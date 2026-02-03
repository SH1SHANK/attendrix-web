"use server";

import { createClient } from "@supabase/supabase-js";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { verifySession } from "@/lib/auth-guard";
import { CourseRecord } from "../../types/supabase-academic";

// ============================================================================
// Types
// ============================================================================

/**
 * Course Type object as stored in Firebase (nested Map structure)
 */
interface CourseTypeObject {
  isLab: boolean;
  courseType: string;
  electiveCategory: string;
}

/**
 * Course object structure for Firebase coursesEnrolled array
 */
interface FirestoreCourse {
  courseID: string;
  courseName: string;
  credits: number;
  courseType: CourseTypeObject;
  attendedClasses: number;
  totalClasses: number;
  isEditable: boolean;
}

/**
 * Challenge object structure from Supabase RPC
 */
interface ChallengeObject {
  progressID: string;
  challengeID: string;
  challengeKey: string;
  challengeName: string;
  challengeDescription: string;
  challengeCondition: string;
}

/**
 * Complete Firestore User document structure
 */
interface FirestoreUser {
  uid: string;
  username: string;
  email: string;
  userRole: "student" | "admin";
  userBio: string;
  batchID: string;
  semesterID: string;
  amplix: number;
  currentStreak: number;
  longestStreak: number;
  coursesEnrolled: FirestoreCourse[];
  challengesAllotted: ChallengeObject[];
  challengeKey: string;
  created_time: FieldValue;
  lastDataFetchTime: FieldValue;
  currentWeekAmplixGained: number;
  streakHistory: number[];
  display_name?: string;
  photo_url?: string;
}

/**
 * Input parameters for the completeOnboarding action
 */
interface OnboardingInput {
  token: string;
  batchID: string;
  coreIDs: string[];
  electiveIDs: string[];
  userProfile: {
    username: string;
    bio: string;
    displayName?: string;
    photoUrl?: string;
  };
  semesterID: string;
}

/**
 * Response from Supabase generate_user_challenges_v2 RPC
 */
interface GenerateChallengesResponse {
  success: boolean;
  user_id: string;
  challenges: ChallengeObject[];
  weekly_key: string;
  monthly_key: string;
  weekly_count: number;
  monthly_count: number;
  generated_at: string;
}

// ============================================================================
// Supabase Client
// ============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Use service role key for RPC calls (server-side only)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Parses the courseType field from Supabase (stringified JSON) to a nested object for Firebase
 */
function parseCourseType(courseTypeRaw: unknown): CourseTypeObject {
  // Default structure
  const defaultType: CourseTypeObject = {
    isLab: false,
    courseType: "core",
    electiveCategory: "",
  };

  if (!courseTypeRaw) return defaultType;

  try {
    // Handle string (most common case from DB)
    if (typeof courseTypeRaw === "string") {
      const parsed = JSON.parse(courseTypeRaw);
      return {
        isLab: parsed.isLab ?? false,
        courseType: parsed.courseType ?? "core",
        electiveCategory: parsed.electiveCategory ?? "",
      };
    }

    // Handle object directly
    if (typeof courseTypeRaw === "object") {
      const obj = courseTypeRaw as Record<string, unknown>;
      return {
        isLab: (obj.isLab as boolean) ?? false,
        courseType: (obj.courseType as string) ?? "core",
        electiveCategory: (obj.electiveCategory as string) ?? "",
      };
    }
  } catch (error) {
    console.error("Error parsing courseType:", error);
  }

  return defaultType;
}

/**
 * Transforms a Supabase CourseRecord to a Firebase-compatible course object
 */
function transformCourseToFirestore(
  course: CourseRecord,
  isElective: boolean,
): FirestoreCourse {
  const parsedType = parseCourseType(course.courseType);
  const credits = course.credits ?? 3;

  return {
    courseID: course.courseID,
    courseName: course.courseName,
    credits: credits,
    courseType: parsedType,
    attendedClasses: 0,
    totalClasses: credits * 15, // Estimate: credits * 15 sessions
    isEditable: isElective,
  };
}

// ============================================================================
// Main Server Action
// ============================================================================

/**
 * Completes the onboarding process by:
 * 1. Fetching & transforming course data from Supabase
 * 2. Syncing user courses to Supabase via RPC
 * 3. Generating challenges via Supabase RPC
 * 4. Creating the user document in Firebase
 */
export async function completeOnboarding(input: OnboardingInput): Promise<{
  success: boolean;
  message: string;
  data?: { uid: string; coursesCount: number; challengesCount: number };
}> {
  const { token, batchID, coreIDs, electiveIDs, userProfile, semesterID } =
    input;

  try {
    // ========================================================================
    // AUTHENTICATION
    // ========================================================================
    const decodedToken = await verifySession(token);
    const uid = decodedToken.uid;
    const email = decodedToken.email ?? "";

    // ========================================================================
    // STEP A: Fetch & Transform Course Data (Supabase -> App)
    // ========================================================================
    const allCourseIDs = [...coreIDs, ...electiveIDs];

    if (allCourseIDs.length === 0) {
      throw new Error("No courses selected for enrollment");
    }

    // Fetch all course records from Supabase
    const { data: courseRecords, error: courseFetchError } = await supabaseAdmin
      .from("courseRecords")
      .select("*")
      .in("courseID", allCourseIDs);

    if (courseFetchError) {
      throw new Error(`Failed to fetch courses: ${courseFetchError.message}`);
    }

    if (!courseRecords || courseRecords.length === 0) {
      throw new Error("No valid courses found for the provided IDs");
    }

    // Transform courses for Firebase
    // Core courses: isEditable = false
    // Elective courses: isEditable = true
    const electiveIDSet = new Set(electiveIDs);
    const coursesEnrolled: FirestoreCourse[] = courseRecords.map((course) => {
      const isElective = electiveIDSet.has(course.courseID);
      return transformCourseToFirestore(course as CourseRecord, isElective);
    });

    // ========================================================================
    // STEP B & C: Sync Supabase State (Run in Parallel)
    // ========================================================================
    const [setCoursesResult, generateChallengesResult] = await Promise.all([
      // Step B: Set user courses via RPC
      supabaseAdmin.rpc("set_user_courses", {
        p_user_id: uid,
        p_course_ids: allCourseIDs,
        p_is_admin: false,
        p_batch_id: batchID,
        p_semester_id: Number(semesterID || 0),
      }),

      // Step C: Generate challenges via RPC
      supabaseAdmin.rpc("generate_user_challenges_v2", {
        p_user_id: uid,
        p_current_challenges: [],
        p_weekly_amplix_limit: 4,
        p_monthly_amplix_limit: 4,
      }),
    ]);

    // Validate Step B result
    if (setCoursesResult.error) {
      throw new Error(
        `Failed to set user courses: ${setCoursesResult.error.message}`,
      );
    }

    // Validate Step C result
    if (generateChallengesResult.error) {
      throw new Error(
        `Failed to generate challenges: ${generateChallengesResult.error.message}`,
      );
    }
    const challengesRpcData =
      generateChallengesResult.data as GenerateChallengesResponse | null;
    if (!challengesRpcData) {
      throw new Error("generate_user_challenges_v2 returned no data");
    }
    if (!challengesRpcData?.success) {
      throw new Error("generate_user_challenges_v2 RPC did not return success");
    }

    // Extract challenges array
    const challengesAllotted: ChallengeObject[] =
      challengesRpcData.challenges || [];
    const challengeKey =
      challengesRpcData.weekly_key || challengesRpcData.monthly_key || "";

    // ========================================================================
    // STEP D: Create Firebase User Document
    // ========================================================================
    const firestoreUser: FirestoreUser = {
      uid: uid,
      username: userProfile.username,
      email: email,
      userRole: "student",
      userBio: userProfile.bio || "",
      batchID: batchID,
      semesterID: semesterID,
      amplix: 0, // Default starting score
      currentStreak: 0,
      longestStreak: 0,
      coursesEnrolled: coursesEnrolled,
      challengesAllotted: challengesAllotted,
      challengeKey: challengeKey,
      created_time: FieldValue.serverTimestamp(),
      lastDataFetchTime: FieldValue.serverTimestamp(),
      currentWeekAmplixGained: 0,
      streakHistory: [],
      display_name: userProfile.displayName,
      photo_url: userProfile.photoUrl,
    };

    // Write to Firestore
    const db = getAdminFirestore();
    await db.collection("users").doc(uid).set(firestoreUser);

    // ========================================================================
    // SUCCESS
    // ========================================================================
    return {
      success: true,
      message: "Onboarding completed successfully",
      data: {
        uid: uid,
        coursesCount: coursesEnrolled.length,
        challengesCount: challengesAllotted.length,
      },
    };
  } catch (error) {
    console.error("Onboarding Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return {
      success: false,
      message: `Onboarding failed: ${errorMessage}`,
    };
  }
}

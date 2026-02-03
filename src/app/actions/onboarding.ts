"use server";

import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth-guard";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { SESSION_COOKIE_NAME } from "@/lib/auth-config";
import {
  getUsernameError,
  normalizeUsername,
  normalizeUsernameLower,
} from "@/lib/onboarding/username";
import { parseCourseType } from "@/lib/onboarding/course-utils";
import {
  BatchRecord,
  CourseRecord,
  CurriculumState,
  ElectiveSlot,
} from "../../types/supabase-academic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // For Admin RPC & Bypass RLS

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Robustly parses JSON that might be a string, an array, or already an object.
 * Returns defaultVal on failure.
 */
function safeParseJSON<T>(input: unknown, defaultVal: T): T {
  if (!input) return defaultVal;
  if (typeof input === "string") {
    try {
      // Handle double-stringified JSON if necessary, though ideally we fix data source
      const parsed = JSON.parse(input);
      if (typeof parsed === "string") {
        return JSON.parse(parsed);
      }
      return parsed;
    } catch {
      return defaultVal;
    }
  }
  return input as T;
}

export type BatchOnboardingData = {
  batch: Pick<
    BatchRecord,
    | "batchID"
    | "batchCode"
    | "semester"
    | "semester_name"
    | "department_id"
    | "courseCatalog"
    | "electiveCatalog"
  >;
  coreCourses: CourseRecord[];
  electiveCourses: CourseRecord[];
};

export async function getAvailableBatches() {
  // Use Admin Client to bypass RLS for this public-facing onboarding data
  try {
    const { data, error } = await supabaseAdmin
      .from("batchRecords")
      .select("batchID, batchCode, semester, semester_name, department_id");

    if (error) {
      console.error("Error fetching batches:", error);
      return [];
    }

    return data as Partial<BatchRecord>[];
  } catch (err) {
    console.error("Unexpected error in getAvailableBatches:", err);
    return [];
  }
}

export async function getBatchCurriculum(
  batchID: string,
): Promise<CurriculumState | null> {
  try {
    console.log(`Fetching curriculum for batch: ${batchID}`);

    // 1. Fetch the Batch Record (Bypass RLS)
    const { data: batch, error: batchError } = await supabaseAdmin
      .from("batchRecords")
      .select("courseCatalog, electiveCatalog")
      .eq("batchID", batchID)
      .limit(1)
      .maybeSingle();

    if (batchError || !batch) {
      console.error("Error fetching batch:", batchError);
      return null;
    }

    const coreIds: string[] = safeParseJSON(batch.courseCatalog, []);
    const electiveCategories: string[] = safeParseJSON(
      batch.electiveCatalog,
      [],
    );

    console.log(
      `Batch ${batchID} raw metadata: Core: ${coreIds.length}, ElectiveCats: ${electiveCategories.join(
        ", ",
      )}`,
    );

    // 2. Fetch Core Courses
    let coreCourses: CourseRecord[] = [];
    if (coreIds.length > 0) {
      const { data: coreData, error: coreError } = await supabaseAdmin
        .from("courseRecords")
        .select("*")
        .in("courseID", coreIds);

      if (coreError) {
        console.error("Error fetching core courses:", coreError);
      } else if (coreData) {
        coreCourses = coreData as CourseRecord[];
      }
    }

    // 3. Fetch Electives - Optimized Filter
    // Instead of simple JS filtering, try to use database filters where possible.
    // However, since 'electiveScope' in DB is likely JSONB or Text, a simple .in() won't work perfectly
    // if we want to match *any* category.
    // OPTIMIZATION: We CAN fetch all electives that *contain* at least one of the categories in their scope.
    // 3. Fetch Electives - Optimized Filter
    let electiveSlots: ElectiveSlot[] = [];

    if (electiveCategories.length > 0) {
      // Attempt optimized fetch
      const { data: validElectives, error: electivesError } =
        await supabaseAdmin
          .from("courseRecords")
          .select("*")
          .eq("isElective", true)
          .overlaps("electiveScope", electiveCategories); // Requires Array/JSONB column type

      if (electivesError) {
        console.error(
          "Error fetching electives with .overlaps() filter. Ensure 'electiveScope' is an array/jsonb column.",
          electivesError,
        );
        return null;
      }

      if (validElectives) {
        const allElectiveRecords = validElectives as CourseRecord[];

        // Group them: Map each Batch Category to suitable courses
        electiveSlots = electiveCategories.map((category) => {
          const available = allElectiveRecords.filter((course) => {
            const scope = safeParseJSON(course.electiveScope, [] as string[]);
            return scope.includes(category);
          });

          return {
            category: category,
            availableCourses: available,
          };
        });
      }
    }

    return {
      core: coreCourses,
      electiveSlots: electiveSlots,
    };
  } catch (err) {
    console.error("Unexpected error in getBatchCurriculum:", err);
    return null;
  }
}

export async function getBatchOnboardingData(
  batchID: string,
): Promise<BatchOnboardingData | null> {
  try {
    const { data: batch, error: batchError } = await supabaseAdmin
      .from("batchRecords")
      .select(
        "batchID, batchCode, semester, semester_name, department_id, courseCatalog, electiveCatalog",
      )
      .eq("batchID", batchID)
      .limit(1)
      .maybeSingle();

    if (batchError || !batch) {
      console.error("Error fetching batch onboarding data:", batchError);
      return null;
    }

    const coreIds: string[] = safeParseJSON(batch.courseCatalog, []);
    const electiveCategories: string[] = safeParseJSON(
      batch.electiveCatalog,
      [],
    );

    const [coreResult, electiveResult] = await Promise.all([
      coreIds.length > 0
        ? supabaseAdmin
            .from("courseRecords")
            .select("*")
            .in("courseID", coreIds)
        : Promise.resolve({ data: [] as CourseRecord[], error: null }),
      electiveCategories.length > 0
        ? supabaseAdmin
            .from("courseRecords")
            .select("*")
            .eq("isElective", true)
            .overlaps("electiveScope", electiveCategories)
        : Promise.resolve({ data: [] as CourseRecord[], error: null }),
    ]);

    let electiveCourses = (electiveResult.data || []) as CourseRecord[];

    if (electiveResult.error) {
      console.error(
        "Elective overlap query failed. Falling back to manual filter.",
        electiveResult.error,
      );
      const { data: fallbackElectives, error: fallbackError } =
        await supabaseAdmin
          .from("courseRecords")
          .select("*")
          .eq("isElective", true);

      if (fallbackError) {
        console.error("Fallback elective fetch failed:", fallbackError);
        electiveCourses = [];
      } else {
        electiveCourses = (fallbackElectives || []) as CourseRecord[];
      }
    }

    return {
      batch: {
        batchID: batch.batchID,
        batchCode: batch.batchCode,
        semester: batch.semester,
        semester_name: batch.semester_name,
        department_id: batch.department_id,
        courseCatalog: coreIds,
        electiveCatalog: electiveCategories,
      },
      coreCourses: (coreResult.data || []) as CourseRecord[],
      electiveCourses,
    };
  } catch (error) {
    console.error("Unexpected error in getBatchOnboardingData:", error);
    return null;
  }
}

// ============================================================================
// Onboarding Action
// ============================================================================

export type OnboardingData = {
  batchID: string;
  semesterID: string;
  selectedCoreCourses: CourseRecord[]; // From Supabase
  selectedElectives: CourseRecord[]; // From Supabase
};

interface CourseTypeObject {
  isLab: boolean;
  courseType: "core" | "elective";
  electiveCategory: string;
}

interface FirestoreCourse {
  courseID: string;
  courseName: string;
  credits: number;
  courseType: CourseTypeObject;
  isEditable: boolean;
  totalClasses: number;
  attendedClasses: number;
}

export async function completeOnboarding(token: string, data: OnboardingData) {
  try {
    // Step A: Authentication & Validation
    const decodedToken = await verifySession(token);
    const uid = decodedToken.uid;
    const isAdmin = decodedToken.admin === true; // Check custom claim

    if (!data.batchID) throw new Error("Batch ID is required");

    // Extract all claimed course IDs from client input
    // We do NOT trust the course details (name, credits, etc.) in 'data', only the IDs.
    const clientCoreIDs = data.selectedCoreCourses.map((c) => c.courseID);
    const clientElectiveIDs = data.selectedElectives.map((c) => c.courseID);
    const allCourseIDs = [...new Set([...clientCoreIDs, ...clientElectiveIDs])];

    if (allCourseIDs.length === 0) {
      // Prompt requirement: "Ensure course arrays are not empty."
      throw new Error("No courses selected");
    }

    // Step B: Fetch Authoritative Data from Supabase
    // Using supabaseAdmin to ensure we can read courseRecords regardless of RLS (though usually public)
    const { data: fetchedCourses, error: fetchError } = await supabaseAdmin
      .from("courseRecords")
      .select("*")
      .in("courseID", allCourseIDs);

    if (fetchError || !fetchedCourses) {
      console.error("Error fetching course details:", fetchError);
      throw new Error("Failed to verify selected courses.");
    }

    // Create a map for easy lookup
    const courseMap = new Map<string, CourseRecord>();
    fetchedCourses.forEach((c) => {
      courseMap.set(c.courseID, c as CourseRecord);
    });

    // Validate that we found all requested courses (or at least the ones that matter)
    // Optional: We could throw if a courseID doesn't exist, or just filter it out.
    // For robust onboarding, filtering out invalid IDs is safer than blocking,
    // but identifying missing IDs might be useful.
    // Let's filter to valid courses only.

    const coursesEnrolled: FirestoreCourse[] = allCourseIDs
      .map((id) => {
        const course = courseMap.get(id);
        if (!course) return null;

        // Determine properties from AUTHORITATIVE data
        const isElective = course.isElective; // Trust DB

        // Determine isLab from DB's courseType jsonb
        let isLab = false;
        if (course.courseType && typeof course.courseType === "object") {
          const ct = course.courseType as { isLab?: boolean };
          if (ct.isLab) isLab = true;
        }

        return {
          courseID: course.courseID.trim(),
          courseName: course.courseName, // Trust DB
          credits: course.credits || 3, // Trust DB
          courseType: {
            isLab: isLab, // Trust DB
            courseType: isElective ? "elective" : "core",
            electiveCategory: isElective ? "OE" : "", // Defaulting to OE for electives as per logic
          },
          // Updated Logic: Admins can edit ALL courses. Non-admins can only edit electives.
          isEditable: isAdmin || isElective,
          totalClasses: 0,
          attendedClasses: 0,
        };
      })
      .filter((c): c is FirestoreCourse => c !== null);

    if (coursesEnrolled.length === 0) {
      throw new Error("No valid courses found for the selected IDs.");
    }

    // Step C: Gamification Initialization (Supabase Integration)
    // 1. Set User Courses
    const finalCourseIDs = coursesEnrolled.map((c) => c.courseID);

    const { error: setCoursesError } = await supabaseAdmin.rpc(
      "set_user_courses",
      {
        p_user_id: uid,
        p_course_ids: finalCourseIDs,
        p_is_admin: false,
        p_batch_id: data.batchID,
        p_semester_id: Number(data.semesterID || 0),
      },
    );

    if (setCoursesError) {
      throw new Error(`Failed to set user courses: ${setCoursesError.message}`);
    }

    // 2. Generate Challenges
    const { data: challengesData, error: rpcError } = await supabaseAdmin.rpc(
      "generate_user_challenges_v2",
      {
        // Using v2 as per instruction
        p_user_id: uid,
        p_current_challenges: [], // Empty for new user
        p_weekly_amplix_limit: 300,
        p_monthly_amplix_limit: 1000,
      },
    );

    if (rpcError) {
      throw new Error(`Gamification RPC failed: ${rpcError.message}`);
    }

    // Extract challengeKey and challenges
    const challengesAllotted = challengesData?.challenges || [];
    const challengeKey =
      challengesData?.weekly_key ||
      (challengesAllotted[0] ? challengesAllotted[0].challengeKey : "") ||
      "";

    // Step D: Firestore Final Commit
    const db = getAdminFirestore();

    const userDocRef = db.collection("users").doc(uid);
    const userSnap = await userDocRef.get();
    const existingUser = userSnap.exists ? userSnap.data() : null;

    const fallbackUsername =
      (existingUser?.username as string) ||
      (decodedToken.email ? decodedToken.email.split("@")[0] : "student") ||
      "student";
    const usernameLower =
      (existingUser?.username_lower as string) ||
      fallbackUsername.toLowerCase();
    const displayName =
      (existingUser?.display_name as string) ||
      decodedToken.name ||
      fallbackUsername;
    const photoUrl =
      (existingUser?.photo_url as string) || decodedToken.picture || "";

    const updatePayload: Record<string, unknown> = {
      batchID: data.batchID,
      semesterID: data.semesterID,
      coursesEnrolled: coursesEnrolled,
      challengesAllotted: challengesAllotted,
      challengeKey: challengeKey,
      lastDataFetchTime: FieldValue.serverTimestamp(),
      isOnboarded: true,
    };

    if (!existingUser) {
      updatePayload.uid = uid;
      updatePayload.email = decodedToken.email || "";
      updatePayload.username = fallbackUsername;
      updatePayload.username_lower = usernameLower;
      updatePayload.display_name = displayName;
      updatePayload.photo_url = photoUrl;
      updatePayload.userRole = "student";
      updatePayload.userBio = "";
      updatePayload.amplix = 0;
      updatePayload.currentWeekAmplixGained = 0;
      updatePayload.currentStreak = 0;
      updatePayload.longestStreak = 0;
      updatePayload.streakHistory = [];
      updatePayload.consentTerms = false;
      updatePayload.consentPromotions = false;
      updatePayload.created_time = FieldValue.serverTimestamp();
    }

    // Use merging to be safe
    await userDocRef.set(updatePayload, { merge: true });

    return { success: true };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("completeOnboarding error:", err);
    throw new Error(errorMessage || "Onboarding failed");
  }
}

// ============================================================================
// New Onboarding Flow - Finalize Action
// ============================================================================

export type FinalizeOnboardingInput = {
  username: string;
  batchID: string;
  semesterID: string;
  coreCourseIDs: string[];
  labCourseIDs: string[];
  electiveCourseIDs: string[];
  consentTerms: boolean;
  consentPromotions: boolean;
};

type ChallengePayload = {
  progressID?: string;
  challengeID?: string;
  challengeKey?: string;
  challengeName?: string;
  challengeDescription?: string;
  challengeCondition?: string;
  targetValue?: number;
  amplixReward?: number;
};

export async function finalizeOnboarding(input: FinalizeOnboardingInput) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const decodedToken = await verifySession(sessionCookie);
    const uid = decodedToken.uid;

    const username = normalizeUsername(input.username);
    const usernameLower = normalizeUsernameLower(username);

    const usernameError = getUsernameError(username);

    if (usernameError || !input.batchID) {
      throw new Error(usernameError || "Missing onboarding fields");
    }
    if (!input.consentTerms) {
      throw new Error("Terms must be accepted");
    }

    const uniqueCourseIDs = [
      ...new Set([
        ...input.coreCourseIDs,
        ...input.labCourseIDs,
        ...input.electiveCourseIDs,
      ]),
    ];

    if (uniqueCourseIDs.length === 0) {
      throw new Error("No courses selected");
    }

    if (input.coreCourseIDs.length === 0) {
      throw new Error("Core courses are required");
    }

    const { data: fetchedCourses, error: fetchError } = await supabaseAdmin
      .from("courseRecords")
      .select("*")
      .in("courseID", uniqueCourseIDs);

    if (fetchError || !fetchedCourses) {
      console.error("Error fetching course details:", fetchError);
      throw new Error("Failed to resolve selected courses");
    }

    const courseMap = new Map<string, CourseRecord>();
    fetchedCourses.forEach((course) =>
      courseMap.set(course.courseID, course as CourseRecord),
    );

    const coursesEnrolled = uniqueCourseIDs
      .map((id) => {
        const course = courseMap.get(id);
        if (!course) return null;

        const type = parseCourseType(course.courseType);
        const isLab = Boolean(type.isLab);
        const courseType =
          type.courseType || (course.isElective ? "elective" : "core");
        const electiveCategory =
          type.electiveCategory ||
          (Array.isArray(course.electiveScope)
            ? course.electiveScope[0]
            : "") ||
          "";

        const isEditable = courseType === "elective" && !isLab;

        return {
          courseID: course.courseID.trim(),
          courseName: course.courseName,
          credits: course.credits || 3,
          courseType: {
            isLab,
            courseType,
            electiveCategory,
          },
          isEditable,
          totalClasses: 0,
          attendedClasses: 0,
        };
      })
      .filter((course): course is NonNullable<typeof course> =>
        Boolean(course),
      );

    if (coursesEnrolled.length === 0) {
      throw new Error("No valid courses resolved");
    }

    const db = getAdminFirestore();
    const userRef = db.collection("users").doc(uid);
    const userSnap = await userRef.get();
    const existingUser = userSnap.exists ? userSnap.data() : null;

    const existingChallenges: ChallengePayload[] = Array.isArray(
      existingUser?.challengesAllotted,
    )
      ? (existingUser?.challengesAllotted as ChallengePayload[])
      : [];

    const existingChallengeIds = existingChallenges
      .map((challenge) => challenge.challengeID)
      .filter((id): id is string => typeof id === "string" && id.length > 0);

    const [setCoursesResult, challengeResult] = await Promise.all([
      supabaseAdmin.rpc("set_user_courses", {
        p_user_id: uid,
        p_course_ids: uniqueCourseIDs,
        p_is_admin: false,
        p_batch_id: input.batchID,
        p_semester_id: Number(input.semesterID || 0),
      }),
      supabaseAdmin.rpc("generate_user_challenges_v2", {
        p_user_id: uid,
        p_current_challenges: existingChallengeIds,
        p_weekly_amplix_limit: 300,
        p_monthly_amplix_limit: 1000,
      }),
    ]);

    if (setCoursesResult.error) {
      throw new Error(
        `Failed to set user courses: ${setCoursesResult.error.message}`,
      );
    }

    if (challengeResult.error) {
      throw new Error(
        `Failed to generate challenges: ${challengeResult.error.message}`,
      );
    }

    const challengesData = (challengeResult.data || {}) as {
      challenges?: ChallengePayload[];
      weekly_key?: string;
      monthly_key?: string;
    };

    const mergedChallenges = new Map<string, ChallengePayload>();
    existingChallenges.forEach((challenge) => {
      const key = challenge.challengeID || challenge.progressID;
      if (key) mergedChallenges.set(key, challenge);
    });

    (challengesData.challenges || []).forEach((challenge) => {
      const key = challenge.challengeID || challenge.progressID;
      if (key) mergedChallenges.set(key, challenge);
    });

    const challengesAllotted = Array.from(mergedChallenges.values()).map(
      (challenge) => ({
        progressID: challenge.progressID || "",
        challengeID: challenge.challengeID || "",
        challengeKey: challenge.challengeKey || challengesData.weekly_key || "",
        challengeName: challenge.challengeName || "",
        challengeDescription: challenge.challengeDescription || "",
        challengeCondition: challenge.challengeCondition || "",
        targetValue: challenge.targetValue || 0,
        amplixReward: challenge.amplixReward || 0,
      }),
    );

    const challengeKey =
      challengesData.weekly_key ||
      challengesData.monthly_key ||
      challengesAllotted[0]?.challengeKey ||
      "";

    const updatePayload: Record<string, unknown> = {
      username,
      username_lower: usernameLower,
      batchID: input.batchID,
      semesterID: input.semesterID,
      coursesEnrolled,
      challengesAllotted,
      challengeKey,
      consentTerms: input.consentTerms,
      consentPromotions: input.consentPromotions,
      lastDataFetchTime: FieldValue.serverTimestamp(),
      isOnboarded: true,
    };

    if (!existingUser) {
      updatePayload.uid = uid;
      updatePayload.email = decodedToken.email || "";
      updatePayload.userRole = "student";
      updatePayload.userBio = "";
      updatePayload.display_name = decodedToken.name || "";
      updatePayload.photo_url = decodedToken.picture || "";
      updatePayload.amplix = 0;
      updatePayload.currentWeekAmplixGained = 0;
      updatePayload.currentStreak = 0;
      updatePayload.longestStreak = 0;
      updatePayload.streakHistory = [];
      updatePayload.created_time = FieldValue.serverTimestamp();
    }

    await userRef.set(updatePayload, { merge: true });

    return {
      success: true,
      data: {
        uid,
        coursesCount: coursesEnrolled.length,
        challengesCount: challengesAllotted.length,
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("finalizeOnboarding error:", error);
    return { success: false, message } as const;
  }
}

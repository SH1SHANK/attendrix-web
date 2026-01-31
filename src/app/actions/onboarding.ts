"use server";

import { createClient } from "@supabase/supabase-js";
import { verifySession } from "@/lib/auth-guard";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
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
          courseID: course.courseID,
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
    // Use merging to be safe
    await userDocRef.set(
      {
        batchID: data.batchID,
        semesterID: data.semesterID,
        coursesEnrolled: coursesEnrolled,
        challengesAllotted: challengesAllotted,
        challengeKey: challengeKey,

        // Reset Stats
        amplix: 0,
        currentWeekAmplixGained: 0,
        stats: { streak: 0, totalClassesAttended: 0 },

        lastDataFetchTime: FieldValue.serverTimestamp(),
        isOnboarded: true,
      },
      { merge: true },
    );

    return { success: true };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("completeOnboarding error:", err);
    throw new Error(errorMessage || "Onboarding failed");
  }
}

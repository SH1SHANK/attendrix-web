"use server";

import { createClient } from "@supabase/supabase-js";
import {
  BatchRecord,
  CourseRecord,
  CurriculumState,
  ElectiveSlot,
} from "@/types/supabase-academic";
import { verifySession } from "@/lib/auth-guard";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function getAvailableBatches(token?: string) {
  // Optional security for public-ish data, or enforce if strictly private
  // For now, allow public read of batches to let onboarding load?
  // actually, user is on /onboarding, so they SHOULD be logged in.
  // Let's enforce it if token is passed, or just proceed.
  // The prompt said "secure Server Actions verifying data".
  // Let's secure it.
  try {
    if (token) await verifySession(token);
    // If no token, we could throw, or just allow (batches are public info usually).
    // Let's enforce for strictness as requested.
    if (!token) throw new Error("Unauthorized");

    const { data, error } = await supabase
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
  token: string,
): Promise<CurriculumState | null> {
  try {
    // 1. Verify User
    await verifySession(token);

    // 2. Fetch the Batch Record
    const { data: batch, error: batchError } = await supabase
      .from("batchRecords")
      .select("courseCatalog, electiveCatalog")
      .eq("batchID", batchID)
      .single();

    if (batchError || !batch) {
      console.error("Error fetching batch:", batchError);
      return null;
    }

    const coreIds = batch.courseCatalog || [];

    // Parse the elective categories from the batch (e.g. ["OE", "LAB1"])
    let electiveCategories: string[] = [];
    try {
      // Handle double stringification or direct array
      if (typeof batch.electiveCatalog === "string") {
        electiveCategories = JSON.parse(batch.electiveCatalog);
      } else if (Array.isArray(batch.electiveCatalog)) {
        electiveCategories = batch.electiveCatalog;
      }
      // Often retrieved as string from specialized columns, ensuring array
      if (typeof electiveCategories === "string") {
        // double parse check
        electiveCategories = JSON.parse(electiveCategories);
      }
    } catch (e) {
      console.error("Error parsing electiveCatalog categories:", e);
      electiveCategories = [];
    }

    // 2. Fetch Core Courses
    let coreCourses: CourseRecord[] = [];
    if (coreIds.length > 0) {
      const { data: coreData, error: coreError } = await supabase
        .from("courseRecords")
        .select("*")
        .in("courseID", coreIds);

      if (!coreError && coreData) {
        coreCourses = coreData as CourseRecord[];
      }
    }

    // 3. Fetch ALL Electives to Match Categories
    // Logic: Fetch all courses where isElective is true.
    // Optimization: In production, might filter by dept or semester if possible, but fetching all active electives is safer for now.
    let electiveSlots: ElectiveSlot[] = [];

    if (electiveCategories.length > 0) {
      const { data: allElectives, error: electivesError } = await supabase
        .from("courseRecords")
        .select("*")
        .eq("isElective", true);

      if (!electivesError && allElectives) {
        const allElectiveRecords = allElectives as CourseRecord[];

        // Group them: Map each Batch Category to suitable courses
        electiveSlots = electiveCategories.map((category) => {
          const available = allElectiveRecords.filter((course) => {
            // Check if course scope includes this category
            let scope: string[] = [];
            try {
              if (typeof course.electiveScope === "string") {
                scope = JSON.parse(course.electiveScope);
              } else if (Array.isArray(course.electiveScope)) {
                scope = course.electiveScope;
              }
            } catch {
              scope = [];
            }
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

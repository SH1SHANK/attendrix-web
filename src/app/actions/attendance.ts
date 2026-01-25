"use server";

import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth-guard";
import { getAdminFirestore } from "@/lib/firebase-admin";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================================
// Types
// ============================================================================

export interface ScheduleItem {
  classID: string;
  courseID: string;
  courseName: string;
  classStartTime: string;
  classEndTime: string;
  classVenue: string;
  classStatus: string;
  isPlusSlot: boolean;
  type: "lecture" | "lab" | "tutorial"; // inferred
}

interface RpcScheduleItem {
  classID: string;
  courseID: string;
  courseName: string;
  classStartTime: string;
  classEndTime: string;
  classVenue: string | null;
  classStatus: string | null;
  isPlusSlot: boolean | null;
}

// ============================================================================
// Helpers
// ============================================================================

async function getUserId() {
  const { SESSION_COOKIE_NAME } = await import("@/lib/auth-config");
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) return null;

  try {
    const decoded = await verifySession(sessionCookie);
    return decoded.uid;
  } catch (err) {
    console.error("Auth Error:", err);
    return null;
  }
}

// ============================================================================
// Actions
// ============================================================================

/**
 * Fetch Student Schedule for a specific date
 */
export async function getStudentSchedule(dateStr?: string): Promise<{
  success: boolean;
  data: ScheduleItem[];
  error?: string;
}> {
  try {
    const uid = await getUserId();
    if (!uid) return { success: false, data: [], error: "Unauthorized" };

    // 1. Get User Batch ID from Firestore
    const db = getAdminFirestore();
    const userDoc = await db.collection("users").doc(uid).get();
    const batchID = userDoc.data()?.batchID;

    if (!batchID) {
      return { success: false, data: [], error: "Batch ID not found" };
    }

    // 2. Format Date (D/M/YYYY)
    const date = dateStr ? new Date(dateStr) : new Date();
    // Supabase RPC expects 'D/M/YYYY' e.g. '25/1/2026'
    const d = date.getDate();
    const m = date.getMonth() + 1;
    const y = date.getFullYear();
    const formattedDate = `${d}/${m}/${y}`;

    // 3. Call RPC
    const { data, error } = await supabase.rpc("get_student_schedule", {
      p_batch_id: batchID,
      p_date_str: formattedDate,
    });

    if (error) {
      console.error("Supabase RPC Error:", error);
      return { success: false, data: [], error: error.message };
    }

    // 4. Transform Data
    if (!data) return { success: true, data: [] };
    const schedule: ScheduleItem[] = (data as RpcScheduleItem[]).map(
      (item) => ({
        classID: item.classID,
        courseID: item.courseID, // Ensure RPC returns this
        courseName: item.courseName,
        classStartTime: item.classStartTime,
        classEndTime: item.classEndTime,
        classVenue: item.classVenue || "TBA",
        classStatus: item.classStatus || "pending",
        isPlusSlot: item.isPlusSlot || false,
        type: item.courseName.toLowerCase().includes("lab") ? "lab" : "lecture",
      }),
    );

    return { success: true, data: schedule };
  } catch (err) {
    console.error("getStudentSchedule Action Error:", err);
    return { success: false, data: [], error: "Internal Server Error" };
  }
}

/**
 * Mark Attendance (Present)
 */
export async function markAttendance(
  classId: string,
  courseId: string,
  startTime: string,
): Promise<{ success: boolean; error?: string }> {
  const uid = await getUserId();
  if (!uid) return { success: false, error: "Unauthorized" };

  // RPC: mark_attendance_bulk(p_user_id, p_class_ids[], p_course_ids[], p_class_times[], p_checkin_time)
  const { error } = await supabase.rpc("mark_attendance_bulk", {
    p_user_id: uid,
    p_class_ids: [classId],
    p_course_ids: [courseId],
    p_class_times: [startTime],
    p_checkin_time: new Date().toISOString(),
  });

  if (error) {
    console.error("markAttendance Error:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Mark Absence
 */
export async function markAbsence(
  classId: string,
  courseIds: string[], // Needed for mark_class_absent?
): Promise<{ success: boolean; error?: string }> {
  const uid = await getUserId();
  if (!uid) return { success: false, error: "Unauthorized" };

  // RPC: mark_class_absent(p_user_id, p_class_id, p_enrolled_courses[])
  // Why p_enrolled_courses? Maybe to validate or update cache?
  // We'll pass the single course ID if that's what it expects, or list of all enrolled.
  // Based on param name "p_enrolled_courses", it implies checking valid courses.
  // Let's assume passing just the relevant course ID in the array is sufficient/safe for that specific class check.

  const { error } = await supabase.rpc("mark_class_absent", {
    p_user_id: uid,
    p_class_id: classId,
    p_enrolled_courses: courseIds,
  });

  if (error) {
    console.error("markAbsence Error:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

"use server";

import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth-guard";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { createClient } from "@supabase/supabase-js";
import { DashboardData, AttendanceStat, ScheduleSlot } from "@/types/dashboard";

// Types for RPC responses
interface RPCStat {
  course_id: string;
  course_name: string;
  attended_classes: number;
  total_classes: number;
  percentage: number;
}

interface RPCSchedule {
  idx: number;
  classID: string;
  courseName: string;
  classStartTime: string;
  classEndTime: string;
  classStatus: string;
  classVenue: string;
  isPlusSlot: boolean;
}

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }

  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Server Action: Get User Dashboard Data
 * Orchestrates fetching from Firebase (Identity) and Supabase (Academic)
 */
export async function getUserDashboardData(
  clientUid?: string,
): Promise<
  { success: true; data: DashboardData } | { success: false; error: string }
> {
  try {
    let uid = clientUid;

    // If no client UID, try to get from session cookie (Server Component fallback)
    if (!uid) {
      const { SESSION_COOKIE_NAME } = await import("@/lib/auth-config");
      const cookieStore = await cookies();
      const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

      if (!sessionCookie) {
        return { success: false, error: "Unauthorized: No session" };
      }

      const decodedToken = await verifySession(sessionCookie);
      uid = decodedToken.uid;
    }

    if (!uid) {
      return { success: false, error: "Unauthorized: Invalid token" };
    }

    // 2. Fetch Firestore User Data (Parallel)
    // Use the robust singleton for Admin Firestore
    const db = getAdminFirestore();
    const userDocRef = db.collection("users").doc(uid);

    // 3. Fetch Supabase Academic Data (Parallel)
    const [userSnapshot, academicStats] = await Promise.all([
      userDocRef.get(),
      getAcademicStats(uid),
    ]);

    if (!userSnapshot.exists) {
      console.error(
        `PROFILE ERROR: Firestore user doc not found for uid=${uid}`,
      );
      return { success: false, error: "User profile not found in database" };
    }

    const userData = userSnapshot.data();

    // 4. Map entire user object using the shared mapper
    const { mapFirestoreUser } = await import("@/lib/user-mapper");
    const mappedUser = mapFirestoreUser(userData, uid);

    if (!mappedUser) {
      return { success: false, error: "Failed to map user data" };
    }

    // 5. Construct Dashboard Data
    // Use mapped user as the base. If mappedUser.coursesEnrolled is empty, try Supabase fallback.
    // However, the mapper handles coursesEnrolled extraction.
    // If we really want to fallback to Supabase stats if Firestore is empty:

    let finalCourses = mappedUser.coursesEnrolled;
    if (finalCourses.length === 0 && academicStats.length > 0) {
      finalCourses = academicStats;
    }

    const dashboardData: DashboardData = {
      user: {
        ...mappedUser,
        coursesEnrolled: finalCourses,
      },
    };

    return { success: true, data: dashboardData };
  } catch (error) {
    console.error("PROFILE FETCH ERROR (getUserDashboardData):", error);
    // Return the actual error message for debugging
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown Error",
    };
  }
}

/**
 * Fetch Academic Stats from Supabase RPC
 */
async function getAcademicStats(uid: string): Promise<AttendanceStat[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc("get_student_attendance_stats", {
    p_user_id: uid,
  });

  if (error) {
    console.error("Supabase RPC Error (Stats):", error);
    throw new Error(`Supabase RPC Failed: ${error.message}`);
  }

  // Check for Diagnostic "ERROR" row
  const rpcData = (data as unknown as RPCStat[]) || [];
  const firstItem = rpcData[0];
  if (firstItem && firstItem.course_id === "ERROR") {
    const dbError = firstItem.course_name;
    console.error("TRAPPED DB ERROR:", dbError);
    throw new Error(`DB Error: ${dbError}`);
  }

  // Transform to match interface
  return rpcData.map((item) => ({
    courseID: item.course_id,
    courseName: item.course_name,
    attendedClasses: Number(item.attended_classes),
    totalClasses: Number(item.total_classes),
    percentage: Number(item.percentage),
    credits: 3, // Defaulting as RPC might not return it yet or need another join
    isLab: item.course_name.toLowerCase().includes("lab"), // Heuristic if not in DB
  }));
}

/**
 * Server Action: Get Day Schedule
 * Validates date and calls Supabase RPC
 */
export async function getDaySchedule(
  date: Date,
  clientBatchID?: string,
): Promise<ScheduleSlot[]> {
  try {
    // NOTE: Simplification for Client-First: We expect client to provide BatchID ideally,
    // but if not, we arguably shouldn't fetch.
    // For now, we'll assume the client calls this with context or we fetch user again.
    // To keep it simple and stateless (or efficient), let's assume we might need to fetch user batch
    // if not provided, but typically this is called after we have dashboard data.

    // However, `timetable` component might just call this.
    // Let's rely on Cookies for this specific action IF called from server,
    // OR better: Update generic signature?
    // The prompt didn't strictly specify changing `getDaySchedule` signature in detail besides RPC.
    // But `get_student_schedule` needs `p_batch_id`.

    // Fallback: Use cookie if no clientBatchID (legacy support)
    let batchID = clientBatchID;

    if (!batchID) {
      const { SESSION_COOKIE_NAME } = await import("@/lib/auth-config");
      const cookieStore = await cookies();
      const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
      if (sessionCookie) {
        const decoded = await verifySession(sessionCookie);
        const db = getAdminFirestore();
        const userDoc = await db.collection("users").doc(decoded.uid).get();
        batchID = userDoc.data()?.batchID;
      }
    }

    if (!batchID) return [];

    // Format Date: "D/M/YYYY" (e.g., "1/1/2026") - No leading zeros based on sample
    const d = date.getDate();
    const m = date.getMonth() + 1;
    const y = date.getFullYear();
    const dateStr = `${d}/${m}/${y}`;

    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc("get_student_schedule", {
      p_batch_id: batchID,
      p_date_str: dateStr,
    });

    if (error) {
      console.error("Supabase RPC Error (Schedule):", error);
      return [];
    }

    return ((data as unknown as RPCSchedule[]) || []).map((item) => ({
      slot_id: item.classID, // Mapping classID to slot_id
      course_name: item.courseName,
      time_start: item.classStartTime, // These come as timestamps from DB?
      // If DB returns timestamps, we need to ensure we format or pass them correctly.
      // Samples show "2026-01-01 09:00:00". Type expects ISO string.
      // If it's a string from Postgres, it's usually ISO-like.
      time_end: item.classEndTime,
      status: "upcoming", // Default mapping for now, or parse item.classStatus if needed
      venue: item.classVenue,
      is_lab: item.courseName.toLowerCase().includes("lab"),
    }));
  } catch (error) {
    console.error("Error fetching schedule:", error);
    return [];
  }
}

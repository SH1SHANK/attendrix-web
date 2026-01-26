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

export interface CalendarClass {
  id: string; // classID
  courseID: string;
  courseCode: string;
  courseName: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  venue: string;
  attended: boolean;
  type: "lecture" | "lab" | "tutorial";
  date: string; // ISO date string
}

// Safely parse JSONB that may arrive as stringified JSON
function parseJsonish<T>(value: unknown): T | null {
  if (!value) return null;
  if (typeof value === "object") return value as T;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch (err) {
      console.warn("Failed to parse jsonish value", value, err);
      return null;
    }
  }
  return null;
}

export interface MonthData {
  classes: CalendarClass[];
  perfectDates?: string[];
}

// ============================================================================
// Actions
// ============================================================================

export async function getMonthAttendance(
  year: number,
  month: number, // 0-11
): Promise<{ success: boolean; data?: MonthData; error?: string }> {
  try {
    // 1. Auth check
    const { SESSION_COOKIE_NAME } = await import("@/lib/auth-config");
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionCookie) return { success: false, error: "Unauthorized" };

    const decoded = await verifySession(sessionCookie);
    const uid = decoded.uid;

    // 2. Get Batch ID
    const db = getAdminFirestore();
    const userDoc = await db.collection("users").doc(uid).get();
    const batchID = userDoc.data()?.batchID;

    if (!batchID) return { success: false, error: "Batch ID not found" };

    // 3. Date Range
    // Start of month
    const startDate = new Date(year, month, 1);
    // End of month
    const endDate = new Date(year, month + 1, 0);

    // Format for DB query (assuming classDate is YYYY-MM-DD or similar text/date column)
    // Based on `get_student_schedule`, input was DD/MM/YYYY.
    // Let's check format of `classDate` column?
    // Previous SQL Step 158 said `classDate` type is `text`.
    // We should assume it matches the `get_student_schedule` format which was DD/MM/YYYY?
    // OR try to filter by timestamp? `classStartTime` is timestamp.
    // Using `classStartTime` is safer for range queries than a text date column format we might guess wrong.

    const startIso = startDate.toISOString();
    const endIso = endDate.toISOString();

    // 4. Fetch Timetable Records
    const { data: timetable, error: ttError } = await supabase
      .from("timetableRecords")
      .select(
        "classID, courseID, courseName, classStartTime, classEndTime, classVenue, courseType",
      )
      .eq("batchID", batchID)
      .gte("classStartTime", startIso)
      .lte("classStartTime", endIso);

    if (ttError) {
      console.error("Timetable Fetch Error:", ttError);
      return { success: false, error: ttError.message };
    }

    if (!timetable || timetable.length === 0) {
      return { success: true, data: { classes: [] } };
    }

    // 5. Fetch Attendance Records for User
    // We want attendance records for these classIDs
    const classIds = timetable.map((c) => c.classID);

    const { data: attendance, error: attError } = await supabase
      .from("attendanceRecords")
      .select("classID")
      .eq("userID", uid)
      .in("classID", classIds);

    if (attError) {
      console.error("Attendance Fetch Error:", attError);
      return { success: false, error: attError.message };
    }

    const attendanceMap = new Set(attendance?.map((a) => a.classID));

    // 6. Merge & Transform
    const classes: CalendarClass[] = timetable.map((item) => {
      const attended = attendanceMap.has(item.classID);
      const courseType = parseJsonish<{
        isLab?: boolean;
        courseType?: string;
      }>(item.courseType);

      // Extract time HH:mm for display
      const dateObj = new Date(item.classStartTime);
      const startTime = `${dateObj.getHours().toString().padStart(2, "0")}:${dateObj.getMinutes().toString().padStart(2, "0")}`;

      const endObj = new Date(item.classEndTime);
      const endTime = `${endObj.getHours().toString().padStart(2, "0")}:${endObj.getMinutes().toString().padStart(2, "0")}`;

      const type: CalendarClass["type"] = courseType?.isLab
        ? "lab"
        : courseType?.courseType === "tutorial"
          ? "tutorial"
          : "lecture";

      return {
        id: item.classID,
        courseID: item.courseID,
        courseCode: item.courseID || item.courseName.split(" ")[0],
        courseName: item.courseName,
        startTime,
        endTime,
        venue: item.classVenue || "TBA",
        attended,
        type,
        date: item.classStartTime, // ISO string for client parsing
      };
    });

    // 7. Get Perfect Dates (Streak Logic)
    // We reuse the user mapper logic for consistency
    const { calculateStreakMetrics } = await import("@/lib/user-mapper");

    // Check if we need to fetch user doc again or if we have it properly
    // Step 2 fetched userDoc but we only extracted batchID.
    // Let's check if we have streakHistory there.
    const userData = userDoc.data();
    const streakHistory = userData?.streakHistory;

    const { calendarDates: perfectDates } =
      calculateStreakMetrics(streakHistory);

    return {
      success: true,
      data: {
        classes,
        perfectDates: perfectDates || [],
      },
    };
  } catch (err) {
    console.error("Calendar Action Error:", err);
    return {
      success: false,
      error:
        "Internal Server Error: " +
        (err instanceof Error ? err.message : String(err)),
    };
  }
}

export async function getHistory(
  range: "7d" | "14d" | "30d" | "all",
): Promise<{ success: boolean; data?: CalendarClass[]; error?: string }> {
  try {
    // 1. Auth check
    const { SESSION_COOKIE_NAME } = await import("@/lib/auth-config");
    const cookieStore = await cookies();

    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionCookie) {
      return { success: false, error: "Unauthorized" };
    }

    const decoded = await verifySession(sessionCookie);
    const uid = decoded.uid;

    // 2. Get Batch ID
    const db = getAdminFirestore();
    const userDoc = await db.collection("users").doc(uid).get();
    const batchID = userDoc.data()?.batchID;

    if (!batchID) return { success: false, error: "Batch ID not found" };

    // 3. Date Range
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Include today

    let startDate: Date;

    if (range === "all") {
      // Set to a far past date or start of academic year
      startDate = new Date(2020, 0, 1);
    } else {
      const days = range === "7d" ? 7 : range === "14d" ? 14 : 30;
      startDate = new Date();
      startDate.setDate(today.getDate() - days);
      startDate.setHours(0, 0, 0, 0);
    }

    const startIso = startDate.toISOString();
    const endIso = today.toISOString();

    // 4. Fetch Timetable Records
    const { data: timetable, error: ttError } = await supabase
      .from("timetableRecords")
      .select(
        "classID, courseID, courseName, classStartTime, classEndTime, classVenue, courseType",
      )
      .eq("batchID", batchID)
      .gte("classStartTime", startIso)
      .lte("classStartTime", endIso)
      .order("classStartTime", { ascending: false }); // Newest first

    if (ttError) {
      console.error("Timetable Fetch Error:", ttError);
      return { success: false, error: ttError.message };
    }

    if (!timetable || timetable.length === 0) {
      return { success: true, data: [] };
    }

    // 5. Fetch Attendance Records for User
    const classIds = timetable.map((c) => c.classID);

    const { data: attendance, error: attError } = await supabase
      .from("attendanceRecords")
      .select("classID")
      .eq("userID", uid)
      .in("classID", classIds);

    if (attError) {
      console.error("Attendance Fetch Error:", attError);
      return { success: false, error: attError.message };
    }

    const attendanceMap = new Set(attendance?.map((a) => a.classID));

    // 6. Merge
    const classes: CalendarClass[] = timetable.map((item) => {
      const attended = attendanceMap.has(item.classID);
      const courseType = parseJsonish<{
        isLab?: boolean;
        courseType?: string;
      }>(item.courseType);

      const dateObj = new Date(item.classStartTime);
      const startTime = `${dateObj.getHours().toString().padStart(2, "0")}:${dateObj.getMinutes().toString().padStart(2, "0")}`;

      const endObj = new Date(item.classEndTime);
      const endTime = `${endObj.getHours().toString().padStart(2, "0")}:${endObj.getMinutes().toString().padStart(2, "0")}`;

      const type: CalendarClass["type"] = courseType?.isLab
        ? "lab"
        : courseType?.courseType === "tutorial"
          ? "tutorial"
          : "lecture";

      return {
        id: item.classID,
        courseID: item.courseID,
        courseCode: item.courseID || item.courseName.split(" ")[0],
        courseName: item.courseName,
        startTime,
        endTime,
        venue: item.classVenue || "TBA",
        attended,
        type,
        date: item.classStartTime,
      };
    });

    return { success: true, data: classes };
  } catch (err) {
    console.error("History Action Error:", err);
    return {
      success: false,
      error:
        "Internal Server Error: " +
        (err instanceof Error ? err.message : String(err)),
    };
  }
}

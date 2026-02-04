import { supabase } from "@/lib/supabase/client";
import { DAY_MS, parseTimestampAsIST } from "@/lib/time/ist";
import {
  ClassByDate,
  TodayScheduleClass,
  UpcomingClass,
} from "@/types/supabase-academic";
import { FilterPeriod, PastClass } from "@/types/types-defination";
import { getISTDateString } from "@/lib/time/ist";

/**
 * Classes Service (Raw Fetch Implementation)
 *
 * Replaced RPC calls with direct Supabase queries for reliability and transparency.
 * Focuses on robust data fetching without hiding logic in database functions.
 */

export const ClassesService = {
  init: () => console.log("[DEBUG] ClassesService loaded"),
  /**
   * Fetch today's schedule
   * RAW QUERY: 'timetableRecords' joined with 'attendanceRecords' check
   */
  async getTodaySchedule(
    userId: string,
    batchId: string,
    attendanceGoalPercentage: number = 75,
    dateIso?: string,
    enrolledCourses?: string[],
  ): Promise<TodayScheduleClass[]> {
    if (!userId || !batchId) return [];

    try {
      const targetDate = dateIso ? new Date(dateIso) : new Date();
      // RPC expects 'date' as YYYY-MM-DD in IST
      const dateString = getISTDateString(targetDate);

      console.log("[getTodaySchedule] Calling RPC with:", {
        batch_id: batchId,
        user_id: userId,
        date: dateString,
        attendance_goal_percentage: attendanceGoalPercentage,
        enrolled_courses: enrolledCourses,
      });

      const { data, error } = await supabase.rpc("get_today_schedule", {
        batch_id: batchId,
        user_id: userId,
        date: dateString,
        attendance_goal_percentage: attendanceGoalPercentage,
      });

      if (error) {
        console.error("Error fetching timetable RPC:", error);
        throw error;
      }

      if (!data) return [];

      console.log("[getTodaySchedule] RPC Response:", data);

      // RPC returns rows matching the TodayScheduleClass interface structure directly
      // but we ensure it matches the interface
      let filteredData = data as any[];

      // Filter by enrolled courses if provided
      if (enrolledCourses && enrolledCourses.length > 0) {
        filteredData = filteredData.filter((row) =>
          enrolledCourses.includes(row.courseID || row.courseid),
        );
        console.log("[getTodaySchedule] Filtered to enrolled courses:", {
          total: data.length,
          filtered: filteredData.length,
          enrolledCourses,
        });
      }

      return filteredData.map((row) => ({
        classID: row.classID || row.classid,
        courseID: row.courseID || row.courseid,
        courseName: row.courseName || row.coursename || "Unknown Course",
        classStartTime: row.classStartTime || row.classstarttime,
        classEndTime: row.classEndTime || row.classendtime,
        classVenue: row.classVenue || row.classvenue,
        isCancelled: row.isCancelled ?? row.iscancelled ?? false,
        userAttended: row.userAttended ?? row.userattended ?? false,
        userCheckinTime: row.userCheckinTime || row.usercheckintime,
        totalClasses: row.totalClasses ?? row.totalclasses ?? 0,
        attendedClasses: row.attendedClasses ?? row.attendedclasses ?? 0,
        currentAttendancePercentage:
          row.currentAttendancePercentage ??
          row.currentattendancepercentage ??
          0,
        classesRequiredToReachGoal:
          row.classesRequiredToReachGoal ?? row.classesrequiredtoreachgoal ?? 0,
        classesCanSkipAndStayAboveGoal:
          row.classesCanSkipAndStayAboveGoal ??
          row.classescanskipandstayabovegoal ??
          0,
      }));
    } catch (err) {
      console.error("[getTodaySchedule] Failed:", err);
      // Return empty array instead of throwing to prevent UI crash
      return [];
    }
  },

  /**
   * Fetch past classes for a user
   * Uses get_user_past_classes RPC
   */
  async getUserPastClasses(
    userId: string,
    filter: FilterPeriod = "all",
  ): Promise<PastClass[]> {
    if (!userId) return [];

    const { data, error } = await supabase.rpc("get_user_past_classes", {
      uid: userId,
      filter,
    });

    if (error) {
      console.error("Error fetching past classes:", error);
      throw error;
    }

    const rows = (data as Array<Record<string, unknown>>) || [];

    const normalized = rows
      .map((row) => {
        const rawStatus = String(
          row.attendanceStatus ?? row.attendancestatus ?? "ABSENT",
        ).toUpperCase();
        const attendanceStatus: PastClass["attendanceStatus"] =
          rawStatus === "PRESENT"
            ? "PRESENT"
            : rawStatus === "PENDING"
              ? "PENDING"
              : "ABSENT";

        return {
          classID: (row.classID ?? row.classid) as string | undefined,
          courseID: (row.courseID ?? row.courseid) as string | undefined,
          courseName: (row.courseName ??
            row.coursename ??
            "Unknown Course") as string,
          classStartTime: (row.classStartTime ?? row.classstarttime) as
            | string
            | undefined,
          classEndTime: (row.classEndTime ?? row.classendtime) as
            | string
            | undefined,
          classVenue: (row.classVenue ?? row.classvenue ?? null) as
            | string
            | null,
          attendanceStatus,
        };
      })
      .filter(
        (item): item is PastClass =>
          !!item.classID &&
          !!item.courseID &&
          !!item.courseName &&
          !!item.classStartTime &&
          !!item.classEndTime,
      );

    if (normalized.length !== rows.length) {
      console.warn(
        "[getUserPastClasses] Dropped rows due to missing fields:",
        rows.length - normalized.length,
      );
    }

    return normalized;
  },

  /**
   * Fetch upcoming classes
   * RAW QUERY: 'timetableRecords' filtered by date > now
   */
  async getUpcomingClasses(
    userId: string,
    batchId: string,
    enrolledCourses?: string[],
  ): Promise<UpcomingClass[]> {
    if (!userId || !batchId) return [];

    try {
      const now = new Date().toISOString();

      // Fetch next 5 classes for the specific batch
      let query = supabase
        .from("timetableRecords")
        .select("*")
        .eq("batchID", batchId) // Use passed batchId
        .gt("classStartTime", now);

      // Filter by enrolled courses if provided
      if (enrolledCourses && enrolledCourses.length > 0) {
        query = query.in("courseID", enrolledCourses);
        console.log(
          "[getUpcomingClasses] Filtering by enrolled courses:",
          enrolledCourses,
        );
      }

      const { data: classes, error } = await query
        .order("classStartTime", { ascending: true })
        .limit(5);

      if (error) throw error;
      if (!classes) return [];

      return classes.map((cls) => ({
        classID: cls.classID,
        courseID: cls.courseID,
        courseName: cls.courseName || "Upcoming Class",
        classStartTime: cls.classStartTime,
        classEndTime: cls.classEndTime,
        classVenue: cls.classVenue,
        classDate: cls.classDate,
        courseType: cls.courseType ?? null,
      }));
    } catch (err) {
      console.error("[getUpcomingClasses] Failed:", err);
      return [];
    }
  },

  /**
   * Fetch the next upcoming class for enrolled courses
   * Direct query on timetableRecords (single nearest upcoming class)
   */
  async getNextEnrolledClass(
    userId: string,
    batchId: string,
    enrolledCourses?: string[],
  ): Promise<UpcomingClass | null> {
    if (!userId || !batchId) return null;

    try {
      const now = Date.now();
      const windowStart = new Date(now - DAY_MS).toISOString();

      let query = supabase
        .from("timetableRecords")
        .select("*")
        .eq("batchID", batchId)
        .gte("classStartTime", windowStart);

      if (enrolledCourses && enrolledCourses.length > 0) {
        query = query.in("courseID", enrolledCourses);
      }

      const { data: classes, error } = await query
        .order("classStartTime", { ascending: true })
        .limit(25);

      if (error) throw error;
      if (!classes || classes.length === 0) return null;

      const nextClass = classes.find((cls) => {
        const startMs = parseTimestampAsIST(cls.classStartTime).getTime();
        return Number.isFinite(startMs) && startMs > now;
      });

      if (!nextClass) return null;

      const cls = nextClass;
      return {
        classID: cls.classID,
        courseID: cls.courseID,
        courseName: cls.courseName || "Upcoming Class",
        classStartTime: cls.classStartTime,
        classEndTime: cls.classEndTime,
        classVenue: cls.classVenue,
        classDate: cls.classDate,
        courseType: cls.courseType ?? null,
      };
    } catch (err) {
      console.error("[getNextEnrolledClass] Failed:", err);
      return null;
    }
  },

  /**
   * Fetch classes by date
   */
  async getClassesByDate(
    userId: string,
    batchId: string,
    targetDate: string,
    enrolledCourses?: string[],
  ): Promise<ClassByDate[]> {
    if (!userId || !batchId || !targetDate) return [];

    try {
      let query = supabase
        .from("timetableRecords")
        .select("*")
        .eq("batchID", batchId)
        .eq("classDate", targetDate);

      // Filter by enrolled courses if provided
      if (enrolledCourses && enrolledCourses.length > 0) {
        query = query.in("courseID", enrolledCourses);
      }

      const { data: classes, error } = await query.order("classStartTime", {
        ascending: true,
      });

      if (error) throw error;
      if (!classes) return [];

      return classes.map((cls) => ({
        classID: cls.classID,
        courseID: cls.courseID,
        courseName: cls.courseName,
        classStartTime: cls.classStartTime,
        classEndTime: cls.classEndTime,
        classVenue: cls.classVenue,
        classDate: cls.classDate,
        classStatus: cls.classStatus,
        courseType: cls.courseType,
        isPlusSlot: cls.isPlusSlot || false,
      }));
    } catch (err) {
      console.error("[getClassesByDate] Failed:", err);
      return [];
    }
  },

  /**
   * Get Next Class
   */
  async getNextClass(
    userId: string,
    batchId: string,
    enrolledCourses?: string[],
  ): Promise<TodayScheduleClass | null> {
    if (!userId || !batchId) return null;

    try {
      const now = new Date().toISOString();

      let query = supabase
        .from("timetableRecords")
        .select("*")
        .eq("batchID", batchId)
        .gt("classEndTime", now); // Show class if it hasn't ended yet (Current) OR is in future

      // Filter by enrolled courses if provided
      if (enrolledCourses && enrolledCourses.length > 0) {
        query = query.in("courseID", enrolledCourses);
      }

      const { data: classes, error } = await query
        .order("classStartTime", { ascending: true })
        .limit(1);

      if (error) throw error;
      if (!classes || classes.length === 0) return null;

      const cls = classes[0];

      // Check attendance
      const { data: attendance } = await supabase
        .from("attendanceRecords")
        .select("classID")
        .eq("userID", userId)
        .eq("classID", cls.classID)
        .maybeSingle();

      return {
        classID: cls.classID,
        courseID: cls.courseID,
        courseName: cls.courseName || "Next Class",
        classStartTime: cls.classStartTime,
        classEndTime: cls.classEndTime,
        classVenue: cls.classVenue,
        isCancelled: cls.classStatus?.isCancelled || false,
        userAttended: !!attendance,
        userCheckinTime: null,
        totalClasses: 0,
        attendedClasses: 0,
        currentAttendancePercentage: 0,
        classesRequiredToReachGoal: 0,
        classesCanSkipAndStayAboveGoal: 0,
      };
    } catch (err) {
      console.error("[getNextClass] Failed:", err);
      return null;
    }
  },
};

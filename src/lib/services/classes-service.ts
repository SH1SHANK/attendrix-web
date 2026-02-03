import { supabase } from "@/lib/supabase/client";
import {
  ClassByDate,
  TodayScheduleClass,
  UpcomingClass,
} from "@/types/supabase-academic";
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
      return (data as any[]).map((row) => ({
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
   * Fetch upcoming classes
   * RAW QUERY: 'timetableRecords' filtered by date > now
   */
  async getUpcomingClasses(
    userId: string,
    batchId: string,
  ): Promise<UpcomingClass[]> {
    if (!userId || !batchId) return [];

    try {
      const now = new Date().toISOString();

      // Fetch next 5 classes for the specific batch
      const { data: classes, error } = await supabase
        .from("timetableRecords")
        .select("*")
        .eq("batchID", batchId) // Use passed batchId
        .gt("classStartTime", now)
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
      }));
    } catch (err) {
      console.error("[getUpcomingClasses] Failed:", err);
      return [];
    }
  },

  /**
   * Fetch classes by date
   */
  async getClassesByDate(
    userId: string,
    batchId: string,
    targetDate: string,
  ): Promise<ClassByDate[]> {
    if (!userId || !batchId || !targetDate) return [];

    try {
      const { data: classes, error } = await supabase
        .from("timetableRecords")
        .select("*")
        .eq("batchID", batchId)
        .eq("classDate", targetDate)
        .order("classStartTime", { ascending: true });

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
  ): Promise<TodayScheduleClass | null> {
    if (!userId || !batchId) return null;

    try {
      const now = new Date().toISOString();

      const { data: classes, error } = await supabase
        .from("timetableRecords")
        .select("*")
        .eq("batchID", batchId)
        .gt("classEndTime", now) // Show class if it hasn't ended yet (Current) OR is in future
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

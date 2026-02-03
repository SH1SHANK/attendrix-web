import { supabase } from "@/lib/supabase/client";
import {
  ClassByDate,
  TodayScheduleClass,
  UpcomingClass,
} from "@/types/supabase-academic";

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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    attendanceGoalPercentage: number = 80,
    dateIso?: string,
  ): Promise<TodayScheduleClass[]> {
    if (!userId || !batchId) return [];

    try {
      const targetDate = dateIso ? new Date(dateIso) : new Date();
      // Format to "D/M/YYYY" to match database format (non-padded day/month?)
      // Check existing logs: "3/2/2026" (D/M/YYYY)
      const day = targetDate.getDate();
      const month = targetDate.getMonth() + 1;
      const year = targetDate.getFullYear();
      const dateString = `${day}/${month}/${year}`;

      // 1. Fetch Schedule
      const { data: classes, error: classesError } = await supabase
        .from("timetableRecords")
        .select("*")
        .eq("batchID", batchId)
        .eq("classDate", dateString)
        .order("classStartTime", { ascending: true });

      if (classesError) {
        console.error("Error fetching timetable:", classesError);
        throw classesError;
      }

      if (!classes || classes.length === 0) return [];

      // 2. Fetch User Attendance for these classes
      const classIds = classes.map((c) => c.classID);
      const { data: attendance, error: attendanceError } = await supabase
        .from("attendanceRecords")
        .select("classID")
        .eq("userID", userId)
        .in("classID", classIds);

      if (attendanceError) {
        console.error("Error fetching attendance:", attendanceError);
        // Continue without attendance status rather than failing completely?
        // Better to throw so UI knows something is wrong, or warn.
      }

      const attendedClassIds = new Set(
        (attendance || []).map((a) => a.classID),
      );

      // 3. Map to TodayScheduleClass
      // NOTE: Complex stats (totalClasses, etc.) are set to default values
      // to keep this fetch simple and fast as requested.
      return classes.map((cls) => ({
        classID: cls.classID,
        courseID: cls.courseID,
        courseName: cls.courseName || "Unknown Course",
        classStartTime: cls.classStartTime,
        classEndTime: cls.classEndTime,
        classVenue: cls.classVenue,
        isCancelled: cls.classStatus?.isCancelled || false,
        userAttended: attendedClassIds.has(cls.classID),
        userCheckinTime: null, // Could fetch if needed
        totalClasses: 0, // Simplified -> 0
        attendedClasses: 0, // Simplified -> 0
        currentAttendancePercentage: 0, // Simplified -> 0
        classesRequiredToReachGoal: 0, // Simplified -> 0
        classesCanSkipAndStayAboveGoal: 0, // Simplified -> 0
      }));
    } catch (err) {
      console.error("[getTodaySchedule] Failed:", err);
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

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/utils/supabase/client";
import {
  TimetableRecordSchema,
  AttendanceRecordSchema,
  type TimetableRecord,
} from "@/schemas/db";

const supabase = createClient();

export type HistoryRange = "7d" | "14d" | "30d" | "all";

export interface ClassRecord {
  id: string; // classID
  courseID: string;
  courseCode: string;
  courseName: string;
  venue: string;
  startTime: string; // HH:yy
  endTime: string;
  type: "lecture" | "lab" | "tutorial";
  attended: boolean;
  date: Date;
}

export interface GroupedHistory {
  date: Date;
  label: string;
  classes: ClassRecord[];
}

export const useHistory = (range: HistoryRange) => {
  const { user } = useAuth();
  const queryKey = ["history", user?.uid, range];

  const {
    data: history = [],
    isLoading,
    error,
  } = useQuery<GroupedHistory[]>({
    queryKey,
    queryFn: async () => {
      if (!user?.uid) return [];

      // 1. Determine Date Range
      const endDate = new Date();
      let startDate: Date | null = null;

      if (range !== "all") {
        const days = parseInt(range);
        startDate = new Date();
        startDate.setDate(endDate.getDate() - days);
        startDate.setHours(0, 0, 0, 0);
      }

      // 2. Fetch Enrolled Courses (Need IDs to fetch timetable)
      const { data: userCourses } = await supabase
        .from("userCourseRecords")
        .select("enrolledCourses")
        .eq("userID", user.uid)
        .limit(1)
        .maybeSingle();

      const courseIDs = (userCourses?.enrolledCourses || [])
        .map((c: { courseID: string }) => c.courseID)
        .filter(Boolean);

      if (courseIDs.length === 0) return [];

      // 3. Fetch Timetable Records
      let query = supabase
        .from("timetableRecords")
        .select("*")
        .in("courseID", courseIDs)
        .lte("classStartTime", endDate.toISOString());

      if (startDate) {
        query = query.gte("classStartTime", startDate.toISOString());
      }

      // Order by latest first
      query = query.order("classStartTime", { ascending: false });

      const { data: timetableData, error: timetableError } = await query;
      if (timetableError) throw timetableError;

      const timetable: TimetableRecord[] = (timetableData || []).map((t) =>
        TimetableRecordSchema.parse(t),
      );
      const classIDs = timetable.map((t) => t.classID);

      if (classIDs.length === 0) return [];

      // 4. Fetch Attendance Records
      const { data: attendanceData, error: attendanceError } = await supabase
        .from("attendanceRecords")
        .select("*")
        .eq("userID", user.uid)
        .in("classID", classIDs);

      if (attendanceError) throw attendanceError;

      const attendanceMap = new Set<string>();
      (attendanceData || []).forEach((a) => {
        const parsed = AttendanceRecordSchema.parse(a);
        attendanceMap.add(parsed.classID);
      });

      // 5. Group by Date
      const groups = new Map<string, ClassRecord[]>();

      timetable.forEach((t) => {
        const date = new Date(t.classStartTime);
        const dateKey = date.toDateString(); // "Mon Jan 01 2026"

        const record: ClassRecord = {
          id: t.classID,
          courseID: t.courseID,
          courseCode: t.courseName.split(" ")[0] || t.courseID,
          courseName: t.courseName,
          venue: t.classVenue || "TBA",
          startTime: date.toTimeString().slice(0, 5),
          endTime: new Date(t.classEndTime).toTimeString().slice(0, 5),
          type: (t.courseType as "lecture" | "lab" | "tutorial") || "lecture",
          attended: attendanceMap.has(t.classID),
          date: date,
        };

        if (!groups.has(dateKey)) {
          groups.set(dateKey, []);
        }
        groups.get(dateKey)?.push(record);
      });

      // Convert to array
      return Array.from(groups.entries()).map(([dateStr, classes]) => ({
        date: new Date(dateStr),
        label: dateStr, // Format better in component if needed
        classes,
      }));
    },
    enabled: !!user?.uid,
    staleTime: 5 * 60 * 1000,
  });

  return {
    history,
    isLoading,
    error,
    range,
  };
};

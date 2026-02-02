import { supabase } from "@/lib/supabase/client";
import {
  ClassByDate,
  TodayScheduleClass,
  UpcomingClass,
} from "@/types/supabase-academic";

type TimetableRecord = {
  classID: string;
  courseID: string;
  courseName: string;
  classStartTime: string;
  classEndTime: string;
  classVenue: string | null;
  classDate: string | null;
  classStatus: unknown;
  courseType: unknown;
  isPlusSlot: boolean | null;
  batchID?: string;
};

type AttendanceRecord = {
  classID: string;
  checkinTime: string | null;
};

type UserCourseRecord = {
  enrolledCourses: unknown;
};

const CANCELLED_STATUSES = new Set(["cancelled", "canceled"]);

function safeParseJson<T>(value: unknown): T | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "object") {
    return value as T;
  }

  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  return null;
}

function getStatus(value: unknown): string | null {
  const parsed = safeParseJson<{ status?: string }>(value);
  if (parsed && typeof parsed.status === "string") {
    return parsed.status.toLowerCase();
  }

  if (value && typeof value === "object" && "status" in value) {
    const status = (value as { status?: unknown }).status;
    if (typeof status === "string") {
      return status.toLowerCase();
    }
  }

  return null;
}

function isCancelledStatus(value: unknown): boolean {
  const status = getStatus(value);
  return status ? CANCELLED_STATUSES.has(status) : false;
}

function formatDateDMY(date: Date): string {
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

async function getUserCourseIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("userCourseRecords")
    .select("enrolledCourses")
    .eq("userID", userId)
    .limit(1);

  if (error) {
    throw new Error(`Failed to fetch user courses: ${error.message}`);
  }

  const record = (data?.[0] as UserCourseRecord | undefined) ?? undefined;
  const raw = record?.enrolledCourses ?? null;
  const parsed = safeParseJson<unknown[]>(raw);

  if (Array.isArray(raw)) {
    return raw.filter((item) => typeof item === "string");
  }

  if (Array.isArray(parsed)) {
    return parsed.filter((item) => typeof item === "string") as string[];
  }

  return [];
}

export const ClassesService = {
  async getTodaySchedule(
    userId: string,
    batchId: string,
    attendanceGoalPercentage: number = 75,
    dateIso?: string,
  ): Promise<TodayScheduleClass[]> {
    const targetDate = dateIso ? new Date(dateIso) : new Date();
    if (Number.isNaN(targetDate.getTime())) {
      throw new Error("Invalid date for schedule request");
    }

    const targetClassDate = formatDateDMY(targetDate);
    const nowIso = new Date().toISOString();

    const { data: statsRecords, error: statsError } = await supabase
      .from("timetableRecords")
      .select("classID,courseID,classStartTime,classStatus")
      .eq("batchID", batchId)
      .lte("classStartTime", nowIso);

    if (statsError) {
      throw new Error(`Failed to fetch timetable stats: ${statsError.message}`);
    }

    const filteredStats =
      (statsRecords as TimetableRecord[] | null | undefined)
        ?.filter((record) => !isCancelledStatus(record.classStatus))
        .filter((record) => record.classID && record.courseID) ?? [];

    const totalByCourse = new Map<string, number>();
    const classIdToCourse = new Map<string, string>();

    filteredStats.forEach((record) => {
      classIdToCourse.set(record.classID, record.courseID);
      totalByCourse.set(
        record.courseID,
        (totalByCourse.get(record.courseID) ?? 0) + 1,
      );
    });

    const statsClassIds = filteredStats.map((record) => record.classID);
    let attendanceRecords: AttendanceRecord[] = [];

    if (statsClassIds.length > 0) {
      const { data: attendanceData, error: attendanceError } = await supabase
        .from("attendanceRecords")
        .select("classID,checkinTime")
        .eq("userID", userId)
        .in("classID", statsClassIds);

      if (attendanceError) {
        throw new Error(
          `Failed to fetch attendance records: ${attendanceError.message}`,
        );
      }

      attendanceRecords = (attendanceData as AttendanceRecord[]) ?? [];
    }

    const attendanceByClassId = new Map<string, AttendanceRecord>();
    const attendedByCourse = new Map<string, number>();

    attendanceRecords.forEach((record) => {
      attendanceByClassId.set(record.classID, record);
      const courseId = classIdToCourse.get(record.classID);
      if (!courseId) {
        return;
      }
      attendedByCourse.set(courseId, (attendedByCourse.get(courseId) ?? 0) + 1);
    });

    const { data: scheduleRecords, error: scheduleError } = await supabase
      .from("timetableRecords")
      .select(
        "classID,courseID,courseName,classStartTime,classEndTime,classVenue,classDate,classStatus",
      )
      .eq("batchID", batchId)
      .eq("classDate", targetClassDate);

    if (scheduleError) {
      throw new Error(
        `Failed to fetch today's schedule: ${scheduleError.message}`,
      );
    }

    const schedule =
      (scheduleRecords as TimetableRecord[] | null | undefined)
        ?.filter((record) => !isCancelledStatus(record.classStatus))
        .map((record) => {
          const total = totalByCourse.get(record.courseID) ?? 0;
          const attended = attendedByCourse.get(record.courseID) ?? 0;
          const percentage = total === 0 ? 0 : (attended / total) * 100.0;
          const attendanceGoal = attendanceGoalPercentage;

          const classesRequiredToReachGoal =
            total === 0
              ? 0
              : percentage >= attendanceGoal
                ? 0
                : Math.max(
                    0,
                    Math.ceil(
                      (attendanceGoal * total - 100.0 * attended) /
                        (100.0 - attendanceGoal),
                    ),
                  );

          const classesCanSkipAndStayAboveGoal =
            total === 0
              ? 0
              : percentage <= attendanceGoal
                ? 0
                : Math.max(
                    0,
                    Math.floor(
                      (100.0 * attended - attendanceGoal * total) /
                        attendanceGoal,
                    ),
                  );

          const attendance = attendanceByClassId.get(record.classID) ?? null;

          return {
            classID: record.classID,
            courseID: record.courseID,
            courseName: record.courseName,
            classStartTime: record.classStartTime,
            classEndTime: record.classEndTime,
            classVenue: record.classVenue,
            isCancelled: isCancelledStatus(record.classStatus),
            userAttended: Boolean(attendance),
            userCheckinTime: attendance?.checkinTime ?? null,
            totalClasses: total,
            attendedClasses: attended,
            currentAttendancePercentage: percentage,
            classesRequiredToReachGoal,
            classesCanSkipAndStayAboveGoal,
          } satisfies TodayScheduleClass;
        }) ?? [];

    return schedule.sort(
      (a, b) =>
        new Date(a.classStartTime).getTime() -
        new Date(b.classStartTime).getTime(),
    );
  },

  async getUpcomingClasses(userId: string): Promise<UpcomingClass[]> {
    const courseIds = await getUserCourseIds(userId);
    if (courseIds.length === 0) {
      return [];
    }

    const nowIso = new Date().toISOString();
    const { data, error } = await supabase
      .from("timetableRecords")
      .select(
        "classID,courseID,courseName,classStartTime,classEndTime,classVenue,classDate,classStatus",
      )
      .in("courseID", courseIds)
      .gt("classStartTime", nowIso);

    if (error) {
      throw new Error(`Failed to fetch upcoming classes: ${error.message}`);
    }

    const records =
      (data as TimetableRecord[] | null | undefined)
        ?.filter((record) => !isCancelledStatus(record.classStatus))
        .filter((record) => record.classStartTime) ?? [];

    if (records.length === 0) {
      return [];
    }

    const sorted = [...records].sort(
      (a, b) =>
        new Date(a.classStartTime).getTime() -
        new Date(b.classStartTime).getTime(),
    );

    if (sorted.length === 0) {
      return [];
    }

    const nextDateKey = dateKey(new Date(sorted[0].classStartTime));

    return sorted
      .filter(
        (record) => dateKey(new Date(record.classStartTime)) === nextDateKey,
      )
      .map((record) => {
        const classDate =
          record.classDate ?? formatDateDMY(new Date(record.classStartTime));

        return {
          classID: record.classID,
          courseID: record.courseID,
          courseName: record.courseName,
          classStartTime: record.classStartTime,
          classEndTime: record.classEndTime,
          classVenue: record.classVenue,
          classDate,
        } satisfies UpcomingClass;
      });
  },

  async getClassesByDate(
    userId: string,
    targetDate: string,
  ): Promise<ClassByDate[]> {
    const courseIds = await getUserCourseIds(userId);
    if (courseIds.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from("timetableRecords")
      .select(
        "classID,courseID,courseName,classStartTime,classEndTime,classVenue,classDate,classStatus,courseType,isPlusSlot",
      )
      .in("courseID", courseIds)
      .eq("classDate", targetDate);

    if (error) {
      throw new Error(`Failed to fetch classes by date: ${error.message}`);
    }

    return (
      (data as TimetableRecord[] | null | undefined)
        ?.filter((record) => !isCancelledStatus(record.classStatus))
        .map((record) => ({
          classID: record.classID,
          courseID: record.courseID,
          courseName: record.courseName,
          classStartTime: record.classStartTime,
          classEndTime: record.classEndTime,
          classVenue: record.classVenue,
          classDate: record.classDate ?? targetDate,
          classStatus: safeParseJson(record.classStatus) as Record<
            string,
            unknown
          > | null,
          courseType: safeParseJson(
            record.courseType,
          ) as ClassByDate["courseType"],
          isPlusSlot: Boolean(record.isPlusSlot),
        }))
        .sort(
          (a, b) =>
            new Date(a.classStartTime).getTime() -
            new Date(b.classStartTime).getTime(),
        ) ?? []
    );
  },
};

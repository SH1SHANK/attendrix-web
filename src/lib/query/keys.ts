import type { FilterPeriod } from "@/types/types-defination";

export const queryKeys = {
  userCourseRecords: (uid: string | null) =>
    ["user-course-records", uid] as const,
  attendanceSummary: (uid: string | null, attendanceGoal?: number) =>
    ["attendance-summary", uid, attendanceGoal ?? null] as const,
  pastClasses: (uid: string | null, filter: FilterPeriod) =>
    ["past-classes", uid, filter] as const,
  dashboardSchedule: (
    uid: string | null,
    batchId: string,
    attendanceGoal: number,
    enrolledKey: string,
  ) =>
    [
      "dashboard-schedule",
      uid,
      batchId,
      attendanceGoal,
      enrolledKey,
    ] as const,
  classesByDate: (
    uid: string | null,
    batchId: string,
    date: string | null,
    enrolledKey: string,
  ) => ["classes-by-date", uid, batchId, date, enrolledKey] as const,
  userCalendars: (batchId: string | null) =>
    ["user-calendars", batchId] as const,
  tasks: (uid: string | null) => ["tasks", uid] as const,
  resourceCourses: (uid: string | null) => ["resource-courses", uid] as const,
  driveFolder: (folderId: string | null) => ["drive-folder", folderId] as const,
};

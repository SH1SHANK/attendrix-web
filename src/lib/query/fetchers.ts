import { fetchJson } from "@/lib/api/fetch-json";
import type {
  CourseAttendanceSummary,
  EvaluateChallengesResponse,
  FilterPeriod,
  PastClass,
  TaskRecord,
  UserCourseRecord,
} from "@/types/types-defination";
import type {
  ClassByDate,
  TodayScheduleClass,
  UpcomingClass,
} from "@/types/supabase-academic";

export type DashboardScheduleData = {
  todaySchedule: TodayScheduleClass[];
  upcomingClasses: UpcomingClass[];
};

export type UserCalendar = {
  calendarID: string;
  calendarUrl: string;
  calendar_name: string;
  batchID: string;
};

export async function fetchUserCourseRecords(options?: {
  signal?: AbortSignal;
}): Promise<UserCourseRecord | null> {
  return fetchJson<UserCourseRecord | null>(
    "/api/user/course-records",
    { signal: options?.signal },
    { metricName: "user-course-records" },
  );
}

export async function fetchAttendanceSummary(options: {
  signal?: AbortSignal;
  attendanceGoal?: number;
}) {
  const params = new URLSearchParams();
  if (options.attendanceGoal) {
    params.set("attendanceGoal", String(options.attendanceGoal));
  }

  const url = params.toString()
    ? `/api/attendance/summary?${params.toString()}`
    : "/api/attendance/summary";

  return fetchJson<CourseAttendanceSummary[]>(
    url,
    { signal: options.signal },
    { metricName: "attendance-summary" },
  );
}

export async function fetchPastClasses(options: {
  signal?: AbortSignal;
  filter: FilterPeriod;
}) {
  const params = new URLSearchParams();
  params.set("filter", options.filter);

  return fetchJson<PastClass[]>(
    `/api/attendance/past?${params.toString()}`,
    { signal: options.signal },
    { metricName: "attendance-past" },
  );
}

export async function fetchDashboardSchedule(options: {
  signal?: AbortSignal;
  batchId: string;
  attendanceGoal: number;
  date?: string;
}) {
  const params = new URLSearchParams();
  params.set("batchId", options.batchId);
  params.set("attendanceGoal", String(options.attendanceGoal));
  if (options.date) params.set("date", options.date);

  return fetchJson<DashboardScheduleData>(
    `/api/attendance/schedule?${params.toString()}`,
    { signal: options.signal },
    { metricName: "dashboard-schedule" },
  );
}

export async function fetchClassesByDate(options: {
  signal?: AbortSignal;
  batchId: string;
  date: string;
}) {
  const params = new URLSearchParams();
  params.set("batchId", options.batchId);
  params.set("date", options.date);

  return fetchJson<ClassByDate[]>(
    `/api/attendance/classes-by-date?${params.toString()}`,
    { signal: options.signal },
    { metricName: "classes-by-date" },
  );
}

export async function fetchUserCalendars(options?: {
  signal?: AbortSignal;
  batchId?: string | null;
}) {
  const params = new URLSearchParams();
  if (options?.batchId) {
    params.set("batchID", options.batchId);
  }
  const url = params.toString()
    ? `/api/user/calendars?${params.toString()}`
    : "/api/user/calendars";
  return fetchJson<UserCalendar[]>(
    url,
    { signal: options?.signal },
    { metricName: "user-calendars" },
  );
}

export async function fetchTasks(options?: { signal?: AbortSignal }) {
  return fetchJson<TaskRecord[]>(
    "/api/tasks",
    { signal: options?.signal },
    { metricName: "tasks" },
  );
}

export async function postClassCheckIn(payload: {
  classID: string;
  classStartTime: string;
}) {
  return fetchJson(
    "/api/attendance/check-in",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    { metricName: "attendance-check-in" },
  );
}

export async function postBulkCheckIn(payload: { classIds: string[] }) {
  return fetchJson(
    "/api/attendance/bulk-checkin",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    { metricName: "attendance-bulk-checkin" },
  );
}

export async function postMarkAbsent(payload: { classID: string }) {
  return fetchJson(
    "/api/attendance/mark-absent",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    { metricName: "attendance-mark-absent" },
  );
}

export async function postEvaluateChallenges(payload: {
  progressIds: string[];
  currentStreak: number | null;
  courseIds: string[];
}): Promise<EvaluateChallengesResponse> {
  return fetchJson(
    "/api/attendance/evaluate-challenges",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    { metricName: "attendance-evaluate-challenges" },
  );
}

import { useQuery } from "@tanstack/react-query";
import { fetchAttendanceSummary } from "@/lib/query/fetchers";
import { getCacheConfig } from "@/lib/query/cache-config";
import { queryKeys } from "@/lib/query/keys";
import type { CourseAttendanceSummary } from "@/types/types-defination";

type RawSummary = Record<string, unknown>;

const getFirst = (record: RawSummary, keys: string[]) => {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null) {
      return value;
    }
  }
  return undefined;
};

const toNumber = (value: unknown, fallback = 0) => {
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const toBoolean = (value: unknown) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return false;
};

const toString = (value: unknown, fallback = "") => {
  if (value === null || value === undefined) return fallback;
  return String(value);
};

function normalizeSummaryItem(raw: RawSummary): CourseAttendanceSummary {
  return {
    courseID: toString(
      getFirst(raw, ["courseID", "courseId", "courseid", "course_id"]),
    ),
    courseName: toString(
      getFirst(raw, ["courseName", "course_name", "coursename"]),
    ),
    courseType: toString(
      getFirst(raw, ["courseType", "course_type", "coursetype"]),
    ),
    credits: toNumber(getFirst(raw, ["credits"])),
    isLab: toBoolean(getFirst(raw, ["isLab", "is_lab", "islab"])),
    totalClasses: toNumber(
      getFirst(raw, ["totalClasses", "total_classes", "totalclasses"]),
    ),
    attendedClasses: toNumber(
      getFirst(raw, ["attendedClasses", "attended_classes", "attendedclasses"]),
    ),
    attendancePercentage: toNumber(
      getFirst(raw, [
        "attendancePercentage",
        "attendance_percentage",
        "attendancepercentage",
      ]),
    ),
    numbersOfClassesNeededToBeAboveAttendanceGoal: toNumber(
      getFirst(raw, [
        "numbersOfClassesNeededToBeAboveAttendanceGoal",
        "numbers_of_classes_needed_to_be_above_attendance_goal",
        "numbersofclassesneededtobeaboveattendancegoal",
        "classesRequiredToReachGoal",
      ]),
    ),
    numbersOfClassesCanBeSkippedStillStayAboveGoal: toNumber(
      getFirst(raw, [
        "numbersOfClassesCanBeSkippedStillStayAboveGoal",
        "numbers_of_classes_can_be_skipped_still_stay_above_goal",
        "numbersofclassescanbeskippedstillstayabovegoal",
        "classesCanSkipAndStayAboveGoal",
      ]),
    ),
  };
}

function normalizeSummary(raw: unknown): CourseAttendanceSummary[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is RawSummary => Boolean(item && typeof item === "object"))
    .map(normalizeSummaryItem)
    .filter((item) => item.courseID.length > 0);
}

export function useAttendanceSummary(
  uid: string | null,
  attendanceGoal?: number,
) {
  const cache = getCacheConfig("attendanceSummary");

  return useQuery<CourseAttendanceSummary[], Error>({
    queryKey: queryKeys.attendanceSummary(uid, attendanceGoal),
    enabled: Boolean(uid),
    staleTime: cache.staleTimeMs,
    gcTime: cache.gcTimeMs,
    refetchOnWindowFocus: cache.refetchOnWindowFocus ?? false,
    queryFn: async ({ signal }) => {
      const summary = await fetchAttendanceSummary({ signal, attendanceGoal });
      return normalizeSummary(summary);
    },
  });
}

import { db } from "@/lib/firebase";
import { doc, getDoc, runTransaction } from "firebase/firestore";
import {
  CourseAttendanceSummary,
  EvaluateChallengesResponse,
  FirebaseCourseEnrollment,
  FirebaseUserDocument,
  MarkClassAbsentRpcResponse,
  ClassCheckInRpcResponse,
  UserCourseRecord,
} from "@/types/types-defination";
import {
  fetchAttendanceSummary,
  fetchUserCourseRecords,
  postBulkCheckIn,
  postClassCheckIn,
  postEvaluateChallenges,
  postMarkAbsent,
} from "@/lib/query/fetchers";
import {
  computeStreakUpdatesForAddition,
  dateToIntIST,
  parseStreakHistory,
  StreakData,
} from "@/lib/attendance/streak-utils";
import { parseTimestampAsIST } from "@/lib/time/ist";

interface EvaluateChallengesParams {
  progressIds: string[];
  currentStreak: number | null;
  courseIds: string[];
}

function normalizeRpcData<T>(data: unknown): T | null {
  if (!data) return null;
  if (Array.isArray(data)) {
    return (data[0] as T) ?? null;
  }
  return data as T;
}

export async function classCheckInRpc(params: {
  classID: string;
  classStartTime: string;
}) {
  const data = await postClassCheckIn({
    classID: params.classID,
    classStartTime: params.classStartTime,
  });

  const normalized = normalizeRpcData<ClassCheckInRpcResponse>(data);
  if (!normalized) {
    throw new Error("class_check_in returned no data");
  }

  return normalized;
}

export async function bulkCheckInRpc(params: { classIds: string[] }) {
  if (!params.classIds || params.classIds.length === 0) {
    throw new Error("bulk_class_checkin requires classIds");
  }

  const data = await postBulkCheckIn({ classIds: params.classIds });
  const normalized = normalizeRpcData<Record<string, unknown>>(data);
  if (!normalized) {
    throw new Error("bulk_class_checkin returned no data");
  }

  return normalized;
}

export async function markClassAbsentRpc(params: {
  classID: string;
}) {
  const data = await postMarkAbsent({ classID: params.classID });
  const normalized = normalizeRpcData<MarkClassAbsentRpcResponse>(data);
  if (!normalized) {
    throw new Error("mark_class_absent returned no data");
  }

  return normalized;
}

export async function getCourseAttendanceSummaryRpc(
  uid: string,
  attendanceGoal?: number,
) {
  if (!uid) return [];
  const data = await fetchAttendanceSummary({
    attendanceGoal,
  });

  return (data as CourseAttendanceSummary[]) || [];
}

export async function getUserCourseRecords(uid: string) {
  if (!uid) return null;
  const data = await fetchUserCourseRecords();
  return (data as UserCourseRecord) || null;
}

export async function getFirestoreUser(uid: string) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as FirebaseUserDocument;
}

export async function evaluateUserChallengesRpc(
  params: EvaluateChallengesParams,
) {
  const data = await postEvaluateChallenges({
    progressIds: params.progressIds,
    currentStreak: params.currentStreak,
    courseIds: params.courseIds,
  });
  if (!data) return null;
  const normalized = normalizeRpcData<EvaluateChallengesResponse>(data);
  return normalized ?? null;
}

export function buildCourseTotalsMap(summary: CourseAttendanceSummary[]) {
  return new Map(
    summary.map((item) => [item.courseID, item]) as Array<
      [string, CourseAttendanceSummary]
    >,
  );
}

export function mergeCoursesWithSummary(
  courses: FirebaseCourseEnrollment[],
  summaryMap: Map<string, CourseAttendanceSummary>,
) {
  return courses.map((course) => {
    const summary = summaryMap.get(course.courseID);
    if (!summary) return course;

    return {
      ...course,
      attendedClasses: summary.attendedClasses,
      totalClasses: summary.totalClasses,
    };
  });
}

export function computeAmplixDelta(params: {
  amplix_gained?: number | null;
  amplix_lost?: number | null;
  points_to_deduct?: number | null;
}) {
  const baseDelta = (params.amplix_gained ?? 0) - (params.amplix_lost ?? 0);
  const challengeDelta = -(params.points_to_deduct ?? 0);
  return baseDelta + challengeDelta;
}

export function extractProgressIds(user: FirebaseUserDocument | null) {
  if (!user?.challengesAllotted || !Array.isArray(user.challengesAllotted)) {
    return [];
  }

  return user.challengesAllotted
    .map((challenge) => challenge?.progressID)
    .filter((id): id is string => typeof id === "string" && id.length > 0);
}

export function buildStreakData(user: FirebaseUserDocument | null): StreakData {
  const dates = parseStreakHistory(user?.streakHistory);
  return {
    dates,
    currentStreak: Number(user?.currentStreak ?? 0),
    longestStreak: Number(user?.longestStreak ?? 0),
  };
}

export async function applyFirestoreAttendanceUpdates(params: {
  uid: string;
  summary: CourseAttendanceSummary[];
  amplixDelta: number;
  streakUpdates?: {
    streakHistory?: number[];
    currentStreak?: number;
    longestStreak?: number;
  };
}) {
  // Rule: Attendance actions must never add, remove, or restructure Firebase user documents.
  // Only explicit numeric field updates are permitted (amplix/streaks and course totals only).
  const { uid, summary, amplixDelta, streakUpdates } = params;
  const summaryMap = buildCourseTotalsMap(summary);

  const ref = doc(db, "users", uid);

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists()) {
      throw new Error("User document not found");
    }

    const data = snap.data() as FirebaseUserDocument;
    const courses = Array.isArray(data.coursesEnrolled)
      ? (data.coursesEnrolled as FirebaseCourseEnrollment[])
      : [];

    const updatedCourses = mergeCoursesWithSummary(courses, summaryMap);

    const hasSummaryChanges = courses.some((course) => {
      const entry = summaryMap.get(course.courseID);
      if (!entry) return false;
      return (
        Number(course.attendedClasses ?? 0) !==
          Number(entry.attendedClasses ?? 0) ||
        Number(course.totalClasses ?? 0) !== Number(entry.totalClasses ?? 0)
      );
    });

    const updates: Record<string, unknown> = {};

    if (hasSummaryChanges) {
      updates.coursesEnrolled = updatedCourses;
    }

    if (amplixDelta !== 0) {
      const currentAmplix = Number(data.amplix ?? 0);
      const currentWeekAmplix = Number(data.currentWeekAmplixGained ?? 0);
      updates.amplix = currentAmplix + amplixDelta;
      updates.currentWeekAmplixGained = currentWeekAmplix + amplixDelta;
    }

    if (streakUpdates) {
      if (
        typeof streakUpdates.currentStreak === "number" &&
        streakUpdates.currentStreak !== Number(data.currentStreak ?? 0)
      ) {
        updates.currentStreak = streakUpdates.currentStreak;
      }
      if (
        Array.isArray(streakUpdates.streakHistory) &&
        JSON.stringify(streakUpdates.streakHistory) !==
          JSON.stringify(data.streakHistory ?? [])
      ) {
        updates.streakHistory = streakUpdates.streakHistory;
      }
      if (
        typeof streakUpdates.longestStreak === "number" &&
        streakUpdates.longestStreak !== Number(data.longestStreak ?? 0)
      ) {
        updates.longestStreak = streakUpdates.longestStreak;
      }
    }

    if (Object.keys(updates).length === 0) return;

    transaction.update(ref, updates);
  });
}

export function computeStreakUpdatesForCheckIn(params: {
  user: FirebaseUserDocument | null;
  classStartTime: string;
}) {
  const { user, classStartTime } = params;
  const streakData = buildStreakData(user);
  const currentDateInt = dateToIntIST(new Date());
  const targetDateInt = dateToIntIST(parseTimestampAsIST(classStartTime));

  return {
    streakData,
    updates: computeStreakUpdatesForAddition({
      streakData,
      targetDateInt,
      currentDateInt,
    }),
  };
}

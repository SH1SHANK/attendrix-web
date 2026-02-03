import { supabase } from "@/lib/supabase/client";
import { db } from "@/lib/firebase";
import { doc, getDoc, runTransaction } from "firebase/firestore";
import {
  ClassCheckInParams,
  CourseAttendanceSummary,
  EvaluateChallengesResponse,
  FirebaseCourseEnrollment,
  FirebaseUserDocument,
  MarkClassAbsentRpcResponse,
  MarkClassAbsentParams,
  ClassCheckInRpcResponse,
  UserCourseRecord,
} from "@/types/types-defination";
import {
  computeStreakUpdatesForAddition,
  dateToIntIST,
  parseStreakHistory,
  StreakData,
} from "@/lib/attendance/streak-utils";
import { parseTimestampAsIST } from "@/lib/time/ist";

interface EvaluateChallengesParams {
  p_user_id: string;
  p_progress_ids: string[];
  p_current_streak: number | null;
  p_course_ids: string[];
}

function normalizeRpcData<T>(data: unknown): T | null {
  if (!data) return null;
  if (Array.isArray(data)) {
    return (data[0] as T) ?? null;
  }
  return data as T;
}

export async function classCheckInRpc(params: ClassCheckInParams) {
  const { data, error } = await supabase.rpc("class_check_in", params);
  if (error) {
    throw new Error(error.message || "class_check_in failed");
  }

  const normalized = normalizeRpcData<ClassCheckInRpcResponse>(data);
  if (!normalized) {
    throw new Error("class_check_in returned no data");
  }

  return normalized;
}

export async function markClassAbsentRpc(params: MarkClassAbsentParams) {
  const { data, error } = await supabase.rpc("mark_class_absent", params);
  if (error) {
    throw new Error(error.message || "mark_class_absent failed");
  }

  const normalized = normalizeRpcData<MarkClassAbsentRpcResponse>(data);
  if (!normalized) {
    throw new Error("mark_class_absent returned no data");
  }

  return normalized;
}

export async function getCourseAttendanceSummaryRpc(uid: string) {
  const { data, error } = await supabase.rpc(
    "get_user_course_attendance_summary",
    {
      uid,
    },
  );

  if (error) {
    throw new Error(
      error.message || "get_user_course_attendance_summary failed",
    );
  }

  return (data as CourseAttendanceSummary[]) || [];
}

export async function getUserCourseRecords(uid: string) {
  const { data, error } = await supabase
    .from("userCourseRecords")
    .select("userID,batchID,semesterID,enrolledCourses,metadata,lastUpdated")
    .eq("userID", uid)
    .single();

  if (error) {
    throw new Error(error.message || "Failed to load userCourseRecords");
  }

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
  const { data, error } = await supabase.rpc(
    "evaluate_user_challenges",
    params,
  );
  if (error) {
    throw new Error(error.message || "evaluate_user_challenges failed");
  }

  const normalized = normalizeRpcData<EvaluateChallengesResponse>(data);
  if (!normalized) {
    throw new Error("evaluate_user_challenges returned no data");
  }

  return normalized;
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

    const updates: Record<string, unknown> = {
      coursesEnrolled: updatedCourses,
    };

    if (amplixDelta !== 0) {
      const currentAmplix = Number(data.amplix ?? 0);
      const currentWeekAmplix = Number(data.currentWeekAmplixGained ?? 0);
      updates.amplix = currentAmplix + amplixDelta;
      updates.currentWeekAmplixGained = currentWeekAmplix + amplixDelta;
    }

    if (streakUpdates) {
      if (typeof streakUpdates.currentStreak === "number") {
        updates.currentStreak = streakUpdates.currentStreak;
      }
      if (Array.isArray(streakUpdates.streakHistory)) {
        updates.streakHistory = streakUpdates.streakHistory;
      }
      if (typeof streakUpdates.longestStreak === "number") {
        updates.longestStreak = streakUpdates.longestStreak;
      }
    }

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

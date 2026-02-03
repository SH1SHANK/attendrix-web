"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  applyFirestoreAttendanceUpdates,
  classCheckInRpc,
  computeAmplixDelta,
  computeStreakUpdatesForCheckIn,
  evaluateUserChallengesRpc,
  extractProgressIds,
  getCourseAttendanceSummaryRpc,
  getFirestoreUser,
  getUserCourseRecords,
  markClassAbsentRpc,
} from "@/lib/attendance/attendance-service";
import {
  EvaluateChallengesResponse,
  FirebaseUserDocument,
} from "@/types/types-defination";

interface AttendanceActionArgs {
  classID: string;
  classStartTime: string;
}

interface AttendanceActionResult {
  success: boolean;
  message: string;
  challengeResult?: EvaluateChallengesResponse | null;
}

export function useAttendanceActions(params: {
  userId: string | null;
  onAfterSuccess?: () => Promise<void> | void;
}) {
  const { userId, onAfterSuccess } = params;
  const [pending, setPending] = useState<Set<string>>(new Set());
  const pendingRef = useRef<Set<string>>(new Set());

  const setPendingForClass = useCallback(
    (classID: string, isPending: boolean) => {
      const next = new Set(pendingRef.current);
      if (isPending) {
        next.add(classID);
      } else {
        next.delete(classID);
      }
      pendingRef.current = next;
      setPending(next);
    },
    [],
  );

  const pendingByClassId = useMemo(() => pending, [pending]);

  const withGuard = useCallback(
    async (classID: string, fn: () => Promise<AttendanceActionResult>) => {
      if (!userId) {
        toast.error("Please sign in to mark attendance");
        return { success: false, message: "Missing user" };
      }

      if (pendingRef.current.has(classID)) {
        return { success: false, message: "Action in progress" };
      }

      try {
        setPendingForClass(classID, true);
        const result = await fn();
        if (result.success && onAfterSuccess) {
          try {
            await onAfterSuccess();
          } catch (error) {
            console.warn("Post-attendance refresh failed", error);
          }
        }
        return result;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Attendance action failed";
        toast.error(message);
        return { success: false, message };
      } finally {
        setPendingForClass(classID, false);
      }
    },
    [onAfterSuccess, setPendingForClass, userId],
  );

  const runChallengeEval = useCallback(
    async (args: {
      user: FirebaseUserDocument | null;
      enrolledCourses: string[];
      currentStreak: number | null;
    }) => {
      if (!userId) return null;
      const progressIds = extractProgressIds(args.user);
      if (progressIds.length === 0 || args.enrolledCourses.length === 0) {
        return null;
      }

      return evaluateUserChallengesRpc({
        p_user_id: userId,
        p_progress_ids: progressIds,
        p_current_streak: args.currentStreak,
        p_course_ids: args.enrolledCourses,
      });
    },
    [userId],
  );

  const checkIn = useCallback(
    async ({ classID, classStartTime }: AttendanceActionArgs) => {
      return withGuard(classID, async () => {
        if (!userId) {
          return { success: false, message: "Missing user" };
        }

        const courseRecord = await getUserCourseRecords(userId);
        const enrolledCourses = courseRecord?.enrolledCourses || [];
        if (enrolledCourses.length === 0) {
          toast.error("No enrolled courses found for attendance");
          return { success: false, message: "Missing enrolled courses" };
        }

        const checkInResponse = await classCheckInRpc({
          p_user_id: userId,
          p_class_id: classID,
          p_class_start: classStartTime,
          p_enrolled_courses: enrolledCourses,
        });

        if (checkInResponse.status !== "success") {
          toast.error(checkInResponse.message || "Check-in failed");
          return { success: false, message: checkInResponse.message };
        }

        const [summary, user] = await Promise.all([
          getCourseAttendanceSummaryRpc(userId),
          getFirestoreUser(userId),
        ]);

        const fullDayCompleted = checkInResponse.full_day_completed === true;
        const streakPayload = fullDayCompleted
          ? computeStreakUpdatesForCheckIn({
              user,
              classStartTime,
            })
          : { streakData: null, updates: {} };

        const computedCurrentStreak =
          typeof (streakPayload.updates as any).currentStreak === "number"
            ? (streakPayload.updates as any).currentStreak
            : (user?.currentStreak ?? 0);

        let challengeResult: EvaluateChallengesResponse | null = null;
        let challengeError: Error | null = null;

        try {
          challengeResult = await runChallengeEval({
            user,
            enrolledCourses,
            currentStreak: computedCurrentStreak,
          });
        } catch (err) {
          challengeError = err as Error;
        }

        const totalDelta = computeAmplixDelta({
          amplix_gained: checkInResponse.amplix_gained,
          amplix_lost: checkInResponse.amplix_lost,
          points_to_deduct: challengeResult?.points_to_deduct ?? 0,
        });

        await applyFirestoreAttendanceUpdates({
          uid: userId,
          summary,
          amplixDelta: totalDelta,
          streakUpdates: fullDayCompleted ? streakPayload.updates : undefined,
        });

        if (challengeError || challengeResult?.status === "error") {
          toast.warning(
            challengeResult?.message ||
              challengeError?.message ||
              "Challenge evaluation failed",
          );
        } else if ((challengeResult?.claimable_challenges_count || 0) > 0) {
          toast.success("Challenge progress updated!");
        }

        toast.success(checkInResponse.message || "Checked in successfully");

        return {
          success: true,
          message: checkInResponse.message || "Checked in",
          challengeResult,
        };
      });
    },
    [runChallengeEval, userId, withGuard],
  );

  const markAbsent = useCallback(
    async ({ classID }: AttendanceActionArgs) => {
      return withGuard(classID, async () => {
        if (!userId) {
          return { success: false, message: "Missing user" };
        }

        const courseRecord = await getUserCourseRecords(userId);
        const enrolledCourses = courseRecord?.enrolledCourses || [];
        if (enrolledCourses.length === 0) {
          toast.error("No enrolled courses found for attendance");
          return { success: false, message: "Missing enrolled courses" };
        }

        const absentResponse = await markClassAbsentRpc({
          p_user_id: userId,
          p_class_id: classID,
          p_enrolled_courses: enrolledCourses,
        });

        if (absentResponse.status !== "success") {
          toast.error(absentResponse.message || "Mark absent failed");
          return { success: false, message: absentResponse.message };
        }

        const [summary, user] = await Promise.all([
          getCourseAttendanceSummaryRpc(userId),
          getFirestoreUser(userId),
        ]);

        let challengeResult: EvaluateChallengesResponse | null = null;
        let challengeError: Error | null = null;

        try {
          challengeResult = await runChallengeEval({
            user,
            enrolledCourses,
            currentStreak: user?.currentStreak ?? 0,
          });
        } catch (err) {
          challengeError = err as Error;
        }

        const totalDelta = computeAmplixDelta({
          amplix_gained: absentResponse.amplix_gained,
          amplix_lost: absentResponse.amplix_lost,
          points_to_deduct: challengeResult?.points_to_deduct ?? 0,
        });

        await applyFirestoreAttendanceUpdates({
          uid: userId,
          summary,
          amplixDelta: totalDelta,
        });

        if (challengeError || challengeResult?.status === "error") {
          toast.warning(
            challengeResult?.message ||
              challengeError?.message ||
              "Challenge evaluation failed",
          );
        } else if ((challengeResult?.claimable_challenges_count || 0) > 0) {
          toast.success("Challenge progress updated!");
        }

        toast.success(absentResponse.message || "Marked absent");

        return {
          success: true,
          message: absentResponse.message || "Marked absent",
          challengeResult,
        };
      });
    },
    [runChallengeEval, userId, withGuard],
  );

  return {
    checkIn,
    markAbsent,
    pendingByClassId,
  };
}

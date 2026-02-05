"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  classCheckInRpc,
  computeAmplixDelta,
  computeStreakUpdatesForCheckIn,
  evaluateUserChallengesRpc,
  extractProgressIds,
  getCourseAttendanceSummaryRpc,
  getFirestoreUser,
  markClassAbsentRpc,
} from "@/lib/attendance/attendance-service";
import type { StreakUpdateResult } from "@/lib/attendance/streak-utils";
import {
  enqueueFirestoreAttendanceUpdate,
  flushNow,
} from "@/lib/attendance/firestore-write-buffer";
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
      courseIds: string[];
      currentStreak: number | null;
    }) => {
      if (!userId) return null;
      const progressIds = extractProgressIds(args.user);
      if (progressIds.length === 0 || args.courseIds.length === 0) {
        return null;
      }

      return evaluateUserChallengesRpc({
        progressIds,
        currentStreak: args.currentStreak,
        courseIds: args.courseIds,
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

        const checkInResponse = await classCheckInRpc({
          classID,
          classStartTime,
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
        const emptyStreakUpdates: StreakUpdateResult = {};
        const streakPayload = fullDayCompleted
          ? computeStreakUpdatesForCheckIn({
              user,
              classStartTime,
            })
          : { streakData: null, updates: emptyStreakUpdates };

        const { updates } = streakPayload;
        const computedCurrentStreak =
          typeof updates.currentStreak === "number"
            ? updates.currentStreak
            : (user?.currentStreak ?? 0);

        let challengeResult: EvaluateChallengesResponse | null = null;
        let challengeError: Error | null = null;

        const courseIds = Array.from(
          new Set(summary.map((item) => item.courseID)),
        );

        try {
          challengeResult = await runChallengeEval({
            user,
            courseIds,
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

        enqueueFirestoreAttendanceUpdate(
          {
            uid: userId,
            summary,
            amplixDelta: totalDelta,
            streakUpdates: fullDayCompleted ? streakPayload.updates : undefined,
          },
          { urgent: true },
        );
        await flushNow();

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

        const absentResponse = await markClassAbsentRpc({ classID });

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

        const courseIds = Array.from(
          new Set(summary.map((item) => item.courseID)),
        );

        try {
          challengeResult = await runChallengeEval({
            user,
            courseIds,
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

        enqueueFirestoreAttendanceUpdate(
          {
            uid: userId,
            summary,
            amplixDelta: totalDelta,
          },
          { urgent: true },
        );
        await flushNow();

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

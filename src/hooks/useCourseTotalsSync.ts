"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getFirestoreUser } from "@/lib/attendance/attendance-service";
import { enqueueFirestoreAttendanceUpdate } from "@/lib/attendance/firestore-write-buffer";
import { getCacheConfig } from "@/lib/query/cache-config";
import { queryKeys } from "@/lib/query/keys";
import { useAttendanceSummary } from "@/hooks/useAttendanceSummary";
import { useQueryClient } from "@tanstack/react-query";
import type { CourseAttendanceSummary } from "@/types/types-defination";

const hasSummaryChanges = (
  summary: CourseAttendanceSummary[],
  courses: Array<{ courseID: string; attendedClasses?: number; totalClasses?: number }>,
) => {
  if (summary.length === 0 || courses.length === 0) return false;
  const summaryMap = new Map(
    summary.map((item) => [item.courseID, item] as const),
  );

  for (const course of courses) {
    const entry = summaryMap.get(course.courseID);
    if (!entry) continue;

    const attended = Number(course.attendedClasses ?? 0);
    const total = Number(course.totalClasses ?? 0);
    if (attended !== Number(entry.attendedClasses ?? 0)) return true;
    if (total !== Number(entry.totalClasses ?? 0)) return true;
  }

  return false;
};

const summarize = (summary: CourseAttendanceSummary[]) =>
  summary
    .filter((item) => typeof item.courseID === "string" && item.courseID.length > 0)
    .sort((a, b) => a.courseID.localeCompare(b.courseID))
    .map(
      (item) =>
        `${item.courseID}:${item.attendedClasses ?? 0}/${item.totalClasses ?? 0}`,
    )
    .join("|");

export function useCourseTotalsSync(userId: string | null) {
  const [syncing, setSyncing] = useState(false);
  const syncingRef = useRef(false);
  const lastSyncedRef = useRef<string | null>(null);
  const queryClient = useQueryClient();
  const cache = getCacheConfig("attendanceSummary");

  const summaryQuery = useAttendanceSummary(userId);
  const summary = summaryQuery.data ?? [];

  const summaryHash = useMemo(() => summarize(summary), [summary]);

  const syncTotals = useCallback(async () => {
    if (!userId) return;
    if (syncingRef.current) return;
    if (summary.length === 0) return;

    if (lastSyncedRef.current === summaryHash) return;

    syncingRef.current = true;
    setSyncing(true);

    try {
      const user = await getFirestoreUser(userId);
      const courses = Array.isArray(user?.coursesEnrolled)
        ? user?.coursesEnrolled
        : [];

      if (!hasSummaryChanges(summary, courses)) {
        lastSyncedRef.current = summaryHash;
        return;
      }

      enqueueFirestoreAttendanceUpdate({
        uid: userId,
        summary,
        amplixDelta: 0,
      });
      lastSyncedRef.current = summaryHash;
    } catch (error) {
      console.error("Failed to sync course totals", error);
    } finally {
      syncingRef.current = false;
      setSyncing(false);
    }
  }, [summary, summaryHash, userId]);

  useEffect(() => {
    void syncTotals();
  }, [syncTotals]);

  useEffect(() => {
    if (!userId) return;

    const queryKey = queryKeys.attendanceSummary(userId, undefined);

    const handleFocus = () => {
      const state = queryClient.getQueryState(queryKey);
      if (!state?.dataUpdatedAt) {
        void summaryQuery.refetch();
        return;
      }
      const isStale = Date.now() - state.dataUpdatedAt > cache.staleTimeMs;
      if (isStale) {
        void summaryQuery.refetch();
      }
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [cache.staleTimeMs, queryClient, summaryQuery, userId]);

  return { refreshTotals: summaryQuery.refetch, syncing };
}

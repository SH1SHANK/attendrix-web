"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  applyFirestoreAttendanceUpdates,
  getCourseAttendanceSummaryRpc,
  getFirestoreUser,
} from "@/lib/attendance/attendance-service";
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

export function useCourseTotalsSync(userId: string | null) {
  const [syncing, setSyncing] = useState(false);
  const syncingRef = useRef(false);

  const refreshTotals = useCallback(async () => {
    if (!userId) return;
    if (syncingRef.current) return;

    syncingRef.current = true;
    setSyncing(true);

    try {
      const [summary, user] = await Promise.all([
        getCourseAttendanceSummaryRpc(userId),
        getFirestoreUser(userId),
      ]);

      const courses = Array.isArray(user?.coursesEnrolled)
        ? user?.coursesEnrolled
        : [];

      if (!hasSummaryChanges(summary, courses)) {
        return;
      }

      await applyFirestoreAttendanceUpdates({
        uid: userId,
        summary,
        amplixDelta: 0,
      });
    } catch (error) {
      console.error("Failed to sync course totals", error);
    } finally {
      syncingRef.current = false;
      setSyncing(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const handleFocus = () => {
      refreshTotals();
    };

    window.addEventListener("focus", handleFocus);
    const interval = window.setInterval(refreshTotals, 5 * 60 * 1000);
    refreshTotals();

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.clearInterval(interval);
    };
  }, [refreshTotals, userId]);

  return { refreshTotals, syncing };
}

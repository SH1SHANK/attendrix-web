"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  applyFirestoreAttendanceUpdates,
  getCourseAttendanceSummaryRpc,
} from "@/lib/attendance/attendance-service";

export function useCourseTotalsSync(userId: string | null) {
  const [syncing, setSyncing] = useState(false);
  const syncingRef = useRef(false);

  const refreshTotals = useCallback(async () => {
    if (!userId) return;
    if (syncingRef.current) return;

    syncingRef.current = true;
    setSyncing(true);

    try {
      const summary = await getCourseAttendanceSummaryRpc(userId);
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

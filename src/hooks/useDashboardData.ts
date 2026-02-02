/**
 * Dashboard Data Hooks
 *
 * READ-ONLY INTEGRATION (Phase 2)
 * These hooks fetch data from Supabase RPCs using Firebase Auth user identity.
 *
 * CONSTRAINTS:
 * - NO write operations
 * - NO attendance marking
 * - NO mutations
 * - Use Firebase uid as user_id
 * - Use Supabase as single source of truth for timetable data
 */

import { useState, useEffect, useCallback } from "react";
import { ClassesService } from "@/lib/services/classes-service";
import {
  TodayScheduleClass,
  UpcomingClass,
  ClassByDate,
} from "@/types/supabase-academic";

/**
 * Hook to fetch today's schedule
 * Uses get_today_schedule RPC
 *
 * @param userId - Firebase Auth UID
 * @param batchId - User's batch ID from Firebase user document
 * @param attendanceGoalPercentage - User's attendance goal (default 75%)
 */
export function useTodaySchedule(
  userId: string | null,
  batchId: string | null,
  attendanceGoalPercentage: number = 75,
) {
  const [data, setData] = useState<TodayScheduleClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!userId || !batchId) {
      setData([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const today = new Date();
      const formattedDate = today.toISOString().split("T")[0];
      const scheduleData = await ClassesService.getTodaySchedule(
        userId,
        batchId,
        attendanceGoalPercentage,
        formattedDate,
      );

      setData(scheduleData);
    } catch (err) {
      console.error("Error fetching today's schedule:", err);
      setError(err instanceof Error ? err : new Error("Unknown error"));
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [userId, batchId, attendanceGoalPercentage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Hook to fetch upcoming classes (next working day)
 * Uses get_upcoming_classes RPC
 *
 * @param userId - Firebase Auth UID
 */
export function useUpcomingClasses(userId: string | null) {
  const [data, setData] = useState<UpcomingClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!userId) {
      setData([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const upcomingData = await ClassesService.getUpcomingClasses(userId);
      setData(upcomingData);
    } catch (err) {
      console.error("Error fetching upcoming classes:", err);
      setError(err instanceof Error ? err : new Error("Unknown error"));
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Hook to fetch classes by specific date
 * Uses get_classes_by_date RPC
 *
 * @param userId - Firebase Auth UID
 * @param targetDate - Date in "D/M/YYYY" format (e.g., "2/2/2026" or "29/1/2026")
 */
export function useClassesByDate(
  userId: string | null,
  targetDate: string | null,
) {
  const [data, setData] = useState<ClassByDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const isValidTargetDate = useCallback((value: string) => {
    const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!match) {
      return false;
    }

    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);

    if (
      !Number.isFinite(day) ||
      !Number.isFinite(month) ||
      !Number.isFinite(year)
    ) {
      return false;
    }

    if (year < 1900 || month < 1 || month > 12 || day < 1 || day > 31) {
      return false;
    }

    const candidate = new Date(year, month - 1, day);
    return (
      candidate.getFullYear() === year &&
      candidate.getMonth() === month - 1 &&
      candidate.getDate() === day
    );
  }, []);

  const fetchData = useCallback(async () => {
    if (!userId || !targetDate) {
      setData([]);
      setLoading(false);
      return;
    }

    if (!isValidTargetDate(targetDate)) {
      setData([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Defensive check for invalid date strings
      if (typeof targetDate === "string" && targetDate.includes("NaN")) {
        // This is expected during initial render or invalid date selection
        // silently handle it or warn
        if (process.env.NODE_ENV === "development") {
          console.warn(
            "[useClassesByDate] Invalid date string prevents fetch:",
            targetDate,
          );
        }
        setData([]);
        setLoading(false);
        return;
      }

      console.log("[useClassesByDate] Fetching classes for:", {
        userId,
        targetDate,
      });

      const classesData = await ClassesService.getClassesByDate(
        userId,
        targetDate,
      );
      setData(classesData);
    } catch (err) {
      console.error("Error fetching classes by date:", err);
      setError(err instanceof Error ? err : new Error("Unknown error"));
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [userId, targetDate, isValidTargetDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Helper function to determine current or next class from today's schedule
 *
 * STRICT ORDER:
 * 1. Sort by classStartTime
 * 2. Find current class: classStartTime <= now < classEndTime
 * 3. Else find next class: first class where classStartTime > now
 * 4. If neither exists, return null
 *
 * @param schedule - Array of today's schedule classes
 * @returns Current or next class with type indicator
 */
export function getCurrentOrNextClass(schedule: TodayScheduleClass[]): {
  class: TodayScheduleClass | null;
  type: "current" | "next" | "none";
} {
  if (!schedule || schedule.length === 0) {
    return { class: null, type: "none" };
  }

  // Sort by classStartTime ascending
  const sorted = [...schedule].sort((a, b) => {
    return (
      new Date(a.classStartTime).getTime() -
      new Date(b.classStartTime).getTime()
    );
  });

  const now = new Date();

  // Find current class
  for (const cls of sorted) {
    const startTime = new Date(cls.classStartTime);
    const endTime = new Date(cls.classEndTime);

    if (startTime <= now && now < endTime) {
      return { class: cls, type: "current" };
    }
  }

  // Find next class
  for (const cls of sorted) {
    const startTime = new Date(cls.classStartTime);

    if (startTime > now) {
      return { class: cls, type: "next" };
    }
  }

  // No current or next class
  return { class: null, type: "none" };
}

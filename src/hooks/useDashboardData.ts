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
import { supabase } from "@/lib/supabase/client";
import { parseTimestampAsIST } from "@/lib/time/ist";

/**
 * Hook to fetch today's schedule
 * Uses get_today_schedule RPC
 *
 * @param userId - Firebase Auth UID
 * @param batchId - User's batch ID (defaults to ME0204)
 * @param attendanceGoalPercentage - User's attendance goal (default 75%)
 */
export function useTodaySchedule(
  userId: string | null,
  batchId: string,
  attendanceGoalPercentage: number = 75,
) {
  const [data, setData] = useState<TodayScheduleClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Initial Fetch Function
  const fetchData = useCallback(async () => {
    if (!userId) {
      setData([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Let the service handle 'today' using local time by not passing a specific date
      const scheduleData = await ClassesService.getTodaySchedule(
        userId as string,
        batchId,
        attendanceGoalPercentage,
      );

      setData(scheduleData);
    } catch (err) {
      console.error("Error fetching today's schedule:", err);
      setError(err instanceof Error ? err : new Error("Unknown error"));
      // Don't clear data immediately on error to avoid flicker
      if (data.length === 0) setData([]);
    } finally {
      setLoading(false);
    }
  }, [userId, batchId, attendanceGoalPercentage, data.length]);

  // Initial load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Realtime Subscription
  useEffect(() => {
    if (!batchId) return;

    // console.log("[useTodaySchedule] Subscribing to realtime changes for batch:", batchId);

    const channel = supabase
      .channel(`today-schedule-${batchId}`)
      .on(
        "postgres_changes",
        {
          event: "*", // INSERT, UPDATE, DELETE
          schema: "public",
          table: "timetableRecords",
          filter: `batchID=eq.${batchId}`,
        },
        (payload) => {
          console.log("[useTodaySchedule] Realtime update received:", payload);
          // Refetch data on any change to the timetable
          fetchData();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [batchId, fetchData]);

  const refetch = () => fetchData();

  return { data, loading, error, refetch };
}

/**
 * Hook to fetch upcoming classes (next working day)
 * Uses get_upcoming_classes RPC
 *
 * @param userId - Firebase Auth UID
 */
/**
 * Hook to fetch upcoming classes (next working day)
 * Uses get_upcoming_classes RPC
 *
 * @param userId - Firebase Auth UID
 * @param batchId - User's batch ID
 */
export function useUpcomingClasses(userId: string | null, batchId: string) {
  const [data, setData] = useState<UpcomingClass[]>([]);
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
      const upcomingData = await ClassesService.getUpcomingClasses(
        userId as string,
        batchId,
      );
      setData(upcomingData);
    } catch (err) {
      console.error("Error fetching upcoming classes:", err);
      setError(err instanceof Error ? err : new Error("Unknown error"));
      if (data.length === 0) setData([]);
    } finally {
      setLoading(false);
    }
  }, [userId, batchId, data.length]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Realtime Subscription
  useEffect(() => {
    if (!batchId) return;

    const channel = supabase
      .channel(`upcoming-classes-${batchId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "timetableRecords",
          filter: `batchID=eq.${batchId}`,
        },
        (payload) => {
          console.log(
            "[useUpcomingClasses] Realtime update received:",
            payload,
          );
          fetchData();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [batchId, userId]);

  const refetch = () => fetchData();

  return { data, loading, error, refetch };
}

/**
 * Hook to fetch classes by specific date
 * Uses get_classes_by_date RPC
 *
 * @param userId - Firebase Auth UID
 * @param batchId - User's batch ID
 * @param targetDate - Date in "D/M/YYYY" format
 */
export function useClassesByDate(
  userId: string | null,
  batchId: string,
  targetDate: string | null,
) {
  const [data, setData] = useState<ClassByDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId || !targetDate || !batchId) {
      setData([]);
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        console.log("[useClassesByDate] Fetching classes for:", {
          userId,
          targetDate,
        });

        const classesData = await ClassesService.getClassesByDate(
          userId as string,
          batchId,
          targetDate as string,
        );
        setData(classesData);
      } catch (err) {
        console.error("Error fetching classes by date:", err);
        setError(err instanceof Error ? err : new Error("Unknown error"));
        setData([]);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [userId, targetDate, batchId]);

  const refetch = async () => {
    if (!userId || !targetDate || !batchId) return;

    try {
      setLoading(true);
      setError(null);

      const classesData = await ClassesService.getClassesByDate(
        userId as string,
        batchId,
        targetDate as string,
      );
      setData(classesData);
    } catch (err) {
      console.error("Error refetching classes by date:", err);
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refetch };
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

  const sorted = [...schedule].sort((a, b) => {
    return (
      parseTimestampAsIST(a.classStartTime).getTime() -
      parseTimestampAsIST(b.classStartTime).getTime()
    );
  });

  const now = new Date();

  for (const cls of sorted) {
    const startTime = parseTimestampAsIST(cls.classStartTime);
    const endTime = parseTimestampAsIST(cls.classEndTime);

    if (startTime <= now && now < endTime) {
      return { class: cls, type: "current" };
    }
  }

  for (const cls of sorted) {
    const startTime = parseTimestampAsIST(cls.classStartTime);

    if (startTime > now) {
      return { class: cls, type: "next" };
    }
  }

  return { class: null, type: "none" };
}

/**
 * Hook to fetch the next upcoming class
 * Uses get_next_class RPC for real-time data
 *
 * @param userId - Firebase Auth UID
 * @param batchId - User's batch ID
 */
export function useNextClass(userId: string | null, batchId: string) {
  const [data, setData] = useState<TodayScheduleClass | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    console.log("[useNextClass] Effect triggered:", { userId, batchId });

    if (!userId) {
      console.log("[useNextClass] Missing userId - returning early");
      setData(null);
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        console.log("[useNextClass] Calling Service with:", {
          userId,
          batchId,
        });

        const nextClass = await ClassesService.getNextClass(
          userId as string,
          batchId,
        );

        setData(nextClass);
      } catch (err) {
        console.error("Error fetching next class:", err);
        setError(err instanceof Error ? err : new Error("Unknown error"));
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [userId, batchId]);

  const refetch = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);
      const nextClass = await ClassesService.getNextClass(
        userId as string,
        batchId,
      );
      setData(nextClass);
    } catch (err) {
      console.error("Error refetching next class:", err);
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refetch };
}

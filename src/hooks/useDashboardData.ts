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

import { useEffect, useMemo, useState } from "react";
import type {
  TodayScheduleClass,
  ClassByDate,
} from "@/types/supabase-academic";
import { ClassesService } from "@/lib/services/classes-service";
import { supabase } from "@/lib/supabase/client";
import { parseTimestampAsIST } from "@/lib/time/ist";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  fetchClassesByDate,
  fetchDashboardSchedule,
  type DashboardScheduleData,
} from "@/lib/query/fetchers";
import { getCacheConfig } from "@/lib/query/cache-config";
import { queryKeys } from "@/lib/query/keys";

const buildEnrolledKey = (enrolledCourses?: string[]) =>
  (enrolledCourses ?? []).slice().sort().join("|");

export function useDashboardSchedule(
  userId: string | null,
  batchId: string,
  attendanceGoalPercentage: number = 75,
  enrolledCourses?: string[],
  options: { subscribe?: boolean } = {},
) {
  const queryClient = useQueryClient();
  const cache = getCacheConfig("dashboardSchedule");
  const enrolledKey = useMemo(
    () => buildEnrolledKey(enrolledCourses),
    [enrolledCourses],
  );

  const queryKey = useMemo(
    () =>
      queryKeys.dashboardSchedule(
        userId,
        batchId,
        attendanceGoalPercentage,
        enrolledKey,
      ),
    [userId, batchId, attendanceGoalPercentage, enrolledKey],
  );

  const query = useQuery<DashboardScheduleData, Error>({
    queryKey,
    enabled: Boolean(userId && batchId),
    staleTime: cache.staleTimeMs,
    gcTime: cache.gcTimeMs,
    refetchOnWindowFocus: cache.refetchOnWindowFocus ?? false,
    queryFn: async ({ signal }) => {
      if (!userId || !batchId) {
        return { todaySchedule: [], upcomingClasses: [] };
      }

      return fetchDashboardSchedule({
        signal,
        batchId,
        attendanceGoal: attendanceGoalPercentage,
      });
    },
  });

  useEffect(() => {
    if (!options.subscribe || !batchId) return;
    const debounceState = { timer: 0 as number | undefined, lastInvoke: 0 };

    const scheduleInvalidate = () => {
      if (queryClient.isFetching({ queryKey }) > 0) return;

      const now = Date.now();
      const maxWait = 5_000;
      const delay = 1_000;

      if (now - debounceState.lastInvoke >= maxWait) {
        debounceState.lastInvoke = now;
        queryClient.invalidateQueries({ queryKey });
        return;
      }

      if (debounceState.timer) return;
      debounceState.timer = window.setTimeout(() => {
        debounceState.timer = undefined;
        if (queryClient.isFetching({ queryKey }) === 0) {
          debounceState.lastInvoke = Date.now();
          queryClient.invalidateQueries({ queryKey });
        }
      }, delay);
    };

    const channel = supabase
      .channel(`dashboard-schedule-${batchId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "timetableRecords",
          filter: `batchID=eq.${batchId}`,
        },
        scheduleInvalidate,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (debounceState.timer) {
        window.clearTimeout(debounceState.timer);
      }
    };
  }, [batchId, options.subscribe, queryClient, queryKey]);

  return {
    data: query.data ?? { todaySchedule: [], upcomingClasses: [] },
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

// Backwards-compatible wrappers (no realtime subscription)
export function useTodaySchedule(
  userId: string | null,
  batchId: string,
  attendanceGoalPercentage: number = 75,
  enrolledCourses?: string[],
) {
  const { data, loading, error, refetch } = useDashboardSchedule(
    userId,
    batchId,
    attendanceGoalPercentage,
    enrolledCourses,
    { subscribe: false },
  );

  return { data: data.todaySchedule, loading, error, refetch };
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
export function useUpcomingClasses(
  userId: string | null,
  batchId: string,
  enrolledCourses?: string[],
) {
  const { data, loading, error, refetch } = useDashboardSchedule(
    userId,
    batchId,
    75,
    enrolledCourses,
    { subscribe: false },
  );

  return { data: data.upcomingClasses, loading, error, refetch };
}

/**
 * Hook to fetch the very next upcoming class for enrolled courses
 * Direct query on timetableRecords
 *
 * @param userId - Firebase Auth UID
 * @param batchId - User's batch ID
 */
export function useNextEnrolledClass(
  userId: string | null,
  batchId: string,
  enrolledCourses?: string[],
) {
  const { data, loading, error, refetch } = useDashboardSchedule(
    userId,
    batchId,
    75,
    enrolledCourses,
    { subscribe: false },
  );

  return {
    data: data.upcomingClasses[0] ?? null,
    loading,
    error,
    refetch,
  };
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
  enrolledCourses?: string[],
) {
  const cache = getCacheConfig("classesByDate");
  const enrolledKey = useMemo(
    () => buildEnrolledKey(enrolledCourses),
    [enrolledCourses],
  );

  const queryKey = useMemo(
    () => queryKeys.classesByDate(userId, batchId, targetDate, enrolledKey),
    [userId, batchId, targetDate, enrolledKey],
  );

  const query = useQuery<ClassByDate[], Error>({
    queryKey,
    enabled: Boolean(userId && batchId && targetDate),
    staleTime: cache.staleTimeMs,
    gcTime: cache.gcTimeMs,
    refetchOnWindowFocus: cache.refetchOnWindowFocus ?? false,
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => {
      if (!userId || !batchId || !targetDate) return [];
      return fetchClassesByDate({ signal, batchId, date: targetDate });
    },
  });

  return {
    data: query.data ?? [],
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
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

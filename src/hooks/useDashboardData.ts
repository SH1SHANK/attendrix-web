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

import { useState, useEffect, useCallback, useMemo } from "react";
import { ClassesService } from "@/lib/services/classes-service";
import {
  TodayScheduleClass,
  UpcomingClass,
  ClassByDate,
} from "@/types/supabase-academic";
import { supabase } from "@/lib/supabase/client";
import { parseTimestampAsIST } from "@/lib/time/ist";
import { useQuery, useQueryClient } from "@tanstack/react-query";

/**
 * Hook to fetch today's schedule
 * Uses get_today_schedule RPC
 *
 * @param userId - Firebase Auth UID
 * @param batchId - User's batch ID (defaults to ME0204)
 * @param attendanceGoalPercentage - User's attendance goal (default 75%)
 */
type DashboardScheduleData = {
  todaySchedule: TodayScheduleClass[];
  upcomingClasses: UpcomingClass[];
};

const buildEnrolledKey = (enrolledCourses?: string[]) =>
  (enrolledCourses ?? []).slice().sort().join("|");

const buildDashboardScheduleKey = (params: {
  userId: string | null;
  batchId: string;
  attendanceGoalPercentage: number;
  enrolledKey: string;
}) => [
  "dashboard-schedule",
  params.userId,
  params.batchId,
  params.attendanceGoalPercentage,
  params.enrolledKey,
] as const;

export function useDashboardSchedule(
  userId: string | null,
  batchId: string,
  attendanceGoalPercentage: number = 75,
  enrolledCourses?: string[],
  options: { subscribe?: boolean } = {},
) {
  const queryClient = useQueryClient();
  const enrolledKey = useMemo(
    () => buildEnrolledKey(enrolledCourses),
    [enrolledCourses],
  );

  const queryKey = useMemo(
    () =>
      buildDashboardScheduleKey({
        userId,
        batchId,
        attendanceGoalPercentage,
        enrolledKey,
      }),
    [userId, batchId, attendanceGoalPercentage, enrolledKey],
  );

  const query = useQuery<DashboardScheduleData, Error>({
    queryKey,
    enabled: Boolean(userId && batchId),
    staleTime: 60 * 1000,
    queryFn: async () => {
      if (!userId || !batchId) {
        return { todaySchedule: [], upcomingClasses: [] };
      }

      const [todaySchedule, upcomingClasses] = await Promise.all([
        ClassesService.getTodaySchedule(
          userId,
          batchId,
          attendanceGoalPercentage,
          undefined,
          enrolledCourses,
        ),
        ClassesService.getUpcomingClasses(userId, batchId, enrolledCourses),
      ]);

      return { todaySchedule, upcomingClasses };
    },
  });

  useEffect(() => {
    if (!options.subscribe || !batchId) return;

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
        () => {
          queryClient.invalidateQueries({ queryKey });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
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

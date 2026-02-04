import { useQuery } from "@tanstack/react-query";
import { fetchAttendanceSummary } from "@/lib/query/fetchers";
import { getCacheConfig } from "@/lib/query/cache-config";
import { queryKeys } from "@/lib/query/keys";
import type { CourseAttendanceSummary } from "@/types/types-defination";

export function useAttendanceSummary(
  uid: string | null,
  attendanceGoal?: number,
) {
  const cache = getCacheConfig("attendanceSummary");

  return useQuery<CourseAttendanceSummary[], Error>({
    queryKey: queryKeys.attendanceSummary(uid, attendanceGoal),
    enabled: Boolean(uid),
    staleTime: cache.staleTimeMs,
    gcTime: cache.gcTimeMs,
    refetchOnWindowFocus: cache.refetchOnWindowFocus ?? false,
    queryFn: ({ signal }) =>
      fetchAttendanceSummary({ signal, attendanceGoal }),
  });
}

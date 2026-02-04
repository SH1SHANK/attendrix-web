import { useQuery } from "@tanstack/react-query";
import { fetchUserCourseRecords } from "@/lib/query/fetchers";
import { getCacheConfig } from "@/lib/query/cache-config";
import { queryKeys } from "@/lib/query/keys";
import type { UserCourseRecord } from "@/types/types-defination";

export function useUserCourseRecords(uid: string | null) {
  const cache = getCacheConfig("userCourseRecords");

  return useQuery<UserCourseRecord | null, Error>({
    queryKey: queryKeys.userCourseRecords(uid),
    enabled: Boolean(uid),
    staleTime: cache.staleTimeMs,
    gcTime: cache.gcTimeMs,
    refetchOnWindowFocus: cache.refetchOnWindowFocus ?? false,
    queryFn: ({ signal }) => fetchUserCourseRecords({ signal }),
  });
}

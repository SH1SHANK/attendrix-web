import { useQuery } from "@tanstack/react-query";
import { fetchUserCalendars } from "@/lib/query/fetchers";
import { getCacheConfig } from "@/lib/query/cache-config";
import { queryKeys } from "@/lib/query/keys";

export function useUserCalendars(batchId: string | null) {
  const cache = getCacheConfig("userCalendars");

  return useQuery({
    queryKey: queryKeys.userCalendars(batchId),
    enabled: Boolean(batchId),
    staleTime: cache.staleTimeMs,
    gcTime: cache.gcTimeMs,
    refetchOnWindowFocus: cache.refetchOnWindowFocus ?? false,
    queryFn: ({ signal }) => fetchUserCalendars({ signal, batchId }),
  });
}

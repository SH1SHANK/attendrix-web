import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { fetchPastClasses } from "@/lib/query/fetchers";
import { getCacheConfig } from "@/lib/query/cache-config";
import { queryKeys } from "@/lib/query/keys";
import type { FilterPeriod, PastClass } from "@/types/types-defination";

export function usePastClasses(uid: string | null, filter: FilterPeriod) {
  const cache = getCacheConfig("pastClasses");

  return useQuery<PastClass[], Error>({
    queryKey: queryKeys.pastClasses(uid, filter),
    enabled: Boolean(uid),
    staleTime: cache.staleTimeMs,
    gcTime: cache.gcTimeMs,
    refetchOnWindowFocus: cache.refetchOnWindowFocus ?? false,
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => fetchPastClasses({ signal, filter }),
  });
}

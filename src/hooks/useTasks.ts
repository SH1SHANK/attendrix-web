import { useQuery } from "@tanstack/react-query";
import { fetchTasks } from "@/lib/query/fetchers";
import { getCacheConfig } from "@/lib/query/cache-config";
import { queryKeys } from "@/lib/query/keys";
import type { TaskRecord } from "@/types/types-defination";

export function useTasks(uid: string | null) {
  const cache = getCacheConfig("tasks");

  return useQuery<TaskRecord[], Error>({
    queryKey: queryKeys.tasks(uid),
    enabled: Boolean(uid),
    staleTime: cache.staleTimeMs,
    gcTime: cache.gcTimeMs,
    refetchOnWindowFocus: cache.refetchOnWindowFocus ?? false,
    queryFn: ({ signal }) => fetchTasks({ signal }),
  });
}

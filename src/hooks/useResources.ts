import { useQuery } from "@tanstack/react-query";
import { fetchDriveFolder, fetchResourceCourses } from "@/lib/query/fetchers";
import { getCacheConfig } from "@/lib/query/cache-config";
import { queryKeys } from "@/lib/query/keys";
import type { DriveItem, ResourceCourse } from "@/types/resources";

export function useResourceCourses(uid: string | null) {
  const cache = getCacheConfig("resourceCourses");

  return useQuery<ResourceCourse[], Error>({
    queryKey: queryKeys.resourceCourses(uid),
    enabled: Boolean(uid),
    staleTime: cache.staleTimeMs,
    gcTime: cache.gcTimeMs,
    refetchOnWindowFocus: cache.refetchOnWindowFocus ?? false,
    queryFn: ({ signal }) => fetchResourceCourses({ signal }),
  });
}

export function useDriveFolder(folderId: string | null) {
  const cache = getCacheConfig("driveFolder");

  return useQuery<DriveItem[], Error>({
    queryKey: queryKeys.driveFolder(folderId),
    enabled: Boolean(folderId),
    staleTime: cache.staleTimeMs,
    gcTime: cache.gcTimeMs,
    refetchOnWindowFocus: cache.refetchOnWindowFocus ?? false,
    retry: 2,
    retryDelay: (attemptIndex) =>
      Math.min(1000 * 2 ** attemptIndex, 8000),
    queryFn: ({ signal }) =>
      fetchDriveFolder({ folderId: folderId ?? "", signal }),
  });
}

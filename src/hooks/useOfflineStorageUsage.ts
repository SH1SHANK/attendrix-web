"use client";

import { useEffect, useMemo, useState } from "react";
import { OFFLINE_CACHE_NAME } from "@/lib/resources/offline-cache";
import type { OfflineFileMeta } from "@/hooks/useStudyMaterialsPreferences";

const MB = 1024 * 1024;

const sumOfflineBytes = (offlineFiles: Record<string, OfflineFileMeta>) =>
  Object.values(offlineFiles).reduce(
    (total, meta) => total + (Number(meta.size) || 0),
    0,
  );

export function useOfflineStorageUsage(
  offlineFiles: Record<string, OfflineFileMeta>,
  limitMb?: number | null,
) {
  const fallbackBytes = useMemo(
    () => sumOfflineBytes(offlineFiles),
    [offlineFiles],
  );
  const [usedBytes, setUsedBytes] = useState(() => fallbackBytes);
  const hasCacheSupport =
    typeof window !== "undefined" && "caches" in window;

  useEffect(() => {
    let active = true;
    if (!hasCacheSupport) {
      return () => {
        active = false;
      };
    }

    const compute = async () => {
      try {
        const cache = await caches.open(OFFLINE_CACHE_NAME);
        let total = 0;
        for (const [resourceId, meta] of Object.entries(offlineFiles)) {
          const response = await cache.match(resourceId);
          if (response) {
            const contentLength = response.headers.get("content-length");
            if (contentLength && Number.isFinite(Number(contentLength))) {
              total += Number(contentLength);
            } else {
              const blob = await response.clone().blob();
              total += blob.size;
            }
          } else {
            total += Number(meta.size) || 0;
          }
        }
        if (active) setUsedBytes(total);
      } catch {
        if (active) setUsedBytes(fallbackBytes);
      }
    };

    void compute();

    return () => {
      active = false;
    };
  }, [fallbackBytes, hasCacheSupport, offlineFiles]);

  const limitBytes = useMemo(() => {
    if (limitMb === null) return Infinity;
    if (!Number.isFinite(Number(limitMb))) return 0;
    return Number(limitMb) * MB;
  }, [limitMb]);

  return {
    usedBytes: hasCacheSupport ? usedBytes : fallbackBytes,
    limitBytes,
    usedMb:
      Math.round(
        ((hasCacheSupport ? usedBytes : fallbackBytes) / MB) * 10,
      ) / 10,
    limitMb: limitBytes === Infinity ? null : Math.round(limitBytes / MB),
  };
}

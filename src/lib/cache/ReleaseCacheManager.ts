/**
 * ReleaseCacheManager
 *
 * Caches GitHub release metadata in localStorage to:
 * - Reduce API calls
 * - Provide faster page loads
 * - Enable some offline functionality
 */

import { Release } from "@/lib/github";

const CACHE_KEY = "attendrix_releases_cache";
const CACHE_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

interface CacheData {
  data: Release[];
  timestamp: number;
}

export class ReleaseCacheManager {
  /**
   * Get cached releases if valid
   */
  getCachedReleases(): Release[] | null {
    if (typeof window === "undefined") return null;

    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const { data, timestamp }: CacheData = JSON.parse(cached);
      const age = Date.now() - timestamp;

      if (age > CACHE_EXPIRY_MS) {
        this.clearCache();
        return null;
      }

      return data;
    } catch {
      return null;
    }
  }

  /**
   * Cache releases data
   */
  cacheReleases(releases: Release[]): void {
    if (typeof window === "undefined") return;

    try {
      const cacheData: CacheData = {
        data: releases,
        timestamp: Date.now(),
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error("Failed to cache releases:", error);
    }
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(CACHE_KEY);
  }

  /**
   * Get cache age in seconds
   */
  getCacheAge(): number | null {
    if (typeof window === "undefined") return null;

    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const { timestamp }: CacheData = JSON.parse(cached);
      return (Date.now() - timestamp) / 1000;
    } catch {
      return null;
    }
  }
}

// Singleton instance for easy import
export const releaseCache = new ReleaseCacheManager();

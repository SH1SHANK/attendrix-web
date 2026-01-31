import type { CachedRelease, DownloadHistoryItem } from "./types";

const CACHE_KEY = "attendrix_releases_cache";
const CACHE_EXPIRY = 15 * 60 * 1000; // 15 minutes
const HISTORY_KEY = "attendrix_download_history";
const MAX_HISTORY = 10;

export class ReleaseCacheManager {
  async getCachedReleases(): Promise<unknown | null> {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const { data, timestamp }: CachedRelease = JSON.parse(cached);
      const age = Date.now() - timestamp;

      if (age > CACHE_EXPIRY) {
        this.clearCache();
        return null;
      }

      return data;
    } catch {
      return null;
    }
  }

  async cacheReleases(releases: unknown): Promise<void> {
    try {
      const cacheData: CachedRelease = {
        data: releases,
        timestamp: Date.now(),
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error("Failed to cache releases:", error);
    }
  }

  clearCache(): void {
    localStorage.removeItem(CACHE_KEY);
  }
}

export class DownloadHistoryManager {
  saveDownload(downloadInfo: Omit<DownloadHistoryItem, "id">): void {
    try {
      const history = this.getHistory();

      const download: DownloadHistoryItem = {
        id: Date.now(),
        ...downloadInfo,
      };

      history.unshift(download);

      // Keep only recent downloads
      if (history.length > MAX_HISTORY) {
        history.splice(MAX_HISTORY);
      }

      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error("Failed to save download history:", error);
    }
  }

  getHistory(): DownloadHistoryItem[] {
    try {
      const history = localStorage.getItem(HISTORY_KEY);
      return history ? JSON.parse(history) : [];
    } catch {
      return [];
    }
  }

  getIncompleteDownloads(): DownloadHistoryItem[] {
    return this.getHistory().filter(
      (d) => d.status === "paused" || d.status === "cancelled",
    );
  }

  async resumeDownload(
    downloadId: number,
  ): Promise<Pick<
    DownloadHistoryItem,
    "url" | "filename" | "totalBytes" | "downloadedBytes" | "chunks"
  > | null> {
    const history = this.getHistory();
    const download = history.find((d) => d.id === downloadId);

    if (!download) return null;

    return {
      url: download.url,
      filename: download.filename,
      totalBytes: download.totalBytes,
      downloadedBytes: download.downloadedBytes,
      chunks: download.chunks,
    };
  }

  updateDownloadStatus(
    downloadId: number,
    status: DownloadHistoryItem["status"],
    downloadedBytes?: number,
  ): void {
    try {
      const history = this.getHistory();
      const index = history.findIndex((d) => d.id === downloadId);

      if (index !== -1 && history[index]) {
        const item = history[index];
        if (item) {
          item.status = status;
          if (downloadedBytes !== undefined) {
            item.downloadedBytes = downloadedBytes;
          }
          localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        }
      }
    } catch (error) {
      console.error("Failed to update download status:", error);
    }
  }

  clearHistory(): void {
    localStorage.removeItem(HISTORY_KEY);
  }
}

import { useState, useRef, useCallback } from "react";
import {
  ResilientDownloadManager,
  DownloadCompleteEvent,
  DownloadErrorEvent,
} from "@/lib/download/DownloadManager";

import type { DownloadProgress } from "@/lib/download/types";

export type DownloadStatus =
  | "idle"
  | "preparing"
  | "downloading"
  | "paused"
  | "completed"
  | "error"
  | "cancelled"
  | "browser-download"; // For GitHub releases - download happens in browser

export interface DownloadState {
  status: DownloadStatus;
  progress: number; // 0-100
  downloadedBytes: number;
  totalBytes: number;
  speed: number; // bytes per second
  timeRemaining: number; // seconds
  error: Error | null;
  filename: string | null;
  url: string | null;
  chunksCompleted: number;
  totalChunks: number;
}

const initialState: DownloadState = {
  status: "idle",
  progress: 0,
  downloadedBytes: 0,
  totalBytes: 0,
  speed: 0,
  timeRemaining: 0,
  error: null,
  filename: null,
  url: null,
  chunksCompleted: 0,
  totalChunks: 0,
};

/**
 * useDownload hook - now powered by ResilientDownloadManager
 *
 * Features:
 * - Chunked parallel downloads
 * - Automatic retry with exponential backoff
 * - Pause/Resume support
 * - Detailed progress tracking
 */
export function useDownload() {
  const [state, setState] = useState<DownloadState>(initialState);
  const managerRef = useRef<ResilientDownloadManager | null>(null);

  /**
   * Start a download
   */
  const download = useCallback(
    async (url: string, filename: string, totalSize?: number) => {
      // Cancel any existing download
      if (managerRef.current) {
        managerRef.current.cancel();
      }

      // Check if this is a GitHub release URL FIRST - these don't support CORS
      // Use direct download instead of fetch-based chunked download
      const isGitHubUrl = ResilientDownloadManager.isGitHubReleaseUrl(url);
      console.log("Download initiated:", { url, filename, isGitHubUrl });

      if (isGitHubUrl) {
        setState({
          ...initialState,
          status: "browser-download",
          filename,
          url,
        });

        // Use direct download (bypasses CORS completely)
        console.log("Using direct download for GitHub release");
        ResilientDownloadManager.directDownload(url, filename);

        // Don't auto-close - let user manually close after checking their downloads
        return;
      }

      setState({
        ...initialState,
        status: "preparing",
        filename,
        url,
      });

      try {
        // If total size not provided, fetch it first
        let size = totalSize || 0;
        if (!size) {
          const headResponse = await fetch(url, { method: "HEAD" });
          const contentLength = headResponse.headers.get("content-length");
          size = contentLength ? parseInt(contentLength, 10) : 0;
        }

        setState((prev) => ({
          ...prev,
          totalBytes: size,
          totalChunks: Math.ceil(size / (5 * 1024 * 1024)), // 5MB chunks
        }));

        // Create manager
        managerRef.current = new ResilientDownloadManager(url, filename, size, {
          chunkSize: 5 * 1024 * 1024, // 5MB chunks
          parallelConnections: 3,
          maxRetries: 3,
          retryDelay: 2000,
        });

        // Start download
        await managerRef.current.download({
          onProgress: (event: DownloadProgress) => {
            setState((prev) => ({
              ...prev,
              status: "downloading",
              progress: event.percentage,
              downloadedBytes: event.downloaded,
              speed: event.speed,
              timeRemaining: event.timeRemaining,
              chunksCompleted: event.chunksCompleted,
              totalChunks: event.totalChunks,
            }));
          },
          onComplete: (event: DownloadCompleteEvent) => {
            setState((prev) => ({
              ...prev,
              status: "completed",
              progress: 100,
              downloadedBytes: event.size,
              timeRemaining: 0,
            }));
          },
          onError: (event: DownloadErrorEvent) => {
            setState((prev) => ({
              ...prev,
              status: "error",
              error: event.error,
            }));
          },
          onPause: () => {
            setState((prev) => ({
              ...prev,
              status: "paused",
            }));
          },
          onResume: () => {
            setState((prev) => ({
              ...prev,
              status: "downloading",
            }));
          },
        });
      } catch (error) {
        setState((prev) => ({
          ...prev,
          status: "error",
          error: error instanceof Error ? error : new Error(String(error)),
        }));
      }
    },
    [],
  );

  /**
   * Pause the current download
   */
  const pause = useCallback(() => {
    if (managerRef.current) {
      managerRef.current.pause();
      setState((prev) => ({ ...prev, status: "paused" }));
    }
  }, []);

  /**
   * Resume a paused download
   */
  const resume = useCallback(() => {
    if (managerRef.current) {
      managerRef.current.resume();
      setState((prev) => ({ ...prev, status: "downloading" }));
    }
  }, []);

  /**
   * Cancel the current download
   */
  const cancel = useCallback(() => {
    if (managerRef.current) {
      managerRef.current.cancel();
    }
    setState((prev) => ({ ...prev, status: "cancelled" }));
  }, []);

  /**
   * Reset to initial state
   */
  const reset = useCallback(() => {
    if (managerRef.current) {
      managerRef.current.cancel();
      managerRef.current = null;
    }
    setState(initialState);
  }, []);

  return {
    state,
    download,
    pause,
    resume,
    cancel,
    reset,
  };
}

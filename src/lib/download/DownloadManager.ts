/**
 * ResilientDownloadManager
 *
 * A robust download manager with:
 * - Chunked streaming with Range headers
 * - Parallel chunk downloading
 * - Retry logic with exponential backoff
 * - Pause/Resume support
 * - Progress callbacks
 */

export type DownloadEventType =
  | "progress"
  | "complete"
  | "error"
  | "pause"
  | "resume"
  | "retry"
  | "cancel";

export interface DownloadProgressEvent {
  downloaded: number;
  total: number;
  percentage: number;
  speed: number; // bytes per second
  timeRemaining: number; // seconds
  chunksCompleted: number;
  totalChunks: number;
}

export interface DownloadCompleteEvent {
  filename: string;
  size: number;
  duration: number; // seconds
}

export interface DownloadErrorEvent {
  error: Error;
  recoverable: boolean;
  retryCount: number;
}

export interface DownloadManagerOptions {
  chunkSize?: number; // Default 5MB
  parallelConnections?: number; // Default 3
  maxRetries?: number; // Default 3
  retryDelay?: number; // Default 2000ms
}

type ProgressCallback = (event: DownloadProgressEvent) => void;
type CompleteCallback = (event: DownloadCompleteEvent) => void;
type ErrorCallback = (event: DownloadErrorEvent) => void;
type SimpleCallback = () => void;

interface DownloadCallbacks {
  onProgress?: ProgressCallback;
  onComplete?: CompleteCallback;
  onError?: ErrorCallback;
  onPause?: SimpleCallback;
  onResume?: SimpleCallback;
  onRetry?: (attempt: number) => void;
}

export class ResilientDownloadManager {
  private url: string;
  private filename: string;
  private totalSize: number;
  private chunkSize: number;
  private parallelConnections: number;
  private maxRetries: number;
  private retryDelay: number;

  private controller: AbortController | null = null;
  private chunks: (Blob | null)[] = [];
  private downloadedChunks: Set<number> = new Set();
  private isPaused = false;
  private isCancelled = false;
  private startTime = 0;

  // Track bytes for speed calculation
  private lastProgressTime = 0;
  private lastProgressBytes = 0;
  private currentSpeed = 0;

  constructor(
    url: string,
    filename: string,
    totalSize: number,
    options: DownloadManagerOptions = {},
  ) {
    this.url = url;
    this.filename = filename;
    this.totalSize = totalSize;
    this.chunkSize = options.chunkSize || 5 * 1024 * 1024; // 5MB
    this.parallelConnections = options.parallelConnections || 3;
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 2000;
  }

  /**
   * Downloads a single chunk with retry logic
   */
  private async downloadChunk(
    chunkIndex: number,
    start: number,
    end: number,
    retryCount = 0,
  ): Promise<Blob> {
    if (this.isCancelled) {
      throw new Error("Download cancelled");
    }

    // Wait if paused
    while (this.isPaused && !this.isCancelled) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    if (this.isCancelled) {
      throw new Error("Download cancelled");
    }

    try {
      const response = await fetch(this.url, {
        headers: {
          Range: `bytes=${start}-${end}`,
        },
        signal: this.controller?.signal,
      });

      if (!response.ok && response.status !== 206) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      return blob;
    } catch (error) {
      if (this.isCancelled) {
        throw new Error("Download cancelled");
      }

      if (retryCount < this.maxRetries) {
        // Exponential backoff
        const delay = this.retryDelay * Math.pow(2, retryCount);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.downloadChunk(chunkIndex, start, end, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * Main download method - downloads all chunks in parallel
   */
  async download(callbacks: DownloadCallbacks = {}): Promise<void> {
    const { onProgress, onComplete, onError } = callbacks;

    this.controller = new AbortController();
    this.isPaused = false;
    this.isCancelled = false;
    this.startTime = Date.now();
    this.lastProgressTime = this.startTime;
    this.lastProgressBytes = 0;

    try {
      const numChunks = Math.ceil(this.totalSize / this.chunkSize);
      this.chunks = new Array(numChunks).fill(null);
      let completedCount = 0;
      let downloadedBytes = 0;

      // Create chunk download queue
      const pendingChunks: number[] = [];
      for (let i = 0; i < numChunks; i++) {
        if (!this.downloadedChunks.has(i)) {
          pendingChunks.push(i);
        }
      }

      // Process chunks with limited concurrency
      const activePromises = new Map<number, Promise<void>>();

      const processChunk = async (chunkIndex: number) => {
        const start = chunkIndex * this.chunkSize;
        const end = Math.min(start + this.chunkSize - 1, this.totalSize - 1);

        try {
          const blob = await this.downloadChunk(chunkIndex, start, end);
          this.chunks[chunkIndex] = blob;
          this.downloadedChunks.add(chunkIndex);
          completedCount++;
          downloadedBytes += blob.size;

          // Calculate speed
          const now = Date.now();
          const timeDiff = (now - this.lastProgressTime) / 1000;
          if (timeDiff > 0.2) {
            // Update every 200ms
            const bytesDiff = downloadedBytes - this.lastProgressBytes;
            this.currentSpeed = bytesDiff / timeDiff;
            this.lastProgressTime = now;
            this.lastProgressBytes = downloadedBytes;
          }

          // Report progress
          const remaining =
            this.currentSpeed > 0
              ? (this.totalSize - downloadedBytes) / this.currentSpeed
              : 0;

          onProgress?.({
            downloaded: downloadedBytes,
            total: this.totalSize,
            percentage: (downloadedBytes / this.totalSize) * 100,
            speed: this.currentSpeed,
            timeRemaining: remaining,
            chunksCompleted: completedCount,
            totalChunks: numChunks,
          });
        } catch (error) {
          throw error;
        }
      };

      // Process chunks with concurrency limit
      while (pendingChunks.length > 0 || activePromises.size > 0) {
        // Start new downloads up to the limit
        while (
          pendingChunks.length > 0 &&
          activePromises.size < this.parallelConnections
        ) {
          const chunkIndex = pendingChunks.shift()!;
          const promise = processChunk(chunkIndex).finally(() => {
            activePromises.delete(chunkIndex);
          });
          activePromises.set(chunkIndex, promise);
        }

        // Wait for at least one to complete
        if (activePromises.size > 0) {
          await Promise.race(activePromises.values());
        }
      }

      // All chunks downloaded - combine and save
      const finalBlob = new Blob(this.chunks as Blob[]);
      this.saveBlob(finalBlob, this.filename);

      const duration = (Date.now() - this.startTime) / 1000;
      onComplete?.({
        filename: this.filename,
        size: this.totalSize,
        duration,
      });
    } catch (error) {
      if (!this.isCancelled) {
        onError?.({
          error: error instanceof Error ? error : new Error(String(error)),
          recoverable: this.downloadedChunks.size > 0,
          retryCount: 0,
        });
      }
    }
  }

  /**
   * Saves blob to user's device
   */
  private saveBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Pause the download
   */
  pause(): void {
    this.isPaused = true;
  }

  /**
   * Resume the download
   */
  resume(): void {
    this.isPaused = false;
  }

  /**
   * Cancel the download
   */
  cancel(): void {
    this.isCancelled = true;
    this.controller?.abort();
  }

  /**
   * Get current download state
   */
  getState(): {
    isPaused: boolean;
    isCancelled: boolean;
    downloadedChunks: number;
    totalChunks: number;
  } {
    return {
      isPaused: this.isPaused,
      isCancelled: this.isCancelled,
      downloadedChunks: this.downloadedChunks.size,
      totalChunks: Math.ceil(this.totalSize / this.chunkSize),
    };
  }
}

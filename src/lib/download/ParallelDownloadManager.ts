import type { DownloadCallbacks, DownloadProgress } from "./types";

export class ParallelDownloadManager {
  private url: string;
  private filename: string;
  private totalSize: number;
  private chunkSize: number;
  private maxRetries: number;
  private retryDelay: number;
  private maxConcurrent: number;
  private controller: AbortController | null = null;
  private isCancelled = false;
  private downloadedBytes = 0;
  private startTime: number = 0;

  constructor(
    url: string,
    filename: string,
    totalSize: number,
    options: {
      chunkSize?: number;
      maxRetries?: number;
      retryDelay?: number;
      maxConcurrent?: number;
    } = {},
  ) {
    this.url = url;
    this.filename = filename;
    this.totalSize = totalSize;
    this.chunkSize = options.chunkSize || 5 * 1024 * 1024; // 5MB chunks
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 2000;
    this.maxConcurrent = options.maxConcurrent || 3;
  }

  async download(callbacks: DownloadCallbacks = {}): Promise<void> {
    const { onProgress, onComplete, onError } = callbacks;

    this.controller = new AbortController();
    this.startTime = Date.now();
    this.isCancelled = false;
    this.downloadedBytes = 0;

    // Initialize chunks array
    const numChunks = Math.ceil(this.totalSize / this.chunkSize);
    const chunks: (Uint8Array | null)[] = new Array(numChunks).fill(null);
    let completedChunks = 0;
    const activeDownloads: Array<Promise<void>> = [];

    const downloadChunk = async (index: number): Promise<void> => {
      if (this.isCancelled || this.controller?.signal.aborted) {
        throw new Error("Download cancelled");
      }

      const start = index * this.chunkSize;
      const end = Math.min(start + this.chunkSize - 1, this.totalSize - 1);

      try {
        const response = await fetch(this.url, {
          headers: {
            Range: `bytes=${start}-${end}`,
            Accept: "application/octet-stream",
          },
          signal: this.controller?.signal,
        });

        if (!response.ok && response.status !== 206) {
          throw new Error(`HTTP ${response.status}`);
        }

        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        chunks[index] = new Uint8Array(arrayBuffer);

        // Update progress safely
        if (chunks[index]) {
          this.downloadedBytes += chunks[index].length;
        }
        completedChunks++;

        // Report progress
        if (onProgress) {
          const elapsed = (Date.now() - this.startTime) / 1000;
          const speed = this.downloadedBytes / elapsed;
          const remainingBytes = this.totalSize - this.downloadedBytes;
          const timeRemaining = speed > 0 ? remainingBytes / speed : 0;

          onProgress({
            downloaded: this.downloadedBytes,
            total: this.totalSize,
            percentage: (completedChunks / numChunks) * 100,
            chunksCompleted: completedChunks,
            totalChunks: numChunks,
            speed,
            timeRemaining,
          });
        }
      } catch (error) {
        if (this.isCancelled) {
          throw new Error("Download cancelled");
        }
        throw error;
      }
    };

    try {
      // Download chunks in parallel with concurrency limit
      for (let i = 0; i < numChunks; i++) {
        // Wait if we've hit the concurrency limit
        while (activeDownloads.length >= this.maxConcurrent) {
          await Promise.race(activeDownloads);
        }

        if (this.isCancelled) {
          throw new Error("Download cancelled");
        }

        const promise = downloadChunk(i).finally(() => {
          const index = activeDownloads.indexOf(promise);
          if (index > -1) {
            activeDownloads.splice(index, 1);
          }
        });

        activeDownloads.push(promise);
      }

      // Wait for all chunks to complete
      await Promise.all(activeDownloads);

      if (this.isCancelled) {
        throw new Error("Download cancelled");
      }

      // Combine chunks
      const validChunks = chunks
        .filter((c): c is Uint8Array => c !== null)
        .map((c) => c.buffer as ArrayBuffer);
      const finalBlob = new Blob(validChunks as BlobPart[]);

      // Trigger download
      const url = URL.createObjectURL(finalBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = this.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      onComplete?.({
        filename: this.filename,
        size: this.totalSize,
        duration: (Date.now() - this.startTime) / 1000,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      onError?.(new Error(errorMessage));
    }
  }

  cancel(): void {
    this.isCancelled = true;
    if (this.controller) {
      this.controller.abort();
    }
  }

  getProgress(): DownloadProgress {
    const elapsed = (Date.now() - this.startTime) / 1000 || 1;
    const speed = this.downloadedBytes / elapsed;
    const remainingBytes = this.totalSize - this.downloadedBytes;

    return {
      downloaded: this.downloadedBytes,
      total: this.totalSize,
      percentage: (this.downloadedBytes / this.totalSize) * 100 || 0,
      chunksCompleted: 0,
      totalChunks: Math.ceil(this.totalSize / this.chunkSize),
      speed,
      timeRemaining: speed > 0 ? remainingBytes / speed : 0,
    };
  }
}

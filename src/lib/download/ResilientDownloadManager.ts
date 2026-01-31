import type { DownloadCallbacks, DownloadProgress } from "./types";

interface Chunk {
  index: number;
  start: number;
  end: number;
  data: Uint8Array | null;
  retries: number;
}

export class ResilientDownloadManager {
  private url: string;
  private filename: string;
  private totalSize: number;
  private chunkSize: number;
  private maxRetries: number;
  private retryDelay: number;
  private chunks: Chunk[] = [];
  private controller: AbortController | null = null;
  private activeDownloads: Set<Promise<void>> = new Set();
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
    } = {},
  ) {
    this.url = url;
    this.filename = filename;
    this.totalSize = totalSize;
    this.chunkSize = options.chunkSize || 5 * 1024 * 1024; // 5MB chunks
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 2000;

    this.initializeChunks();
  }

  private initializeChunks(): void {
    const numChunks = Math.ceil(this.totalSize / this.chunkSize);
    this.chunks = new Array(numChunks);

    for (let i = 0; i < numChunks; i++) {
      const start = i * this.chunkSize;
      const end = Math.min(start + this.chunkSize - 1, this.totalSize - 1);

      this.chunks[i] = {
        index: i,
        start,
        end,
        data: null,
        retries: 0,
      };
    }
  }

  async downloadChunk(
    chunk: Chunk,
    retryCount = 0,
    onProgress?: (progress: DownloadProgress) => void,
  ): Promise<void> {
    if (this.isCancelled) {
      throw new Error("Download cancelled");
    }

    try {
      if (!this.controller) {
        this.controller = new AbortController();
      }

      const response = await fetch(this.url, {
        headers: {
          Range: `bytes=${chunk.start}-${chunk.end}`,
          Accept: "application/octet-stream",
        },
        signal: this.controller.signal,
      });

      if (!response.ok && response.status !== 206) {
        throw new Error(`HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      chunk.data = new Uint8Array(arrayBuffer);

      this.downloadedBytes += chunk.data.length;

      // Report progress
      if (onProgress) {
        const elapsed = (Date.now() - this.startTime) / 1000;
        const speed = this.downloadedBytes / elapsed;
        const remainingBytes = this.totalSize - this.downloadedBytes;
        const timeRemaining = speed > 0 ? remainingBytes / speed : 0;

        onProgress({
          downloaded: this.downloadedBytes,
          total: this.totalSize,
          percentage: (this.downloadedBytes / this.totalSize) * 100,
          chunksCompleted: this.chunks.filter((c) => c.data !== null).length,
          totalChunks: this.chunks.length,
          speed,
          timeRemaining,
        });
      }
    } catch (error) {
      if (this.isCancelled) {
        throw new Error("Download cancelled");
      }

      if (retryCount < this.maxRetries) {
        // Exponential backoff
        const delay = this.retryDelay * Math.pow(2, retryCount);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.downloadChunk(chunk, retryCount + 1, onProgress);
      }

      throw error;
    }
  }

  async download(callbacks: DownloadCallbacks = {}): Promise<void> {
    const { onProgress, onComplete, onError } = callbacks;

    this.controller = new AbortController();
    this.startTime = Date.now();
    this.isCancelled = false;

    try {
      // Download chunks sequentially for reliability
      for (let i = 0; i < this.chunks.length; i++) {
        const chunk = this.chunks[i];
        if (!chunk) {
          throw new Error(`Chunk ${i} not initialized`);
        }
        await this.downloadChunk(chunk, 0, onProgress);
      }

      // Combine chunks
      const finalBlob = this.combineChunks();
      this.saveBlob(finalBlob, this.filename);

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

  private combineChunks(): Blob {
    const chunks = this.chunks
      .map((c) => c.data)
      .filter((c): c is Uint8Array => c !== null)
      .map((c) => c.buffer as ArrayBuffer);
    return new Blob(chunks as BlobPart[]);
  }

  private saveBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
      chunksCompleted: this.chunks.filter((c) => c.data !== null).length,
      totalChunks: this.chunks.length,
      speed,
      timeRemaining: speed > 0 ? remainingBytes / speed : 0,
    };
  }
}

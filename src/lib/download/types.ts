export interface DownloadProgress {
  downloaded: number;
  total: number;
  percentage: number;
  chunksCompleted: number;
  totalChunks: number;
  speed: number;
  timeRemaining: number;
}

export interface DownloadCompleteInfo {
  filename: string;
  size: number;
  duration?: number;
}

export interface DownloadCallbacks {
  onProgress?: (progress: DownloadProgress) => void;
  onComplete?: (info: DownloadCompleteInfo) => void;
  onError?: (error: Error) => void;
}

export type DownloadStatus =
  | "idle"
  | "preparing"
  | "downloading"
  | "paused"
  | "completed"
  | "error"
  | "cancelled";

export interface DownloadState {
  status: DownloadStatus;
  progress: number;
  downloadedBytes: number;
  totalBytes: number;
  speed: number;
  timeRemaining: number;
  error: Error | null;
  filename: string | null;
  url: string | null;
  chunksCompleted?: number;
  totalChunks?: number;
}

export interface CachedRelease {
  data: unknown;
  timestamp: number;
}

export interface DownloadHistoryItem {
  id: number;
  version: string;
  filename: string;
  size: number;
  downloadedBytes: number;
  totalBytes: number;
  status: "completed" | "failed" | "cancelled" | "paused";
  timestamp: string;
  url: string;
  chunks: number[];
}

export interface NetworkInfo {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
  quality?: "excellent" | "good" | "fair" | "poor" | "unknown";
}

export interface PreDownloadCheck {
  name: string;
  passed: boolean;
  isWarning: boolean;
  message: string;
  suggestion: string | null;
}

export interface ErrorRecoveryResult {
  action: "RETRY" | "MANUAL" | "ABORT";
  message: string;
  solutions?: string[];
  delay?: number;
}

export interface PerformanceMetrics {
  downloadId: string | null;
  startTime: number | null;
  endTime: number | null;
  totalBytes: number;
  downloadedBytes: number;
  speedSamples: Array<{ timestamp: number; speed: number; downloaded: number }>;
  pauseEvents: Array<{ timestamp: number; downloadedBytes: number }>;
  errorEvents: Array<{ timestamp: number; error: string; downloadedBytes: number }>;
  retryEvents: Array<{ timestamp: number; downloadedBytes: number }>;
}

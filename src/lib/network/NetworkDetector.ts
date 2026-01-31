/**
 * NetworkDetector
 *
 * Detects network quality and provides recommendations for downloads.
 * Uses Network Information API when available, with fallback to speed test.
 */

export interface NetworkInfo {
  effectiveType: "4g" | "3g" | "2g" | "slow-2g" | "unknown";
  downlink: number; // Mbps
  rtt: number; // ms
  saveData: boolean;
  quality: "excellent" | "good" | "fair" | "poor" | "unknown";
}

export interface NetworkRecommendation {
  message: string;
  recommendation: string | null;
  showWarning: boolean;
  suggestWifi: boolean;
}

interface NetworkConnection {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

export class NetworkDetector {
  /**
   * Detect current network conditions
   */
  async detectConnection(): Promise<NetworkInfo> {
    // Use Network Information API if available
    if ("connection" in navigator) {
      const nav = navigator as Navigator & { connection?: NetworkConnection };
      const connection = nav.connection;

      if (!connection) {
        return this.measureSpeed();
      }

      const rawType = connection.effectiveType || "unknown";
      const effectiveType = this.normalizeEffectiveType(rawType);

      return {
        effectiveType,
        downlink: connection.downlink || 0,
        rtt: connection.rtt || 0,
        saveData: connection.saveData || false,
        quality: this.getQualityFromType(rawType),
      };
    }

    // Fallback: measure with test request
    return this.measureSpeed();
  }

  /**
   * Normalize effective type string to union type
   */
  private normalizeEffectiveType(type: string): NetworkInfo["effectiveType"] {
    switch (type) {
      case "4g":
        return "4g";
      case "3g":
        return "3g";
      case "2g":
        return "2g";
      case "slow-2g":
        return "slow-2g";
      default:
        return "unknown";
    }
  }

  /**
   * Measure network speed with a test request
   */
  private async measureSpeed(): Promise<NetworkInfo> {
    const testUrl = "https://api.github.com/zen"; // Small test endpoint
    const start = Date.now();

    try {
      const response = await fetch(testUrl);
      await response.text();
      const duration = Date.now() - start;

      let quality: NetworkInfo["quality"];
      let effectiveType: NetworkInfo["effectiveType"];

      if (duration < 100) {
        quality = "excellent";
        effectiveType = "4g";
      } else if (duration < 300) {
        quality = "good";
        effectiveType = "4g";
      } else if (duration < 500) {
        quality = "fair";
        effectiveType = "3g";
      } else {
        quality = "poor";
        effectiveType = "2g";
      }

      return {
        effectiveType,
        downlink: 0,
        rtt: duration,
        saveData: false,
        quality,
      };
    } catch {
      return {
        effectiveType: "unknown",
        downlink: 0,
        rtt: 0,
        saveData: false,
        quality: "unknown",
      };
    }
  }

  /**
   * Map connection type to quality
   */
  private getQualityFromType(type: string): NetworkInfo["quality"] {
    switch (type) {
      case "4g":
        return "excellent";
      case "3g":
        return "fair";
      case "2g":
      case "slow-2g":
        return "poor";
      default:
        return "unknown";
    }
  }

  /**
   * Get download recommendation based on file size and network
   */
  async getRecommendation(fileSize: number): Promise<NetworkRecommendation> {
    const network = await this.detectConnection();
    const fileSizeMB = fileSize / (1024 * 1024);

    if (network.saveData) {
      return {
        message: "Data saver mode detected",
        recommendation: "Download on Wi-Fi to save mobile data",
        showWarning: true,
        suggestWifi: true,
      };
    }

    if (network.effectiveType === "slow-2g" || network.effectiveType === "2g") {
      const estimatedTime = this.estimateTime(fileSize, network);
      return {
        message: "Slow connection detected",
        recommendation: `Downloading ${fileSizeMB.toFixed(1)}MB may take ${estimatedTime}. Connect to Wi-Fi for better experience.`,
        showWarning: true,
        suggestWifi: true,
      };
    }

    if (network.quality === "poor" && fileSizeMB > 50) {
      return {
        message: "Connection quality may affect download",
        recommendation: "Consider downloading on a more stable connection",
        showWarning: true,
        suggestWifi: true,
      };
    }

    return {
      message: "Connection quality is good",
      recommendation: null,
      showWarning: false,
      suggestWifi: false,
    };
  }

  /**
   * Estimate download time based on connection type
   */
  private estimateTime(fileSize: number, network: NetworkInfo): string {
    // Rough estimates based on connection type
    const speedMap: Record<string, number> = {
      "slow-2g": 50 * 1024, // 50 KB/s
      "2g": 150 * 1024, // 150 KB/s
      "3g": 750 * 1024, // 750 KB/s
      "4g": 3 * 1024 * 1024, // 3 MB/s
    };

    const speed = speedMap[network.effectiveType] || 1024 * 1024;
    const seconds = fileSize / speed;

    if (seconds < 60) return `${Math.round(seconds)} seconds`;
    if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
    return `${Math.round(seconds / 3600)} hours`;
  }

  /**
   * Check if currently online
   */
  isOnline(): boolean {
    return typeof navigator !== "undefined" ? navigator.onLine : true;
  }

  /**
   * Listen for online/offline events
   */
  onConnectionChange(callback: (online: boolean) => void): () => void {
    if (typeof window === "undefined") return () => {};

    const handleOnline = () => callback(true);
    const handleOffline = () => callback(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }
}

// Singleton instance
export const networkDetector = new NetworkDetector();

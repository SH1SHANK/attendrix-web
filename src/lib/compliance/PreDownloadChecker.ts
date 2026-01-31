/**
 * PreDownloadChecker
 *
 * Verifies prerequisites before starting a download:
 * - Storage space
 * - Network quality
 * - Battery level
 * - Device compatibility
 * - Browser support
 */

interface CheckResult {
  name: string;
  passed: boolean;
  isWarning: boolean;
  message: string;
  suggestion: string | null;
}

interface PreDownloadResult {
  canDownload: boolean;
  checks: CheckResult[];
  failed: CheckResult[];
  warnings: CheckResult[];
  recommendation: {
    level: "success" | "warning" | "error";
    message: string;
    actions: string[];
  };
}

export class PreDownloadChecker {
  /**
   * Run all pre-download checks
   */
  async runChecks(
    fileSize: number,
    minimumAndroid = "5.0",
  ): Promise<PreDownloadResult> {
    const checks: CheckResult[] = [];

    // Storage check
    checks.push(await this.checkStorage(fileSize));

    // Network check
    checks.push(await this.checkNetwork());

    // Battery check (mobile only)
    checks.push(await this.checkBattery());

    // Device compatibility
    checks.push(this.checkCompatibility(minimumAndroid));

    // Browser support
    checks.push(this.checkBrowserSupport());

    const failed = checks.filter((c) => !c.passed);
    const warnings = checks.filter((c) => c.isWarning && c.passed);

    return {
      canDownload: failed.length === 0,
      checks,
      failed,
      warnings,
      recommendation: this.getRecommendation(checks),
    };
  }

  /**
   * Check available storage space
   */
  private async checkStorage(requiredSize: number): Promise<CheckResult> {
    const overhead = 50 * 1024 * 1024; // 50MB overhead
    const needed = requiredSize + overhead;

    if ("storage" in navigator && "estimate" in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        const available = (estimate.quota || 0) - (estimate.usage || 0);

        return {
          name: "Storage Space",
          passed: available >= needed,
          isWarning: false,
          message:
            available >= needed
              ? `✓ Sufficient storage (${this.formatBytes(available)} available)`
              : `✗ Insufficient storage (need ${this.formatBytes(needed)}, have ${this.formatBytes(available)})`,
          suggestion:
            available < needed
              ? "Free up storage space before downloading"
              : null,
        };
      } catch {
        // Fall through to default
      }
    }

    return {
      name: "Storage Space",
      passed: true,
      isWarning: true,
      message: "⚠ Could not verify storage space",
      suggestion: `Ensure you have at least ${this.formatBytes(needed)} free`,
    };
  }

  /**
   * Check network quality
   */
  private async checkNetwork(): Promise<CheckResult> {
    if ("connection" in navigator) {
      const connection = (
        navigator as Navigator & { connection?: { effectiveType?: string } }
      ).connection;
      const effectiveType = connection?.effectiveType || "unknown";
      const isGood = effectiveType === "4g";
      const isMobile = effectiveType === "3g" || effectiveType === "2g";

      return {
        name: "Network Connection",
        passed: true, // Don't block, just warn
        isWarning: !isGood || isMobile,
        message:
          isGood && !isMobile
            ? "✓ Good network connection"
            : isMobile
              ? "⚠ On mobile data - may use significant data"
              : "⚠ Slow connection detected",
        suggestion:
          !isGood || isMobile ? "Connect to Wi-Fi for best experience" : null,
      };
    }

    return {
      name: "Network Connection",
      passed: true,
      isWarning: false,
      message: "— Network check not available",
      suggestion: null,
    };
  }

  /**
   * Check battery level
   */
  private async checkBattery(): Promise<CheckResult> {
    if ("getBattery" in navigator) {
      try {
        const battery = await ((
          navigator as Navigator & {
            getBattery?: () => Promise<{ level: number; charging: boolean }>;
          }
        ).getBattery?.() ?? Promise.reject());
        const level = battery.level * 100;
        const charging = battery.charging;

        const isLow = level < 20 && !charging;

        return {
          name: "Battery Level",
          passed: true, // Don't block, just warn
          isWarning: isLow,
          message: isLow
            ? `⚠ Low battery (${level.toFixed(0)}%)`
            : `✓ Battery level OK (${level.toFixed(0)}%)`,
          suggestion: isLow ? "Connect charger before downloading" : null,
        };
      } catch {
        // Fall through
      }
    }

    return {
      name: "Battery Level",
      passed: true,
      isWarning: false,
      message: "— Battery check not available",
      suggestion: null,
    };
  }

  /**
   * Check device compatibility
   */
  private checkCompatibility(minimumAndroid: string): CheckResult {
    const userAgent = navigator.userAgent;
    const androidMatch = userAgent.match(/Android (\d+(\.\d+)?)/);

    if (androidMatch) {
      const versionStr = androidMatch[1] ?? "";
      const version = parseFloat(versionStr);
      const minVersion = parseFloat(minimumAndroid);

      return {
        name: "Device Compatibility",
        passed: version >= minVersion,
        isWarning: false,
        message:
          version >= minVersion
            ? `✓ Compatible (Android ${version})`
            : `✗ Not compatible (need Android ${minVersion}+, have ${version})`,
        suggestion:
          version < minVersion
            ? `Upgrade to Android ${minVersion}+ or download an older version`
            : null,
      };
    }

    return {
      name: "Device Compatibility",
      passed: true,
      isWarning: true,
      message: "⚠ Could not detect Android version",
      suggestion: "Ensure your device runs Android 5.0 or higher",
    };
  }

  /**
   * Check browser support for required APIs
   */
  private checkBrowserSupport(): CheckResult {
    const hasRequiredAPIs =
      "fetch" in window &&
      "Blob" in window &&
      "URL" in window &&
      "createObjectURL" in URL;

    return {
      name: "Browser Support",
      passed: hasRequiredAPIs,
      isWarning: false,
      message: hasRequiredAPIs
        ? "✓ Browser supports downloads"
        : "✗ Browser may not support downloads",
      suggestion: !hasRequiredAPIs
        ? "Use a modern browser (Chrome, Firefox, Edge)"
        : null,
    };
  }

  /**
   * Generate overall recommendation
   */
  private getRecommendation(
    checks: CheckResult[],
  ): PreDownloadResult["recommendation"] {
    const failed = checks.filter((c) => !c.passed);
    const warnings = checks.filter((c) => c.isWarning && c.passed);

    if (failed.length > 0) {
      return {
        level: "error",
        message: "Cannot proceed with download",
        actions: failed
          .map((c) => c.suggestion)
          .filter((s): s is string => s !== null),
      };
    }

    if (warnings.length > 0) {
      return {
        level: "warning",
        message: "Download is possible but not optimal",
        actions: warnings
          .map((c) => c.suggestion)
          .filter((s): s is string => s !== null && s !== undefined),
      };
    }

    return {
      level: "success",
      message: "All checks passed - ready to download",
      actions: [],
    };
  }

  /**
   * Format bytes to human readable
   */
  private formatBytes(bytes: number): string {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }
}

// Singleton instance
export const preDownloadChecker = new PreDownloadChecker();

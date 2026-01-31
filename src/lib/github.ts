import { format } from "date-fns";

export interface Release {
  releaseId: number;
  version: string;
  date: string;
  size: string;
  status: "stable" | "beta";
  downloadUrl: string;
  htmlUrl: string; // Renamed from githubUrl for consistency
  commitHash: string;
  sha256: string | null;
  body: string; // Raw markdown
  isPreRelease: boolean;
}

const GITHUB_OWNER = process.env.NEXT_PUBLIC_GITHUB_OWNER || "SH1SHANK";
const GITHUB_REPO = process.env.NEXT_PUBLIC_GITHUB_REPO || "attendrix";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// Cache configuration - stale-while-revalidate pattern
const CACHE_MAX_AGE = 3600; // 1 hour fresh

// Helper to format bytes to MB
const bytesToMB = (bytes: number) => {
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

// Compile regex once for reuse
const SHA256_REGEX = /sha256:\s*([a-f0-9]{64})/i;

interface GitHubAsset {
  name: string;
  size: number;
  browser_download_url: string;
}

interface GitHubRelease {
  id: number;
  tag_name: string;
  name: string;
  published_at: string;
  prerelease: boolean;
  html_url: string;
  body: string;
  target_commitish: string;
  assets?: GitHubAsset[];
}

export async function getReleases(): Promise<Release[]> {
  try {
    const headers: HeadersInit = {
      Accept: "application/vnd.github.v3+json",
    };

    if (GITHUB_TOKEN) {
      headers.Authorization = `token ${GITHUB_TOKEN}`;
    }

    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases`,
      {
        headers,
        next: {
          revalidate: CACHE_MAX_AGE,
          tags: ["releases"],
        },
      },
    );

    if (!res.ok) {
      // Log error details but don't throw - return empty array for graceful degradation
      console.error("GitHub API Error:", {
        status: res.status,
        statusText: res.statusText,
      });

      if (res.status === 404) return [];
      if (res.status === 403) {
        console.warn("GitHub API rate limit exceeded. Consider using a token.");
      }
      return [];
    }

    const data = await res.json();

    if (!Array.isArray(data)) {
      console.error("Invalid response format from GitHub API");
      return [];
    }

    // Pre-allocate array for better performance
    const releases: Release[] = new Array(data.length);

    for (let i = 0; i < data.length; i++) {
      const release: GitHubRelease = data[i];

      // Find APK asset - prioritize .apk files
      const apkAsset = release.assets?.find((asset) =>
        asset.name.endsWith(".apk"),
      );

      // Extract SHA-256 using pre-compiled regex
      const shaMatch = release.body?.match(SHA256_REGEX);
      const sha256 = shaMatch?.[1] ?? null;

      releases[i] = {
        releaseId: release.id,
        version: release.tag_name,
        date: format(new Date(release.published_at), "MMM dd, yyyy"),
        size: apkAsset ? bytesToMB(apkAsset.size) : "Unknown",
        status: release.prerelease ? "beta" : "stable",
        downloadUrl: apkAsset?.browser_download_url || release.html_url,
        htmlUrl: release.html_url,
        commitHash: release.target_commitish.substring(0, 7),
        sha256,
        body: release.body || "",
        isPreRelease: release.prerelease,
      };
    }

    return releases;
  } catch (error) {
    console.error("Failed to fetch releases:", error);
    return [];
  }
}

// Revalidation helper for on-demand cache updates
export async function revalidateReleases() {
  try {
    // Use Next.js fetch with no cache to force refresh
    await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases`,
      {
        cache: "no-store",
        headers: GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : {},
      },
    );
  } catch (error) {
    console.error("Failed to revalidate releases:", error);
  }
}

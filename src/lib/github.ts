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

// Helper to format bytes to MB
const bytesToMB = (bytes: number) => {
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

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
        next: { revalidate: 3600 }, // Cache for 1 hour
      },
    );

    if (!res.ok) {
      if (res.status === 404) return [];
      console.error("GitHub API Error:", res.status, res.statusText);
      return [];
    }

    const data = await res.json();

    if (!Array.isArray(data)) return [];

    return data.map((release: GitHubRelease) => {
      // Find APK asset
      const apkAsset = release.assets?.find((asset: GitHubAsset) =>
        asset.name.endsWith(".apk"),
      );

      // Determine size
      const size = apkAsset ? bytesToMB(apkAsset.size) : "Unknown";

      // Determine download URL
      const downloadUrl = apkAsset
        ? apkAsset.browser_download_url
        : release.html_url;

      // Extract SHA-256 from body if present
      // Regex looks for "SHA256: <hash>" or "sha256: <hash>" or just the hash in a code block context if labelled
      const shaMatch = release.body.match(/sha256:\s*([a-f0-9]{64})/i);
      const sha256 = shaMatch ? shaMatch[1] : null;

      return {
        releaseId: release.id,
        version: release.tag_name,
        date: format(new Date(release.published_at), "MMM dd, yyyy"),
        size,
        status: release.prerelease ? "beta" : "stable",
        downloadUrl,
        htmlUrl: release.html_url,
        commitHash: release.target_commitish.substring(0, 7), // Short hash
        sha256,
        body: release.body,
        isPreRelease: release.prerelease,
      };
    });
  } catch (error) {
    console.error("Failed to fetch releases:", error);
    return [];
  }
}

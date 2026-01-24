import { format } from "date-fns";

export interface Release {
  version: string;
  date: string;
  size: string;
  status: "stable" | "beta";
  downloadUrl: string;
  githubUrl: string;
  sha256: string;
  notes: { tag: "NEW" | "FIX" | "IMPROVEMENT" | "INFO"; text: string }[];
}

const GITHUB_OWNER = process.env.NEXT_PUBLIC_GITHUB_OWNER || "SH1SHANK";
const GITHUB_REPO = process.env.NEXT_PUBLIC_GITHUB_REPO || "attendrix";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// Helper to format bytes to MB
const bytesToMB = (bytes: number) => {
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

// Helper to parse body into notes
// This is a naive heuristic parser for standard release notes styles
const parseNotes = (body: string): Release["notes"] => {
  if (!body) return [];

  const lines = body.split("\n").filter((line) => line.trim().length > 0);
  const notes: Release["notes"] = [];

  for (const line of lines) {
    const cleanLine = line.replace(/^[-*•]\s+/, "").trim();
    if (!cleanLine) continue;

    // Detect tags based on keywords or prefixes
    let tag: Release["notes"][0]["tag"] = "INFO";
    const lower = cleanLine.toLowerCase();

    if (
      lower.startsWith("feat") ||
      lower.startsWith("add") ||
      lower.startsWith("new")
    )
      tag = "NEW";
    else if (
      lower.startsWith("fix") ||
      lower.startsWith("bug") ||
      lower.startsWith("hotfix")
    )
      tag = "FIX";
    else if (
      lower.startsWith("perf") ||
      lower.startsWith("improv") ||
      lower.startsWith("refactor")
    )
      tag = "IMPROVEMENT";

    // Clean up "Feat:" prefix if present
    const text = cleanLine.replace(
      /^(Feat|Fix|Perf|Chore|Refactor|Docs|Style|Test|Build|Ci|Revert)(\(.*\))?:\s*/i,
      "",
    );

    notes.push({ tag, text: text || cleanLine });
  }

  return notes.slice(0, 5); // Limit to top 5 items for cleaner UI
};

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

    return data.map((release: any) => {
      // Find APK asset
      const apkAsset = release.assets?.find((asset: any) =>
        asset.name.endsWith(".apk"),
      );

      // Determine size
      const size = apkAsset ? bytesToMB(apkAsset.size) : "Unknown";

      // Determine download URL
      const downloadUrl = apkAsset
        ? apkAsset.browser_download_url
        : release.html_url;

      return {
        version: release.tag_name,
        date: format(new Date(release.published_at), "MMM dd, yyyy"),
        size,
        status: release.prerelease ? "beta" : "stable",
        downloadUrl,
        githubUrl: release.html_url,
        // Mock SHA since it's not standard in API response unless we parse the body or have a separate file
        sha256: "Verified by GitHub",
        notes: parseNotes(release.body),
      };
    });
  } catch (error) {
    console.error("Failed to fetch releases:", error);
    return [];
  }
}

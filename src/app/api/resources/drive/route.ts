import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth-guard";
import { SESSION_COOKIE_NAME } from "@/lib/auth-config";
import { buildApiError, buildApiSuccess } from "@/lib/api/errors";
import type { DriveItem } from "@/types/resources";

export const runtime = "nodejs";

const DRIVE_FIELDS =
  "nextPageToken,files(id,name,mimeType,modifiedTime,webViewLink,iconLink,size)";

async function fetchDriveChildren(folderId: string, apiKey: string) {
  const items: DriveItem[] = [];
  let pageToken: string | null = null;
  let pageCount = 0;

  do {
    const params = new URLSearchParams();
    params.set("q", `'${folderId}' in parents and trashed = false`);
    params.set("fields", DRIVE_FIELDS);
    params.set("pageSize", "1000");
    params.set("orderBy", "folder,name");
    params.set("supportsAllDrives", "true");
    params.set("includeItemsFromAllDrives", "true");
    params.set("key", apiKey);
    if (pageToken) params.set("pageToken", pageToken);

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?${params.toString()}`,
      {
        cache: "force-cache",
        next: { revalidate: 60 * 60 },
      },
    );

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || "Failed to fetch Drive data");
    }

    const payload = (await response.json()) as {
      files?: DriveItem[];
      nextPageToken?: string;
    };

    items.push(...(payload.files ?? []));
    pageToken = payload.nextPageToken ?? null;
    pageCount += 1;
  } while (pageToken && pageCount < 10);

  return items;
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    await verifySession(sessionCookie);

    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get("folderId");

    if (!folderId) {
      const response = NextResponse.json(
        buildApiError("VALIDATION_ERROR", "folderId is required"),
        { status: 400 },
      );
      response.headers.set("Cache-Control", "private, no-store");
      return response;
    }

    const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
    if (!apiKey) {
      const response = NextResponse.json(
        buildApiError("INTERNAL_ERROR", "Google Drive API key is missing"),
        { status: 500 },
      );
      response.headers.set("Cache-Control", "private, no-store");
      return response;
    }

    const items = await fetchDriveChildren(folderId, apiKey);

    const response = NextResponse.json(buildApiSuccess(items));
    response.headers.set(
      "Cache-Control",
      "private, max-age=60, s-maxage=3600, stale-while-revalidate=86400",
    );
    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load Drive resources";
    const status = message.startsWith("Unauthorized") ? 401 : 500;
    const response = NextResponse.json(
      buildApiError(
        status === 401 ? "UNAUTHORIZED" : "INTERNAL_ERROR",
        status === 401 ? "Unauthorized" : message,
      ),
      { status },
    );
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }
}

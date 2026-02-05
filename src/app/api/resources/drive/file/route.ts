import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth-guard";
import { SESSION_COOKIE_NAME } from "@/lib/auth-config";
import { buildApiError } from "@/lib/api/errors";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    await verifySession(sessionCookie);

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("fileId");
    const exportMime = searchParams.get("export");

    if (!fileId) {
      return NextResponse.json(
        buildApiError("VALIDATION_ERROR", "fileId is required"),
        { status: 400 },
      );
    }

    const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        buildApiError("INTERNAL_ERROR", "Google Drive API key is missing"),
        { status: 500 },
      );
    }

    const baseUrl = `https://www.googleapis.com/drive/v3/files/${fileId}`;
    const url = exportMime
      ? `${baseUrl}/export?mimeType=${encodeURIComponent(exportMime)}&key=${apiKey}`
      : `${baseUrl}?alt=media&key=${apiKey}`;

    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      const message = await response.text();
      return NextResponse.json(
        buildApiError("HTTP_ERROR", message || "Failed to fetch file"),
        { status: response.status },
      );
    }

    const buffer = await response.arrayBuffer();
    const headers = new Headers(response.headers);
    headers.set("Cache-Control", "private, max-age=3600");
    return new NextResponse(buffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json(
      buildApiError(
        status === 401 ? "UNAUTHORIZED" : "INTERNAL_ERROR",
        status === 401 ? "Unauthorized" : message,
      ),
      { status },
    );
  }
}

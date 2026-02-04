import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { verifySession } from "@/lib/auth-guard";
import { SESSION_COOKIE_NAME } from "@/lib/auth-config";
import { buildApiError, buildApiSuccess } from "@/lib/api/errors";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { fetchUserCourseRecord } from "@/lib/api/supabase-utils";

export const runtime = "nodejs";

const querySchema = z.object({
  batchID: z.string().min(1).max(32).optional(),
});

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const decoded = await verifySession(sessionCookie);
    const supabaseAdmin = getSupabaseAdmin();

    const parsed = querySchema.safeParse(
      Object.fromEntries(new URL(request.url).searchParams.entries()),
    );

    if (!parsed.success) {
      const response = NextResponse.json(
        buildApiError("VALIDATION_ERROR", "Invalid query", parsed.error.format()),
        { status: 400 },
      );
      response.headers.set("Cache-Control", "private, no-store");
      return response;
    }

    const userRecord = await fetchUserCourseRecord(decoded.uid);
    if (!userRecord?.batchID) {
      const response = NextResponse.json(
        buildApiError("NOT_FOUND", "User batch not found"),
        { status: 404 },
      );
      response.headers.set("Cache-Control", "private, no-store");
      return response;
    }

    if (parsed.data.batchID && parsed.data.batchID !== userRecord.batchID) {
      const response = NextResponse.json(
        buildApiError("VALIDATION_ERROR", "Batch mismatch"),
        { status: 403 },
      );
      response.headers.set("Cache-Control", "private, no-store");
      return response;
    }

    const { data, error } = await supabaseAdmin
      .from("calendars")
      .select("calendarID,calendarUrl,calendar_name,batchID")
      .eq("batchID", userRecord.batchID);

    if (error) {
      const response = NextResponse.json(
        buildApiError("SUPABASE_ERROR", error.message || "Query failed"),
        { status: 500 },
      );
      response.headers.set("Cache-Control", "private, no-store");
      return response;
    }

    const response = NextResponse.json(buildApiSuccess(data || []));
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
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

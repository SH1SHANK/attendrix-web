import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { verifySession } from "@/lib/auth-guard";
import { SESSION_COOKIE_NAME } from "@/lib/auth-config";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { buildApiError, buildApiSuccess } from "@/lib/api/errors";

export const runtime = "nodejs";

const bodySchema = z.object({
  progressIds: z.array(z.string().min(1).max(64)).default([]),
  currentStreak: z.number().nullable().optional(),
  courseIds: z.array(z.string().min(1).max(64)).default([]),
});

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const decoded = await verifySession(sessionCookie);
    const supabaseAdmin = getSupabaseAdmin();

    const body = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      const response = NextResponse.json(
        buildApiError("VALIDATION_ERROR", "Invalid request body", parsed.error.format()),
        { status: 400 },
      );
      response.headers.set("Cache-Control", "private, no-store");
      return response;
    }

    const { progressIds, currentStreak, courseIds } = parsed.data;

    if (progressIds.length === 0 || courseIds.length === 0) {
      const response = NextResponse.json(buildApiSuccess(null));
      response.headers.set("Cache-Control", "private, no-store");
      return response;
    }

    const { data, error } = await supabaseAdmin.rpc(
      "evaluate_user_challenges",
      {
        p_user_id: decoded.uid,
        p_progress_ids: progressIds,
        p_current_streak: currentStreak ?? null,
        p_course_ids: courseIds,
      },
    );

    if (error) {
      const response = NextResponse.json(
        buildApiError("SUPABASE_ERROR", error.message || "RPC failed"),
        { status: 500 },
      );
      response.headers.set("Cache-Control", "private, no-store");
      return response;
    }

    const response = NextResponse.json(buildApiSuccess(data));
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

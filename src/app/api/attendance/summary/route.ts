import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { verifySession } from "@/lib/auth-guard";
import { SESSION_COOKIE_NAME } from "@/lib/auth-config";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { buildApiError, buildApiSuccess } from "@/lib/api/errors";

export const runtime = "nodejs";

const querySchema = z.object({
  attendanceGoal: z
    .preprocess(
      (val) => (typeof val === "string" && val.length ? Number(val) : undefined),
      z.number().min(1).max(100).optional(),
    )
    .optional(),
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

    const { attendanceGoal } = parsed.data;

    const { data, error } = await supabaseAdmin.rpc(
      "get_user_course_attendance_summary",
      {
        uid: decoded.uid,
        attendance_goal: attendanceGoal,
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

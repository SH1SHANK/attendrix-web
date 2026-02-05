import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { verifySession } from "@/lib/auth-guard";
import { SESSION_COOKIE_NAME } from "@/lib/auth-config";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { buildApiError, buildApiSuccess } from "@/lib/api/errors";
import type { PastClass } from "@/types/types-defination";

export const runtime = "nodejs";

const filterSchema = z.object({
  filter: z.enum(["7d", "14d", "30d", "all"]).default("7d"),
});

function normalizePastClassRow(
  row: Record<string, unknown>,
): PastClass | null {
  const classID = (row.classID ?? row.classid) as string | undefined;
  const courseID = (row.courseID ?? row.courseid) as string | undefined;
  const courseName = (row.courseName ?? row.coursename ?? "Unknown Course") as
    | string
    | undefined;
  const classStartTime = (row.classStartTime ?? row.classstarttime) as
    | string
    | undefined;
  const classEndTime = (row.classEndTime ?? row.classendtime) as
    | string
    | undefined;
  const classVenue = (row.classVenue ?? row.classvenue ?? null) as
    | string
    | null;

  if (!classID || !courseID || !courseName || !classStartTime || !classEndTime) {
    return null;
  }

  const rawStatus = String(
    row.attendanceStatus ?? row.attendancestatus ?? "ABSENT",
  ).toUpperCase();

  const attendanceStatus: PastClass["attendanceStatus"] =
    rawStatus === "PRESENT"
      ? "PRESENT"
      : rawStatus === "PENDING"
        ? "PENDING"
        : "ABSENT";

  return {
    classID,
    courseID,
    courseName,
    classStartTime,
    classEndTime,
    classVenue,
    attendanceStatus,
  };
}

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const decoded = await verifySession(sessionCookie);
    const supabaseAdmin = getSupabaseAdmin();

    const parsed = filterSchema.safeParse(
      Object.fromEntries(new URL(request.url).searchParams.entries()),
    );

    if (!parsed.success) {
      const response = NextResponse.json(
        buildApiError("VALIDATION_ERROR", "Invalid filter", parsed.error.format()),
        { status: 400 },
      );
      response.headers.set("Cache-Control", "private, no-store");
      return response;
    }

    const { filter } = parsed.data;

    const { data, error } = await supabaseAdmin.rpc(
      "get_user_past_classes",
      {
        uid: decoded.uid,
        filter,
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

    const rows = Array.isArray(data) ? data : [];
    const normalized = rows
      .map((row) => normalizePastClassRow(row as Record<string, unknown>))
      .filter((item): item is PastClass => item !== null);

    if (normalized.length !== rows.length) {
      console.warn(
        "[Attendance Past] Dropped rows due to missing fields:",
        rows.length - normalized.length,
      );
    }

    const response = NextResponse.json(buildApiSuccess(normalized));
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

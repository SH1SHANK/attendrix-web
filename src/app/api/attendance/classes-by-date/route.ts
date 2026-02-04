import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { verifySession } from "@/lib/auth-guard";
import { SESSION_COOKIE_NAME } from "@/lib/auth-config";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { buildApiError, buildApiSuccess } from "@/lib/api/errors";
import { fetchUserCourseRecord } from "@/lib/api/supabase-utils";
import type { ClassByDate } from "@/types/supabase-academic";

export const runtime = "nodejs";

const querySchema = z.object({
  batchId: z.string().min(1).max(32),
  date: z.string().min(1),
});

function normalizeClassByDateRow(
  row: Record<string, unknown>,
): ClassByDate | null {
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
  const classDate = (row.classDate ?? row.classdate) as string | undefined;

  if (
    !classID ||
    !courseID ||
    !courseName ||
    !classStartTime ||
    !classEndTime ||
    !classDate
  ) {
    return null;
  }

  return {
    classID,
    courseID,
    courseName,
    classStartTime,
    classEndTime,
    classVenue,
    classDate,
    classStatus: (row.classStatus ?? row.classstatus ?? null) as
      | Record<string, unknown>
      | null,
    courseType: (row.courseType ?? row.coursetype ?? null) as
      | {
          isLab: boolean;
          courseType: string;
          electiveCategory: string;
        }
      | null,
    isPlusSlot: Boolean(row.isPlusSlot ?? row.isplusslot ?? false),
  };
}

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

    const { batchId, date } = parsed.data;

    const courseRecord = await fetchUserCourseRecord(decoded.uid);
    const enrolledCourses = courseRecord?.enrolledCourses ?? [];

    if (enrolledCourses.length === 0) {
      const response = NextResponse.json(buildApiSuccess([]));
      response.headers.set("Cache-Control", "private, no-store");
      return response;
    }

    let query = supabaseAdmin
      .from("timetableRecords")
      .select(
        "classID,courseID,courseName,classStartTime,classEndTime,classVenue,classDate,classStatus,courseType,isPlusSlot",
      )
      .eq("batchID", batchId)
      .eq("classDate", date);

    if (enrolledCourses.length > 0) {
      query = query.in("courseID", enrolledCourses);
    }

    const { data, error } = await query.order("classStartTime", {
      ascending: true,
    });

    if (error) {
      const response = NextResponse.json(
        buildApiError("SUPABASE_ERROR", error.message || "Query failed"),
        { status: 500 },
      );
      response.headers.set("Cache-Control", "private, no-store");
      return response;
    }

    const rows = Array.isArray(data) ? data : [];
    const normalized = rows
      .map((row) => normalizeClassByDateRow(row as Record<string, unknown>))
      .filter((item): item is ClassByDate => item !== null);

    if (normalized.length !== rows.length) {
      console.warn(
        "[Classes By Date] Dropped rows due to missing fields:",
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

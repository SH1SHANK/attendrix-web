import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth-guard";
import { SESSION_COOKIE_NAME } from "@/lib/auth-config";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { buildApiError, buildApiSuccess } from "@/lib/api/errors";
import { fetchUserCourseRecord } from "@/lib/api/supabase-utils";
import type { TaskRecord } from "@/types/types-defination";

export const runtime = "nodejs";

function getTaskTimestamp(task: TaskRecord) {
  const date =
    task.taskDueDate || task.taskStartTime || task.taskEndTime || task.created_at;
  const timestamp = Date.parse(date ?? "");
  return Number.isNaN(timestamp) ? null : timestamp;
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const decoded = await verifySession(sessionCookie);

    const courseRecord = await fetchUserCourseRecord(decoded.uid);
    const enrolledCourses = courseRecord?.enrolledCourses ?? [];

    if (enrolledCourses.length === 0) {
      const response = NextResponse.json(buildApiSuccess([]));
      response.headers.set("Cache-Control", "private, no-store");
      return response;
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("taskRecords")
      .select(
        "id,created_at,courseID,taskType,taskName,taskDescription,taskDueDate,taskStartTime,taskEndTime,taskAssets,maxScore,taskVenue,additional_info",
      )
      .in("courseID", enrolledCourses)
      .order("taskDueDate", { ascending: true });

    if (error) {
      const response = NextResponse.json(
        buildApiError("SUPABASE_ERROR", error.message || "Failed to load tasks"),
        { status: 500 },
      );
      response.headers.set("Cache-Control", "private, no-store");
      return response;
    }

    const tasks = (data ?? []) as TaskRecord[];
    const sorted = [...tasks].sort((a, b) => {
      const aTime = getTaskTimestamp(a);
      const bTime = getTaskTimestamp(b);
      if (aTime === null && bTime === null) return 0;
      if (aTime === null) return 1;
      if (bTime === null) return -1;
      return aTime - bTime;
    });

    const response = NextResponse.json(buildApiSuccess(sorted));
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

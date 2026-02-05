import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth-guard";
import { SESSION_COOKIE_NAME } from "@/lib/auth-config";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { buildApiError, buildApiSuccess } from "@/lib/api/errors";
import { fetchUserCourseRecord } from "@/lib/api/supabase-utils";
import { parseSyllabusAssets } from "@/lib/resources/syllabus";
import type { ResourceCourse } from "@/types/resources";

export const runtime = "nodejs";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const decoded = await verifySession(sessionCookie);

    const courseRecord = await fetchUserCourseRecord(decoded.uid);
    const enrolledCourses = courseRecord?.enrolledCourses ?? [];

    if (enrolledCourses.length === 0) {
      const response = NextResponse.json(buildApiSuccess([]));
      response.headers.set(
        "Cache-Control",
        "private, max-age=60, s-maxage=300, stale-while-revalidate=3600",
      );
      return response;
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("courseRecords")
      .select("courseID,courseName,syllabusAssets")
      .in("courseID", enrolledCourses);

    if (error) {
      const response = NextResponse.json(
        buildApiError(
          "SUPABASE_ERROR",
          error.message || "Failed to load course resources",
        ),
        { status: 500 },
      );
      response.headers.set("Cache-Control", "private, no-store");
      return response;
    }

    const order = new Map(enrolledCourses.map((id, index) => [id, index]));

    const courses: ResourceCourse[] = (data ?? []).map((row) => ({
      courseID: String(row.courseID ?? ""),
      courseName: row.courseName ?? null,
      syllabusAssets: parseSyllabusAssets(row.syllabusAssets),
    }));

    courses.sort((a, b) => {
      const orderA = order.get(a.courseID) ?? Number.MAX_SAFE_INTEGER;
      const orderB = order.get(b.courseID) ?? Number.MAX_SAFE_INTEGER;
      if (orderA !== orderB) return orderA - orderB;
      return (a.courseName ?? a.courseID).localeCompare(
        b.courseName ?? b.courseID,
      );
    });

    const response = NextResponse.json(buildApiSuccess(courses));
    response.headers.set(
      "Cache-Control",
      "private, max-age=60, s-maxage=300, stale-while-revalidate=3600",
    );
    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load resources";
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

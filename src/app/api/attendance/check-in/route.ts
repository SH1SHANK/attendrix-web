import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { verifySession } from "@/lib/auth-guard";
import { SESSION_COOKIE_NAME } from "@/lib/auth-config";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { buildApiError, buildApiSuccess } from "@/lib/api/errors";
import { fetchUserCourseRecord } from "@/lib/api/supabase-utils";
import { getAdminFirestore } from "@/lib/firebase-admin";

export const runtime = "nodejs";

const bodySchema = z.object({
  classID: z.string().min(1).max(64).regex(/^[A-Za-z0-9._:-]+$/),
  classStartTime: z.string().min(1).max(128),
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

    const courseRecord = await fetchUserCourseRecord(decoded.uid);
    let enrolledCourses = courseRecord?.enrolledCourses ?? [];

    if (enrolledCourses.length === 0) {
      const db = getAdminFirestore();
      const snap = await db.collection("users").doc(decoded.uid).get();
      const fallbackCourses = snap.exists ? snap.data()?.coursesEnrolled : [];
      enrolledCourses = Array.isArray(fallbackCourses)
        ? fallbackCourses
            .map((course: { courseID?: unknown }) => course?.courseID)
            .filter((id): id is string => typeof id === "string" && id.length > 0)
        : [];
    }

    if (enrolledCourses.length === 0) {
      const response = NextResponse.json(
        buildApiError("VALIDATION_ERROR", "No enrolled courses found"),
        { status: 400 },
      );
      response.headers.set("Cache-Control", "private, no-store");
      return response;
    }

    const { data, error } = await (supabaseAdmin as any).rpc(
      "class_check_in",
      {
        p_user_id: decoded.uid,
        p_class_id: parsed.data.classID,
        p_class_start: parsed.data.classStartTime,
        p_enrolled_courses: enrolledCourses,
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

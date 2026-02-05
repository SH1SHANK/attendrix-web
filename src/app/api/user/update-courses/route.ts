import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { verifySession } from "@/lib/auth-guard";
import { SESSION_COOKIE_NAME } from "@/lib/auth-config";
import { buildApiError, buildApiSuccess } from "@/lib/api/errors";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { fetchUserCourseRecord } from "@/lib/api/supabase-utils";
import { getBatchOnboardingData } from "@/app/actions/onboarding";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { parseCourseType } from "@/lib/onboarding/course-utils";
import type { CourseRecord } from "@/types/supabase-academic";
import type { FirebaseCourseEnrollment } from "@/types/types-defination";

export const runtime = "nodejs";

const bodySchema = z.object({
  courseIds: z
    .array(z.string().min(1).max(64).regex(/^[A-Za-z0-9._:-]+$/))
    .min(1)
    .max(200),
});

function uniqueIds(ids: string[]) {
  return Array.from(new Set(ids));
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const decoded = await verifySession(sessionCookie);

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

    const supabaseAdmin = getSupabaseAdmin();
    const userRecord = await fetchUserCourseRecord(decoded.uid);

    if (!userRecord) {
      const response = NextResponse.json(
        buildApiError("NOT_FOUND", "User course record not found"),
        { status: 404 },
      );
      response.headers.set("Cache-Control", "private, no-store");
      return response;
    }

    const batchId = userRecord.batchID;
    const semesterId = userRecord.semesterID;

    const batchData = await getBatchOnboardingData(batchId);
    if (!batchData) {
      const response = NextResponse.json(
        buildApiError("NOT_FOUND", "Course catalog not found"),
        { status: 404 },
      );
      response.headers.set("Cache-Control", "private, no-store");
      return response;
    }

    const allowedIds = new Set([
      ...batchData.coreCourses.map((course) => course.courseID),
      ...batchData.electiveCourses.map((course) => course.courseID),
    ]);

    const requestedIds = uniqueIds(parsed.data.courseIds);
    const invalidIds = requestedIds.filter((id) => !allowedIds.has(id));

    if (invalidIds.length > 0) {
      const response = NextResponse.json(
        buildApiError("VALIDATION_ERROR", "Invalid course selection", {
          invalidIds,
        }),
        { status: 400 },
      );
      response.headers.set("Cache-Control", "private, no-store");
      return response;
    }

    const { data: courseRecords, error: courseError } = await supabaseAdmin
      .from("courseRecords")
      .select("courseID,courseName,credits,courseType")
      .in("courseID", requestedIds);

    if (courseError) {
      const response = NextResponse.json(
        buildApiError("SUPABASE_ERROR", courseError.message || "Query failed"),
        { status: 500 },
      );
      response.headers.set("Cache-Control", "private, no-store");
      return response;
    }

    const recordMap = new Map<string, CourseRecord>();
    (courseRecords as CourseRecord[] | null | undefined || []).forEach(
      (course) => {
        recordMap.set(course.courseID, course);
      },
    );

    const db = getAdminFirestore();
    const userRef = db.collection("users").doc(decoded.uid);
    const userSnap = await userRef.get();
    const existingUser = userSnap.exists ? userSnap.data() : null;

    const existingCourses = Array.isArray(existingUser?.coursesEnrolled)
      ? (existingUser?.coursesEnrolled as FirebaseCourseEnrollment[])
      : [];

    const existingMap = new Map(
      existingCourses.map((course) => [course.courseID, course]),
    );

    const enrolledCourseIds = requestedIds.filter((id) => recordMap.has(id));

    const updatedCourses = enrolledCourseIds
      .map((courseId) => {
        const record = recordMap.get(courseId);
        if (!record) return null;
        const existing = existingMap.get(courseId);
        const type = parseCourseType(record.courseType);

        return {
          courseID: record.courseID,
          courseName: record.courseName,
          credits: record.credits ?? 0,
          courseType: {
            isLab: Boolean(type.isLab),
            courseType: (type.courseType || "core") as
              | "core"
              | "elective"
              | "audit",
            electiveCategory: type.electiveCategory || "",
          },
          isEditable: existing?.isEditable ?? true,
          totalClasses: existing?.totalClasses ?? 0,
          attendedClasses: existing?.attendedClasses ?? 0,
        } as FirebaseCourseEnrollment;
      })
      .filter((course): course is FirebaseCourseEnrollment => Boolean(course));

    const previousIds = new Set(existingCourses.map((course) => course.courseID));
    const addedCourseIds = enrolledCourseIds.filter((id) => !previousIds.has(id));
    const removedCourseIds = Array.from(previousIds).filter(
      (id) => !enrolledCourseIds.includes(id),
    );

    await userRef.set(
      {
        coursesEnrolled: updatedCourses,
        lastDataFetchTime: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    const rpcPayload = {
      p_user_id: decoded.uid,
      p_course_ids: enrolledCourseIds,
      p_is_admin: false,
      p_batch_id: batchId,
      p_semester_id: Number(semesterId || 0),
    };

    const { error: rpcError } = await supabaseAdmin.rpc(
      "set_user_courses",
      rpcPayload,
    );

    if (rpcError) {
      const response = NextResponse.json(
        buildApiError("SUPABASE_ERROR", rpcError.message || "RPC failed"),
        { status: 500 },
      );
      response.headers.set("Cache-Control", "private, no-store");
      return response;
    }

    const response = NextResponse.json(
      buildApiSuccess({
        addedCourseIds,
        removedCourseIds,
        enrolledCourseIds,
      }),
    );
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

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { verifySession } from "@/lib/auth-guard";
import { SESSION_COOKIE_NAME } from "@/lib/auth-config";
import { buildApiError, buildApiSuccess } from "@/lib/api/errors";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { fetchUserCourseRecord } from "@/lib/api/supabase-utils";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import type { FirebaseCourseEnrollment } from "@/types/types-defination";

export const runtime = "nodejs";

const bodySchema = z
  .object({})
  .strict()
  .optional();

type TotalsMismatch = {
  courseID: string;
  firebase: { attended: number; total: number };
  supabase: { attended: number; total: number };
};

function normalizeIds(ids: string[]) {
  return Array.from(
    new Set(ids.filter((id) => typeof id === "string" && id.length > 0)),
  );
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const decoded = await verifySession(sessionCookie);
    const supabaseAdmin = getSupabaseAdmin();

    const body = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(body ?? {});

    if (!parsed.success) {
      const response = NextResponse.json(
        buildApiError("VALIDATION_ERROR", "Invalid request body", parsed.error.format()),
        { status: 400 },
      );
      response.headers.set("Cache-Control", "private, no-store");
      return response;
    }

    const db = getAdminFirestore();
    const userRef = db.collection("users").doc(decoded.uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      const response = NextResponse.json(
        buildApiError("NOT_FOUND", "User document not found"),
        { status: 404 },
      );
      response.headers.set("Cache-Control", "private, no-store");
      return response;
    }

    const firebaseCourses = Array.isArray(userSnap.data()?.coursesEnrolled)
      ? (userSnap.data()?.coursesEnrolled as FirebaseCourseEnrollment[])
      : [];

    const firebaseIds = normalizeIds(
      firebaseCourses.map((course) => course.courseID),
    );

    const supabaseRecord = await fetchUserCourseRecord(decoded.uid);
    if (!supabaseRecord) {
      const response = NextResponse.json(
        buildApiError("NOT_FOUND", "Supabase course record not found"),
        { status: 404 },
      );
      response.headers.set("Cache-Control", "private, no-store");
      return response;
    }

    const supabaseIds = normalizeIds(supabaseRecord.enrolledCourses ?? []);

    const missingInSupabase = firebaseIds.filter((id) => !supabaseIds.includes(id));
    const extraInSupabase = supabaseIds.filter((id) => !firebaseIds.includes(id));

    const { data: summaryData } = await supabaseAdmin.rpc(
      "get_user_course_attendance_summary",
      {
        uid: decoded.uid,
        attendance_goal: 75,
      },
    );

    const summaryList = Array.isArray(summaryData) ? summaryData : [];

    const mismatchList: TotalsMismatch[] = [];
    firebaseCourses.forEach((course) => {
      const match = summaryList.find(
        (row: { courseID?: string }) => row?.courseID === course.courseID,
      );
      if (!match) return;

      const fbAttended = Number(course.attendedClasses ?? 0);
      const fbTotal = Number(course.totalClasses ?? 0);
      const sbAttended = Number(match.attendedClasses ?? 0);
      const sbTotal = Number(match.totalClasses ?? 0);

      if (fbAttended !== sbAttended || fbTotal !== sbTotal) {
        mismatchList.push({
          courseID: course.courseID,
          firebase: { attended: fbAttended, total: fbTotal },
          supabase: { attended: sbAttended, total: sbTotal },
        });
      }
    });

    const shouldUpdate = missingInSupabase.length > 0 || extraInSupabase.length > 0;

    if (shouldUpdate) {
      const payload = {
        p_user_id: decoded.uid,
        p_course_ids: firebaseIds,
        p_is_admin: false,
        p_batch_id: supabaseRecord.batchID,
        p_semester_id: Number(supabaseRecord.semesterID || 0),
      };

      const { error: rpcError } = await supabaseAdmin.rpc(
        "set_user_courses",
        payload,
      );

      if (rpcError) {
        const response = NextResponse.json(
          buildApiError("SUPABASE_ERROR", rpcError.message || "RPC failed"),
          { status: 500 },
        );
        response.headers.set("Cache-Control", "private, no-store");
        return response;
      }

      await supabaseAdmin
        .from("userCourseRecords")
        .update({
          enrolledCourses: firebaseIds,
          lastUpdated: new Date().toISOString(),
        })
        .eq("userID", decoded.uid);
    }

    await userRef.set(
      {
        lastResyncAt: FieldValue.serverTimestamp(),
        resyncCount: FieldValue.increment(1),
      },
      { merge: true },
    );

    const response = NextResponse.json(
      buildApiSuccess({
        firebaseCourseIds: firebaseIds,
        supabaseCourseIds: supabaseIds,
        missingInSupabase,
        extraInSupabase,
        totalsMismatched: mismatchList,
        updated: shouldUpdate,
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

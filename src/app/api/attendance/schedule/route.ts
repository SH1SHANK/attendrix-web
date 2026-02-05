import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { verifySession } from "@/lib/auth-guard";
import { SESSION_COOKIE_NAME } from "@/lib/auth-config";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { buildApiError, buildApiSuccess } from "@/lib/api/errors";
import { fetchUserCourseRecord } from "@/lib/api/supabase-utils";
import { getISTDateString } from "@/lib/time/ist";
import type { TodayScheduleClass, UpcomingClass } from "@/types/supabase-academic";

export const runtime = "nodejs";

const querySchema = z.object({
  batchId: z.string().min(1).max(32),
  attendanceGoal: z.preprocess(
    (val) => (typeof val === "string" && val.length ? Number(val) : 75),
    z.number().min(1).max(100),
  ),
  date: z.string().optional(),
});

function normalizeTodayScheduleRow(row: Record<string, unknown>): TodayScheduleClass {
  return {
    classID: (row.classID || row.classid) as string,
    courseID: (row.courseID || row.courseid) as string,
    courseName: (row.courseName || row.coursename || "Unknown Course") as string,
    classStartTime: (row.classStartTime || row.classstarttime) as string,
    classEndTime: (row.classEndTime || row.classendtime) as string,
    classVenue: (row.classVenue || row.classvenue) as string | null,
    isCancelled: (row.isCancelled ?? row.iscancelled ?? false) as boolean,
    userAttended: (row.userAttended ?? row.userattended ?? false) as boolean,
    userCheckinTime: (row.userCheckinTime || row.usercheckintime) as
      | string
      | null,
    totalClasses: (row.totalClasses ?? row.totalclasses ?? 0) as number,
    attendedClasses: (row.attendedClasses ?? row.attendedclasses ?? 0) as number,
    currentAttendancePercentage: (row.currentAttendancePercentage ??
      row.currentattendancepercentage ??
      0) as number,
    classesRequiredToReachGoal: (row.classesRequiredToReachGoal ??
      row.classesrequiredtoreachgoal ??
      0) as number,
    classesCanSkipAndStayAboveGoal: (row.classesCanSkipAndStayAboveGoal ??
      row.classescanskipandstayabovegoal ??
      0) as number,
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

    const { batchId, attendanceGoal, date } = parsed.data;
    const targetDate = date ? new Date(date) : new Date();
    if (Number.isNaN(targetDate.getTime())) {
      const response = NextResponse.json(
        buildApiError("VALIDATION_ERROR", "Invalid date"),
        { status: 400 },
      );
      response.headers.set("Cache-Control", "private, no-store");
      return response;
    }

    const dateString = getISTDateString(targetDate);

    const courseRecord = await fetchUserCourseRecord(decoded.uid);
    const enrolledCourses = courseRecord?.enrolledCourses ?? [];

    if (enrolledCourses.length === 0) {
      const response = NextResponse.json(
        buildApiSuccess({ todaySchedule: [], upcomingClasses: [] }),
      );
      response.headers.set("Cache-Control", "private, no-store");
      return response;
    }

    const { data: todayData, error: todayError } = await supabaseAdmin.rpc(
      "get_today_schedule",
      {
        batch_id: batchId,
        user_id: decoded.uid,
        date: dateString,
        attendance_goal_percentage: attendanceGoal,
      },
    );

    if (todayError) {
      const response = NextResponse.json(
        buildApiError("SUPABASE_ERROR", todayError.message || "RPC failed"),
        { status: 500 },
      );
      response.headers.set("Cache-Control", "private, no-store");
      return response;
    }

    let todaySchedule = Array.isArray(todayData)
      ? todayData.map((row) => normalizeTodayScheduleRow(row as Record<string, unknown>))
      : [];

    if (enrolledCourses.length > 0) {
      todaySchedule = todaySchedule.filter((row) =>
        enrolledCourses.includes(row.courseID),
      );
    }

    const nowIso = new Date().toISOString();

    let upcomingQuery = supabaseAdmin
      .from("timetableRecords")
      .select(
        "classID,courseID,courseName,classStartTime,classEndTime,classVenue,classDate,courseType",
      )
      .eq("batchID", batchId)
      .gt("classStartTime", nowIso);

    if (enrolledCourses.length > 0) {
      upcomingQuery = upcomingQuery.in("courseID", enrolledCourses);
    }

    const { data: upcomingData, error: upcomingError } = await upcomingQuery
      .order("classStartTime", { ascending: true })
      .limit(5);

    if (upcomingError) {
      const response = NextResponse.json(
        buildApiError("SUPABASE_ERROR", upcomingError.message || "Query failed"),
        { status: 500 },
      );
      response.headers.set("Cache-Control", "private, no-store");
      return response;
    }

    const upcomingRows = (upcomingData || []) as Array<
      Record<string, unknown>
    >;

    const upcomingClasses: UpcomingClass[] = upcomingRows.map((cls) => {
      const rawCourseType = cls.courseType;
      const courseType =
        rawCourseType && typeof rawCourseType === "object"
          ? (rawCourseType as UpcomingClass["courseType"])
          : null;

      return {
        classID: cls.classID as string,
        courseID: cls.courseID as string,
        courseName: (cls.courseName as string) || "Upcoming Class",
        classStartTime: cls.classStartTime as string,
        classEndTime: cls.classEndTime as string,
        classVenue: cls.classVenue as string | null,
        classDate: cls.classDate as string,
        courseType,
      };
    });

    const response = NextResponse.json(
      buildApiSuccess({ todaySchedule, upcomingClasses }),
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

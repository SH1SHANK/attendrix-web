import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { verifySession } from "@/lib/auth-guard";
import { SESSION_COOKIE_NAME } from "@/lib/auth-config";
import { buildApiError, buildApiSuccess } from "@/lib/api/errors";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getAdminAuth, getAdminFirestore } from "@/lib/firebase-admin";

export const runtime = "nodejs";

const bodySchema = z.object({
  confirm: z.literal("DELETE"),
});

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

    await supabaseAdmin.from("attendanceRecords").delete().eq("userID", decoded.uid);
    await supabaseAdmin
      .from("amplixChallengeProgress")
      .delete()
      .eq("userID", decoded.uid);
    await supabaseAdmin.from("userCourseRecords").delete().eq("userID", decoded.uid);

    const db = getAdminFirestore();
    await db.collection("users").doc(decoded.uid).delete();

    const auth = getAdminAuth();
    await auth.deleteUser(decoded.uid);

    const response = NextResponse.json(buildApiSuccess({ deleted: true }));
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

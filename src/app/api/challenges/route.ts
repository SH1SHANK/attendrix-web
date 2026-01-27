import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth-guard";
import { SESSION_COOKIE_NAME } from "@/lib/auth-config";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { UserChallenge } from "@/types/challenges";

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }

  return createClient(supabaseUrl, supabaseKey);
}

// Reuse logic from useChallenges hook but on server side
// Ideally we should move the generate/sync logic here to keep client thin.
// The hook had extensive logic for:
// 1. Checking Firestore user data (challengeKey)
// 2. Calling `generate_user_challenges_v2` RPC if needed
// 3. Calling `evaluate_user_challenges` RPC
// 4. Updating Firestore

// We will replicate this orchestration in the GET handler.

export async function GET() {
  try {
    // 1. Auth Check - Duplicate logic to safeguard API
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionCookie) {
      return NextResponse.json(
        { error: "Unauthorized: No session" },
        { status: 401 },
      );
    }

    const decodedToken = await verifySession(sessionCookie);
    const uid = decodedToken.uid;

    if (!uid) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid token" },
        { status: 401 },
      );
    }

    const supabase = getSupabaseClient();
    const db = getAdminFirestore();
    const userRef = db.collection("users").doc(uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userSnap.data();
    if (!userData) {
      return NextResponse.json({ error: "User data empty" }, { status: 404 });
    }

    // --- LOGIC PORT FROM useChallenges.ts ---

    // Generate keys
    const now = new Date();

    // Let's rely on importing date-fns
    const { format } = await import("date-fns");
    const month = format(now, "MM");
    const year = format(now, "yy");
    const weekNum = format(now, "w");
    const currentWeeklyKey = `${month}${year}-W${weekNum}W`;

    let challengesAllotted: UserChallenge[] =
      (userData.challengesAllotted as UserChallenge[]) || [];
    const storedKey = userData.challengeKey;

    // 1. Sync/Generate
    if (storedKey !== currentWeeklyKey) {
      // RPC call
      const { data: generatedData, error: genError } = await supabase.rpc(
        "generate_user_challenges_v2",
        {
          p_user_id: uid,
          p_current_challenges: challengesAllotted,
          p_weekly_amplix_limit: 1000,
          p_monthly_amplix_limit: 5000,
        },
      );

      if (genError) {
        console.error("API Challenges: Generation RPC failed", genError);
      } else if (generatedData?.status && generatedData?.challenges) {
        const newChallenges = generatedData.challenges;
        await userRef.update({
          challengesAllotted: newChallenges,
          challengeKey: currentWeeklyKey,
        });
        challengesAllotted = newChallenges;
      }
    }

    // 2. Evaluation
    const progressIds = challengesAllotted
      .map((c) => c.progressID)
      .filter((id): id is string => !!id);
    // mapped User in profile hook handles specific shape, direct firestore has it differently?
    // userData.coursesEnrolled in Firestore might be array of strings or objects?
    // Looking at useAttendance: `[`enrolledClasses.${classItem.courseID}.attendedClasses`]` -> it's a map?
    // Or in profile hook: `coursesEnrolled: AttendanceStat[]`.
    // The RPC expects `p_course_ids` as text[].

    // Let's assume we pass the array of IDs.
    // If `coursesEnrolled` is an array of objects in Firestore (unlikely for raw data, usually mapped), or array of strings.
    // Checking `getUserDashboardData` in profile actions: it uses `mapFirestoreUser`.
    // Let's assume we can pass generic course IDs.
    // Simplest: Pass empty if unsure, or try to extract.
    // If Firestore has `enrolledClasses` map, we extract keys.
    let courseIdList: string[] = [];
    if (userData.enrolledClasses) {
      courseIdList = Object.keys(userData.enrolledClasses);
    } else if (Array.isArray(userData.coursesEnrolled)) {
      // Check if string or object
      if (typeof userData.coursesEnrolled[0] === "string") {
        courseIdList = userData.coursesEnrolled;
      } else {
        courseIdList = userData.coursesEnrolled.map(
          (c: { courseID: string }) => c.courseID,
        );
      }
    }

    if (progressIds.length > 0) {
      const { data: evalData, error: evalError } = await supabase.rpc(
        "evaluate_user_challenges",
        {
          p_user_id: uid,
          p_progress_ids: progressIds,
          p_current_streak: userData.stats?.streak || 0,
          p_course_ids: courseIdList,
        },
      );

      if (evalError) {
        console.error("API Challenges: Eval RPC failed", evalError);
      } else {
        // Handle deductions
        if (
          evalData &&
          typeof evalData === "object" &&
          (evalData as { points_to_deduct?: number }).points_to_deduct &&
          (evalData as { points_to_deduct: number }).points_to_deduct > 0
        ) {
          // Safe-guard increment import
          const { FieldValue } = await import("firebase-admin/firestore");
          const deduction = (evalData as { points_to_deduct: number })
            .points_to_deduct;
          await userRef.update({
            amplix: FieldValue.increment(-deduction),
            "stats.points": FieldValue.increment(-deduction),
          });
        }
      }
    }

    // 3. Fetch Fresh Progress
    const { data: progressData } = await supabase
      .from("amplixChallengeProgress")
      .select("*")
      .in("progressID", progressIds);

    const progressMap = new Map();
    progressData?.forEach((p) => progressMap.set(p.progressID, p));

    const merged = challengesAllotted.map((ch) => {
      if (!ch.progressID) return ch;
      const fresh = progressMap.get(ch.progressID);
      return fresh ? { ...ch, ...fresh } : ch;
    });

    return NextResponse.json(merged);
  } catch (error) {
    console.error("API /api/challenges Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

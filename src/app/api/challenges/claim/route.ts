import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth-guard";
import { SESSION_COOKIE_NAME } from "@/lib/auth-config";
import { getAdminFirestore } from "@/lib/firebase-admin";

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

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decodedToken = await verifySession(sessionCookie);
    const uid = decodedToken.uid;
    if (!uid)
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const body = await request.json();
    const { progressID } = body;

    if (!progressID) {
      return NextResponse.json(
        { error: "Missing progressID" },
        { status: 400 },
      );
    }

    const supabase = getSupabaseClient();
    const { data: rewardAmount, error } = await supabase.rpc(
      "complete_challenge_and_award",
      {
        progress_id: progressID,
      },
    );

    if (error) {
      console.error("API Claim Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update Firebase
    if (typeof rewardAmount === "number") {
      const db = getAdminFirestore();
      const { FieldValue } = await import("firebase-admin/firestore");
      const userRef = db.collection("users").doc(uid);

      await userRef.update({
        amplix: FieldValue.increment(rewardAmount),
        "stats.points": FieldValue.increment(rewardAmount),
      });
    }

    return NextResponse.json({ success: true, reward: rewardAmount });
  } catch (error) {
    console.error("API /api/challenges/claim Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

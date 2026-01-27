import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth-guard";
import { SESSION_COOKIE_NAME } from "@/lib/auth-config";

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

export async function GET(request: NextRequest) {
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

    // 2. Parse Query Params
    const searchParams = request.nextUrl.searchParams;
    const year = parseInt(searchParams.get("year") || "");
    const month = parseInt(searchParams.get("month") || "");

    if (isNaN(year) || isNaN(month)) {
      return NextResponse.json(
        { error: "Invalid year or month parameters" },
        { status: 400 },
      );
    }

    // 3. Call Supabase RPC
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc("get_month_attendance", {
      p_user_id: uid,
      p_year: year,
      p_month: month,
    });

    if (error) {
      console.error("Supabase RPC Error (Calendar):", error);
      return NextResponse.json(
        { error: error.message || "Failed to fetch calendar data" },
        { status: 500 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("API /api/calendar Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

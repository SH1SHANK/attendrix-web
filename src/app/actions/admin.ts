"use server";

import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { verifySession } from "@/lib/auth-guard";
import { getAdminAuth, getAdminFirestore } from "@/lib/firebase-admin";
import { SESSION_COOKIE_NAME } from "@/lib/auth-config";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Verifies an admin verification code.
 * If valid, updates the user's custom claims to { admin: true }.
 *
 * @param code The 6-digit verification code entered by the user
 */
export async function verifyAdminCode(code: string) {
  try {
    if (!code) {
      return { success: false, message: "Verification code is required." };
    }

    // 1. Verify Session via cookie
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const decodedToken = await verifySession(sessionCookie);
    const uid = decodedToken.uid;
    const email = decodedToken.email;

    if (!email) {
      throw new Error("User email not found in session.");
    }

    // 2. Query 'public.adminusers' to match userid and admincode
    // We use supabaseAdmin to bypass RLS, ensuring strictly server-side verification.
    const { data: adminUser, error } = await supabaseAdmin
      .from("adminusers")
      .select("*")
      .eq("userid", uid) // Match by User ID
      .eq("admincode", code) // Match by Code
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Supabase Admin Query Failed:", error);
      throw new Error("Verification failed due to database error.");
    }

    if (!adminUser) {
      // No match found
      return { success: false, message: "Invalid verification code." };
    }

    // 3. Code Valid -> Update Custom Claims via Firebase Admin
    const auth = getAdminAuth();
    await auth.setCustomUserClaims(uid, { admin: true });

    // 4. Persist role to Firestore for local role checks
    const db = getAdminFirestore();
    await db
      .collection("users")
      .doc(uid)
      .set({ userRole: "admin" }, { merge: true });

    console.log(
      `[Admin Verification] User ${email} (${uid}) promoted to ADMIN.`,
    );

    return { success: true };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    console.error("[Admin Verification] Error:", error);
    return {
      success: false,
      message,
    };
  }
}

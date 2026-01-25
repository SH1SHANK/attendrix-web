import "server-only";
import { getAdminAuth } from "./firebase-admin";
import type { DecodedIdToken } from "firebase-admin/auth";

/**
 * Verifies a Session Cookie (NOT an ID Token)
 *
 * @param sessionCookie The session cookie value from cookies()
 * @param checkRevoked If true, checks if tokens have been revoked (slower)
 * @returns The decoded claims if valid
 * @throws Error if invalid or expired
 */
export async function verifySession(
  sessionCookie: string | undefined | null,
  checkRevoked: boolean = false,
): Promise<DecodedIdToken> {
  if (!sessionCookie) {
    throw new Error("Unauthorized: No session cookie");
  }

  try {
    const auth = getAdminAuth();
    // CRITICAL: Use verifySessionCookie, NOT verifyIdToken
    const decodedClaims = await auth.verifySessionCookie(
      sessionCookie,
      checkRevoked,
    );
    return decodedClaims;
  } catch (error) {
    console.error("[Auth Guard] Session verification failed:", error);
    throw new Error("Unauthorized: Invalid or expired session");
  }
}

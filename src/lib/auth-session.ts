import "server-only";
import { getAdminAuth } from "./firebase-admin";
import {
  SESSION_COOKIE_NAME,
  SESSION_EXPIRY_MS,
  AUTH_EVENTS,
  logAuthEvent,
} from "./auth-config";
import type { DecodedIdToken } from "firebase-admin/auth";

/**
 * Session Lifecycle Management
 *
 * This module provides the core session operations:
 * - createSessionCookie: Mint a new session from an ID token
 * - verifySessionCookie: Validate an existing session
 * - revokeRefreshTokens: Force logout (invalidate all sessions)
 *
 * SECURITY NOTES:
 * - All functions run server-side only (import "server-only")
 * - Errors are logged with context but safe messages returned to clients
 * - checkRevoked=true should only be used for sensitive operations
 */

// Re-export for convenience
export { SESSION_COOKIE_NAME };

// =============================================================================
// SESSION CREATION
// =============================================================================

export interface CreateSessionResult {
  success: boolean;
  cookie?: string;
  error?: string;
  uid?: string;
}

/**
 * Creates a session cookie from a Firebase ID token.
 *
 * @param idToken - The ID token from Firebase client SDK
 * @returns Result object with cookie string or error
 *
 * FLOW:
 * 1. Verify the ID token is valid and not expired
 * 2. Mint a session cookie with 5-day expiry
 * 3. Return the cookie string for Set-Cookie header
 */
export async function createSessionCookie(
  idToken: string,
): Promise<CreateSessionResult> {
  logAuthEvent(AUTH_EVENTS.LOGIN_ATTEMPT, "Session creation started");

  try {
    // Validate input
    if (!idToken || typeof idToken !== "string") {
      logAuthEvent(AUTH_EVENTS.LOGIN_FAILURE, "Invalid ID token format");
      return { success: false, error: "Invalid token format" };
    }

    const auth = getAdminAuth();

    // Verify the ID token first (ensures it's valid and not expired)
    const decodedToken = await auth.verifyIdToken(idToken);

    // Check token age - reject if older than 5 minutes (prevents replay attacks)
    const authTime = decodedToken.auth_time * 1000;
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    if (now - authTime > fiveMinutes) {
      logAuthEvent(AUTH_EVENTS.LOGIN_FAILURE, "Token too old for session", {
        uid: decodedToken.uid,
        tokenAge: now - authTime,
      });
      return { success: false, error: "Token expired. Please sign in again." };
    }

    // Mint the session cookie
    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn: SESSION_EXPIRY_MS,
    });

    logAuthEvent(AUTH_EVENTS.LOGIN_SUCCESS, "Session created", {
      uid: decodedToken.uid,
      email: decodedToken.email,
    });

    return {
      success: true,
      cookie: sessionCookie,
      uid: decodedToken.uid,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logAuthEvent(AUTH_EVENTS.LOGIN_FAILURE, "Session creation failed", {
      error: errorMessage,
    });

    // Return safe message to client
    return { success: false, error: "Authentication failed" };
  }
}

// =============================================================================
// SESSION VERIFICATION
// =============================================================================

export interface VerifySessionResult {
  success: boolean;
  user?: DecodedIdToken;
  error?: string;
}

/**
 * Verifies a session cookie and returns the decoded user data.
 *
 * @param sessionCookie - The session cookie value
 * @param checkRevoked - If true, checks if user's tokens have been revoked (network call)
 * @returns Result object with user data or error
 *
 * WHEN TO USE checkRevoked=true:
 * - Password changes
 * - Account deletion
 * - Other sensitive/irreversible operations
 *
 * WHEN TO USE checkRevoked=false (default):
 * - Normal page loads
 * - Non-sensitive data fetches
 */
export async function verifySessionCookie(
  sessionCookie: string,
  checkRevoked: boolean = false,
): Promise<VerifySessionResult> {
  try {
    if (!sessionCookie || typeof sessionCookie !== "string") {
      logAuthEvent(AUTH_EVENTS.VERIFY_FAILURE, "Invalid session cookie format");
      return { success: false, error: "Invalid session" };
    }

    const auth = getAdminAuth();
    const decodedClaims = await auth.verifySessionCookie(
      sessionCookie,
      checkRevoked,
    );

    logAuthEvent(AUTH_EVENTS.VERIFY_SUCCESS, "Session verified", {
      uid: decodedClaims.uid,
      checkRevoked,
    });

    return { success: true, user: decodedClaims };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logAuthEvent(AUTH_EVENTS.VERIFY_FAILURE, "Session verification failed", {
      error: errorMessage,
      checkRevoked,
    });

    return { success: false, error: "Session expired or invalid" };
  }
}

// =============================================================================
// TOKEN REVOCATION
// =============================================================================

/**
 * Revokes all refresh tokens for a user (force logout from all devices).
 *
 * USE CASES:
 * - Admin force-logout
 * - Security incident response
 * - User-requested "sign out everywhere"
 *
 * NOTE: Existing session cookies will continue to work until they expire
 * UNLESS you use verifySessionCookie with checkRevoked=true.
 *
 * @param uid - The user's Firebase UID
 */
export async function revokeRefreshTokens(uid: string): Promise<void> {
  try {
    const auth = getAdminAuth();
    await auth.revokeRefreshTokens(uid);

    logAuthEvent(AUTH_EVENTS.REVOKE, "Refresh tokens revoked", { uid });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logAuthEvent(AUTH_EVENTS.REVOKE, "Token revocation failed", {
      uid,
      error: errorMessage,
    });
    throw error; // Re-throw for caller to handle
  }
}

// =============================================================================
// SERVER UTILITY: requireAuth
// =============================================================================

/**
 * Server utility to require authentication in Server Components or API routes.
 *
 * @param cookies - The cookies() object from next/headers
 * @param checkRevoked - Whether to check token revocation (use for sensitive ops)
 * @returns The decoded user claims
 * @throws Error if not authenticated (caller should handle redirect/response)
 *
 * USAGE IN SERVER COMPONENT:
 * ```ts
 * import { cookies } from 'next/headers';
 * import { requireAuth } from '@/lib/auth-session';
 *
 * export default async function ProtectedPage() {
 *   const user = await requireAuth(cookies());
 *   return <div>Welcome, {user.email}</div>;
 * }
 * ```
 */
export async function requireAuth(
  cookieStore: { get: (name: string) => { value: string } | undefined },
  checkRevoked: boolean = false,
): Promise<DecodedIdToken> {
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!sessionCookie?.value) {
    throw new Error("Unauthorized: No session");
  }

  const result = await verifySessionCookie(sessionCookie.value, checkRevoked);

  if (!result.success || !result.user) {
    throw new Error("Unauthorized: Invalid session");
  }

  return result.user;
}

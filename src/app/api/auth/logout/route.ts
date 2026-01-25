import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  verifySessionCookie,
  revokeRefreshTokens,
} from "@/lib/auth-session";
import { logAuthEvent, AUTH_EVENTS } from "@/lib/auth-config";

/**
 * POST /api/auth/logout
 *
 * Destroys the user's session by clearing the session cookie.
 * Optionally revokes all refresh tokens (forces logout on all devices).
 *
 * REQUEST:
 * - Body (optional): { revokeAll?: boolean }
 *   - revokeAll: If true, revokes all refresh tokens for the user
 *
 * RESPONSE:
 * - 200: { success: true }
 * - 500: { success: false, error: string }
 *
 * SECURITY:
 * - Cookie cleared regardless of verification outcome
 * - Token revocation is optional (for "sign out everywhere" feature)
 */
export async function POST(request: NextRequest) {
  try {
    // Get the current session cookie
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    // Parse request body for optional revokeAll flag
    let revokeAll = false;
    try {
      const body = await request.json();
      revokeAll = body.revokeAll === true;
    } catch {
      // Empty body or invalid JSON is fine - just proceed with default
    }

    // If we have a session and revokeAll is requested, revoke tokens
    if (sessionCookie && revokeAll) {
      try {
        const result = await verifySessionCookie(sessionCookie, false);
        if (result.success && result.user) {
          await revokeRefreshTokens(result.user.uid);
          logAuthEvent(
            AUTH_EVENTS.LOGOUT,
            "Session destroyed with token revocation",
            {
              uid: result.user.uid,
            },
          );
        }
      } catch {
        // Continue with logout even if revocation fails
        logAuthEvent(
          AUTH_EVENTS.LOGOUT,
          "Token revocation failed, continuing with logout",
        );
      }
    } else {
      logAuthEvent(AUTH_EVENTS.LOGOUT, "Session destroyed");
    }

    // Build response that clears the session cookie
    const response = NextResponse.json({ success: true });

    // Clear the session cookie by setting it to empty with immediate expiry
    response.cookies.set(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0, // Immediate expiry
    });

    return response;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logAuthEvent(AUTH_EVENTS.LOGOUT, "Logout failed", { error: errorMessage });

    // Still try to clear the cookie even on error
    const response = NextResponse.json(
      { success: false, error: "Logout failed" },
      { status: 500 },
    );

    response.cookies.set(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  }
}

/**
 * OPTIONS handler for CORS preflight (if needed)
 */
export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

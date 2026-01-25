import { NextRequest, NextResponse } from "next/server";
import { createSessionCookie, SESSION_COOKIE_NAME } from "@/lib/auth-session";
import { getCookieOptions, logAuthEvent, AUTH_EVENTS } from "@/lib/auth-config";

/**
 * POST /api/auth/login
 *
 * Creates a server-side session from a Firebase ID token.
 *
 * REQUEST:
 * - Body: { idToken: string }
 *
 * RESPONSE:
 * - 200: { success: true, uid: string }
 * - 400: { success: false, error: string } - Invalid request
 * - 401: { success: false, error: string } - Authentication failed
 *
 * SECURITY:
 * - ID token verified by Firebase Admin SDK
 * - Session cookie is HTTPOnly (not accessible to JS)
 * - Token must be fresh (< 5 minutes old) to prevent replay attacks
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { idToken } = body;

    // Validate input
    if (!idToken || typeof idToken !== "string") {
      logAuthEvent(
        AUTH_EVENTS.LOGIN_FAILURE,
        "Missing or invalid idToken in request",
      );
      return NextResponse.json(
        { success: false, error: "Missing authentication token" },
        { status: 400 },
      );
    }

    // Create session cookie
    const result = await createSessionCookie(idToken);

    if (!result.success || !result.cookie) {
      return NextResponse.json(
        { success: false, error: result.error || "Authentication failed" },
        { status: 401 },
      );
    }

    // Build response with session cookie
    const response = NextResponse.json({
      success: true,
      uid: result.uid,
    });

    // Set the session cookie
    const cookieOptions = getCookieOptions();
    response.cookies.set(SESSION_COOKIE_NAME, result.cookie, cookieOptions);

    return response;
  } catch (error) {
    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      logAuthEvent(AUTH_EVENTS.LOGIN_FAILURE, "Invalid JSON in request body");
      return NextResponse.json(
        { success: false, error: "Invalid request format" },
        { status: 400 },
      );
    }

    // Generic error handling
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logAuthEvent(AUTH_EVENTS.LOGIN_FAILURE, "Unexpected error during login", {
      error: errorMessage,
    });

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * OPTIONS handler for CORS preflight (if needed)
 */
export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

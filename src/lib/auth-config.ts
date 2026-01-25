/**
 * Authentication Configuration
 * Single source of truth for all auth-related constants.
 *
 * WHY __session?
 * - Firebase Hosting convention for session cookies
 * - Next.js compatible (no conflicts with framework cookies)
 * - Consistent with Firebase documentation patterns
 */

/**
 * Session cookie name - used across middleware, API routes, and verification
 */
export const SESSION_COOKIE_NAME = "__session";

/**
 * Session duration: 5 days in milliseconds
 * Trade-off: Long enough for UX, short enough for security
 */
export const SESSION_EXPIRY_MS = 5 * 24 * 60 * 60 * 1000;

/**
 * Cookie options factory - environment-aware security settings
 * @returns Cookie options compatible with Next.js Response cookies
 */
export const getCookieOptions = () =>
  ({
    httpOnly: true, // Prevent XSS access
    secure: process.env.NODE_ENV === "production", // HTTPS in prod, allow localhost in dev
    sameSite: "lax" as const, // CSRF protection while allowing navigation
    path: "/", // Available site-wide
    maxAge: SESSION_EXPIRY_MS / 1000, // Convert to seconds
  }) as const;

/**
 * Protected route patterns for middleware
 * Add new protected paths here
 */
export const PROTECTED_ROUTES = [
  "/profile",
  "/settings",
  "/onboarding",
  "/app/dashboard",
  "/app",
];

/**
 * Auth event types for structured logging
 */
export const AUTH_EVENTS = {
  LOGIN_ATTEMPT: "LOGIN_ATTEMPT",
  LOGIN_SUCCESS: "LOGIN_SUCCESS",
  LOGIN_FAILURE: "LOGIN_FAILURE",
  VERIFY_SUCCESS: "VERIFY_SUCCESS",
  VERIFY_FAILURE: "VERIFY_FAILURE",
  LOGOUT: "LOGOUT",
  REVOKE: "REVOKE",
} as const;

export type AuthEvent = (typeof AUTH_EVENTS)[keyof typeof AUTH_EVENTS];

/**
 * Structured auth logger
 * Outputs: [Auth:<Event>] <message> { context }
 * Destination: console (surfaces in Vercel/GCP logs in production)
 */
export function logAuthEvent(
  event: AuthEvent,
  message: string,
  context?: Record<string, unknown>,
): void {
  const logData = {
    timestamp: new Date().toISOString(),
    event,
    message,
    ...context,
  };

  // In production, this surfaces in Vercel Functions logs / GCP Cloud Logging
  console.log(`[Auth:${event}] ${message}`, JSON.stringify(logData));
}

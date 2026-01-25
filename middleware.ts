import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, PROTECTED_ROUTES } from "@/lib/auth-config";

/**
 * Next.js Middleware - Route-Level Gatekeeper
 *
 * AUTH INVARIANTS ENFORCED:
 * 1. Middleware is the ONLY route gatekeeper (client redirects are UX only)
 * 2. No cryptographic verification here (performance, Edge runtime compatibility)
 * 3. Fail closed - missing cookie = redirect to signin
 *
 * WHAT THIS DOES:
 * - Checks if session cookie EXISTS (not verified - that happens in Server Components)
 * - Redirects unauthenticated requests to /auth/signin with redirect param
 *
 * WHAT THIS DOES NOT DO:
 * - Verify session cookie validity (expensive, requires Firebase Admin)
 * - Make authorization decisions (that's for Server Components/API routes)
 *
 * @see lib/auth-session.ts for session verification
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if this is a protected route
  const isProtectedRoute = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (!isProtectedRoute) {
    // Not a protected route - allow through
    return NextResponse.next();
  }

  // Check for session cookie existence (not validity - that's verified server-side)
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);

  if (!sessionCookie?.value) {
    // No session cookie - redirect to signin
    const signinUrl = new URL("/auth/signin", request.url);

    // Add redirect parameter so user returns to original page after signin
    signinUrl.searchParams.set("redirect", pathname);

    // Log for debugging (visible in Vercel Functions logs)
    console.log(
      `[Middleware] Unauthenticated access to ${pathname} - redirecting to signin`,
    );

    return NextResponse.redirect(signinUrl);
  }

  // Session cookie exists - allow through (verification happens in Server Components)
  return NextResponse.next();
}

/**
 * Matcher config - runs middleware only on specified routes
 * This is more efficient than checking every request
 */
export const config = {
  matcher: [
    /*
     * Match all protected routes:
     * - /profile and /profile/*
     * - /settings and /settings/*
     * - /onboarding and /onboarding/*
     * - /dashboard and /dashboard/*
     *
     * Excludes:
     * - API routes (handled separately)
     * - Static files (_next/static, favicon.ico, etc.)
     * - Public routes (/, /auth/*, /docs/*, etc.)
     */
    "/profile/:path*",
    "/settings/:path*",
    "/onboarding/:path*",
    "/app/:path*",
  ],
};

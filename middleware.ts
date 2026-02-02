import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth-config";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. PERFORMANCE: Skip middleware for internal Next.js requests if matcher leaks
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") // Optimization: Skip files with extensions (images, css, etc.)
  ) {
    return NextResponse.next();
  }

  // 2. AUTH CHECK: Fast "Fail Closed" Check
  // We only check for existence here. Cryptographic verification happens in Server Components.
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
  const isAuthenticated = !!sessionCookie?.value;

  if (!isAuthenticated) {
    // Construct the login URL with the redirect params
    const signinUrl = new URL("/auth/signin", request.url);
    signinUrl.searchParams.set("redirect", pathname);

    return NextResponse.redirect(signinUrl);
  }

  // 3. SECURITY HEADERS: Inject basic security headers for all protected routes
  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
}

/**
 * OPTIMIZED MATCHER CONFIG
 * The middleware will ONLY execute on these specific paths.
 * This removes the need for manual array filtering inside the function.
 */
export const config = {
  matcher: [
    /*
     * PROTECTED ROUTES ONLY:
     * Add any new private routes here.
     */
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/placeholder/:path*",
  ],
};

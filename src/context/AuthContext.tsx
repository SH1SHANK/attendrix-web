"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { useRouter, usePathname } from "next/navigation";
import { checkOnboardingStatus } from "@/lib/auth-utils";
import { EVENTS, trackEvent } from "@/lib/analytics";
import {
  AuthStateData,
  createIdleState,
  createAuthenticatingState,
  createAuthenticatedState,
  createRedirectingState,
  createErrorState,
} from "@/types/auth-state";

/**
 * Authentication Context
 *
 * CLIENT-SIDE ORCHESTRATION ONLY
 *
 * AUTH INVARIANTS:
 * - Client auth never implies server authorization
 * - Redirects only happen AFTER server confirms session creation
 * - Server is the single source of truth
 * - CRITICAL: Never block rendering - always show children
 *
 * FLOW:
 * 1. User signs in with Firebase (Google/Email)
 * 2. Client gets ID token from Firebase
 * 3. Client POSTs token to /api/auth/login
 * 4. Server verifies + creates session cookie
 * 5. NOW client can redirect
 */

// Timeout for authentication flow (30 seconds)
const AUTH_TIMEOUT_MS = 30000;

interface AuthContextType {
  user: User | null;
  loading: boolean;
  authState: AuthStateData;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetAuthState: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  authState: createIdleState(),
  signInWithGoogle: async () => {},
  logout: async () => {},
  resetAuthState: () => {},
});

export const useAuth = () => useContext(AuthContext);

/**
 * Creates a server session by POSTing the ID token to /api/auth/login
 * Returns true if successful, throws on failure
 */
async function createServerSession(idToken: string): Promise<boolean> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Failed to create session");
  }

  return true;
}

/**
 * Destroys the server session by POSTing to /api/auth/logout
 */
async function destroyServerSession(revokeAll: boolean = false): Promise<void> {
  await fetch("/api/auth/logout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ revokeAll }),
  });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authState, setAuthState] = useState<AuthStateData>(createIdleState());
  const router = useRouter();
  const pathname = usePathname();

  // Use refs to track if redirect is in progress to prevent loops
  const isRedirecting = useRef(false);
  const lastPathname = useRef(pathname);
  const authTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const guardInFlight = useRef(false);

  // Reset auth state to idle
  const resetAuthState = useCallback(() => {
    setAuthState(createIdleState());
    if (authTimeoutRef.current) {
      clearTimeout(authTimeoutRef.current);
      authTimeoutRef.current = null;
    }
  }, []);

  // Start auth timeout
  const startAuthTimeout = useCallback(() => {
    if (authTimeoutRef.current) {
      clearTimeout(authTimeoutRef.current);
    }
    authTimeoutRef.current = setTimeout(() => {
      setAuthState(
        createErrorState("Authentication timed out. Please try again."),
      );
      // Auto-reset to idle after showing error
      setTimeout(() => setAuthState(createIdleState()), 3000);
    }, AUTH_TIMEOUT_MS);
  }, []);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current);
      }
    };
  }, []);

  // Memoized redirect logic to prevent re-renders from triggering multiple redirects
  const handleAuthRedirects = useCallback(
    async (currentUser: User | null) => {
      // Skip if already redirecting or path hasn't settled
      if (isRedirecting.current) return;

      if (!currentUser) return;

      const isPublicPage =
        pathname === "/" ||
        pathname.startsWith("/legal") ||
        pathname.startsWith("/api") ||
        pathname.startsWith("/download");

      if (isPublicPage) return;
    },
    [pathname],
  );

  useEffect(() => {
    // Reset redirect flag when pathname changes
    if (lastPathname.current !== pathname) {
      isRedirecting.current = false;
      lastPathname.current = pathname;
    }
  }, [pathname]);

  useEffect(() => {
    if (!user || loading || guardInFlight.current) return;

    const isPublicPage =
      pathname === "/" ||
      pathname.startsWith("/legal") ||
      pathname.startsWith("/api") ||
      pathname.startsWith("/download");

    if (isPublicPage) return;

    const isOnboardingPage = pathname.startsWith("/onboarding");
    const isAuthPage = pathname.startsWith("/auth");

    const currentPath =
      typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}`
        : pathname;

    guardInFlight.current = true;

    const runGuard = async () => {
      try {
        const isOnboarded = await checkOnboardingStatus(user.uid);

        if (!isOnboarded) {
          if (!isOnboardingPage) {
            const nextParam = encodeURIComponent(
              isAuthPage ? "/dashboard" : currentPath,
            );
            isRedirecting.current = true;
            router.push(`/onboarding?next=${nextParam}`);
          }
          return;
        }

        if (isOnboarded && isOnboardingPage) {
          const params = new URLSearchParams(
            typeof window !== "undefined" ? window.location.search : "",
          );
          const next = params.get("next");
          const safeNext =
            next && next.startsWith("/") && !next.startsWith("/onboarding")
              ? next
              : "/dashboard";
          isRedirecting.current = true;
          router.push(safeNext);
          return;
        }

        if (isOnboarded && isAuthPage) {
          isRedirecting.current = true;
          router.push("/dashboard");
        }
      } catch (error) {
        console.error("Error checking onboarding status:", error);
      } finally {
        guardInFlight.current = false;
      }
    };

    runGuard();
  }, [user, loading, pathname, router]);

  // Reset auth state when navigation completes after successful auth
  useEffect(() => {
    if (authState.status === "redirecting" && !isRedirecting.current) {
      // Use setTimeout to defer the state update and avoid sync setState in effect
      const timer = setTimeout(() => {
        setAuthState(createIdleState());
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [authState.status]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      // Handle redirects after state is set
      await handleAuthRedirects(currentUser);
    });

    return () => unsubscribe();
  }, [handleAuthRedirects]);

  /**
   * Sign in with Google
   * Manages state transitions: idle -> authenticating -> authenticated -> redirecting
   */
  const signInWithGoogle = useCallback(async () => {
    try {
      // Start with authenticating state
      setAuthState(createAuthenticatingState("Connecting to Google..."));
      startAuthTimeout();

      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;

      // Update to authenticated (verifying session)
      setAuthState(createAuthenticatedState());

      const idToken = await firebaseUser.getIdToken();
      await createServerSession(idToken);

      const isOnboarded = await checkOnboardingStatus(firebaseUser.uid);

      trackEvent(EVENTS.AUTH_SIGNIN, { method: "google", isOnboarded });

      // Clear timeout and set redirecting
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current);
        authTimeoutRef.current = null;
      }
      setAuthState(createRedirectingState());

      isRedirecting.current = true;
      if (isOnboarded) {
        router.push("/dashboard");
      } else {
        router.push("/onboarding");
      }
    } catch (error: unknown) {
      // Clear timeout
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current);
        authTimeoutRef.current = null;
      }

      // Handle popup closed by user (not a real error)
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code: string }).code === "auth/popup-closed-by-user"
      ) {
        // User cancelled - just reset to idle, no error message
        setAuthState(createIdleState());
        return;
      }

      // Handle other errors
      console.error("Google Sign In Error:", error);
      let errorMessage = "Sign in failed. Please try again.";
      if (typeof error === "object" && error !== null && "code" in error) {
        const code = (error as { code: string }).code;
        if (code === "auth/network-request-failed") {
          errorMessage = "Network error. Please check your connection.";
        } else if (code === "auth/too-many-requests") {
          errorMessage = "Too many attempts. Please try again later.";
        }
      }

      setAuthState(createErrorState(errorMessage));
      // Auto-reset to idle after showing error
      setTimeout(() => setAuthState(createIdleState()), 3000);
      throw error;
    }
  }, [router, startAuthTimeout]);

  /**
   * Sign out
   */
  const logout = useCallback(async () => {
    try {
      await destroyServerSession();
      await signOut(auth);
      isRedirecting.current = true;
      router.push("/auth/signin");
    } catch (error) {
      console.error("Logout Error:", error);
      await signOut(auth);
      router.push("/auth/signin");
    }
  }, [router]);

  // CRITICAL FIX: Always render children, never block on loading
  // Components can use `loading` state to show appropriate UX
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authState,
        signInWithGoogle,
        logout,
        resetAuthState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

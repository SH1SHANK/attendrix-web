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

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  logout: async () => {},
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
  const router = useRouter();
  const pathname = usePathname();

  // Use refs to track if redirect is in progress to prevent loops
  const isRedirecting = useRef(false);
  const lastPathname = useRef(pathname);

  // Memoized redirect logic to prevent re-renders from triggering multiple redirects
  const handleAuthRedirects = useCallback(
    async (currentUser: User | null) => {
      // Skip if already redirecting or path hasn't settled
      if (isRedirecting.current) return;

      if (currentUser) {
        // Only redirect if NOT on public pages
        const isPublicPage =
          pathname === "/" ||
          pathname.startsWith("/legal") ||
          pathname.startsWith("/api") ||
          pathname.startsWith("/download");

        if (!isPublicPage) {
          try {
            const isOnboarded = await checkOnboardingStatus(currentUser.uid);

            // Smart Redirects - only if needed
            if (isOnboarded) {
              if (pathname === "/onboarding" || pathname.startsWith("/auth")) {
                isRedirecting.current = true;
                router.push("/placeholder");
              }
            } else {
              if (pathname.startsWith("/placeholder")) {
                isRedirecting.current = true;
                router.push("/onboarding");
              }
            }
          } catch (error) {
            console.error("Error checking onboarding status:", error);
          }
        }
      }
    },
    [pathname, router],
  );

  useEffect(() => {
    // Reset redirect flag when pathname changes
    if (lastPathname.current !== pathname) {
      isRedirecting.current = false;
      lastPathname.current = pathname;
    }
  }, [pathname]);

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
   */
  const signInWithGoogle = useCallback(async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      const idToken = await firebaseUser.getIdToken();

      await createServerSession(idToken);

      const isOnboarded = await checkOnboardingStatus(firebaseUser.uid);

      trackEvent(EVENTS.AUTH_SIGNIN, { method: "google", isOnboarded });

      isRedirecting.current = true;
      if (isOnboarded) {
        router.push("/placeholder");
      } else {
        router.push("/onboarding");
      }
    } catch (error) {
      console.error("Google Sign In Error:", error);
      throw error;
    }
  }, [router]);

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
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

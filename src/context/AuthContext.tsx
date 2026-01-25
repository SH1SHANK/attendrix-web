"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        // Check status on load
        // Only redirect if NOT on public pages like landing (/) or docs (/docs)
        // We enforce logic primarily on /auth/*, /onboarding, /dashboard
        const isPublicPage =
          pathname === "/" ||
          pathname.startsWith("/docs") ||
          pathname.startsWith("/legal") ||
          pathname.startsWith("/api");

        if (!isPublicPage) {
          const isOnboarded = await checkOnboardingStatus(currentUser.uid);

          // Smart Redirects
          if (isOnboarded) {
            // If user IS onboarded but stuck on onboarding or auth pages, send to dashboard
            if (pathname === "/onboarding" || pathname.startsWith("/auth")) {
              router.push("/profile");
            }
          } else {
            // If user is NOT onboarded but trying to access protected pages, send to onboarding
            if (
              pathname.startsWith("/app/dashboard") ||
              pathname.startsWith("/profile")
            ) {
              router.push("/onboarding");
            }
          }
        }
      }

      setLoading(false);
    });
    return () => unsubscribe();
  }, [router, pathname]);

  /**
   * Sign in with Google
   *
   * FLOW:
   * 1. Firebase popup authentication
   * 2. Get ID token
   * 3. POST to /api/auth/login to create session cookie
   * 4. Check onboarding status
   * 5. Redirect based on status
   */
  const signInWithGoogle = async () => {
    try {
      // Step 1: Firebase authentication
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;

      // Step 2: Get ID token
      const idToken = await firebaseUser.getIdToken();

      // Step 3: Create server session (THIS IS CRITICAL)
      await createServerSession(idToken);

      // Step 4: Check onboarding status
      const isOnboarded = await checkOnboardingStatus(firebaseUser.uid);

      // Analytics
      trackEvent(EVENTS.AUTH_SIGNIN, { method: "google", isOnboarded });

      // Step 5: Redirect AFTER server confirms session
      if (isOnboarded) {
        router.push("/profile");
      } else {
        router.push("/onboarding");
      }
    } catch (error) {
      console.error("Google Sign In Error:", error);
      throw error;
    }
  };

  /**
   * Sign out
   *
   * FLOW:
   * 1. POST to /api/auth/logout to clear session cookie
   * 2. Sign out from Firebase client
   * 3. Redirect to signin page
   */
  const logout = async () => {
    try {
      // Step 1: Destroy server session first
      await destroyServerSession();

      // Step 2: Sign out from Firebase client
      await signOut(auth);

      // Step 3: Redirect
      router.push("/auth/signin");
    } catch (error) {
      console.error("Logout Error:", error);
      // Even if server logout fails, sign out locally
      await signOut(auth);
      router.push("/auth/signin");
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

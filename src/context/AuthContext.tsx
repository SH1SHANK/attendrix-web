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
              router.push("/dashboard");
            }
          } else {
            // If user is NOT onboarded but trying to access dashboard, send to onboarding
            if (pathname.startsWith("/dashboard")) {
              router.push("/onboarding");
            }
          }
        }
      }

      setLoading(false);
    });
    return () => unsubscribe();
  }, [router, pathname]);

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Bypass Check
      const isOnboarded = await checkOnboardingStatus(user.uid);

      // Analytics
      trackEvent(EVENTS.AUTH_SIGNIN, { method: "google", isOnboarded });

      if (isOnboarded) {
        router.push("/dashboard");
      } else {
        router.push("/onboarding");
      }
    } catch (error) {
      console.error("Google Sign In Error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      router.push("/auth/signin");
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

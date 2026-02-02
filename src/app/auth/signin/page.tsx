"use client";

import React, { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { Github, Eye, EyeOff, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import AuthLoadingScreen from "@/components/auth/AuthLoadingScreen";
import {
  AuthStateData,
  createIdleState,
  createAuthenticatingState,
  createAuthenticatedState,
  createRedirectingState,
  createErrorState,
  isLoadingState,
} from "@/types/auth-state";

export default function SignInPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Local auth state for email/password flow
  const [localAuthState, setLocalAuthState] =
    useState<AuthStateData>(createIdleState());

  // Prevent double submissions
  const isSubmittingRef = useRef(false);

  const { signInWithGoogle, authState: googleAuthState } = useAuth();
  const router = useRouter();

  // Combine local and Google auth states - show loading if either is active
  const isLoading =
    isLoadingState(localAuthState) || isLoadingState(googleAuthState);
  const activeState = isLoadingState(localAuthState)
    ? localAuthState
    : googleAuthState || createIdleState();

  const handleEmailSignIn = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Prevent double submissions
      if (isSubmittingRef.current || isLoading) return;

      if (!email || !password) {
        toast.error("Please fill in all fields");
        return;
      }

      isSubmittingRef.current = true;

      try {
        // Step 1: Start authentication
        setLocalAuthState(createAuthenticatingState());

        // Step 2: Firebase authentication
        const result = await signInWithEmailAndPassword(auth, email, password);

        // Step 3: Get ID token and update state
        setLocalAuthState(createAuthenticatedState());
        const idToken = await result.user.getIdToken();

        // Step 4: Create server session
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        });

        if (!response.ok) {
          throw new Error("Failed to create session");
        }

        // Step 5: Check onboarding and redirect
        const { checkOnboardingStatus } = await import("@/lib/auth-utils");
        const isOnboarded = await checkOnboardingStatus(result.user.uid);

        setLocalAuthState(createRedirectingState());
        toast.success("Welcome back!");

        if (isOnboarded) {
          router.push("/profile");
        } else {
          router.push("/onboarding");
        }
      } catch (error: unknown) {
        console.error(error);
        let msg = "Failed to sign in";
        if (typeof error === "object" && error !== null && "code" in error) {
          const err = error as { code: string };
          if (err.code === "auth/invalid-credential") {
            msg = "Invalid email or password";
          } else if (err.code === "auth/network-request-failed") {
            msg = "Network error. Please check your connection.";
          } else if (err.code === "auth/too-many-requests") {
            msg = "Too many attempts. Please try again later.";
          }
        }
        toast.error(msg);
        setLocalAuthState(createErrorState(msg));
        // Auto-reset to idle after showing error
        setTimeout(() => setLocalAuthState(createIdleState()), 2000);
      } finally {
        isSubmittingRef.current = false;
      }
    },
    [email, password, router, isLoading],
  );

  const handleGoogleSignIn = useCallback(async () => {
    // Prevent if already loading
    if (isLoading) return;

    try {
      await signInWithGoogle();
      // State managed by AuthContext, redirect handled there
    } catch {
      // Error already handled in AuthContext
      // Just show toast for user feedback
      toast.error("Google Sign In failed");
    }
  }, [signInWithGoogle, isLoading]);

  return (
    <>
      {/* Loading Screen - shown during authentication */}
      <AuthLoadingScreen
        status={activeState.status}
        message={activeState.message}
        isVisible={isLoading}
      />

      {/* Form - hidden during authentication */}
      <AnimatePresence mode="wait">
        {!isLoading && (
          <motion.div
            key="auth-form"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_#000] overflow-hidden"
          >
            {/* Header */}
            <div className="bg-[#FFD02F] border-b-2 border-black p-6 md:p-8 text-center pt-8 md:pt-10">
              <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-black mb-1">
                Sign In
              </h1>
              <p className="text-neutral-900 font-bold text-base md:text-lg leading-tight">
                Welcome back! Enter your details...
              </p>
            </div>

            {/* Form Body */}
            <form className="p-6 md:p-8 space-y-6" onSubmit={handleEmailSignIn}>
              {/* Email Input */}
              <div className="space-y-2">
                <label className="block text-sm font-black uppercase tracking-wide">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@nitc.ac.in"
                  className="w-full h-12 border-2 border-black p-3 font-bold text-base outline-none placeholder:text-neutral-400 focus:shadow-[4px_4px_0px_0px_#000] focus:bg-yellow-50 transition-all"
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-black uppercase tracking-wide">
                    Password
                  </label>
                  <a
                    href="#"
                    className="text-xs font-bold text-neutral-500 hover:text-black underline"
                  >
                    Forgot?
                  </a>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-12 border-2 border-black p-3 font-bold text-base outline-none placeholder:text-neutral-400 focus:shadow-[4px_4px_0px_0px_#000] focus:bg-yellow-50 transition-all pr-12"
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-black"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Primary Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-black text-white font-black uppercase tracking-wide shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] active:translate-y-1 active:shadow-none transition-all hover:bg-neutral-900 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Sign In"
                )}
              </button>

              {/* Divider */}
              <div className="relative flex py-2 items-center">
                <div className="grow border-t-2 border-neutral-200"></div>
                <span className="shrink-0 mx-4 text-xs font-black text-neutral-400 uppercase tracking-widest">
                  Or continue with
                </span>
                <div className="grow border-t-2 border-neutral-200"></div>
              </div>

              {/* Social Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  disabled
                  className="h-12 w-full flex items-center justify-center gap-2 border-2 border-black bg-white text-black font-bold uppercase text-sm tracking-wide shadow-[4px_4px_0px_0px_#000] hover:bg-neutral-50 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#000] transition-all opacity-50 cursor-not-allowed"
                  title="Coming Soon"
                >
                  <Github className="w-5 h-5" />
                  <span className="hidden sm:inline">GitHub</span>
                </button>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="h-12 w-full flex items-center justify-center gap-2 border-2 border-black bg-white text-black font-bold uppercase text-sm tracking-wide shadow-[4px_4px_0px_0px_#000] hover:bg-neutral-50 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#000] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                  </svg>
                  <span className="hidden sm:inline">Google</span>
                </button>
              </div>
            </form>

            {/* Footer Link */}
            <div className="bg-neutral-100 border-t-2 border-black p-4 text-center">
              <p className="font-bold text-xs md:text-sm text-neutral-600">
                Don&apos;t have an account?{" "}
                <Link
                  href="/auth/signup"
                  className="text-black uppercase underline decoration-2 underline-offset-2 hover:bg-[#FFD02F] transition-colors"
                >
                  Create Account
                </Link>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Copyright */}
      <div className="text-center mt-6 text-[10px] uppercase font-bold text-neutral-400 tracking-widest">
        © {new Date().getFullYear()} Attendrix. Secure.
      </div>
    </>
  );
}

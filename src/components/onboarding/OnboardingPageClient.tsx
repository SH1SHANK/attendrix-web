"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { OnboardingProvider, useOnboarding } from "@/context/OnboardingContext";
import { useUserOnboardingProfile } from "@/hooks/useOnboardingData";
import OnboardingLoadingScreen from "@/components/onboarding/OnboardingLoadingScreen";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";

function sanitizeNextPath(nextPath: string | null): string {
  if (!nextPath) return "/dashboard";
  if (!nextPath.startsWith("/")) return "/dashboard";
  if (nextPath.startsWith("/onboarding")) return "/dashboard";
  if (nextPath.startsWith("/auth")) return "/dashboard";
  return nextPath;
}

function OnboardingBootstrap() {
  const params = useSearchParams();
  const nextPath = sanitizeNextPath(params.get("next"));
  const { user } = useAuth();
  const { data: profile, isLoading } = useUserOnboardingProfile(
    user?.uid ?? null,
  );
  const { dispatch } = useOnboarding();

  useEffect(() => {
    if (!profile) return;
    if (profile.username) {
      dispatch({ type: "SET_USERNAME", value: profile.username });
    }
    if (profile.batchID) {
      dispatch({
        type: "SET_BATCH",
        batchID: profile.batchID,
        semesterID: profile.semesterID ? String(profile.semesterID) : null,
      });
    }
    if (typeof profile.consentTerms === "boolean") {
      dispatch({ type: "SET_CONSENT_TERMS", value: profile.consentTerms });
    }
    if (typeof profile.consentPromotions === "boolean") {
      dispatch({
        type: "SET_CONSENT_PROMOS",
        value: profile.consentPromotions,
      });
    }
  }, [profile, dispatch]);

  if (isLoading) {
    return <OnboardingLoadingScreen />;
  }

  return <OnboardingWizard nextPath={nextPath} />;
}

export default function OnboardingPageClient() {
  return (
    <ProtectedRoute>
      <OnboardingProvider>
        <OnboardingBootstrap />
      </OnboardingProvider>
    </ProtectedRoute>
  );
}

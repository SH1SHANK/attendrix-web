import { Suspense } from "react";
import OnboardingPageClient from "@/components/onboarding/OnboardingPageClient";
import OnboardingLoadingScreen from "@/components/onboarding/OnboardingLoadingScreen";

export default function OnboardingPage() {
  return (
    <Suspense fallback={<OnboardingLoadingScreen />}>
      <OnboardingPageClient />
    </Suspense>
  );
}

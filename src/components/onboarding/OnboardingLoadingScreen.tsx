"use client";

import { Loader2 } from "lucide-react";

export default function OnboardingLoadingScreen() {
  return (
    <div className="min-h-screen bg-paper flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 border-2 border-black bg-white shadow-neo-lg px-8 py-10">
        <div className="w-16 h-16 bg-main border-2 border-black flex items-center justify-center animate-spin">
          <Loader2 className="w-8 h-8 text-black" />
        </div>
        <p className="font-black uppercase tracking-widest text-neutral-600 text-sm">
          Loading Onboarding
        </p>
      </div>
    </div>
  );
}

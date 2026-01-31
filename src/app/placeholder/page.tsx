"use client";

import { useAuth } from "@/context/AuthContext";
import { Loader2, LogOut, Sparkles, ShieldCheck } from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function PlaceholderPage() {
  return (
    <ProtectedRoute>
      <PlaceholderContent />
    </ProtectedRoute>
  );
}

function PlaceholderContent() {
  const { logout, loading } = useAuth();

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center relative font-sans">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(#00000026_1px,transparent_1px)] bg-size-[20px_20px] pointer-events-none opacity-50" />

      {/* Content Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_#000] p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-[#FFD02F] border-2 border-black flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-black text-2xl uppercase tracking-tight">
                You&apos;re All Set!
              </h1>
              <p className="text-sm font-bold text-neutral-500">
                Onboarding Complete
              </p>
            </div>
          </div>

          {/* Message */}
          <div className="bg-neutral-100 border-2 border-dashed border-neutral-300 p-6 mb-6">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-neutral-600 mt-0.5 shrink-0" />
              <div className="space-y-2">
                <p className="font-bold text-neutral-800">
                  Dashboard Coming Soon
                </p>
                <p className="text-sm text-neutral-600">
                  We&apos;re building something great. Your account is ready and
                  waiting. Check back soon for the full experience.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              onClick={logout}
              disabled={loading}
              className="w-full bg-white text-black border-2 border-black px-6 py-3 font-black uppercase tracking-wide flex items-center justify-center gap-2 hover:bg-neutral-100 active:translate-y-1 transition-all disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <LogOut className="w-4 h-4" />
                  Log Out
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs font-bold text-neutral-400 uppercase tracking-widest mt-6">
          © {new Date().getFullYear()} Attendrix
        </p>
      </div>
    </div>
  );
}

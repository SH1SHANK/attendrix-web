"use client";

import React, { useState, useEffect, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { ShieldCheck, X, Cookie } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Switch } from "@/components/ui/Switch";
import Link from "next/link";
import { trackEvent } from "@/lib/analytics";

// Hydration-safe hook using useSyncExternalStore
function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

// Safe localStorage reader
function getStoredConsent() {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem("attendrix-cookie-consent");
  return stored ? JSON.parse(stored) : null;
}

export default function CookieConsent() {
  const pathname = usePathname();
  const isHydrated = useHydrated();
  const storedConsent = isHydrated ? getStoredConsent() : null;

  const [isOpen, setIsOpen] = useState(false);
  const [, setHasConsented] = useState(() => !!storedConsent);

  // Granular Preferences State - initialize from stored or defaults
  const [preferences, setPreferences] = useState(() => ({
    essential: true,
    analytics: storedConsent?.analytics ?? true,
    functional: storedConsent?.functional ?? true,
    advertising: storedConsent?.advertising ?? false,
  }));

  // Delay modal appearance to avoid overlap with preloader
  useEffect(() => {
    const timer = setTimeout(() => {
      const saved = getStoredConsent();
      if (!saved) {
        setIsOpen(true);
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  // Hide on dashboard, classes, and profile pages
  const shouldHide =
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/classes") ||
    pathname?.startsWith("/profile");

  if (shouldHide) return null;

  const handleSave = () => {
    const dataToSave = {
      ...preferences,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(
      "attendrix-cookie-consent",
      JSON.stringify(dataToSave),
    );
    trackEvent("cookie_consent_custom", {
      analytics: preferences.analytics,
      advertising: preferences.advertising,
    });
    setHasConsented(true);
    setIsOpen(false);
  };

  const handleAcceptAll = () => {
    const allEnabled = {
      essential: true,
      analytics: true,
      functional: true,
      advertising: true,
      timestamp: new Date().toISOString(),
    };
    setPreferences({
      essential: true,
      analytics: true,
      functional: true,
      advertising: true,
    });
    localStorage.setItem(
      "attendrix-cookie-consent",
      JSON.stringify(allEnabled),
    );
    trackEvent("cookie_consent_full");
    setHasConsented(true);
    setIsOpen(false);
  };

  const togglePreference = (key: keyof typeof preferences) => {
    if (key === "essential") return; // Locked
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (!isHydrated) return null;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-4 right-4 z-50 w-full max-w-sm pointer-events-auto"
          >
            <div className="bg-white border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col max-h-[85vh]">
              {/* HEADER */}
              <div className="bg-[#FFD02F] border-b-2 border-black p-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-black stroke-[2.5px]" />
                  <h3 className="font-black uppercase text-xs tracking-wide text-black">
                    Privacy Matters
                  </h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-0.5 hover:bg-black hover:text-white transition-colors border-2 border-transparent hover:border-black rounded-none"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              {/* BODY (Scrollable) */}
              <div className="p-4 overflow-y-auto custom-scrollbar">
                {/* Intro */}
                <div className="mb-4">
                  <p className="text-xs font-medium text-neutral-600 mb-1.5 leading-relaxed">
                    We use cookies to secure your account and improve your
                    experience. You can choose which additional data we collect
                    below.
                  </p>
                  <Link
                    href="/legal/cookies"
                    className="text-xs font-bold uppercase underline hover:text-[#FFD02F] hover:bg-black transition-colors"
                  >
                    Read Full Policy
                  </Link>
                </div>

                {/* Granular Controls List */}
                <div className="space-y-3 border-t-2 border-dashed border-neutral-200 pt-3">
                  {/* 1. Essential */}
                  <div className="flex items-center justify-between group">
                    <div className="pr-3">
                      <p className="font-bold text-xs uppercase flex items-center gap-1.5">
                        Strictly Necessary
                        <span className="text-[9px] bg-black text-white px-1 py-0.5 rounded-sm">
                          REQ
                        </span>
                      </p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        Login, CSRF tokens.
                      </p>
                    </div>
                    <Switch
                      checked={true}
                      disabled
                      aria-readonly
                      className="data-[state=checked]:bg-neutral-300 opacity-50 cursor-not-allowed"
                    />
                  </div>

                  {/* 2. Performance & Analytics */}
                  <div className="flex items-center justify-between">
                    <div className="pr-3">
                      <p className="font-bold text-xs uppercase">Performance</p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        Helps us fix bugs and popular pages.
                      </p>
                    </div>
                    <Switch
                      checked={preferences.analytics}
                      onCheckedChange={() => togglePreference("analytics")}
                      className="data-[state=checked]:bg-[#FFD02F]! data-[state=checked]:border-black! [&_span]:data-[state=checked]:bg-black!"
                    />
                  </div>

                  {/* 3. Functional */}
                  <div className="flex items-center justify-between">
                    <div className="pr-3">
                      <p className="font-bold text-xs uppercase">Functional</p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        Remembers your settings.
                      </p>
                    </div>
                    <Switch
                      checked={preferences.functional}
                      onCheckedChange={() => togglePreference("functional")}
                      className="data-[state=checked]:bg-[#FFD02F]! data-[state=checked]:border-black! [&_span]:data-[state=checked]:bg-black!"
                    />
                  </div>

                  {/* 4. Advertising */}
                  <div className="flex items-center justify-between">
                    <div className="pr-3">
                      <p className="font-bold text-xs uppercase">Advertising</p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        For ads (if used).
                      </p>
                    </div>
                    <Switch
                      checked={preferences.advertising}
                      onCheckedChange={() => togglePreference("advertising")}
                      className="data-[state=checked]:bg-[#FFD02F]! data-[state=checked]:border-black! [&_span]:data-[state=checked]:bg-black!"
                    />
                  </div>
                </div>
              </div>

              {/* FOOTER - Actions */}
              <div className="p-3 bg-neutral-50 border-t-2 border-black flex flex-col sm:flex-row gap-2 shrink-0">
                <button
                  onClick={handleSave}
                  className="flex-1 py-2 bg-white text-black border-2 border-black font-black uppercase text-xs tracking-wide hover:bg-neutral-100 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="flex-1 py-2 bg-black text-[#FFD02F] border-2 border-black font-black uppercase text-xs tracking-wide shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] hover:translate-x-px hover:translate-y-px hover:shadow-none active:translate-y-0.5 active:shadow-none transition-all"
                >
                  Accept
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Trigger */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 w-12 h-12 bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000] flex items-center justify-center hover:bg-[#FFD02F] transition-all group active:translate-y-1 active:shadow-none"
          title="Privacy Preferences"
        >
          <Cookie className="w-5 h-5 text-black group-hover:rotate-12 transition-transform" />
        </motion.button>
      )}
    </>
  );
}

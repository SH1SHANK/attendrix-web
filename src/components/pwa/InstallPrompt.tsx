"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { cn } from "@/lib/utils";

const DISMISS_KEY = "attendrix.installPrompt.dismissed";

type InstallPromptProps = {
  variant?: "banner" | "card";
  className?: string;
};

export function InstallPrompt({ variant = "banner", className }: InstallPromptProps) {
  const { isInstallable, isInstalled, promptInstall } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(DISMISS_KEY);
    setDismissed(stored === "true");
  }, []);

  if (!isInstallable || isInstalled || dismissed) return null;

  const handleDismiss = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DISMISS_KEY, "true");
    }
    setDismissed(true);
  };

  return (
    <div
      role="region"
      aria-label="Install Attendrix Web"
      className={cn(
        "border-[3px] border-black shadow-[5px_5px_0px_0px_#000]",
        variant === "banner"
          ? "bg-[#FFD02F] px-4 py-4 sm:px-6"
          : "bg-white px-4 py-4",
        className,
      )}
    >
      <div
        className={cn(
          "flex flex-col gap-4",
          variant === "banner" ? "sm:flex-row sm:items-center" : "",
        )}
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center border-[3px] border-black bg-white shadow-[3px_3px_0px_0px_#000]">
            <Download className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-black uppercase text-black">
              Install Attendrix Web
            </p>
            <p className="text-xs font-bold uppercase text-neutral-700">
              Add Attendrix to your home screen for faster access.
            </p>
          </div>
        </div>

        <div
          className={cn(
            "flex flex-wrap gap-2",
            variant === "banner" ? "sm:ml-auto" : "",
          )}
        >
          <button
            type="button"
            onClick={() => void promptInstall()}
            aria-label="Install Attendrix Web"
            className="inline-flex items-center gap-2 border-[3px] border-black bg-black px-4 py-2 text-xs font-black uppercase text-white shadow-[4px_4px_0px_0px_#000] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_#000]"
          >
            Install
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Don't show install prompt again"
            className="inline-flex items-center gap-2 border-[3px] border-black bg-white px-4 py-2 text-xs font-black uppercase shadow-[4px_4px_0px_0px_#000] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_#000]"
          >
            Don&apos;t show again
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { RetroSwitch } from "@/components/ui/RetroSwitch";
import { Button } from "@/components/ui/Button";
import {
  Monitor,
  Sun,
  Moon,
  Cpu,
  Github,
  Trash,
  Cookie,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function SystemModule() {
  // Preferences State
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [reducedMotion, setReducedMotion] = useState(false);

  // Integrations State
  const [lumenContext, setLumenContext] = useState(true);

  // Handlers
  const handleResetCookies = () => {
    toast.info("COOKIES CLEARED. RELOADING PROTOCOLS...");
    // Simulate clear
    setTimeout(() => window.location.reload(), 1500);
  };

  const handleClearLumen = () => {
    if (confirm("Wipe all Lumen AI memory banks? This cannot be undone.")) {
      toast.success("LUMEN MEMORY PURGED");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* MODULE C: PREFERENCES */}
      <section className="border-2 border-black bg-white p-6 md:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-8">
        <h2 className="text-2xl font-black uppercase flex items-center gap-3">
          <span className="bg-black text-white px-3 py-1 text-lg">
            MODULE C
          </span>
          SYSTEM PREFS
        </h2>

        {/* Theme Selector */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-neutral-500">
            Interface Theme
          </h3>
          <div className="flex gap-4">
            {[
              { id: "light", icon: Sun, label: "LIGHT" },
              { id: "dark", icon: Moon, label: "DARK" },
              { id: "system", icon: Monitor, label: "AUTO" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id as "light" | "dark" | "system")}
                className={cn(
                  "flex-1 py-4 border-2 flex flex-col items-center justify-center gap-2 transition-all active:scale-95",
                  theme === t.id
                    ? "bg-yellow-400 border-black font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    : "bg-white border-neutral-300 text-neutral-500 hover:border-black hover:text-black",
                )}
              >
                <t.icon className="w-5 h-5" />
                <span className="text-xs font-bold tracking-wider">
                  {t.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {/* Reduced Motion */}
          <div className="flex items-center justify-between border-b-2 border-neutral-100 pb-4">
            <div className="space-y-1">
              <p className="font-bold uppercase text-sm">Reduced Motion</p>
              <p className="text-xs text-neutral-500 font-mono">
                Disable complex layout shifts
              </p>
            </div>
            <RetroSwitch
              checked={reducedMotion}
              onCheckedChange={setReducedMotion}
            />
          </div>

          {/* Privacy */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-bold uppercase text-sm flex items-center gap-2">
                <Cookie className="w-4 h-4" /> Privacy Protocols
              </p>
              <p className="text-xs text-neutral-500 font-mono">
                Manage consent tokens
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetCookies}
              className="border-2 font-bold uppercase text-xs"
            >
              Reset Consent
            </Button>
          </div>
        </div>
      </section>

      {/* MODULE D: INTEGRATIONS */}
      <section className="border-2 border-black bg-white p-6 md:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-8">
        <h2 className="text-2xl font-black uppercase flex items-center gap-3">
          <span className="bg-black text-white px-3 py-1 text-lg">
            MODULE D
          </span>
          INTEGRATIONS
        </h2>

        {/* Lumen AI */}
        <div className="space-y-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-neutral-500 flex items-center gap-2">
            <Cpu className="w-4 h-4" /> Lumen Intelligence
          </h3>

          <div className="bg-neutral-50 border-2 border-neutral-200 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-bold text-sm">Context Awareness</p>
              <RetroSwitch
                checked={lumenContext}
                onCheckedChange={setLumenContext}
              />
            </div>
            <div className="h-px bg-neutral-200" />
            <div className="flex items-center justify-between">
              <p className="font-bold text-sm text-neutral-600">Memory Banks</p>
              <button
                onClick={handleClearLumen}
                className="text-xs font-bold text-red-600 uppercase hover:underline flex items-center gap-1"
              >
                <Trash className="w-3 h-3" /> Purge Cache
              </button>
            </div>
          </div>
        </div>

        {/* GitHub */}
        <div className="space-y-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-neutral-500 flex items-center gap-2">
            <Github className="w-4 h-4" /> Version Control
          </h3>
          <div className="bg-neutral-50 border-2 border-dashed border-neutral-300 p-6 flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-12 h-12 bg-white rounded-full border-2 border-neutral-200 flex items-center justify-center">
              <Github className="w-6 h-6 text-neutral-400" />
            </div>
            <div>
              <p className="font-bold text-sm">No Repository Linked</p>
              <p className="text-xs text-neutral-500 max-w-[200px] mx-auto">
                Connect your GitHub to sync assignment submissions directly.
              </p>
            </div>
            <Button disabled className="w-full opacity-50 cursor-not-allowed">
              Link Repository [SOON]
            </Button>

            <a
              href="#"
              className="flex items-center gap-1 text-[10px] font-mono font-bold uppercase text-neutral-400 hover:text-black"
            >
              View Changelog <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

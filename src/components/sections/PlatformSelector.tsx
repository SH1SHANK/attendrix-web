"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Smartphone, Monitor, Download, ExternalLink } from "lucide-react";

// 3. Data Structure (Dynamic Props)
const DEPLOYMENT_DATA = {
  android: {
    version: "v1.3.2 (Beta)",
    size: "12MB",
    stats: { power: 100, speed: 85, offline: true },
  },
  web: {
    version: "Live Build",
    url: "app.attendrix.com",
    stats: { power: 80, speed: 100, access: "Global" },
  },
};

type PanelType = "android" | "web" | null;

// Stat Bar Component
function StatBar({
  label,
  value,
  color = "bg-black",
}: {
  label: string;
  value: number | string | boolean;
  color?: string;
}) {
  const displayValue =
    typeof value === "boolean" ? (value ? "YES" : "NO") : value;
  const isPercentage = typeof value === "number";
  const percentage = isPercentage ? value : 100;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs font-bold uppercase tracking-wider text-black">
          {label}
        </span>
        <span className="font-mono text-xs font-black text-black">
          {isPercentage ? `${value}%` : displayValue}
        </span>
      </div>
      <div className="h-3 border-2 border-black bg-white shadow-[2px_2px_0px_0px_#000]">
        <motion.div
          className={`h-full ${color} border-r-2 border-black`}
          initial={{ width: 0 }}
          whileInView={{ width: `${percentage}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.3 }}
        />
      </div>
    </div>
  );
}

export default function PlatformSelector() {
  const [hoveredPanel, setHoveredPanel] = useState<PanelType>(null);

  // Dot pattern for Web panel
  const dotPattern = {
    backgroundImage: "radial-gradient(#000 1px, transparent 1px)",
    backgroundSize: "20px 20px",
  };

  return (
    <section
      id="platform-selector"
      className="relative w-full overflow-hidden bg-stone-100 py-16 md:py-0"
    >
      {/* Section Header - Mobile Only */}
      <div className="px-6 pb-8 text-center md:hidden">
        <div className="mb-4 inline-flex items-center gap-2 border-2 border-black bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider shadow-[4px_4px_0_#0a0a0a]">
          <Smartphone className="h-4 w-4" />
          Deployment Hangar
        </div>
        <h2 className="text-4xl font-black uppercase leading-[0.95] tracking-tight text-stone-900">
          CHOOSE <span className="text-yellow-400 bg-black px-1">LOADOUT</span>
        </h2>
      </div>

      {/* Desktop: Split-Screen Interaction */}
      <div className="hidden md:flex md:min-h-[600px] border-y-2 border-black">
        {/* LEFT PANEL: ANDROID */}
        <motion.div
          className="group relative flex cursor-pointer flex-col justify-center overflow-hidden border-r-2 border-black bg-white px-12 transition-all duration-500"
          animate={{
            width:
              hoveredPanel === "android"
                ? "65%"
                : hoveredPanel === "web"
                  ? "35%"
                  : "50%",
          }}
          onMouseEnter={() => setHoveredPanel("android")}
          onMouseLeave={() => setHoveredPanel(null)}
        >
          {/* Background Icon */}
          <Smartphone
            className="pointer-events-none absolute -right-8 top-1/2 h-120 w-120 -translate-y-1/2 text-neutral-200 opacity-40 transition-transform duration-500 group-hover:scale-110"
            strokeWidth={1}
          />

          <div
            className={`relative z-10 max-w-xl transition-all duration-500 ${hoveredPanel === "web" ? "opacity-50 blur-[2px]" : "opacity-100"}`}
          >
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 border-2 border-black bg-green-400 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-black shadow-[4px_4px_0px_0px_#000]">
              <Smartphone className="h-3.5 w-3.5" />
              {DEPLOYMENT_DATA.android.version}
            </div>

            <h3 className="mb-4 font-black text-6xl uppercase leading-[0.9] tracking-tighter text-black">
              NATIVE
              <br />
              <span
                className="text-transparent"
                style={{ WebkitTextStroke: "2px black" }}
              >
                ARMOR
              </span>
            </h3>

            <p className="mb-8 font-mono text-sm font-bold leading-relaxed text-black/80">
              {"// OFFLINE_READY"}
              <br />
              {"// BACKGROUND_SYNC_ENABLED"}
              <br />
              {"// PUSH_NOTIFICATIONS: ACTIVE"}
            </p>

            <div className="mb-8 space-y-4 max-w-sm">
              <StatBar
                label="Power"
                value={DEPLOYMENT_DATA.android.stats.power}
                color="bg-black"
              />
              <StatBar
                label="Speed"
                value={DEPLOYMENT_DATA.android.stats.speed}
                color="bg-black"
              />
              <StatBar
                label="Offline"
                value={DEPLOYMENT_DATA.android.stats.offline}
                color="bg-green-400"
              />
            </div>

            <Link
              href="/download"
              className="group/btn inline-flex items-center gap-3 border-2 border-black bg-green-400 px-8 py-4 font-black text-lg uppercase tracking-tight text-black shadow-[8px_8px_0px_0px_#000] transition-all duration-300 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[12px_12px_0px_0px_#000] active:translate-x-0 active:translate-y-0 active:shadow-[4px_4px_0px_0px_#000]"
            >
              <Download className="h-5 w-5" />
              INSTALL APK
            </Link>

            {/* Hover details */}
            <AnimatePresence>
              {hoveredPanel === "android" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-6 space-y-2 overflow-hidden border-t-2 border-black pt-4"
                >
                  <div className="flex items-center gap-2 font-mono text-xs font-bold text-black">
                    SIZE: {DEPLOYMENT_DATA.android.size}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* RIGHT PANEL: WEB */}
        <motion.div
          className="group relative flex cursor-pointer flex-col justify-center overflow-hidden bg-yellow-400 px-12 transition-all duration-500"
          animate={{
            width:
              hoveredPanel === "web"
                ? "65%"
                : hoveredPanel === "android"
                  ? "35%"
                  : "50%",
          }}
          onMouseEnter={() => setHoveredPanel("web")}
          onMouseLeave={() => setHoveredPanel(null)}
          style={dotPattern}
        >
          {/* Background Icon */}
          <Monitor
            className="pointer-events-none absolute -left-8 top-1/2 h-120 w-120 -translate-y-1/2 text-black opacity-5 transition-transform duration-500 group-hover:scale-110"
            strokeWidth={1}
          />
          <div
            className={`relative z-10 max-w-xl ml-auto text-right items-end flex flex-col transition-all duration-500 ${hoveredPanel === "android" ? "opacity-50 blur-[2px]" : "opacity-100"}`}
          >
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 border-2 border-black bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-black shadow-[4px_4px_0px_0px_#000]">
              <Monitor className="h-3.5 w-3.5" />
              {DEPLOYMENT_DATA.web.version}
            </div>

            <h3 className="mb-4 font-black text-6xl uppercase leading-[0.9] tracking-tighter text-black">
              INSTANT
              <br />
              <span className="bg-black px-2 text-yellow-400">ACCESS</span>
            </h3>

            <p className="mb-8 font-mono text-sm font-bold leading-relaxed text-black/80">
              {"// ZERO_INSTALL"}
              <br />
              {"// ANY_TERMINAL"}
              <br />
              {"// GLOBAL_ACCESS"}
            </p>

            <div className="mb-8 space-y-4 w-full max-w-sm">
              <StatBar
                label="Power"
                value={DEPLOYMENT_DATA.web.stats.power}
                color="bg-black"
              />
              <StatBar
                label="Speed"
                value={DEPLOYMENT_DATA.web.stats.speed}
                color="bg-black"
              />
              <StatBar
                label="Access"
                value={DEPLOYMENT_DATA.web.stats.access}
                color="bg-purple-600"
              />
            </div>

            <Link
              href="/app"
              className="group/btn inline-flex items-center gap-3 border-2 border-black bg-white px-8 py-4 font-black text-lg uppercase tracking-tight text-black shadow-[8px_8px_0px_0px_#000] transition-all duration-300 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[12px_12px_0px_0px_#000] active:translate-x-0 active:translate-y-0 active:shadow-[4px_4px_0px_0px_#000]"
            >
              <ExternalLink className="h-5 w-5" />
              LAUNCH DASHBOARD
            </Link>

            {/* Hover details */}
            <AnimatePresence>
              {hoveredPanel === "web" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-6 space-y-2 overflow-hidden border-t-2 border-black pt-4"
                >
                  <div className="flex justify-end items-center gap-2 font-mono text-xs font-bold text-black">
                    URL: {DEPLOYMENT_DATA.web.url}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Mobile: Vertical Stack */}
      <div className="flex flex-col md:hidden">
        {/* Panel A: Android */}
        <div className="relative flex min-h-[60vh] flex-col justify-center overflow-hidden border-y-2 border-black bg-white px-6 py-20">
          <Smartphone
            className="pointer-events-none absolute -right-8 top-1/2 h-64 w-64 -translate-y-1/2 text-neutral-200 opacity-40 ml-auto"
            strokeWidth={1}
          />

          <div className="relative z-10">
            <div className="mb-6 inline-flex items-center gap-2 border-2 border-black bg-green-400 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-black shadow-[4px_4px_0px_0px_#000]">
              <Smartphone className="h-3.5 w-3.5" />
              {DEPLOYMENT_DATA.android.version}
            </div>

            <h3 className="mb-4 font-black text-5xl uppercase leading-[0.9] tracking-tighter text-black">
              NATIVE
              <br />
              <span
                className="text-transparent"
                style={{ WebkitTextStroke: "1.5px black" }}
              >
                ARMOR
              </span>
            </h3>

            <p className="mb-8 text-base font-mono font-bold leading-relaxed text-black/80">
              {"// OFFLINE_READY"}
            </p>

            <div className="mb-8 space-y-4">
              <StatBar
                label="Power"
                value={DEPLOYMENT_DATA.android.stats.power}
                color="bg-black"
              />
              <StatBar
                label="Speed"
                value={DEPLOYMENT_DATA.android.stats.speed}
                color="bg-black"
              />
              <StatBar
                label="Offline"
                value={DEPLOYMENT_DATA.android.stats.offline}
                color="bg-green-400"
              />
            </div>

            <Link
              href="/download"
              className="inline-flex w-full items-center justify-center gap-3 border-2 border-black bg-green-400 px-6 py-4 font-black text-base uppercase tracking-tight text-black shadow-[6px_6px_0px_0px_#000] active:shadow-none active:translate-x-1 active:translate-y-1"
            >
              <Download className="h-5 w-5" />
              INSTALL APK
            </Link>
          </div>
        </div>

        {/* Panel B: Web */}
        <div
          className="relative flex min-h-[60vh] flex-col justify-center overflow-hidden border-b-2 border-black bg-yellow-400 px-6 py-20"
          style={dotPattern}
        >
          <Monitor
            className="pointer-events-none absolute -left-8 top-1/2 h-64 w-64 -translate-y-1/2 text-black opacity-5"
            strokeWidth={1}
          />

          <div className="relative z-10">
            <div className="mb-6 inline-flex items-center gap-2 border-2 border-black bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-black shadow-[4px_4px_0px_0px_#000]">
              <Monitor className="h-3.5 w-3.5" />
              {DEPLOYMENT_DATA.web.version}
            </div>

            <h3 className="mb-4 font-black text-5xl uppercase leading-[0.9] tracking-tighter text-black">
              INSTANT
              <br />
              <span className="bg-black px-2 text-yellow-400">ACCESS</span>
            </h3>

            <p className="mb-8 text-base font-mono font-bold leading-relaxed text-black/80">
              {"// ZERO_INSTALL"}
            </p>

            <div className="mb-8 space-y-4">
              <StatBar
                label="Power"
                value={DEPLOYMENT_DATA.web.stats.power}
                color="bg-black"
              />
              <StatBar
                label="Speed"
                value={DEPLOYMENT_DATA.web.stats.speed}
                color="bg-black"
              />
              <StatBar
                label="Access"
                value={DEPLOYMENT_DATA.web.stats.access}
                color="bg-purple-600"
              />
            </div>

            <Link
              href="/app"
              className="inline-flex w-full items-center justify-center gap-3 border-2 border-black bg-white px-6 py-4 font-black text-base uppercase tracking-tight text-black shadow-[6px_6px_0px_0px_#000] active:shadow-none active:translate-x-1 active:translate-y-1"
            >
              <ExternalLink className="h-5 w-5" />
              LAUNCH DASHBOARD
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

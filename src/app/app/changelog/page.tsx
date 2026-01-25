"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowLeft, CheckCircle2, FileCode } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// Changelog Data
// ============================================================================

const CHANGELOG_ENTRIES = [
  {
    version: "v2.1.0-alpha",
    date: "Current Build",
    status: "active",
    title: "The Server-State Migration",
    tag: "MAJOR ALERT",
    details: [
      {
        text: "Refactored entire data layer to TanStack Query v5",
        type: "feat",
      },
      { text: "Implemented useAttendance hook (Latency: <50ms)", type: "feat" },
      {
        text: "Replaced client logic with Supabase RPC class_check_in",
        type: "feat",
      },
      {
        text: "Added Hybrid Sync: Writes to SQL -> Triggers Edge Function",
        type: "feat",
      },
    ],
    alert: "Known Issue: Attendance toggle may flicker on slow 3G networks.",
  },
  {
    version: "v2.0.5-alpha",
    date: "Legacy Shell",
    status: "history",
    title: "The 'Lite' Shell Port",
    tag: "FEATURE",
    details: [
      {
        text: "Initial port of 'AttendrixLite' to Next.js App Router",
        type: "feat",
      },
      {
        text: "Integrated RetroUI Design System (Neo-Brutalist CSS)",
        type: "feat",
      },
      {
        text: "Added 'Safe Cut' Calculator Algorithm (75% Logic)",
        type: "feat",
      },
      { text: "Setup Middleware for Route Protection (/app/*)", type: "feat" },
    ],
  },
  {
    version: "v2.0.0-dev",
    date: "Initialization",
    status: "history",
    title: "Core Initialization",
    tag: "INIT",
    details: [
      { text: "Project initialized from Android codebase logic", type: "feat" },
      { text: "Ported Firebase Auth providers", type: "feat" },
      { text: "Established initial Supabase connection strings", type: "feat" },
    ],
  },
];

// ============================================================================
// Components
// ============================================================================

function LogEntry({ entry }: { entry: (typeof CHANGELOG_ENTRIES)[0] }) {
  const isLatest = entry.status === "active";

  return (
    <div className="relative pl-8 md:pl-12 py-2">
      {/* Timeline Branch Connector */}
      <div className="absolute left-0 top-8 w-8 md:w-12 h-0.5 border-t-2 border-dashed border-black/30" />

      {/* Node Dot */}
      <div
        className={cn(
          "absolute left-[-5px] top-[29px] w-3 h-3 rounded-full border-2 border-black z-10",
          isLatest ? "bg-rose-500" : "bg-neutral-200",
        )}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className={cn(
          "relative bg-white border-2 p-6 transition-all",
          isLatest
            ? "border-rose-500 shadow-[6px_6px_0px_0px_#e11d48]"
            : "border-black shadow-[4px_4px_0px_0px_#000] opacity-90 hover:opacity-100",
        )}
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b-2 border-dashed border-neutral-200">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "p-2 border-2 border-black font-mono font-bold text-sm",
                isLatest
                  ? "bg-rose-100 text-rose-700"
                  : "bg-neutral-100 text-black",
              )}
            >
              {entry.version}
            </div>
            <span className="font-mono text-xs uppercase text-neutral-500 tracking-wider">
              {entry.date}
            </span>
          </div>

          {isLatest && (
            <div className="flex items-center gap-2 px-3 py-1 bg-rose-50 border border-rose-200 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
              <span className="text-[10px] font-bold uppercase text-rose-700 tracking-wide">
                Current Build
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div>
          <h3 className="font-mono font-bold text-lg md:text-xl text-black mb-4">
            {entry.title}
          </h3>

          <ul className="space-y-3 mb-6">
            {entry.details.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-neutral-400 shrink-0 mt-0.5" />
                <span className="text-sm font-medium text-neutral-700 leading-relaxed">
                  {item.text}
                </span>
              </li>
            ))}
          </ul>

          {/* Alert Box if present */}
          {entry.alert && (
            <div className="bg-rose-50 border-l-4 border-rose-500 p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <p className="text-xs font-bold text-rose-900 leading-relaxed">
                {entry.alert}
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ============================================================================
// Page Layout
// ============================================================================

export default function WebChangelogPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#18181B] font-sans selection:bg-rose-200">
      {/* Engineering Grid Pattern */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(#000 1px, transparent 1px),
            linear-gradient(90deg, #000 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative max-w-4xl mx-auto px-6 py-20">
        {/* HEADER: DOSSIER STYLE */}
        <header className="mb-16 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-black text-white text-[10px] font-bold uppercase tracking-[0.2em] mb-4">
            <FileCode className="w-3 h-3" />
            Internal // Authorized Eyes Only
          </div>

          <h1 className="font-mono font-black text-4xl md:text-5xl uppercase tracking-tighter mb-8">
            System Kernel Log
          </h1>

          <div className="w-full border-b-2 border-dashed border-black/20" />
        </header>

        {/* TIMELINE CONTAINER */}
        <div className="relative">
          {/* Vertical Connector Line */}
          <div className="absolute left-0 top-0 bottom-0 w-px border-l-2 border-dashed border-black/20" />

          <div className="space-y-12">
            {CHANGELOG_ENTRIES.map((entry) => (
              <LogEntry key={entry.version} entry={entry} />
            ))}
          </div>
        </div>

        {/* NAVIGATION FOOTER */}
        <footer className="mt-24 pl-8 md:pl-12">
          <Link
            href="/app"
            className="
               group block w-full border-2 border-black/10 p-6 text-center
               hover:border-black hover:bg-white hover:shadow-[4px_4px_0px_0px_#000]
               transition-all duration-200
             "
          >
            <span className="flex items-center justify-center gap-3 font-mono font-bold uppercase text-sm tracking-widest text-neutral-500 group-hover:text-black">
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              Return to Console
            </span>
          </Link>

          <p className="mt-8 text-center font-mono text-[10px] text-neutral-400 uppercase tracking-widest">
            End of Record • Attendrix Systems Archival
          </p>
        </footer>
      </div>
    </div>
  );
}

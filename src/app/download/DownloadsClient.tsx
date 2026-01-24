"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Download,
  Github,
  ChevronDown,
  Package,
  Calendar,
  ArrowLeft,
  Share2,
  Bell,
  Rss,
  QrCode,
  ShieldCheck,
  Smartphone,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { QRCodeSVG } from "qrcode.react";
import { toast, Toaster } from "sonner";
import { Release } from "@/lib/github";

interface DownloadsClientProps {
  releases: Release[];
}

export default function DownloadsClient({ releases }: DownloadsClientProps) {
  const [copiedRef, setCopiedRef] = useState(false);

  // Use real data or fallback
  const latestRelease = releases[0];

  const handleShare = async () => {
    if (typeof window !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Download Attendrix",
          text: "Get the latest Attendrix APK for Android.",
          url: window.location.href,
        });
      } catch (error) {
        console.log("Error sharing:", error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast("Link copied to clipboard");
    }
  };

  const copyReferral = () => {
    navigator.clipboard.writeText("attendrix.app/ref/u/shashank");
    setCopiedRef(true);
    toast.success("Referral link copied!", {
      className: "bg-black text-white border-2 border-white",
    });
    setTimeout(() => setCopiedRef(false), 2000);
  };

  return (
    <div className="min-h-screen bg-paper font-sans relative">
      <Toaster position="bottom-right" />

      {/* Background Pattern */}
      <div
        className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #000 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* 1. STICKY HEADER */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b-2 border-black">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 font-black uppercase text-sm md:text-base hover:text-neutral-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden md:inline">Back to Home</span>
            <span className="md:hidden">Home</span>
          </Link>

          <span className="hidden md:block font-black tracking-widest text-sm text-neutral-400">
            DOWNLOAD CENTER
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2 hover:bg-neutral-100 rounded-none border-2 border-transparent hover:border-black transition-all"
              title="Share Page"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <button
              className="p-2 hover:bg-neutral-100 rounded-none border-2 border-transparent hover:border-black transition-all"
              title="Get Alerts"
            >
              <Bell className="w-5 h-5" />
            </button>
            <button
              className="p-2 hover:bg-neutral-100 rounded-none border-2 border-transparent hover:border-black transition-all text-neutral-500"
              title="RSS Feed"
            >
              <Rss className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12 md:py-20 relative z-10">
        {/* Page Title */}
        <div className="mb-12 text-center md:text-left">
          <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter text-black leading-[0.9] mb-4">
            Get{" "}
            <span
              className="text-stroke-black text-transparent"
              style={{ WebkitTextStroke: "2px black" }}
            >
              Attendrix
            </span>
          </h1>
          <p className="text-xl md:text-2xl font-bold text-neutral-500 max-w-2xl">
            The latest stable build for Android. Direct APK download. No play
            store required.
          </p>
        </div>

        {/* 2. ENHANCED DOWNLOAD CARD */}
        {latestRelease ? (
          <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_#000] p-0 mb-20 overflow-hidden flex flex-col md:flex-row">
            {/* Left Content */}
            <div className="p-8 md:p-12 flex-1">
              <div className="flex gap-4 mb-6">
                <Badge>{latestRelease.status}</Badge>
                <div className="flex items-center gap-1 text-xs font-bold text-neutral-500 uppercase tracking-wider border border-neutral-300 px-2 bg-neutral-100">
                  <ShieldCheck className="w-3 h-3" /> Knox Secure
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-neutral-500 uppercase tracking-wider border border-neutral-300 px-2 bg-neutral-100">
                  <Smartphone className="w-3 h-3" /> Android 14+
                </div>
              </div>

              <h2 className="text-4xl font-black uppercase mb-2">
                Attendrix {latestRelease.version}
              </h2>
              <div className="text-neutral-600 font-medium mb-8 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Released {latestRelease.date}
                </span>
                <span className="flex items-center gap-2">
                  <Package className="w-4 h-4" /> {latestRelease.size}
                </span>
              </div>

              {/* Checksum Box */}
              <div className="mb-8">
                <p className="text-[10px] uppercase font-bold text-neutral-400 mb-1 tracking-widest">
                  SHA-256 Checksum
                </p>
                <code className="block bg-neutral-100 border border-neutral-300 p-3 font-mono text-xs text-neutral-600 break-all select-all">
                  {latestRelease.sha256}
                </code>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href={latestRelease.downloadUrl}
                  data-umami-event="download_apk_click"
                  data-umami-event-version={latestRelease.version}
                  className="flex-1 bg-[#FFD02F] text-black border-2 border-black font-black uppercase px-8 py-4 shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] active:shadow-none transition-all flex items-center justify-center gap-3"
                >
                  <Download className="w-6 h-6 stroke-[3px]" />
                  Download APK
                </a>
                <a
                  href={latestRelease.githubUrl}
                  className="bg-white text-black border-2 border-black font-bold uppercase px-6 py-4 hover:bg-neutral-100 transition-colors flex items-center justify-center gap-2"
                >
                  <Github className="w-5 h-5" />
                  GitHub
                </a>
              </div>
            </div>

            {/* Right QR Section (Desktop) */}
            <div className="hidden md:flex w-64 bg-neutral-50 border-l-2 border-black flex-col items-center justify-center p-8 text-center shrink-0">
              <div className="bg-white p-3 border-2 border-black shadow-sm mb-4">
                <QRCodeSVG
                  value={latestRelease.downloadUrl}
                  size={140}
                  level="M"
                />
              </div>
              <p className="font-black uppercase text-sm mb-1">
                Scan to Install
              </p>
              <p className="text-xs text-neutral-500 font-medium">
                Camera &gt; Link
              </p>
            </div>
          </div>
        ) : (
          <EmptyState />
        )}

        {/* 3. REFERRAL SECTION */}
        <div className="mb-24 bg-black text-white p-8 md:p-12 border-2 border-black shadow-[8px_8px_0px_0px_#FFD02F] relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <h3 className="text-3xl font-black uppercase mb-2 text-[#FFD02F]">
                Invite Classmates
              </h3>
              <p className="text-neutral-400 font-medium max-w-md">
                Get premium features unlocked for every 3 friends who join using
                your link.
              </p>
            </div>

            <div className="flex w-full md:w-auto max-w-md bg-white/10 p-1 border border-white/20 rounded-none">
              <div className="flex-1 px-4 py-3 font-mono text-sm text-neutral-300 truncate">
                attendrix.app/ref/u/shashank
              </div>
              <button
                onClick={copyReferral}
                className="bg-[#FFD02F] text-black font-bold uppercase text-sm px-6 py-2 hover:bg-white transition-colors flex items-center gap-2"
              >
                {copiedRef ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                {copiedRef ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <QrCode className="w-64 h-64 text-white" />
          </div>
        </div>

        {/* 4. CHANGELOG HISTORY */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-black uppercase mb-12 flex items-center gap-4">
            <span className="border-b-4 border-black pb-2">
              Release History
            </span>
          </h2>

          <div className="relative border-l-2 border-dashed border-neutral-300 ml-4 md:ml-8 pl-8 md:pl-12 pb-12 space-y-12">
            {releases.map((release) => (
              <TimelineItem key={release.version} release={release} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

// ============================================
// HELPERS & SUB-COMPONENTS
// ============================================

function EmptyState() {
  return (
    <div className="bg-white border-2 border-black p-12 text-center mb-20 shadow-[8px_8px_0px_0px_#000]">
      <h3 className="font-black uppercase text-2xl mb-2">No Releases Found</h3>
      <p className="text-neutral-500 font-bold mb-6">
        Check back later or visit our GitHub directly.
      </p>
      <a
        href="https://github.com/attendrix/attendrix-mobile"
        className="inline-flex items-center gap-2 font-black uppercase underline hover:text-neutral-600"
      >
        <Github className="w-4 h-4" /> Visit Repository
      </a>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  const isStable = children === "stable";
  return (
    <div
      className={cn(
        "inline-flex items-center border-2 border-black px-3 py-1 font-black text-xs uppercase shadow-[2px_2px_0px_0px_#000]",
        isStable ? "bg-green-400" : "bg-yellow-400",
      )}
    >
      {children}
    </div>
  );
}

function TimelineItem({ release }: { release: Release }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      {/* Timeline Dot */}
      <div className="absolute -left-[41px] md:-left-[59px] top-6 w-5 h-5 bg-black border-2 border-white shadow-[0_0_0_4px_#fff]" />

      <div className="bg-white border-2 border-black hover:shadow-[4px_4px_0px_0px_#000] transition-shadow duration-300">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full flex items-start md:items-center justify-between p-6 text-left transition-colors",
            isOpen
              ? "bg-neutral-50 border-b-2 border-black"
              : "hover:bg-neutral-50",
          )}
        >
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h3 className="font-black text-2xl uppercase">
                {release.version}
              </h3>
              {release.status === "beta" && (
                <span className="text-[10px] font-bold bg-yellow-400 text-black px-1.5 py-0.5 border border-black uppercase">
                  Beta
                </span>
              )}
            </div>
            <div className="text-neutral-500 font-medium text-sm flex items-center gap-2">
              <Calendar className="w-3 h-3" /> {release.date}
            </div>
          </div>

          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="p-2 border-2 border-transparent hover:border-black rounded-none"
          >
            <ChevronDown className="w-6 h-6 text-black" />
          </motion.div>
        </button>

        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
            >
              <div className="p-6 md:p-8 bg-white">
                <ul className="space-y-4 mb-8">
                  {release.notes.length > 0 ? (
                    release.notes.map((note, idx) => (
                      <li key={idx} className="flex items-start gap-4">
                        <Tag type={note.tag} />
                        <span className="font-medium text-neutral-800 leading-snug pt-0.5">
                          {note.text}
                        </span>
                      </li>
                    ))
                  ) : (
                    <li className="text-neutral-400 font-bold text-sm italic">
                      No release notes provided.
                    </li>
                  )}
                </ul>

                <div className="flex items-center justify-between pt-6 border-t-2 border-neutral-100">
                  <a
                    href={release.downloadUrl}
                    className="flex items-center gap-2 font-bold text-sm uppercase hover:text-blue-600 transition-colors"
                  >
                    <Download className="w-4 h-4" /> Direct Download
                  </a>
                  <a
                    href={release.githubUrl}
                    className="flex items-center gap-2 font-bold text-sm uppercase text-neutral-400 hover:text-black transition-colors"
                  >
                    Release Notes <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Tag({ type }: { type: "NEW" | "FIX" | "IMPROVEMENT" | "INFO" }) {
  const styles = {
    NEW: "bg-[#FFD02F] text-black border-black",
    FIX: "bg-blue-400 text-white border-blue-900",
    IMPROVEMENT: "bg-green-400 text-black border-green-800",
    INFO: "bg-neutral-200 text-neutral-600 border-neutral-400",
  };

  return (
    <span
      className={cn(
        "shrink-0 font-bold text-[10px] px-2 py-0.5 border uppercase tracking-wide w-24 text-center select-none",
        styles[type],
      )}
    >
      {type}
    </span>
  );
}

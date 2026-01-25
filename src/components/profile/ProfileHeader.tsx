"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Activity, RefreshCw, Settings } from "lucide-react";
import { UserMenu } from "@/components/layout/UserMenu";

// ============================================================================
// ProfileHeader Component
// ============================================================================

export function ProfileHeader() {
  const [currentTime, setCurrentTime] = useState<string>("");

  // Update time every minute
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="sticky top-0 w-full border-b-2 border-black bg-white/95 backdrop-blur-md z-50 px-4 md:px-6 py-3"
    >
      <div className="flex items-center justify-between gap-4">
        {/* ============================================================ */}
        {/* LEFT: Navigation & Context */}
        {/* ============================================================ */}
        <div className="flex items-center gap-4">
          {/* Back Button */}
          <Link
            href="/"
            className="w-10 h-10 border-2 border-black hover:bg-yellow-400 flex items-center justify-center transition-colors shadow-[2px_2px_0px_0px_#000] hover:shadow-[4px_4px_0px_0px_#000] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          {/* Title Group */}
          <div className="flex flex-col">
            <h1 className="font-black uppercase text-base md:text-lg leading-none tracking-tight">
              Academic Record
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <motion.div
                className="w-2 h-2 bg-green-500 rounded-full"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="font-mono text-[10px] text-green-600 uppercase tracking-wide">
                Live System Status
              </span>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* MIDDLE: Sync Indicator (Hidden on Mobile) */}
        {/* ============================================================ */}
        <div className="hidden lg:flex items-center gap-2 border border-black px-3 py-1.5 bg-neutral-100 shadow-[2px_2px_0px_0px_#000]">
          <RefreshCw className="w-3 h-3 text-neutral-600" />
          <span className="font-mono text-xs uppercase tracking-wide text-neutral-700">
            Synced: {currentTime || "..."} • v1.4.0
          </span>
        </div>

        {/* ============================================================ */}
        {/* RIGHT: User Profile Card (UserMenu) */}
        {/* ============================================================ */}
        <div className="flex items-center gap-3">
          {/* System Activity Indicator (Hidden on small screens) */}
          <div className="hidden md:flex items-center gap-2 border border-black px-2 py-1 bg-yellow-50">
            <Activity className="w-3 h-3 text-yellow-600" />
            <span className="font-mono text-[10px] uppercase text-yellow-700">
              Active
            </span>
          </div>

          <Link
            href="/settings"
            className="w-10 h-10 border-2 border-black bg-white hover:bg-yellow-400 flex items-center justify-center transition-colors shadow-[2px_2px_0px_0px_#000] hover:shadow-[4px_4px_0px_0px_#000] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" />
          </Link>

          {/* User Menu */}
          <UserMenu />
        </div>
      </div>
    </motion.header>
  );
}

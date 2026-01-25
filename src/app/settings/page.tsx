"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, AlertCircle, LogOut, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { IdentityModule } from "@/components/settings/IdentityModule";
import { AcademicModule } from "@/components/settings/AcademicModule";
import { SystemModule } from "@/components/settings/SystemModule";
import { toast } from "sonner";

export default function GlobalSettingsPage() {
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  const handleDeleteAccount = () => {
    if (
      confirm(
        "CRITICAL WARNING: This will permanently delete your Pilot Registry. Proceed?",
      )
    ) {
      toast.error("PROTOCOL INITIATED: ACCOUNT DELETION");
    }
  };

  const handleLogout = async () => {
    toast.info("SIGNING OFF...");
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revokeAll: false }),
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
    window.location.href = "/auth/signin";
  };

  return (
    <div className="min-h-screen bg-neutral-100 font-sans text-black pb-24">
      {/* 1. COMMAND HEADER (STICKY) */}
      <header className="sticky top-0 z-50 bg-white border-b-2 border-black flex items-center justify-between px-4 py-3 md:px-8 shadow-sm">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="w-10 h-10 border-2 border-black hover:bg-yellow-400 flex items-center justify-center transition-colors shadow-[2px_2px_0px_0px_#000] hover:shadow-[4px_4px_0px_0px_#000] active:translate-y-[1px] active:shadow-none"
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
          </Link>
          <h1 className="font-bold font-mono text-lg md:text-xl uppercase tracking-tight hidden md:block">
            System Configuration
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <AnimatePresence>
            {unsavedChanges && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="bg-yellow-100 border-2 border-yellow-500 px-3 py-1.5 flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 text-yellow-700" />
                <span className="text-xs font-black uppercase text-yellow-800 tracking-wide">
                  Unsaved Changes
                </span>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="font-mono text-xs text-neutral-400 font-bold hidden md:block">
            BUILD V2.5.0
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 space-y-12">
        {/* MODULE A: IDENTITY */}
        <IdentityModule
          onDirtyChange={setUnsavedChanges}
          initialData={{
            displayName: "Shashank Pilot",
            username: "shashank_x",
            email: "shashank@attendrix.edu",
            bio: "Frontend Specialist deploying robust UI systems.",
          }}
        />

        {/* MODULE B: ACADEMIC */}
        <AcademicModule />

        {/* MODULE C & D: SYSTEM & INTEGRATIONS (Combined in Layout Grid inside SystemModule) */}
        <SystemModule />

        {/* MODULE E: DANGER ZONE */}
        <section className="border-2 border-red-500 bg-red-50 p-6 md:p-8 relative overflow-hidden">
          {/* Background Pattern */}
          <div
            className="absolute inset-0 opacity-[0.05] pointer-events-none z-0"
            style={{
              backgroundImage:
                "repeating-linear-gradient(135deg, #ef4444 0, #ef4444 1px, transparent 0, transparent 20px)",
            }}
          />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div>
              <h2 className="text-2xl font-black uppercase text-red-600 mb-2 flex items-center gap-2">
                <Trash2 className="w-6 h-6" /> Danger Zone
              </h2>
              <p className="font-bold text-red-800 text-sm max-w-md">
                Critical operations. Once executed, these actions cannot be
                reversed. Proceed with extreme caution.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-yellow-400 border-2 border-black font-black uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-y-0 active:shadow-none"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>

              <button
                onClick={handleDeleteAccount}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 border-2 border-red-900 text-white font-black uppercase text-sm shadow-[4px_4px_0px_0px_#7f1d1d] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#7f1d1d] transition-all active:translate-y-0 active:shadow-none"
              >
                Delete Account
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

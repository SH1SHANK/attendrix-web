"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { NeoAvatar } from "@/components/ui/NeoAvatar";
import {
  ChevronDown,
  User,
  Settings,
  HelpCircle,
  LogOut,
  FileText,
  Activity,
  Shield,
  Scale,
  Rocket,
  ShieldCheck,
} from "lucide-react";

// ============================================================================
// UserMenu Component
// ============================================================================

export function UserMenu() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close menu on Escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  if (!user) return null;

  const displayName = user.displayName?.split(" ")[0] || "Pilot";

  return (
    <div ref={menuRef} className="relative">
      {/* ================================================================ */}
      {/* TRIGGER: Clean User Button */}
      {/* ================================================================ */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-none border-2 border-transparent hover:border-black hover:shadow-[2px_2px_0px_0px_#000] hover:-translate-y-px hover:-translate-x-px transition-all duration-200
          ${isOpen ? "translate-x-[2px] translate-y-[2px] shadow-none bg-yellow-50" : "hover:bg-yellow-50 hover:-translate-y-px hover:-translate-x-px hover:shadow-[3px_3px_0px_0px_#000]"}
        `}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="scale-90">
          <NeoAvatar name={user.displayName || user.email} />
        </div>

        <span className="font-bold uppercase text-sm tracking-wide hidden sm:block">
          {displayName}
        </span>

        <ChevronDown
          className={`w-4 h-4 text-black transition-transform duration-200 ${isOpen ? "rotate-180" : "group-hover:translate-y-px"}`}
        />
      </button>

      {/* ================================================================ */}
      {/* DROPDOWN MENU */}
      {/* ================================================================ */}
      {isOpen && (
        <div
          className="
            absolute top-full right-0 mt-2 w-64
            bg-white border-2 border-black shadow-[6px_6px_0px_0px_#000] z-50
            animate-in fade-in slide-in-from-top-2 duration-150
          "
          role="menu"
          aria-orientation="vertical"
        >
          {/* Primary Action */}
          <Link
            href="/app"
            onClick={() => setIsOpen(false)}
            className="
              w-full text-left px-4 py-3
              font-black uppercase text-sm tracking-wide
              bg-[#FFD02F] text-black
              border-b-2 border-black
              hover:bg-[#ffdb5c] transition-colors
              flex items-center gap-3
            "
          >
            <Rocket className="w-4 h-4" />
            Launch Web App
          </Link>

          <div className="py-2">
            {/* Account Section */}
            <div className="px-4 py-1.5 text-[10px] font-bold uppercase text-neutral-400 tracking-wider">
              Account
            </div>
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 hover:bg-neutral-100 flex items-center gap-3 text-sm font-bold uppercase"
            >
              <User className="w-4 h-4 text-neutral-500" />
              Profile
            </Link>
            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 hover:bg-neutral-100 flex items-center gap-3 text-sm font-bold uppercase"
            >
              <Settings className="w-4 h-4 text-neutral-500" />
              Settings
            </Link>
            <Link
              href="/settings/request-admin"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 hover:bg-neutral-100 flex items-center gap-3 text-sm font-bold uppercase"
            >
              <ShieldCheck className="w-4 h-4 text-neutral-500" />
              Request Admin Access
            </Link>

            {/* Resources Section */}
            <div className="px-4 py-1.5 mt-2 text-[10px] font-bold uppercase text-neutral-400 tracking-wider border-t border-dashed border-neutral-200">
              Resources
            </div>
            <Link
              href="/docs"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 hover:bg-neutral-100 flex items-center gap-3 text-sm font-bold uppercase"
            >
              <HelpCircle className="w-4 h-4 text-neutral-500" />
              Help & Docs
            </Link>
            <Link
              href="/download"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 hover:bg-neutral-100 flex items-center gap-3 text-sm font-bold uppercase"
            >
              <FileText className="w-4 h-4 text-neutral-500" />
              Release Hub
            </Link>
            <Link
              href="/status"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 hover:bg-neutral-100 flex items-center gap-3 text-sm font-bold uppercase"
            >
              <Activity className="w-4 h-4 text-neutral-500" />
              System Status
            </Link>

            {/* Legal Section */}
            <div className="px-4 py-1.5 mt-2 text-[10px] font-bold uppercase text-neutral-400 tracking-wider border-t border-dashed border-neutral-200">
              Legal
            </div>
            <Link
              href="/privacy"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 hover:bg-neutral-100 flex items-center gap-3 text-sm font-bold uppercase"
            >
              <Shield className="w-4 h-4 text-neutral-500" />
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 hover:bg-neutral-100 flex items-center gap-3 text-sm font-bold uppercase"
            >
              <Scale className="w-4 h-4 text-neutral-500" />
              Terms of Service
            </Link>
          </div>

          {/* Logout Footer */}
          <div className="border-t-2 border-black p-2 bg-neutral-50">
            <button
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="
                w-full text-left px-3 py-2 rounded
                font-bold uppercase text-xs text-red-600
                hover:bg-red-50 transition-colors
                flex items-center gap-2
                "
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

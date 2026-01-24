"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { NeoAvatar } from "@/components/ui/NeoAvatar";
import { ShieldCheck, LogOut, LayoutDashboard } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();

  // Nav Links
  const navLinks = [
    { href: "#features", label: "FEATURES" },
    { href: "#how-it-works", label: "HOW IT WORKS" },
    { href: "#pricing", label: "PRICING" },
    { href: "#faq", label: "FAQ" },
  ];

  return (
    <header className="sticky top-0 w-full h-16 border-b-2 border-black bg-white/95 backdrop-blur z-50 px-6 md:px-12 flex items-center justify-between">
      {/* LEFT: Branding */}
      <Link
        href="/"
        className="flex items-center gap-2 text-black hover:opacity-80 transition-opacity"
      >
        <ShieldCheck className="w-6 h-6 stroke-[3px]" />
        <span className="font-black text-2xl uppercase tracking-tighter">
          Attendrix
        </span>
      </Link>

      {/* CENTER: Desktop Nav (Visible only on lg screens) */}
      <nav className="hidden lg:flex items-center gap-6">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="font-bold text-xs uppercase tracking-widest hover:text-[#FFD02F] transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {/* RIGHT: Actions */}
      <div className="flex items-center gap-4">
        {user ? (
          // LOGGED IN STATE
          <div className="flex items-center gap-4">
            {/* Profile Chip */}
            <div className="flex items-center gap-3 border-2 border-black bg-white px-3 py-1.5 shadow-[4px_4px_0px_0px_#000]">
              <NeoAvatar name={user.displayName || user.email} />
              <div className="flex flex-col">
                <span className="font-bold uppercase text-xs sm:text-sm leading-none">
                  {user.displayName?.split(" ")[0] || "Pilot"}
                </span>
                <span className="font-mono text-[10px] text-neutral-500 leading-none">
                  ONLINE
                </span>
              </div>
            </div>

            {/* Logout Button (Small Icon) */}
            <button
              onClick={() => logout()}
              className="w-10 h-10 flex items-center justify-center border-2 border-transparent hover:border-black hover:bg-neutral-100 transition-all rounded-full"
              title="Log Out"
            >
              <LogOut className="w-5 h-5 text-neutral-600 hover:text-red-600" />
            </button>
          </div>
        ) : (
          // GUEST STATE
          <div className="flex items-center gap-4">
            <Link
              href="/auth/signin"
              className="text-sm font-bold uppercase hover:underline hidden sm:block"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="px-5 py-2 bg-[#FFD02F] text-black border-2 border-black font-bold uppercase text-xs tracking-wider shadow-[2px_2px_0px_0px_#000] transition-all hover:-translate-y-[2px] hover:-translate-x-[2px] hover:shadow-[4px_4px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

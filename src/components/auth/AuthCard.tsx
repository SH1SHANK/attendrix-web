import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface AuthCardProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footerLink?: {
    text: string;
    linkText: string;
    href: string;
  };
}

const AuthCard = ({ title, subtitle, children, footerLink }: AuthCardProps) => {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-neutral-50 px-4 py-12 overflow-hidden font-sans">
      {/* ================= BACKGROUND ELEMENTS ================= */}

      {/* 1. High-Contrast Dot Pattern (Black 15% opacity) */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(#00000026_1px,transparent_1px)] bg-size-[20px_20px] pointer-events-none" />

      {/* 2. Vignette (Focus Mask) - Stronger edge fade */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(255,255,255,0.9)_100%)] pointer-events-none" />

      {/* 3. Refined Yellow Glow (Smaller & tighter) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-87.5 h-87.5 bg-yellow-400/25 blur-[80px] rounded-full z-0 pointer-events-none" />

      {/* ================= CONTENT WRAPPER ================= */}
      <div className="w-full max-w-100 relative z-10 px-0 sm:px-0">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-black uppercase text-xs tracking-wider hover:text-neutral-600 transition-colors bg-white/80 backdrop-blur-sm px-3 py-1.5 border-2 border-transparent hover:border-black rounded-none"
          >
            <ArrowLeft className="w-3 h-3" /> Back to Home
          </Link>
        </div>

        {/* The Card */}
        <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_#000] overflow-hidden">
          {/* Header */}
          <div className="bg-[#FFD02F] border-b-2 border-black p-6 md:p-8 text-center pt-8 md:pt-10">
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-black mb-1">
              {title}
            </h1>
            <p className="text-neutral-900 font-bold text-base md:text-lg leading-tight">
              {subtitle}
            </p>
          </div>

          {/* Body */}
          <div className="p-6 md:p-8">{children}</div>

          {/* Footer Link */}
          {footerLink && (
            <div className="bg-neutral-100 border-t-2 border-black p-4 text-center">
              <p className="font-bold text-xs md:text-sm text-neutral-600">
                {footerLink.text}{" "}
                <Link
                  href={footerLink.href}
                  className="text-black uppercase underline decoration-2 underline-offset-2 hover:bg-[#FFD02F] transition-colors"
                >
                  {footerLink.linkText}
                </Link>
              </p>
            </div>
          )}
        </div>

        {/* Copyright */}
        <div className="text-center mt-6 text-[10px] uppercase font-bold text-neutral-400 tracking-widest">
          © {new Date().getFullYear()} Attendrix. Secure.
        </div>
      </div>
    </div>
  );
};

export default AuthCard;

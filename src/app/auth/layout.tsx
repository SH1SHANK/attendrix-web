import Link from "next/link";
import React from "react";
import { ShieldCheck } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-neutral-50 px-4 py-12 overflow-hidden font-sans">
      {/* ================= BACKGROUND ELEMENTS ================= */}
      {/* 1. High-Contrast Dot Pattern */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(#00000026_1px,transparent_1px)] bg-size-[20px_20px] pointer-events-none" />

      {/* 2. Vignette */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(255,255,255,0.9)_100%)] pointer-events-none" />

      {/* 3. Refined Yellow Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-yellow-400/25 blur-[80px] rounded-full -z-0 pointer-events-none" />

      {/* ================= BRANDING HEADER ================= */}
      <div className="relative z-10 mb-8 w-full flex justify-center">
        <Link
          href="/"
          className="group bg-[#FFD02F] border-2 border-black p-3 shadow-[4px_4px_0px_0px_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#000] transition-all flex items-center gap-2"
        >
          <ShieldCheck className="w-6 h-6 stroke-[3px] text-black" />
          <span className="font-black text-2xl uppercase tracking-tighter text-black">
            Attendrix
          </span>
        </Link>
      </div>

      {/* ================= PAGE CONTENT (CARD) ================= */}
      <div className="w-full max-w-sm relative z-10">{children}</div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRef } from "react";
import { Download, ExternalLink } from "lucide-react";
import { useHeroIntro } from "@/animations/reveal";
import { useMagneticHover, useWiggleOnHover } from "@/animations/hover";

interface HeroProps {
  isVisible?: boolean;
}

export default function Hero({ isVisible = false }: HeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const attendanceRef = useRef<HTMLSpanElement>(null);
  const reimaginedRef = useRef<HTMLSpanElement>(null);
  const brushRef = useRef<HTMLSpanElement>(null);
  const primaryRef = useRef<HTMLAnchorElement>(null);
  const secondaryRef = useRef<HTMLAnchorElement>(null);

  useHeroIntro({
    containerRef: sectionRef,
    attendanceRef,
    reimaginedRef,
    brushRef,
    isActive: isVisible,
  });

  useMagneticHover(primaryRef);
  useMagneticHover(secondaryRef, { strength: 18 });
  useWiggleOnHover(primaryRef, { rotation: 1.8 });

  const subheadingText =
    "The bespoke academic ecosystem for NITC. Track subject-wise eligibility, sync your Google Calendar, and level up your 'Mage Rank'—all in one app.";

  return (
    <section
      ref={sectionRef}
      className="relative isolate flex min-h-[92vh] flex-col items-center justify-center overflow-hidden px-6 pb-20 pt-28 sm:px-8 lg:px-12"
    >
      {/* Animated Dot Grid Background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        aria-hidden="true"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(15,23,42,0.3) 1.5px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 bg-linear-to-b from-white/40 via-stone-50 to-stone-50"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 mix-blend-multiply opacity-[0.18]"
        aria-hidden="true"
        style={{
          backgroundImage:
            "url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 200%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22200%25%22 height=%22200%25%22 filter=%22url(%23n)%22 opacity=%220.25%22/%3E%3C/svg%3E')",
        }}
      />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center gap-8 text-center">
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 rounded-full border-2 border-black bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-stone-900 shadow-[4px_4px_0_#0a0a0a]"
          data-hero-stagger
        >
          <span
            className="h-2 w-2 rounded-full bg-green-500 animate-pulse"
            aria-hidden="true"
          />
          AttendrixWeb v2.0.5 Alpha-Preview
        </div>

        {/* Main Typography */}
        <div
          className="relative flex flex-col items-center gap-2 text-center"
          aria-hidden="true"
        >
          <span
            ref={attendanceRef}
            className="text-balance text-5xl font-black uppercase leading-[0.9] tracking-[-0.06em] text-stone-900 sm:text-7xl lg:text-8xl"
          >
            ATTENDANCE
          </span>
          {/* Yellow Rotated Container for REIMAGINED */}
          <div className="relative inline-flex items-center justify-center -rotate-2">
            <span
              ref={brushRef}
              className="absolute inset-x-[-8%] inset-y-[-12%] bg-yellow-400 border-2 border-black shadow-[4px_4px_0_#0a0a0a]"
            />
            <span
              ref={reimaginedRef}
              className="relative px-4 py-1 text-balance text-5xl font-black uppercase leading-[0.9] tracking-[-0.06em] text-stone-950 sm:text-7xl lg:text-8xl"
            >
              REIMAGINED
            </span>
          </div>
        </div>

        <div className="space-y-6 text-center">
          <h1
            className="text-balance text-3xl font-black leading-tight tracking-tight text-stone-950 sm:text-4xl lg:text-5xl"
            data-hero-stagger
          >
            Your Academic Life. Gamified.
          </h1>
          <p
            className="mx-auto max-w-3xl text-lg leading-relaxed text-stone-700 sm:text-xl"
            data-hero-stagger
          >
            {subheadingText}
          </p>
        </div>

        {/* CTAs */}
        <div
          className="flex flex-col items-center justify-center gap-4 sm:flex-row"
          data-hero-stagger
        >
          {/* Primary: Download APK */}
          <Link
            ref={primaryRef}
            href="/download"
            className="group relative inline-flex items-center gap-3 border-2 border-black bg-yellow-400 px-6 py-3 text-lg font-bold uppercase tracking-tight text-black shadow-[6px_6px_0_#0a0a0a] transition-all duration-200 hover:shadow-[4px_4px_0_#0a0a0a] hover:-translate-x-[2px] hover:-translate-y-[2px]"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center bg-black text-yellow-400">
              <Download className="h-5 w-5" />
            </span>
            Download APK
          </Link>

          {/* Secondary: Launch Web App */}
          <Link
            ref={secondaryRef}
            href="/app"
            className="group inline-flex items-center gap-3 border-2 border-black bg-white px-6 py-3 text-lg font-bold uppercase tracking-tight text-stone-900 shadow-[6px_6px_0_#0a0a0a] transition-all duration-200 hover:shadow-[4px_4px_0_#0a0a0a] hover:-translate-x-[2px] hover:-translate-y-[2px]"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center border-2 border-black bg-stone-900 text-white">
              <ExternalLink className="h-4 w-4" />
            </span>
            Launch Web App
          </Link>
        </div>
      </div>
    </section>
  );
}

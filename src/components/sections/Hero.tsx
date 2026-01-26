"use client";

import Link from "next/link";
import { useRef } from "react";
import { ArrowRight, Play } from "lucide-react";
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
    "Stop calculating percentages. Start earning XP. The only attendance tracker that plays as hard as you work.";

  return (
    <section
      ref={sectionRef}
      className="relative isolate flex min-h-[92vh] flex-col items-center justify-center overflow-hidden px-6 pb-20 pt-28 sm:px-8 lg:px-12"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        aria-hidden="true"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(15,23,42,0.2) 1px, transparent 0)",
          backgroundSize: "26px 26px",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/40 via-stone-50 to-stone-50"
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
        <div
          className="inline-flex items-center gap-2 rounded-full border-2 border-black bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-stone-900 shadow-[6px_6px_0_#0a0a0a]"
          data-hero-stagger
        >
          <span
            className="h-2 w-2 rounded-full bg-green-500"
            aria-hidden="true"
          />
          Beta 2.1 • Built for NITC
        </div>

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
          <div className="relative inline-flex items-center justify-center">
            <span
              ref={brushRef}
              className="absolute inset-x-[-10%] bottom-1 h-5 rounded-md bg-amber-200/90"
            />
            <span
              ref={reimaginedRef}
              className="relative text-balance text-5xl font-black uppercase leading-[0.9] tracking-[-0.06em] text-stone-950 sm:text-7xl lg:text-8xl"
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

        <div
          className="flex flex-col items-center justify-center gap-4 sm:flex-row"
          data-hero-stagger
        >
          <Link
            ref={primaryRef}
            href="/auth/signup"
            className="group relative inline-flex items-center gap-3 rounded-full border-2 border-black bg-gradient-to-r from-amber-300 to-amber-200 px-6 py-3 text-lg font-semibold uppercase tracking-tight text-black shadow-[10px_10px_0_#0a0a0a] transition-shadow duration-200 hover:shadow-[6px_6px_0_#0a0a0a]"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black text-amber-200 shadow-[4px_4px_0_#0a0a0a]">
              ⚡
            </span>
            Join the Batch
            <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>

          <Link
            ref={secondaryRef}
            href="/app"
            className="group inline-flex items-center gap-3 rounded-full border-2 border-stone-900 bg-white/80 px-6 py-3 text-lg font-semibold text-stone-900 shadow-[8px_8px_0_#0a0a0a] transition-colors duration-200 hover:bg-stone-100"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-stone-900 bg-stone-900 text-white">
              <Play className="h-4 w-4" />
            </span>
            Watch Demo
          </Link>
        </div>
      </div>
    </section>
  );
}

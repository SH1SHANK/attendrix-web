"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Bot,
  Calculator,
  TrendingUp,
  Lock,
  LayoutDashboard,
  Calendar,
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export default function FeaturesGrid() {
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      const isMobile = window.innerWidth < 768;

      // Animate header
      gsap.from(headerRef.current, {
        autoAlpha: 0,
        y: isMobile ? 15 : 30,
        duration: isMobile ? 0.5 : 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: headerRef.current,
          start: "top 80%",
          toggleActions: "play none none none",
        },
      });

      // Animate cards with stagger (simplified for mobile)
      const cards = gridRef.current?.querySelectorAll(".feature-card");
      const icons = gridRef.current?.querySelectorAll(".feature-icon");

      if (cards && cards.length > 0) {
        gsap.from(cards, {
          autoAlpha: 0,
          y: isMobile ? 15 : 30,
          duration: isMobile ? 0.5 : 0.8,
          stagger: isMobile ? 0.05 : 0.12,
          ease: "power3.out",
          scrollTrigger: {
            trigger: gridRef.current,
            start: "top 75%",
            toggleActions: "play none none none",
          },
        });
      }

      // Animate icons with pop effect (disabled on mobile for performance)
      if (icons && icons.length > 0 && !isMobile) {
        gsap.from(icons, {
          scale: 0,
          rotation: -45,
          duration: 0.9,
          stagger: 0.08,
          ease: "elastic.out(1, 0.5)",
          delay: 0.3,
          scrollTrigger: {
            trigger: gridRef.current,
            start: "top 75%",
            toggleActions: "play none none none",
          },
        });
      }
    }, gridRef);

    return () => ctx.revert();
  }, [prefersReducedMotion]);

  return (
    <section className="w-full bg-paper py-20 md:py-32 flex flex-col items-center">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div ref={headerRef} className="text-center mb-16 md:mb-20">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-black mb-4 leading-tight">
            Tired of Manually Calculating
            <br />
            Your Attendance?
          </h2>
          <div className="flex justify-center mb-16 md:mb-20">
            <p className="sm:text-xl text-neutral-600 font-medium max-w-2xl">
              Stop guessing. Start tracking. Here&apos;s everything Attendrix
              does for you.
            </p>
          </div>
        </div>

        {/* Asymmetrical Bento Grid */}
        <div
          ref={gridRef}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 auto-rows-[minmax(180px,auto)]"
        >
          {/* Card A: Calculations on Autopilot (Wide Header) */}
          <div className="feature-card col-span-1 md:col-span-2">
            <div
              className="h-full p-8 cursor-pointer group shadow-[6px_6px_0px_0px_#000] transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] hover:-translate-y-[2px] hover:-translate-x-[2px] hover:shadow-[10px_10px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              style={{
                backgroundColor: "#ffffff",
                color: "#000000",
                border: "2px solid black",
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="feature-icon p-1">
                  <TrendingUp className="w-8 h-8 text-black" />
                </div>
              </div>
              <h3 className="text-2xl md:text-3xl font-black tracking-tight text-black mb-3">
                Calculations on Autopilot
              </h3>
              <p className="text-base md:text-lg text-neutral-600 leading-relaxed font-medium">
                Real-time tracking automatically updates your attendance
                percentages. Spot &quot;Bunkable&quot; classes instantly and
                know exactly when you need to show up.
              </p>
            </div>
          </div>

          {/* Card B: NITC Slot System (Tall Vertical Tower) - YELLOW */}
          <div className="feature-card col-span-1 md:col-span-1 md:row-span-2">
            <div
              className="h-full p-8 cursor-pointer shadow-[8px_8px_0px_0px_#000] transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] hover:-translate-y-[2px] hover:-translate-x-[2px] hover:shadow-[12px_12px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              style={{
                backgroundColor: "#FFD02F",
                color: "#000000",
                border: "2px solid black",
              }}
            >
              <div className="flex h-full flex-col justify-between">
                <div>
                  <div className="feature-icon p-1 mb-4 inline-block">
                    <Calendar className="w-12 h-12 text-black" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-black tracking-tight text-black mb-3">
                    NITC Slot System Built-In
                  </h3>
                  <p className="text-base text-black/80 leading-relaxed font-bold">
                    Forget manual timetable entry. We support the NITC slot
                    system natively.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Card C: Meet Lumen (Blue Square) */}
          <div className="feature-card col-span-1">
            <div
              className="w-full h-full p-8 cursor-pointer shadow-[6px_6px_0px_0px_#000] transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] hover:-translate-y-[2px] hover:-translate-x-[2px] hover:shadow-[10px_10px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              style={{
                backgroundColor: "#3b82f6",
                color: "#ffffff",
                border: "2px solid black",
              }}
            >
              <div className="feature-icon p-1 mb-4 inline-block">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl md:text-3xl font-black tracking-tight mb-2">
                Meet Lumen
              </h3>
              <p className="text-sm text-white/90 leading-relaxed font-medium">
                Your AI attendance companion. Chat with Lumen to check stats or
                log classes instantly.
              </p>
            </div>
          </div>

          {/* Card D: Amplix (Pink Square) */}
          <div className="feature-card col-span-1">
            <div
              className="w-full h-full p-8 cursor-pointer shadow-[6px_6px_0px_0px_#000] transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] hover:-translate-y-[2px] hover:-translate-x-[2px] hover:shadow-[10px_10px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              style={{
                backgroundColor: "#ff4d79",
                color: "#ffffff",
                border: "2px solid black",
              }}
            >
              <div className="feature-icon p-1 mb-4 inline-block">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl md:text-3xl font-black tracking-tight mb-2">
                Amplix Gamification
              </h3>
              <p className="text-sm text-white/90 leading-relaxed font-medium">
                Turn attendance into a game. Earn badges, streaks, and compete
                with friends.
              </p>
            </div>
          </div>

          {/* Card E: Future Calculator (White Square) */}
          <div className="feature-card col-span-1">
            <div
              className="h-full p-8 cursor-pointer shadow-[6px_6px_0px_0px_#000] transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] hover:-translate-y-[2px] hover:-translate-x-[2px] hover:shadow-[10px_10px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              style={{
                backgroundColor: "#ffffff",
                color: "#000000",
                border: "2px solid black",
              }}
            >
              <div className="feature-icon p-1 mb-4 inline-block">
                <Calculator className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-2xl md:text-3xl font-black tracking-tight text-black mb-3">
                Future Calculator
              </h3>
              <p className="text-sm text-neutral-600 leading-relaxed font-medium">
                &quot;What if I bunk 3 classes?&quot; Simulate scenarios to see
                how your attendance drops or climbs.
              </p>
            </div>
          </div>

          {/* Card F: Everything in One View (Wide Footer/Middle) */}
          <div className="feature-card col-span-1 md:col-span-2">
            <div
              className="h-full p-8 cursor-pointer shadow-[6px_6px_0px_0px_#000] transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] hover:-translate-y-[2px] hover:-translate-x-[2px] hover:shadow-[10px_10px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              style={{
                backgroundColor: "#ffffff",
                color: "#000000",
                border: "2px solid black",
              }}
            >
              <div className="feature-icon p-1 mb-4 inline-block">
                <LayoutDashboard className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-2xl md:text-3xl font-black tracking-tight text-black mb-3">
                Everything in One View
              </h3>
              <p className="text-base md:text-lg text-neutral-600 leading-relaxed font-medium">
                A unified dashboard that gives you a complete overview of your
                academic life at a glance.
              </p>
            </div>
          </div>

          {/* Card G: Iron-Clad Privacy (Full Width Bottom) - DARK */}
          <div className="feature-card col-span-1 md:col-span-3">
            <div
              className="h-full p-8 cursor-pointer shadow-[8px_8px_0px_0px_#000] transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] hover:-translate-y-[2px] hover:-translate-x-[2px] hover:shadow-[12px_12px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              style={{
                backgroundColor: "#09090b",
                color: "#ffffff",
                border: "2px solid black",
              }}
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                  <div className="feature-icon p-1 mb-4 inline-block">
                    <Lock className="w-8 h-8 text-[#FFD02F]" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-black tracking-tight text-white mb-2">
                    Iron-Clad Privacy
                  </h3>
                  <p className="text-base text-neutral-400 leading-relaxed max-w-2xl font-medium">
                    Your data stays on your device. We don&apos;t sell it, we
                    don&apos;t share it. End-to-end encryption ensures only you
                    have access to your attendance records.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

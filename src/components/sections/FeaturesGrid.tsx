"use client";

import { useRef, useMemo } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import {
  Bot,
  Calculator,
  Calendar,
  Target,
  BookOpen,
  Database,
  ShieldCheck,
} from "lucide-react";
import DotPatternBackground from "../ui/DotPatternBackground";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function FeaturesGrid() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Check for reduced motion preference at render time (SSR-safe)
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  // Single consolidated GSAP hook with proper cleanup
  useGSAP(
    () => {
      if (prefersReducedMotion) return;
      if (!headerRef.current || !gridRef.current) return;

      const mm = gsap.matchMedia();

      mm.add("(min-width: 768px)", () => {
        // Desktop animations
        gsap.from(headerRef.current, {
          autoAlpha: 0,
          y: 30,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: headerRef.current,
            start: "top 80%",
            toggleActions: "play none none none",
          },
        });

        const cards = gridRef.current?.querySelectorAll(".feature-card");
        const icons = gridRef.current?.querySelectorAll(".feature-icon");

        if (cards && cards.length > 0) {
          gsap.from(cards, {
            autoAlpha: 0,
            y: 30,
            duration: 0.8,
            stagger: 0.12,
            ease: "power3.out",
            scrollTrigger: {
              trigger: gridRef.current,
              start: "top 75%",
              toggleActions: "play none none none",
            },
          });
        }

        if (icons && icons.length > 0) {
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
      });

      mm.add("(max-width: 767px)", () => {
        // Mobile animations - simplified for performance
        gsap.from(headerRef.current, {
          autoAlpha: 0,
          y: 15,
          duration: 0.5,
          ease: "power3.out",
          scrollTrigger: {
            trigger: headerRef.current,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        });

        const cards = gridRef.current?.querySelectorAll(".feature-card");

        if (cards && cards.length > 0) {
          gsap.from(cards, {
            autoAlpha: 0,
            y: 15,
            duration: 0.5,
            stagger: 0.05,
            ease: "power3.out",
            scrollTrigger: {
              trigger: gridRef.current,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          });
        }
      });

      // Cleanup handled automatically by useGSAP
      return () => mm.revert();
    },
    { scope: sectionRef, dependencies: [prefersReducedMotion] },
  );

  return (
    <section
      ref={sectionRef}
      id="features"
      className="w-full relative py-20 md:py-32 flex flex-col items-center"
    >
      <DotPatternBackground />
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div ref={headerRef} className="text-center mb-16 md:mb-20">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-black mb-4 leading-tight">
            Stop Guessing.
            <br />
            Track with Precision.
          </h2>
          <div className="flex justify-center mb-16 md:mb-20">
            <p className="sm:text-xl text-neutral-600 font-medium max-w-2xl">
              Subject-wise tracking, slot-aware counts, plus classes,
              assignments, exams, and study materials in one system.
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
              className="h-full p-8 cursor-pointer shadow-[6px_6px_0px_0px_#000] transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[10px_10px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              style={{
                backgroundColor: "#ffffff",
                color: "#000000",
                border: "2px solid black",
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="feature-icon p-1">
                  <Target className="w-8 h-8 text-black" />
                </div>
              </div>
              <h3 className="text-2xl md:text-3xl font-black tracking-tight text-black mb-3">
                Subject-Wise, NITC-Ready
              </h3>
              <p className="text-base md:text-lg text-neutral-600 leading-relaxed font-medium">
                Every course tracks independently with slot-aware class counts.
                Built for NITC without confusing aggregate-only views.
              </p>
            </div>
          </div>

          {/* Card B: NITC Slot System (Tall Vertical Tower) - YELLOW */}
          <div className="feature-card col-span-1 md:col-span-1 md:row-span-2">
            <div
              className="h-full p-8 cursor-pointer shadow-[8px_8px_0px_0px_#000] transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[12px_12px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
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
                    Slot System Built-In
                  </h3>
                  <p className="text-base text-black/80 leading-relaxed font-bold">
                    Timetables and check-ins follow NITC slots automatically —
                    no manual mapping.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Card C: Meet Lumen (Blue Square) */}
          <div className="feature-card col-span-1">
            <div
              className="w-full h-full p-8 cursor-pointer shadow-[6px_6px_0px_0px_#000] transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[10px_10px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
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
                Lumen AI (Syllabus-Bound)
              </h3>
              <p className="text-sm text-white/90 leading-relaxed font-medium">
                Ask questions grounded in your uploaded PDFs. Lumen retrieves
                only verified syllabus context and your attendance status.
              </p>
            </div>
          </div>

          {/* Card D: Amplix (Pink Square) */}
          <div className="feature-card col-span-1">
            <div
              className="w-full h-full p-8 cursor-pointer shadow-[6px_6px_0px_0px_#000] transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[10px_10px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              style={{
                backgroundColor: "#ff4d79",
                color: "#ffffff",
                border: "2px solid black",
              }}
            >
              <div className="feature-icon p-1 mb-4 inline-block">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl md:text-3xl font-black tracking-tight mb-2">
                Study Materials (Web + APK)
              </h3>
              <p className="text-sm text-white/90 leading-relaxed font-medium">
                Drive-backed materials on both. Web includes the full offline
                cache, tags, and focus mode; APK keeps a lighter version.
              </p>
            </div>
          </div>

          {/* Card E: Future Calculator (White Square) */}
          <div className="feature-card col-span-1">
            <div
              className="h-full p-8 cursor-pointer shadow-[6px_6px_0px_0px_#000] transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[10px_10px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
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
                Attendance Simulator
              </h3>
              <p className="text-sm text-neutral-600 leading-relaxed font-medium">
                What-if engine for attendance impact on Web and APK.
              </p>
            </div>
          </div>

          {/* Card F: Everything in One View (Wide Footer/Middle) */}
          <div className="feature-card col-span-1 md:col-span-2">
            <div
              className="h-full p-8 cursor-pointer shadow-[6px_6px_0px_0px_#000] transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[10px_10px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              style={{
                backgroundColor: "#ffffff",
                color: "#000000",
                border: "2px solid black",
              }}
            >
              <div className="feature-icon p-1 mb-4 inline-block">
                <Database className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-2xl md:text-3xl font-black tracking-tight text-black mb-3">
                Classes, Assignments, Exams
              </h3>
              <p className="text-base md:text-lg text-neutral-600 leading-relaxed font-medium">
                Manage classes, assignments, and exams in one place alongside
                attendance and study materials.
              </p>
            </div>
          </div>

          {/* Card G: Iron-Clad Privacy (Full Width Bottom) - DARK */}
          <div className="feature-card col-span-1 md:col-span-3">
            <div
              className="h-full p-8 cursor-pointer shadow-[8px_8px_0px_0px_#000] transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[12px_12px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              style={{
                backgroundColor: "#09090b",
                color: "#ffffff",
                border: "2px solid black",
              }}
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                  <div className="feature-icon p-1 mb-4 inline-block">
                    <ShieldCheck className="w-8 h-8 text-[#FFD02F]" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-black tracking-tight text-white mb-2">
                    Privacy & Transparency
                  </h3>
                  <p className="text-base text-neutral-400 leading-relaxed max-w-2xl font-medium">
                    Your academic data stays scoped to your account. Export
                    anytime and see the math behind every calculation.
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

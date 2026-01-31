"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Sparkles, Target, TrendingUp } from "lucide-react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function WhatIsAttendrix() {
  const sectionRef = useRef<HTMLElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      // Desktop animations
      mm.add("(min-width: 768px)", () => {
        // Text stagger reveal
        const textLines =
          textContainerRef.current?.querySelectorAll("[data-reveal]");
        if (textLines?.length) {
          gsap.fromTo(
            textLines,
            { y: 40, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              stagger: 0.12,
              duration: 0.8,
              ease: "power3.out",
              scrollTrigger: {
                trigger: sectionRef.current,
                start: "top 75%",
                toggleActions: "play none none reverse",
              },
            },
          );
        }

        // Image parallax un-tilt
        if (imageRef.current) {
          gsap.fromTo(
            imageRef.current,
            { rotate: 6, y: 60, opacity: 0 },
            {
              rotate: 0,
              y: 0,
              opacity: 1,
              duration: 1,
              ease: "power2.out",
              scrollTrigger: {
                trigger: sectionRef.current,
                start: "top 70%",
                toggleActions: "play none none reverse",
              },
            },
          );

          // Parallax on scroll
          gsap.to(imageRef.current, {
            y: -40,
            ease: "none",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top bottom",
              end: "bottom top",
              scrub: 1,
            },
          });
        }
      });

      // Mobile animations - simpler
      mm.add("(max-width: 767px)", () => {
        const textLines =
          textContainerRef.current?.querySelectorAll("[data-reveal]");
        if (textLines?.length) {
          gsap.fromTo(
            textLines,
            { y: 20, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              stagger: 0.08,
              duration: 0.5,
              ease: "power2.out",
              scrollTrigger: {
                trigger: sectionRef.current,
                start: "top 85%",
              },
            },
          );
        }

        if (imageRef.current) {
          gsap.fromTo(
            imageRef.current,
            { y: 30, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.6,
              ease: "power2.out",
              scrollTrigger: {
                trigger: imageRef.current,
                start: "top 90%",
              },
            },
          );
        }
      });

      return () => mm.revert();
    },
    { scope: sectionRef },
  );

  return (
    <section
      ref={sectionRef}
      className="relative py-24 px-6 sm:px-8 lg:px-12 overflow-hidden bg-stone-50"
    >
      {/* Dot grid background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        aria-hidden="true"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(15,23,42,0.3) 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Text Content - Left */}
          <div ref={textContainerRef} className="space-y-6">
            {/* Badge */}
            <div
              data-reveal
              className="inline-flex items-center gap-2 border-2 border-black bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-wider shadow-[3px_3px_0_#0a0a0a]"
            >
              <Sparkles className="h-3.5 w-3.5" />
              The Ecosystem
            </div>

            {/* Headline */}
            <h2
              data-reveal
              className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase leading-[0.95] tracking-tight text-stone-900"
            >
              Built for the{" "}
              <span className="relative inline-block">
                <span className="relative z-10">Slot System</span>
                <span className="absolute bottom-1 left-0 right-0 h-3 bg-yellow-400 -z-10 -rotate-1" />
              </span>
            </h2>

            {/* Subheadline */}
            <p
              data-reveal
              className="text-xl sm:text-2xl font-semibold text-stone-800"
            >
              It&apos;s an Ecosystem.
            </p>

            {/* Body */}
            <p
              data-reveal
              className="text-lg text-stone-600 leading-relaxed max-w-xl"
            >
              Standard apps fail at NITC. Attendrix understands strict
              subject-wise 80% rules, 'W' grades, and slot-based timetables.
              It's hard-coded for Calicut. Your academic standing is calculated
              exactly as the administration does it.
            </p>

            {/* Feature pills */}
            <div data-reveal className="flex flex-wrap gap-3 pt-2">
              <div className="inline-flex items-center gap-2 border-2 border-black bg-green-100 px-3 py-2 text-sm font-semibold shadow-[2px_2px_0_#0a0a0a]">
                <Target className="h-4 w-4 text-green-700" />
                Track Attendance
              </div>
              <div className="inline-flex items-center gap-2 border-2 border-black bg-purple-100 px-3 py-2 text-sm font-semibold shadow-[2px_2px_0_#0a0a0a]">
                <Sparkles className="h-4 w-4 text-purple-700" />
                Earn XP
              </div>
              <div className="inline-flex items-center gap-2 border-2 border-black bg-blue-100 px-3 py-2 text-sm font-semibold shadow-[2px_2px_0_#0a0a0a]">
                <TrendingUp className="h-4 w-4 text-blue-700" />
                Plan Ahead
              </div>
            </div>
          </div>

          {/* Graphic - Right */}
          <div className="relative flex items-center justify-center lg:justify-end">
            <div
              ref={imageRef}
              className="relative w-full max-w-md lg:max-w-lg"
            >
              {/* Dashboard mockup */}
              <div className="relative border-4 border-black bg-white shadow-[12px_12px_0_#0a0a0a] overflow-hidden">
                {/* Browser chrome */}
                <div className="flex items-center gap-2 px-4 py-3 bg-stone-100 border-b-2 border-black">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400 border border-black" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400 border border-black" />
                    <div className="w-3 h-3 rounded-full bg-green-400 border border-black" />
                  </div>
                  <div className="flex-1 ml-4">
                    <div className="bg-white border-2 border-black px-3 py-1 text-xs font-mono text-stone-500">
                      attendrix.app/dashboard
                    </div>
                  </div>
                </div>

                {/* Dashboard content mockup */}
                <div className="p-6 space-y-4 bg-stone-50">
                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="border-2 border-black bg-yellow-400 p-3 shadow-[2px_2px_0_#0a0a0a]">
                      <div className="text-2xl font-black">87%</div>
                      <div className="text-xs font-bold uppercase">Overall</div>
                    </div>
                    <div className="border-2 border-black bg-white p-3 shadow-[2px_2px_0_#0a0a0a]">
                      <div className="text-2xl font-black">1,250</div>
                      <div className="text-xs font-bold uppercase">XP</div>
                    </div>
                    <div className="border-2 border-black bg-green-200 p-3 shadow-[2px_2px_0_#0a0a0a]">
                      <div className="text-2xl font-black">Lv.5</div>
                      <div className="text-xs font-bold uppercase">Rank</div>
                    </div>
                  </div>

                  {/* Subject bars */}
                  <div className="space-y-2">
                    {[
                      { name: "MA2003", pct: 92, color: "bg-green-400" },
                      { name: "CS2001", pct: 78, color: "bg-yellow-400" },
                      { name: "ME2004", pct: 85, color: "bg-blue-400" },
                    ].map((subj) => (
                      <div key={subj.name} className="flex items-center gap-3">
                        <div className="w-16 text-xs font-mono font-bold">
                          {subj.name}
                        </div>
                        <div className="flex-1 h-4 border-2 border-black bg-white">
                          <div
                            className={`h-full ${subj.color}`}
                            style={{ width: `${subj.pct}%` }}
                          />
                        </div>
                        <div className="w-10 text-xs font-bold text-right">
                          {subj.pct}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-12 h-12 bg-yellow-400 border-2 border-black shadow-[3px_3px_0_#0a0a0a] flex items-center justify-center">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="absolute -bottom-3 -left-3 w-8 h-8 bg-green-400 border-2 border-black" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

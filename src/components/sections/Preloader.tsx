"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

interface PreloaderProps {
  onComplete: () => void;
}

const BOOT_STAGES = [
  "Initializing academic context",
  "Syncing course structure",
  "Validating attendance rules",
  "Preparing dashboard",
  "Finalizing session",
];

export default function Preloader({ onComplete }: PreloaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const brandRef = useRef<HTMLDivElement>(null);
  const sweepRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const hasCompletedRef = useRef(false);

  const [currentStage, setCurrentStage] = useState(0);

  const handleComplete = useCallback(() => {
    if (hasCompletedRef.current) return;
    hasCompletedRef.current = true;
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      if (!hasCompletedRef.current) {
        console.warn("Preloader fallback triggered");
        handleComplete();
      }
    }, 7000);

    return () => clearTimeout(fallbackTimer);
  }, [handleComplete]);

  useGSAP(
    () => {
      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const tl = gsap.timeline({
        onComplete: () => {
          const exitTl = gsap.timeline({ onComplete: handleComplete });

          exitTl
            .to(brandRef.current, {
              scale: 0.88,
              opacity: 0,
              duration: 0.3,
              ease: "back.in(1.2)",
            })
            .to(
              [textRef.current],
              {
                opacity: 0,
                y: -20,
                duration: 0.25,
                ease: "back.in(1.2)",
              },
              "<0.08",
            )
            .to(
              containerRef.current,
              {
                yPercent: -100,
                duration: 0.6,
                ease: "power4.inOut",
              },
              "<0.12",
            );
        },
      });

      const stageTimings = [
        { duration: 0.7, hold: 0.18 },
        { duration: 0.8, hold: 0.2 },
        { duration: 0.85, hold: 0.2 },
        { duration: 0.7, hold: 0.18 },
        { duration: 0.6, hold: 0.1 },
      ];

      if (brandRef.current) {
        gsap.fromTo(
          brandRef.current,
          { x: -8, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 0.4,
            ease: "power3.out",
          },
        );
      }

      stageTimings.forEach((stage, index) => {
        tl.to(
          {},
          {
            duration: prefersReducedMotion
              ? stage.duration * 0.5
              : stage.duration,
            onStart: () => {
              if (textRef.current) {
                gsap.to(textRef.current, {
                  y: -8,
                  opacity: 0,
                  duration: 0.14,
                  ease: "power2.in",
                  onComplete: () => {
                    setCurrentStage(index);
                    gsap.fromTo(
                      textRef.current,
                      { y: 8, opacity: 0 },
                      { y: 0, opacity: 1, duration: 0.22, ease: "power2.out" },
                    );
                  },
                });
              } else {
                setCurrentStage(index);
              }
            },
          },
        );

        if (sweepRef.current && !prefersReducedMotion) {
          tl.fromTo(
            sweepRef.current,
            { xPercent: -120, opacity: 0 },
            {
              xPercent: 120,
              opacity: 1,
              duration: 0.45,
              ease: "power1.inOut",
            },
            "<",
          );
        }

        if (stage.hold > 0) {
          tl.to({}, { duration: prefersReducedMotion ? 0.05 : stage.hold });
        }
      });
    },
    { scope: containerRef },
  );

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-9999 flex flex-col items-center justify-center font-display"
      style={{ backgroundColor: "#FFD02F" }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        aria-hidden="true"
        style={{
          backgroundImage:
            "linear-gradient(45deg, transparent 48%, rgba(0,0,0,0.04) 49%, rgba(0,0,0,0.04) 51%, transparent 52%)",
          backgroundSize: "2px 2px",
        }}
      />

      <div className="relative w-full h-full">
        <div
          ref={brandRef}
          className="absolute top-10 left-8 sm:left-12 flex items-center gap-3"
          style={{
            textShadow: "3px 3px 0px rgba(0,0,0,0.12)",
          }}
        >
          <div
            className="h-10 w-10 border-3 border-black bg-black text-[#FFD02F] flex items-center justify-center font-mono font-black text-lg"
            style={{
              boxShadow: "4px 4px 0px rgba(0,0,0,0.25)",
            }}
          >
            A
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black uppercase tracking-[0.24em] text-black">
              Attendrix
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-black/70">
              System Boot
            </span>
          </div>
        </div>

        <div className="absolute left-8 right-8 top-28 sm:left-12 sm:right-16">
          <div
            className="border-4 border-black bg-[#FFD02F]"
            style={{
              boxShadow:
                "8px 8px 0px rgba(0,0,0,0.3), 16px 16px 0px rgba(0,0,0,0.08)",
            }}
          >
            <div
              className="border-b-4 border-black px-6 py-4 flex items-center justify-between bg-[#FFD02F]"
              style={{
                borderBottomColor: "black",
              }}
            >
              <span className="text-xs font-black uppercase tracking-[0.2em] text-black">
                Boot Sequence
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-black/80 font-mono">
                v2.0.5-alpha
              </span>
            </div>

            <div className="relative px-6 py-5 bg-white">
              <div className="absolute left-0 right-0 top-0 h-1 bg-black" />
              <div
                ref={sweepRef}
                className="absolute left-0 top-0 h-1 w-1/3 bg-black"
                style={{
                  boxShadow: "inset 0 -2px 0px rgba(0,0,0,0.15)",
                }}
              />
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-8 items-start">
                <div className="space-y-4">
                  <div className="border-b-3 border-black pb-3">
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-black">
                      STATE
                    </p>
                  </div>
                  <div className="h-8 overflow-hidden">
                    <p
                      ref={textRef}
                      className="text-lg sm:text-2xl font-black uppercase tracking-tight text-black leading-tight"
                    >
                      {BOOT_STAGES[currentStage]}
                    </p>
                  </div>
                  <div className="border-t-3 border-black pt-3">
                    <div className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-black/70">
                      Attendance logic · Academic rules · Sync pipeline
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3 sm:border-l-4 sm:border-black sm:pl-4">
                  <span className="text-xs font-black uppercase tracking-[0.3em] text-black">
                    PROGRESS
                  </span>
                  <div className="flex items-center gap-2">
                    {BOOT_STAGES.map((_, index) => (
                      <div
                        key={index}
                        className="relative"
                        style={{
                          perspective: "1000px",
                        }}
                      >
                        <span
                          className={`h-3 w-9 border-3 border-black font-black uppercase text-[8px] flex items-center justify-center transition-all duration-100 ${
                            index <= currentStage
                              ? "bg-black text-[#FFD02F] shadow-[inset_0_2px_0px_rgba(255,208,47,0.3)]"
                              : "bg-white text-black"
                          }`}
                          style={{
                            boxShadow:
                              index <= currentStage
                                ? "inset 0 2px 0px rgba(255,208,47,0.3), 2px 2px 0px rgba(0,0,0,0.2)"
                                : "2px 2px 0px rgba(0,0,0,0.15)",
                          }}
                        >
                          {index + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t-4 border-black px-6 py-3 bg-black text-[#FFD02F] flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em]">
                Systems online
              </span>
              <span className="text-[10px] font-mono font-bold uppercase tracking-[0.3em]">
                secure boot · ok
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black" />
    </div>
  );
}

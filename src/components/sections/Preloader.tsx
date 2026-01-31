"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import Image from "next/image";

gsap.registerPlugin(useGSAP);

interface PreloaderProps {
  onComplete: () => void;
}

const ACADEMIC_ICONS = [
  "/preloader-icons/Math Animated Icon.gif",
  "/preloader-icons/Math Books Icon.gif",
  "/preloader-icons/Math Microscope Icon.gif",
  "/preloader-icons/Math Notebook Icon.gif",
  "/preloader-icons/Math Lesson Animation.gif",
];

const LOADING_TEXTS = [
  "LOADING SUBJECTS",
  "SYNCING CALENDAR",
  "CALCULATING ATTENDANCE",
  "CHECKING THRESHOLDS",
  "PREPARING DASHBOARD",
];

export default function Preloader({ onComplete }: PreloaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const percentRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const shimmerRef = useRef<HTMLDivElement>(null);
  const iconContainerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const hasCompletedRef = useRef(false);

  const [currentIconIndex, setCurrentIconIndex] = useState(0);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  // Memoize onComplete to prevent unnecessary re-runs
  const handleComplete = useCallback(() => {
    if (hasCompletedRef.current) return;
    hasCompletedRef.current = true;
    onComplete();
  }, [onComplete]);

  // Icon cross-fade rotation with GSAP
  useGSAP(
    () => {
      const iconInterval = setInterval(() => {
        if (iconContainerRef.current) {
          // Fade out current icon
          gsap.to(iconContainerRef.current, {
            opacity: 0,
            scale: 0.95,
            duration: 0.2,
            ease: "power2.in",
            onComplete: () => {
              setCurrentIconIndex((prev) => (prev + 1) % ACADEMIC_ICONS.length);
              // Fade in new icon
              gsap.to(iconContainerRef.current, {
                opacity: 1,
                scale: 1,
                duration: 0.3,
                ease: "power2.out",
              });
            },
          });
        }
      }, 1200);

      return () => clearInterval(iconInterval);
    },
    { scope: containerRef },
  );

  // Coordinated text rotation based on progress milestones
  useEffect(() => {
    const milestone = Math.floor(progress / 20);
    if (milestone !== currentTextIndex && milestone < LOADING_TEXTS.length) {
      // Animate text change
      if (textRef.current) {
        gsap.to(textRef.current, {
          y: -8,
          opacity: 0,
          duration: 0.15,
          ease: "power2.in",
          onComplete: () => {
            setCurrentTextIndex(milestone);
            gsap.fromTo(
              textRef.current,
              { y: 8, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.2, ease: "power2.out" },
            );
          },
        });
      }
    }
  }, [progress, currentTextIndex]);

  // Fallback timeout
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      if (!hasCompletedRef.current) {
        console.warn("Preloader fallback triggered");
        handleComplete();
      }
    }, 7000);

    return () => clearTimeout(fallbackTimer);
  }, [handleComplete]);

  // Main loading animation timeline
  useGSAP(
    () => {
      const tl = gsap.timeline({
        onComplete: () => {
          // Enhanced exit animation: scale + fade + blur + slide
          const exitTl = gsap.timeline({ onComplete: handleComplete });

          exitTl
            .to(iconContainerRef.current, {
              scale: 0.8,
              opacity: 0,
              duration: 0.3,
              ease: "power2.in",
            })
            .to(
              [percentRef.current, barRef.current?.parentElement],
              {
                opacity: 0,
                y: -20,
                duration: 0.25,
                ease: "power2.in",
                stagger: 0.05,
              },
              "<0.1",
            )
            .to(
              containerRef.current,
              {
                yPercent: -100,
                duration: 0.6,
                ease: "power3.inOut",
              },
              "<0.15",
            );
        },
      });

      // Animate percentage 0 -> 100 with organic easing
      const progressObj = { value: 0 };

      tl.to(progressObj, {
        value: 100,
        duration: 4,
        ease: "power2.out", // Fast start, slow finish
        onUpdate: function () {
          const val = Math.round(progressObj.value);
          setProgress(val);
          if (percentRef.current) {
            percentRef.current.innerText = val + "%";
          }
        },
      });

      // Sync progress bar with smooth fill
      tl.to(
        barRef.current,
        {
          scaleX: 1,
          duration: 4,
          ease: "power2.out",
        },
        "<",
      );

      // Shimmer animation on bar
      if (shimmerRef.current) {
        gsap.to(shimmerRef.current, {
          xPercent: 200,
          duration: 1.5,
          ease: "power1.inOut",
          repeat: -1,
          repeatDelay: 0.3,
        });
      }

      // Subtle breathing effect on icon container
      gsap.to(iconContainerRef.current, {
        scale: 1.02,
        duration: 1.2,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
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
      {/* Subtle pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        aria-hidden="true"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(0,0,0,0.4) 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="flex flex-col items-center gap-8 w-full max-w-md px-6">
        {/* Icon Container - Dark semi-transparent card */}
        <div
          ref={iconContainerRef}
          className="relative p-5 bg-black/10 backdrop-blur-sm border-2 border-black/20 shadow-[4px_4px_0_rgba(0,0,0,0.15)]"
        >
          <div className="relative w-20 h-20 sm:w-24 sm:h-24">
            <Image
              src={ACADEMIC_ICONS[currentIconIndex] || ACADEMIC_ICONS[0]!}
              alt="Loading..."
              fill
              className="object-contain drop-shadow-lg"
              unoptimized
              priority
            />
          </div>
        </div>

        {/* Counter Block */}
        <div className="flex flex-col items-center w-full gap-3">
          {/* Percentage */}
          <div className="text-6xl sm:text-7xl font-black tracking-tighter text-black tabular-nums">
            <span ref={percentRef}>0%</span>
          </div>

          {/* Progress Bar */}
          <div className="h-3 w-full max-w-xs bg-black/10 border-2 border-black/30 overflow-hidden relative">
            <div
              ref={barRef}
              className="absolute inset-0 bg-black origin-left transform scale-x-0"
            />
            {/* Shimmer overlay */}
            <div
              ref={shimmerRef}
              className="absolute inset-0 w-1/2 -translate-x-full"
              style={{
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)",
              }}
            />
          </div>
        </div>

        {/* Status Text - GSAP controlled */}
        <div className="h-6 overflow-hidden relative">
          <p
            ref={textRef}
            className="text-xs sm:text-sm font-bold tracking-[0.2em] text-black/70 uppercase"
          >
            {LOADING_TEXTS[currentTextIndex]}
          </p>
        </div>
      </div>

      {/* Bottom branding accent */}
      <div className="absolute bottom-0 left-0 right-0 h-2 bg-black/20" />
    </div>
  );
}

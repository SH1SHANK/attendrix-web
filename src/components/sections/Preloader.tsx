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
  "LOADING SUBJECTS...",
  "SYNCING CALENDAR...",
  "CALCULATING ATTENDANCE...",
  "CHECKING THRESHOLDS...",
  "FINALIZING SCHEDULE...",
];

export default function Preloader({ onComplete }: PreloaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const percentRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const hasCompletedRef = useRef(false);

  const [currentIconIndex, setCurrentIconIndex] = useState(0);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);

  // Memoize onComplete to prevent unnecessary re-runs
  const handleComplete = useCallback(() => {
    if (hasCompletedRef.current) return;
    hasCompletedRef.current = true;
    onComplete();
  }, [onComplete]);

  // Icon rotation
  useEffect(() => {
    const iconInterval = setInterval(() => {
      setCurrentIconIndex((prev) => (prev + 1) % ACADEMIC_ICONS.length);
    }, 800);
    return () => clearInterval(iconInterval);
  }, []);

  // Text rotation
  useEffect(() => {
    const textInterval = setInterval(() => {
      setCurrentTextIndex((prev) => (prev + 1) % LOADING_TEXTS.length);
    }, 600);
    return () => clearInterval(textInterval);
  }, []);

  // Fallback timeout
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      if (!hasCompletedRef.current) {
        console.warn("Preloader fallback triggered");
        handleComplete();
      }
    }, 6000);

    return () => clearTimeout(fallbackTimer);
  }, [handleComplete]);

  useGSAP(
    () => {
      const tl = gsap.timeline({
        onComplete: () => {
          // Exit animation
          gsap.to(containerRef.current, {
            yPercent: -100,
            duration: 0.8,
            ease: "power2.inOut",
            onComplete: handleComplete,
          });
        },
      });

      // Animate percentage 0 -> 100 using a proxy object for safety
      const progressObj = { value: 0 };

      tl.to(progressObj, {
        value: 100,
        duration: 3.5,
        ease: "power1.inOut",
        onUpdate: function () {
          if (percentRef.current) {
            percentRef.current.innerText = Math.round(progressObj.value) + "%";
          }
        },
      });

      // Sync progress bar with the timeline
      // We start this at the same time as the counter
      tl.to(
        barRef.current,
        {
          scaleX: 1,
          duration: 3.5,
          ease: "power1.inOut",
        },
        "<", // Insert at start of previous animation
      );
    },
    { scope: containerRef },
  );

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-9999 flex flex-col items-center justify-center border-b-8 border-black font-display"
      style={{ backgroundColor: "#FFD02F" }} // Hardcoded for safety against var issues
    >
      <div className="flex flex-col items-center gap-6 w-full max-w-md px-4">
        {/* Animated Icon Container - Wrapped in Card to mask white backgrounds */}
        <div className="relative mb-4 bg-white border-2 border-black p-4 shadow-[4px_4px_0_#0a0a0a]">
          <div className="relative w-24 h-24 sm:w-32 sm:h-32">
            <Image
              src={ACADEMIC_ICONS[currentIconIndex] || ACADEMIC_ICONS[0]!}
              alt="Loading..."
              fill
              className="object-contain" // Keep aspect ratio
              unoptimized
            />
          </div>
        </div>

        {/* Counter Block */}
        <div className="flex flex-col items-center w-full gap-2">
          <div className="text-6xl sm:text-8xl font-black tracking-tighter text-black tabular-nums">
            <span ref={percentRef}>0%</span>
          </div>
          <div className="h-4 w-full bg-black/10 border-2 border-black rounded-none overflow-hidden relative max-w-xs">
            <div
              ref={barRef}
              className="absolute top-0 left-0 h-full bg-black w-full origin-left transform scale-x-0"
            />
          </div>
        </div>

        {/* Status Text */}
        <div className="h-8 overflow-hidden relative">
          <p className="text-sm font-bold tracking-widest text-black uppercase animate-pulse">
            {LOADING_TEXTS[currentTextIndex]}
          </p>
        </div>
      </div>
    </div>
  );
}

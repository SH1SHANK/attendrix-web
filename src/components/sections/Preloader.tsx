"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

interface PreloaderProps {
  onComplete: () => void;
}

export default function Preloader({ onComplete }: PreloaderProps) {
  const preloaderRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animate loading dots
      gsap.to(dotsRef.current?.children || [], {
        y: -10,
        stagger: 0.15,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut",
        duration: 0.5,
      });

      // Minimum display time of 1.5s
      gsap.delayedCall(1.5, () => {
        // Curtain lift: Slide preloader up and out
        gsap.to(preloaderRef.current, {
          y: "-100%",
          duration: 1.2,
          ease: "expo.inOut",
          onComplete: () => {
            onComplete();
          },
        });
      });
    }, preloaderRef);

    return () => ctx.revert();
  }, [onComplete]);

  return (
    <div
      ref={preloaderRef}
      className="fixed inset-0 z-50 bg-accent flex flex-col items-center justify-center border-b-8 border-black"
      style={{ willChange: "transform" }}
    >
      {/* RetroUI-style Loader */}
      <div className="flex flex-col items-center gap-8">
        {/* Logo/Brand */}
        <div className="bg-white border-4 border-black shadow-[8px_8px_0_#000] px-8 py-4">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-black">
            ATTENDRIX
          </h2>
        </div>

        {/* Loading Dots */}
        <div ref={dotsRef} className="flex gap-3">
          <div className="w-4 h-4 bg-black border-2 border-black" />
          <div className="w-4 h-4 bg-black border-2 border-black" />
          <div className="w-4 h-4 bg-black border-2 border-black" />
        </div>

        <p className="text-sm font-bold tracking-widest text-black">
          LOADING...
        </p>
      </div>
    </div>
  );
}

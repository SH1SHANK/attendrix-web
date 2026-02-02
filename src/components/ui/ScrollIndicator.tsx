"use client";

import { useEffect, useRef } from "react";

interface ScrollIndicatorProps {
  targetId?: string;
}

export function ScrollIndicator({
  targetId = "what-is-attendrix",
}: ScrollIndicatorProps) {
  const indicatorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!indicatorRef.current) return;

      const scrollPosition = window.scrollY;
      const opacity = Math.max(0, 1 - scrollPosition / 300);
      indicatorRef.current.style.opacity = opacity.toString();
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleClick = () => {
    const target = document.getElementById(targetId);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div
      ref={indicatorRef}
      onClick={handleClick}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 cursor-pointer group hidden md:block"
      style={{ transition: "opacity 0.3s ease" }}
    >
      <div className="flex flex-col items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
          Scroll
        </span>
        <div className="relative h-12 w-6 border-2 border-black rounded-full bg-white shadow-[2px_2px_0_#0a0a0a]">
          <div className="absolute top-2 left-1/2 -translate-x-1/2 h-2 w-1 bg-black rounded-full animate-scroll-bounce" />
        </div>
      </div>
    </div>
  );
}

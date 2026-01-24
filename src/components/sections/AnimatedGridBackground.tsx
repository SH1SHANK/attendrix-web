"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function AnimatedGridBackground() {
  const filledDotsRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animate all filled dots with staggered, randomized timing
      gsap.to(".filled-dot", {
        opacity: 0.8,
        duration: gsap.utils.random(3, 5, 0.1, true), // Random duration for each
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        stagger: {
          each: 0.15,
          from: "random",
          repeat: -1,
        },
      });
    }, filledDotsRef);

    return () => ctx.revert();
  }, []);

  // Generate random positions for filled dots
  // Using fixed seed-like values for SSR consistency
  const filledDots = [
    { x: 120, y: 80, delay: 0 },
    { x: 340, y: 150, delay: 0.3 },
    { x: 580, y: 95, delay: 0.6 },
    { x: 780, y: 220, delay: 0.9 },
    { x: 950, y: 130, delay: 1.2 },
    { x: 1150, y: 180, delay: 1.5 },
    { x: 1320, y: 90, delay: 1.8 },
    { x: 250, y: 320, delay: 2.1 },
    { x: 460, y: 380, delay: 2.4 },
    { x: 680, y: 340, delay: 2.7 },
    { x: 890, y: 410, delay: 3.0 },
    { x: 1080, y: 370, delay: 3.3 },
    { x: 1280, y: 330, delay: 3.6 },
    { x: 180, y: 520, delay: 3.9 },
    { x: 420, y: 580, delay: 4.2 },
    { x: 640, y: 540, delay: 4.5 },
    { x: 850, y: 600, delay: 4.8 },
    { x: 1060, y: 560, delay: 5.1 },
    { x: 1250, y: 610, delay: 5.4 },
    { x: 300, y: 720, delay: 5.7 },
    { x: 520, y: 780, delay: 6.0 },
    { x: 740, y: 740, delay: 6.3 },
    { x: 960, y: 800, delay: 6.6 },
    { x: 1180, y: 760, delay: 6.9 },
    { x: 1360, y: 720, delay: 7.2 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* SVG Grid */}
      <svg
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Base Grid Pattern - Faint dots */}
          <pattern
            id="scantron-grid"
            x="0"
            y="0"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <circle
              cx="20"
              cy="20"
              r="2.5"
              fill="#D1D5DB"
              opacity="1"
              className="base-dot"
            />
          </pattern>

          {/* Vignette Mask - Fades grid at edges */}
          <radialGradient id="vignette" cx="50%" cy="50%" r="80%">
            <stop offset="0%" stopColor="black" stopOpacity="1" />
            <stop offset="60%" stopColor="black" stopOpacity="0.8" />
            <stop offset="100%" stopColor="black" stopOpacity="0.2" />
          </radialGradient>
        </defs>

        {/* Apply the base grid pattern */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="url(#scantron-grid)"
          mask="url(#vignette-mask)"
        />

        {/* Vignette Mask Definition */}
        <mask id="vignette-mask">
          <rect x="0" y="0" width="100%" height="100%" fill="url(#vignette)" />
        </mask>

        {/* Filled Dots - These will animate */}
        <g ref={filledDotsRef}>
          {filledDots.map((dot, index) => (
            <circle
              key={index}
              className="filled-dot"
              cx={dot.x}
              cy={dot.y}
              r="4"
              fill="#374151"
              opacity="0.4"
              style={{
                willChange: "opacity",
              }}
            />
          ))}
        </g>
      </svg>

      {/* Additional CSS Vignette Overlay for extra fade */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 75% 65% at 50% 45%, transparent 20%, rgba(255, 255, 255, 0.3) 65%, rgba(255, 255, 255, 0.8) 100%)",
        }}
      />
    </div>
  );
}

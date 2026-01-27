"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/sections/Hero";
import Preloader from "@/components/sections/Preloader";
import Footer from "@/components/sections/Footer";

// Dynamic Imports for Below-the-Fold Content
const WhatIsAttendrix = dynamic(
  () => import("@/components/sections/WhatIsAttendrix"),
  { ssr: true },
);
const PlatformSelector = dynamic(
  () => import("@/components/sections/PlatformSelector"),
  { ssr: true },
);
const FeaturesGrid = dynamic(
  () => import("@/components/sections/FeaturesGrid"),
  { ssr: true },
);
const WebAccessSpotlight = dynamic(
  () => import("@/components/sections/WebAccessSpotlight"),
  { ssr: true },
);
const HowItWorks = dynamic(() => import("@/components/sections/HowItWorks"), {
  ssr: true,
});
const Gamification = dynamic(
  () => import("@/components/sections/Gamification"),
  { ssr: true },
);
const Pricing = dynamic(() => import("@/components/sections/Pricing"), {
  ssr: true,
});
const FAQ = dynamic(() => import("@/components/sections/FAQ"), { ssr: true });

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  // No side effects needed for immediate render

  return (
    <>
      {isLoading && <Preloader onComplete={() => setIsLoading(false)} />}

      {/* Render Main Content immediately but hidden/behind loader until ready? 
          Actually, we want it to render so attributes/images load. 
          The Preloader likely has a z-index covering everything. 
      */}
      <div
        className={
          isLoading
            ? "fixed inset-0 -z-30 opacity-0"
            : "animate-in fade-in duration-700"
        }
      >
        {/* 
            Note: If we hide it with opacity-0, we preserve LCP capability (browser loads bg images). 
            But if we want perfect LCP score, we should show it immediately. 
            However, the user has a specific "Preloader" design. 
            The compromise: Render logic is simpler. 
            We'll render it normally. The Preloader is fixed overlay.
          */}
      </div>

      <Navbar />
      <main className="relative min-h-screen overflow-hidden bg-stone-50 text-stone-950">
        {/* Global dot grid background */}
        <div
          className="pointer-events-none fixed inset-0 -z-20 opacity-[0.05]"
          aria-hidden="true"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(15,23,42,0.25) 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
        {/* Noise texture overlay */}
        <div
          className="pointer-events-none fixed inset-0 -z-10 mix-blend-multiply opacity-20"
          aria-hidden="true"
          style={{
            backgroundImage:
              "url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 200%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22200%25%22 height=%22200%25%22 filter=%22url(%23noise)%22 opacity=%220.22%22/%3E%3C/svg%3E')",
          }}
        />

        {/* Hero is critical - keep it sync or high priority */}
        <Hero isVisible={!isLoading} />

        {/* Lazy load the rest */}
        <WhatIsAttendrix />
        <PlatformSelector />
        <FeaturesGrid />
        <WebAccessSpotlight />
        <HowItWorks />
        <Gamification />
        <Pricing />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}

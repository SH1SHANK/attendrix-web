"use client";

import { useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/sections/Hero";
const Preloader = dynamic(() => import("@/components/sections/Preloader"), {
  ssr: false,
});
import Footer from "@/components/sections/Footer";

gsap.registerPlugin(useGSAP);

// Dynamic Imports for Below-the-Fold Content
const WhatIsAttendrix = dynamic(
  () => import("@/components/sections/WhatIsAttendrix"),
  { ssr: true },
);
const ChooseYourWeapon = dynamic(
  () => import("@/components/sections/ChooseYourWeapon"),
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
  const [heroReady, setHeroReady] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);

  // Coordinated reveal after preloader completes
  const handlePreloaderComplete = useCallback(() => {
    setIsLoading(false);

    // Small delay to ensure DOM is ready, then trigger reveal
    requestAnimationFrame(() => {
      // Animate navbar entry
      if (navRef.current) {
        gsap.fromTo(
          navRef.current,
          { y: -20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" },
        );
      }

      // Trigger hero animations
      setHeroReady(true);

      // Animate main content container
      if (mainRef.current) {
        gsap.fromTo(
          mainRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.4, ease: "power2.out" },
        );
      }
    });
  }, []);

  return (
    <>
      {isLoading && <Preloader onComplete={handlePreloaderComplete} />}

      {/* Navbar with ref for coordinated animation */}
      <div
        ref={navRef as React.RefObject<HTMLDivElement>}
        style={{ opacity: isLoading ? 0 : undefined }}
      >
        <Navbar />
      </div>

      <main
        ref={mainRef}
        className="relative min-h-screen overflow-hidden bg-stone-50 text-stone-950"
        style={{ opacity: isLoading ? 0 : undefined }}
      >
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

        {/* Hero is critical - triggered after preloader */}
        <Hero isVisible={heroReady} />

        {/* Lazy load the rest */}
        <Navbar />
        <WhatIsAttendrix />
        <ChooseYourWeapon />
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

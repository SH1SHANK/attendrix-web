"use client";

import { useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/sections/Hero";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
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
const StudyMaterialsSpotlight = dynamic(
  () => import("@/components/sections/StudyMaterialsSpotlight"),
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
        className="relative min-h-screen overflow-hidden text-stone-950"
        style={{ opacity: isLoading ? 0 : undefined }}
      >
        {/* Hero is critical - triggered after preloader */}
        <Hero isVisible={heroReady} />

        <div className="mx-auto w-full max-w-6xl px-6 pb-8 sm:px-8 lg:px-12">
          <InstallPrompt variant="banner" />
        </div>

        {/* Lazy load the rest */}
        <Navbar />
        <WhatIsAttendrix />
        <ChooseYourWeapon />
        <FeaturesGrid />
        <WebAccessSpotlight />
        <StudyMaterialsSpotlight />
        <HowItWorks />
        <Gamification />
        <Pricing />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}

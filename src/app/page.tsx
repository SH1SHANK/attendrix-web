"use client";

import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/sections/Hero";
import Preloader from "@/components/sections/Preloader";
import FeaturesGrid from "@/components/sections/FeaturesGrid";
import WebAccessSpotlight from "@/components/sections/WebAccessSpotlight";
import HowItWorks from "@/components/sections/HowItWorks";
import Gamification from "@/components/sections/Gamification";
import Pricing from "@/components/sections/Pricing";
import FAQ from "@/components/sections/FAQ";
import Footer from "@/components/sections/Footer";

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <>
      {isLoading && <Preloader onComplete={() => setIsLoading(false)} />}

      {!isLoading && (
        <>
          <Navbar />
          <main className="relative min-h-screen overflow-hidden bg-stone-50 text-stone-950">
            <div
              className="pointer-events-none fixed inset-0 -z-20 opacity-[0.05]"
              aria-hidden="true"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, rgba(15,23,42,0.25) 1px, transparent 0)",
                backgroundSize: "28px 28px",
              }}
            />
            <div
              className="pointer-events-none fixed inset-0 -z-10 mix-blend-multiply opacity-20"
              aria-hidden="true"
              style={{
                backgroundImage:
                  "url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 200%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22200%25%22 height=%22200%25%22 filter=%22url(%23noise)%22 opacity=%220.22%22/%3E%3C/svg%3E')",
              }}
            />
            <Hero isVisible={!isLoading} />
            <FeaturesGrid />
            <WebAccessSpotlight />
            <HowItWorks />
            <Gamification />
            <Pricing />
            <FAQ />
          </main>
          <Footer />
        </>
      )}
    </>
  );
}

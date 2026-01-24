"use client";

import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/sections/Hero";
import Preloader from "@/components/sections/Preloader";
import FeaturesGrid from "@/components/sections/FeaturesGrid";
import HowItWorks from "@/components/sections/HowItWorks";
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
          <main>
            <Hero isVisible={!isLoading} />
            <FeaturesGrid />
            <HowItWorks />
            <Pricing />
            <FAQ />
          </main>
          <Footer />
        </>
      )}
    </>
  );
}

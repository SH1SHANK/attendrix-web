"use client";

import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Download, BookOpen } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative bg-surface overflow-hidden border-b-2 border-black bg-grid">
      {/* Top accent bar */}
      <div className="h-1 bg-black" />

      <div className="container-tight section flex flex-col items-center justify-center text-center py-20 lg:py-32">
        {/* Status badge */}
        <div className="mb-8">
          <Badge variant="dark" className="gap-2">
            <span className="w-1.5 h-1.5 bg-success rounded-full" />
            <span>V1.3.2 BETA</span>
          </Badge>
        </div>

        {/* Main Headline */}
        <div className="space-y-6 max-w-5xl mx-auto mb-12">
          <h1 className="heading-display leading-[0.9] text-5xl sm:text-7xl lg:text-8xl tracking-tighter text-black">
            TRACK YOUR
            <br />
            <span className="relative inline-block mx-2 my-2 sm:my-0">
              <span className="relative z-10 inline-block bg-accent px-4 py-1 border-3 border-black shadow-[6px_6px_0_#000] -rotate-1 text-black">
                ATTENDANCE
              </span>
            </span>
            <br />
            <span className="text-muted-foreground">NOT YOUR LUCK.</span>
          </h1>

          <p className="body-lg text-muted-foreground max-w-2xl mx-auto text-lg sm:text-xl leading-relaxed font-medium">
            Subject-wise tracking for NITC students. Policy-compliant
            calculations. Know exactly how many classes you can skip—per
            subject.
          </p>
        </div>

        {/* CTA Block */}
        <div className="flex flex-col sm:flex-row gap-4 mb-16 w-full sm:w-auto px-4">
          <Button
            asChild
            variant="default"
            size="lg"
            className="w-full sm:w-auto shadow-[4px_4px_0_#000] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#000] transition-all border-2 border-black text-lg px-8 py-6 h-auto tracking-wide font-bold"
          >
            <a href="#">
              DOWNLOAD APK
              <Download className="w-5 h-5 ml-2" strokeWidth={3} />
            </a>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="w-full sm:w-auto border-2 border-black text-lg px-8 py-6 h-auto hover:bg-paper tracking-wide font-bold shadow-none"
          >
            <a href="#docs">
              READ THE DOCS
              <BookOpen className="w-5 h-5 ml-2" strokeWidth={3} />
            </a>
          </Button>
        </div>

        {/* Stats Row */}
        <div className="inline-flex flex-wrap justify-center items-center gap-8 sm:gap-16 pt-8 border-t-2 border-black px-8 sm:px-16 bg-surface">
          <div className="text-center">
            <p className="stat-value text-4xl sm:text-5xl text-black">8</p>
            <p className="stat-label mt-2 text-xs tracking-widest font-bold text-muted-foreground">
              SUBJECTS
            </p>
          </div>

          <div className="hidden sm:block w-[2px] h-12 bg-border-light" />

          <div className="text-center">
            <p className="stat-value text-4xl sm:text-5xl text-black">80%</p>
            <p className="stat-label mt-2 text-xs tracking-widest font-bold text-muted-foreground">
              THRESHOLD
            </p>
          </div>

          <div className="hidden sm:block w-[2px] h-12 bg-border-light" />

          <div className="text-center">
            <div className="flex items-center justify-center gap-3">
              <span className="w-3 h-3 bg-success animate-pulse rounded-none" />
              <p className="stat-value text-4xl sm:text-5xl text-black">
                Active
              </p>
            </div>
            <p className="stat-label mt-2 text-xs tracking-widest font-bold text-muted-foreground">
              SYSTEM STATUS
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

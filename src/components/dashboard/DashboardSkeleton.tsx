"use client";

import { cn } from "@/lib/utils";

function SkeletonPulse({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse bg-neutral-200 border-2 border-black/10",
        className,
      )}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#fffdf5] relative overflow-x-hidden">
      {/* Global Dotted Grid Background */}
      <div
        className="fixed inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: "radial-gradient(#000 1.5px, transparent 1.5px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12 relative z-10">
        {/* Header Skeleton */}
        <header className="mb-8 sm:mb-10 lg:mb-12 flex flex-col items-start gap-3 sm:gap-4">
          <SkeletonPulse className="h-8 w-24 rounded-full" />
          <div className="space-y-2">
            <SkeletonPulse className="h-12 sm:h-16 md:h-20 w-64 sm:w-80 md:w-96" />
            <SkeletonPulse className="h-6 w-40 sm:w-48" />
          </div>
        </header>

        {/* Vertical Stack Layout */}
        <div className="flex flex-col gap-6 sm:gap-8 md:gap-10 lg:gap-12">
          {/* Countdown Card Skeleton */}
          <div className="w-full">
            <SkeletonPulse className="h-48 sm:h-56 md:h-64 lg:h-72 w-full shadow-[4px_4px_0px_0px_#000] sm:shadow-[6px_6px_0px_0px_#000] md:shadow-[8px_8px_0px_0px_#000]" />
          </div>

          {/* Divider */}
          <div className="relative w-full h-8 sm:h-10 md:h-12 flex items-center justify-center">
            <div className="w-full border-t-2 border-black/20 border-dashed" />
            <div className="absolute flex items-center gap-2 sm:gap-3 bg-[#fffdf5] px-4 sm:px-6">
              <div className="h-3 w-3 sm:h-4 sm:w-4 rotate-45 bg-black/20 border-2 border-black/20" />
              <div className="h-3 w-3 sm:h-4 sm:w-4 rotate-45 bg-black/10 border-2 border-black/20" />
              <div className="h-3 w-3 sm:h-4 sm:w-4 rotate-45 bg-black/20 border-2 border-black/20" />
            </div>
          </div>

          {/* Today's Schedule Skeleton */}
          <div className="w-full space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between border-b-2 border-black/20 pb-3 sm:pb-4 md:pb-6">
              <div className="flex items-center gap-2">
                <SkeletonPulse className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 rounded" />
                <SkeletonPulse className="h-6 sm:h-8 md:h-10 w-40 sm:w-48 md:w-56" />
              </div>
              <SkeletonPulse className="h-4 w-16 sm:w-20" />
            </div>

            <div className="space-y-3 sm:space-y-4 md:space-y-6">
              {[1, 2, 3].map((i) => (
                <SkeletonPulse
                  key={i}
                  className="h-24 sm:h-28 md:h-32 w-full shadow-[4px_4px_0px_0px_#000] sm:shadow-[6px_6px_0px_0px_#000]"
                />
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="relative w-full h-8 sm:h-10 md:h-12 flex items-center justify-center">
            <div className="w-full border-t-2 border-black/20 border-dashed" />
            <div className="absolute flex items-center gap-2 sm:gap-3 bg-[#fffdf5] px-4 sm:px-6">
              <div className="h-3 w-3 sm:h-4 sm:w-4 rotate-45 bg-black/20 border-2 border-black/20" />
              <div className="h-3 w-3 sm:h-4 sm:w-4 rotate-45 bg-black/10 border-2 border-black/20" />
              <div className="h-3 w-3 sm:h-4 sm:w-4 rotate-45 bg-black/20 border-2 border-black/20" />
            </div>
          </div>

          {/* Upcoming Classes Skeleton */}
          <div className="w-full">
            <SkeletonPulse className="h-96 sm:h-112 md:h-128 w-full shadow-[4px_4px_0px_0px_#000] sm:shadow-[5px_5px_0px_0px_#000] md:shadow-[6px_6px_0px_0px_#000]" />
          </div>
        </div>

        {/* Footer Spacer */}
        <div className="h-16 sm:h-20 md:h-24" />
      </div>
    </div>
  );
}

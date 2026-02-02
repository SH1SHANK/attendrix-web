"use client";

import { RetroSkeleton } from "@/components/ui/skeleton";

interface ReleasesSkeletonProps {
  count?: number;
}

export function ReleasesSkeleton({ count = 3 }: ReleasesSkeletonProps) {
  return (
    <div className="relative border-l-2 border-black/20 ml-4 md:ml-8 space-y-12 py-8">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="relative pl-8 md:pl-12">
          <div className="absolute -left-2.25 top-8 w-4 h-4 rounded-full bg-white border-4 border-black box-content z-10" />
          <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0_#000]">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <RetroSkeleton className="h-6 w-20" />
              <RetroSkeleton className="h-6 w-32" />
            </div>
            <RetroSkeleton className="h-8 w-48 mb-4" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-neutral-100">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="space-y-2">
                  <RetroSkeleton className="h-3 w-12" />
                  <RetroSkeleton className="h-4 w-full max-w-25" />
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t-2 border-black/5 space-y-4">
              <RetroSkeleton className="h-14 w-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="bg-white border-2 border-black p-6 shadow-[8px_8px_0_#000]">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <RetroSkeleton className="h-6 w-20" />
        <RetroSkeleton className="h-6 w-32" />
      </div>
      <RetroSkeleton className="h-12 w-56 mb-4" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-neutral-100">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <RetroSkeleton className="h-3 w-12" />
            <RetroSkeleton className="h-4 w-full max-w-25" />
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t-2 border-black/5 space-y-4">
        <RetroSkeleton className="h-14 w-full" />
        <RetroSkeleton className="h-24 w-full" />
      </div>
    </div>
  );
}

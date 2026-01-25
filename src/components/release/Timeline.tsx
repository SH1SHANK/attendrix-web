"use client";

import { useState } from "react";
import { type Release } from "@/lib/github";
import { ReleaseCard } from "./ReleaseCard";
import { ChevronDown } from "lucide-react";
import { differenceInMonths, parse } from "date-fns";

interface TimelineProps {
  releases: Release[];
}

export function Timeline({ releases }: TimelineProps) {
  const [showAll, setShowAll] = useState(false);

  // Group into "Recent" and "Archived" (older than 6 months)
  const now = new Date();
  const recentReleases = releases.filter((r) => {
    try {
      // Date format from github.ts is "MMM dd, yyyy"
      const releaseDate = parse(r.date, "MMM dd, yyyy", new Date());
      return differenceInMonths(now, releaseDate) < 6;
    } catch (e) {
      return true; // Keep if date parse fails
    }
  });

  const archivedReleases = releases.filter((r) => !recentReleases.includes(r));

  // If no archived releases, or very few total, just show all
  const displayReleases = showAll
    ? releases
    : archivedReleases.length > 0
      ? recentReleases
      : releases;

  const hasHidden = !showAll && archivedReleases.length > 0;

  return (
    <div className="relative border-l-2 border-black/20 ml-4 md:ml-8 space-y-12 py-8">
      {displayReleases.map((release, index) => (
        <div key={release.releaseId} className="relative pl-8 md:pl-12">
          {/* Timeline Dot */}
          <div className="absolute left-[-9px] top-8 w-4 h-4 rounded-full bg-white border-4 border-black box-content z-10" />

          <ReleaseCard release={release} />
        </div>
      ))}

      {hasHidden && (
        <div className="relative pl-8 md:pl-12 pt-4">
          <div className="absolute left-[-5px] top-10 w-2 h-2 rounded-full bg-neutral-300" />
          <button
            onClick={() => setShowAll(true)}
            className="flex items-center gap-2 px-6 py-3 bg-neutral-100 border-2 border-black font-bold uppercase text-xs tracking-wider hover:bg-white transition-colors"
          >
            Load {archivedReleases.length} Older Versions
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

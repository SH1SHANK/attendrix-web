"use client";

import { useState, useMemo } from "react";
import { type Release } from "@/lib/github";
import { ReleaseCard } from "@/components/release/ReleaseCard";
import { FilterBar } from "@/components/release/FilterBar";
import { motion } from "framer-motion";

type FilterType = "all" | "stable" | "prerelease";

interface ReleasesClientProps {
  releases: Release[];
}

export function ReleasesClient({ releases }: ReleasesClientProps) {
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter and search logic
  const filteredReleases = useMemo(() => {
    let filtered = releases;

    // Apply status filter
    if (filter === "stable") {
      filtered = filtered.filter((r) => r.status === "stable");
    } else if (filter === "prerelease") {
      filtered = filtered.filter((r) => r.status !== "stable");
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.version.toLowerCase().includes(query) ||
          r.body.toLowerCase().includes(query),
      );
    }

    return filtered;
  }, [releases, filter, searchQuery]);

  // Calculate counts for filter badges
  const stableCount = releases.filter((r) => r.status === "stable").length;
  const prereleaseCount = releases.filter((r) => r.status !== "stable").length;

  // Get latest stable for hero section
  const latestStable =
    releases.find((r) => r.status === "stable") || releases[0];

  // Get timeline releases (excluding hero)
  const timelineReleases = filteredReleases.filter(
    (r) => r.releaseId !== latestStable?.releaseId,
  );

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <>
      {/* Filter Bar */}
      <FilterBar
        totalCount={releases.length}
        stableCount={stableCount}
        prereleaseCount={prereleaseCount}
        onFilterChange={setFilter}
        onSearchChange={setSearchQuery}
        currentFilter={filter}
        searchQuery={searchQuery}
      />

      {/* Latest Release Hero */}
      {latestStable && filter === "all" && !searchQuery && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-20"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="font-mono text-sm font-bold uppercase tracking-wider text-black">
              Latest Release
            </span>
          </div>
          <ReleaseCard release={latestStable} isHero />
        </motion.section>
      )}

      {/* Release History / Filtered Results */}
      {timelineReleases.length > 0 && (
        <section>
          <h2 className="text-2xl font-black uppercase tracking-tight mb-8 border-b-2 border-black inline-block pb-1">
            {searchQuery
              ? `Search Results (${timelineReleases.length})`
              : filter !== "all"
                ? `${filter === "stable" ? "Stable" : "Pre-release"} Releases`
                : "Release History"}
          </h2>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-6"
          >
            {timelineReleases.map((release) => (
              <motion.div key={release.releaseId} variants={itemVariants}>
                <ReleaseCard release={release} />
              </motion.div>
            ))}
          </motion.div>
        </section>
      )}

      {/* Empty State */}
      {filteredReleases.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="py-20 flex flex-col items-center justify-center text-center border-2 border-dashed border-neutral-300"
        >
          <div className="bg-neutral-100 p-4 mb-4 border-2 border-black shadow-[4px_4px_0_#000]">
            <span className="text-4xl">🔍</span>
          </div>
          <h3 className="text-xl font-bold uppercase mb-2">
            No Releases Found
          </h3>
          <p className="text-neutral-500 max-w-md mb-4">
            {searchQuery
              ? `No releases match "${searchQuery}"`
              : `No ${filter === "stable" ? "stable" : "pre-release"} releases available`}
          </p>
          {(searchQuery || filter !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setFilter("all");
              }}
              className="px-6 py-2 bg-black text-white font-bold uppercase text-sm border-2 border-black hover:bg-neutral-800 transition-colors shadow-[4px_4px_0_#000] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]"
            >
              Clear Filters
            </button>
          )}
        </motion.div>
      )}
    </>
  );
}

"use client";

import { useState, useMemo, useCallback, memo } from "react";
import { type Release } from "@/lib/github";
import { ReleaseCard } from "@/components/release/ReleaseCard";
import { FilterBar } from "@/components/release/FilterBar";
import { motion, AnimatePresence } from "framer-motion";

type FilterType = "all" | "stable" | "prerelease";

interface ReleasesClientProps {
  releases: Release[];
}

// Memoized ReleaseCard wrapper
const MemoizedReleaseCard = memo(ReleaseCard);

export function ReleasesClient({ releases }: ReleasesClientProps) {
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Memoized callbacks for better performance
  const handleFilterChange = useCallback((newFilter: FilterType) => {
    setFilter(newFilter);
  }, []);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Filter and search logic - optimized with useMemo
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

  // Calculate counts for filter badges - memoized for performance
  const { stableCount, prereleaseCount } = useMemo(
    () => ({
      stableCount: releases.filter((r) => r.status === "stable").length,
      prereleaseCount: releases.filter((r) => r.status !== "stable").length,
    }),
    [releases],
  );

  // Get latest stable for hero section - memoized
  const latestStable = useMemo(
    () => releases.find((r) => r.status === "stable") || releases[0],
    [releases],
  );

  // Get timeline releases (excluding hero) - memoized
  const timelineReleases = useMemo(
    () =>
      filteredReleases.filter((r) => r.releaseId !== latestStable?.releaseId),
    [filteredReleases, latestStable],
  );

  // Clear filters callback
  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    setFilter("all");
  }, []);

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
        onFilterChange={handleFilterChange}
        onSearchChange={handleSearchChange}
        currentFilter={filter}
        searchQuery={searchQuery}
      />

      {/* Latest Release Hero */}
      <AnimatePresence mode="wait">
        {latestStable && filter === "all" && !searchQuery && (
          <motion.section
            key="hero"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="mb-20"
          >
            <div className="flex items-center gap-2 mb-4">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-3 h-3 bg-red-500 rounded-full"
              />
              <span className="font-mono text-sm font-bold uppercase tracking-wider text-black">
                Latest Release
              </span>
            </div>
            <MemoizedReleaseCard release={latestStable} isHero />
          </motion.section>
        )}
      </AnimatePresence>

      {/* Release History / Filtered Results */}
      <AnimatePresence mode="wait">
        {timelineReleases.length > 0 && (
          <motion.section
            key="timeline"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.h2
              layout
              className="text-2xl font-black uppercase tracking-tight mb-8 border-b-2 border-black inline-block pb-1"
            >
              {searchQuery
                ? `Search Results (${timelineReleases.length})`
                : filter !== "all"
                  ? `${filter === "stable" ? "Stable" : "Pre-release"} Releases`
                  : "Release History"}
            </motion.h2>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="space-y-6"
            >
              {timelineReleases.map((release) => (
                <motion.div
                  key={release.releaseId}
                  variants={itemVariants}
                  layout
                >
                  <MemoizedReleaseCard release={release} />
                </motion.div>
              ))}
            </motion.div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Empty State */}
      <AnimatePresence>
        {filteredReleases.length === 0 && (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="py-20 flex flex-col items-center justify-center text-center border-2 border-dashed border-neutral-300 bg-neutral-50"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="bg-white p-6 mb-4 border-2 border-black shadow-[4px_4px_0_#000]"
            >
              <span className="text-4xl">🔍</span>
            </motion.div>
            <h3 className="text-xl font-bold uppercase mb-2">
              No Releases Found
            </h3>
            <p className="text-neutral-500 max-w-md mb-4">
              {searchQuery
                ? `No releases match "${searchQuery}"`
                : `No ${filter === "stable" ? "stable" : "pre-release"} releases available`}
            </p>
            {(searchQuery || filter !== "all") && (
              <motion.button
                onClick={handleClearFilters}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2 bg-black text-white font-bold uppercase text-sm border-2 border-black hover:bg-neutral-800 transition-colors shadow-[4px_4px_0_#000] active:shadow-none active:translate-x-1 active:translate-y-1"
              >
                Clear Filters
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

"use client";

import { useState } from "react";
import { Search, Filter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type FilterType = "all" | "stable" | "prerelease";

interface FilterBarProps {
  totalCount: number;
  stableCount: number;
  prereleaseCount: number;
  onFilterChange: (filter: FilterType) => void;
  onSearchChange: (query: string) => void;
  currentFilter: FilterType;
  searchQuery: string;
}

export function FilterBar({
  totalCount,
  stableCount,
  prereleaseCount,
  onFilterChange,
  onSearchChange,
  currentFilter,
  searchQuery,
}: FilterBarProps) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const filters: { type: FilterType; label: string; count: number }[] = [
    { type: "all", label: "All Releases", count: totalCount },
    { type: "stable", label: "Stable", count: stableCount },
    { type: "prerelease", label: "Pre-release", count: prereleaseCount },
  ];

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, filterType: FilterType) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onFilterChange(filterType);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="sticky top-20 z-30 bg-[#fffdf5]/95 backdrop-blur-sm pb-6 mb-10"
    >
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Filter Tabs - Simplified */}
        <div
          className="flex gap-2 overflow-x-auto scrollbar-hide"
          role="tablist"
          aria-label="Release filters"
        >
          {filters.map((filter, index) => (
            <motion.button
              key={filter.type}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08 }}
              onClick={() => onFilterChange(filter.type)}
              onKeyDown={(e) => handleKeyDown(e, filter.type)}
              role="tab"
              aria-selected={currentFilter === filter.type}
              aria-controls={`${filter.type}-panel`}
              tabIndex={currentFilter === filter.type ? 0 : -1}
              className={cn(
                "px-4 py-2.5 font-bold uppercase text-xs tracking-wide border-2 border-black transition-all duration-150 whitespace-nowrap",
                "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black",
                currentFilter === filter.type
                  ? "bg-black text-white shadow-[3px_3px_0_#000]"
                  : "bg-white text-black hover:bg-neutral-50 shadow-[2px_2px_0_#000] hover:shadow-[3px_3px_0_#000] hover:-translate-y-0.5 active:shadow-[1px_1px_0_#000] active:translate-y-0",
              )}
            >
              {filter.label}
              <span
                className={cn(
                  "ml-2 px-1.5 py-0.5 text-[10px] font-mono border border-current rounded-sm",
                  currentFilter === filter.type
                    ? "bg-white text-black"
                    : "bg-neutral-100",
                )}
              >
                {filter.count}
              </span>
            </motion.button>
          ))}
        </div>

        {/* Search Bar - Simplified */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="relative flex-1 md:max-w-xs"
        >
          <div
            className={cn(
              "flex items-center gap-2 border-2 border-black bg-white transition-all duration-150",
              isSearchFocused
                ? "shadow-[3px_3px_0_#000]"
                : "shadow-[2px_2px_0_#000]",
            )}
          >
            <Search
              className={cn(
                "w-4 h-4 ml-3 transition-colors",
                isSearchFocused ? "text-black" : "text-neutral-400",
              )}
            />
            <input
              type="text"
              placeholder="Search versions..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              aria-label="Search releases"
              className="flex-1 py-2 pr-3 bg-transparent font-medium text-sm focus:outline-none placeholder:text-neutral-400"
            />
            <AnimatePresence>
              {searchQuery && (
                <motion.button
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  onClick={() => onSearchChange("")}
                  aria-label="Clear search"
                  className="mr-2 px-2 py-1 text-xs font-bold text-neutral-600 hover:text-black transition-colors"
                >
                  ✕
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Active Filter Indicator */}
      {(currentFilter !== "all" || searchQuery) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 flex items-center gap-2 text-sm"
        >
          <Filter className="w-4 h-4" />
          <span className="font-medium">
            {searchQuery && (
              <>
                Searching for <strong>&quot;{searchQuery}&quot;</strong>
                {currentFilter !== "all" && " in "}
              </>
            )}
            {currentFilter !== "all" && (
              <strong>
                {currentFilter === "stable" ? "Stable" : "Pre-release"} releases
              </strong>
            )}
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}

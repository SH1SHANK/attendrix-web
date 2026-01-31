"use client";

import { useState } from "react";
import { Search, Filter } from "lucide-react";
import { motion } from "framer-motion";
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

  return (
    <div className="sticky top-20 z-30 bg-[#fffdf5] pb-6 mb-8 border-b-4 border-black">
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          {filters.map((filter) => (
            <button
              key={filter.type}
              onClick={() => onFilterChange(filter.type)}
              className={cn(
                "px-4 py-2 font-bold uppercase text-sm border-2 border-black transition-all whitespace-nowrap",
                "shadow-[2px_2px_0_#000] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]",
                currentFilter === filter.type
                  ? "bg-black text-white"
                  : "bg-white text-black hover:bg-neutral-100",
              )}
            >
              {filter.label}
              <span
                className={cn(
                  "ml-2 px-1.5 py-0.5 text-xs font-mono border border-current",
                  currentFilter === filter.type
                    ? "bg-white text-black"
                    : "bg-black text-white",
                )}
              >
                {filter.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 md:max-w-xs">
          <div
            className={cn(
              "flex items-center gap-2 border-2 border-black bg-white transition-all",
              isSearchFocused
                ? "shadow-[4px_4px_0_#000]"
                : "shadow-[2px_2px_0_#000]",
            )}
          >
            <Search className="w-4 h-4 ml-3 text-neutral-400" />
            <input
              type="text"
              placeholder="Search versions..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className="flex-1 py-2 pr-3 bg-transparent font-medium text-sm focus:outline-none placeholder:text-neutral-400"
            />
            {searchQuery && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={() => onSearchChange("")}
                className="mr-2 px-2 py-1 text-xs font-bold border border-black bg-neutral-100 hover:bg-neutral-200"
              >
                Clear
              </motion.button>
            )}
          </div>
        </div>
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
    </div>
  );
}

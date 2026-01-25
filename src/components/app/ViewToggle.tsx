"use client";

import { motion } from "framer-motion";
import { Calendar, List } from "lucide-react";

type ViewMode = "calendar" | "list";

interface ViewToggleProps {
  activeView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export function ViewToggle({ activeView, onViewChange }: ViewToggleProps) {
  return (
    <div className="inline-flex border-2 border-black bg-white">
      <button
        onClick={() => onViewChange("calendar")}
        className={`
          relative flex items-center gap-2 px-4 py-2.5 font-mono text-sm font-bold uppercase tracking-wider
          transition-all duration-200
          ${
            activeView === "calendar"
              ? "bg-black text-white"
              : "bg-white text-black hover:bg-neutral-100"
          }
        `}
      >
        <Calendar className="w-4 h-4" />
        <span>Calendar</span>
        {activeView === "calendar" && (
          <motion.div
            className="absolute inset-0 bg-black -z-10"
            layoutId="viewToggle"
          />
        )}
      </button>

      <div className="w-px bg-black" />

      <button
        onClick={() => onViewChange("list")}
        className={`
          relative flex items-center gap-2 px-4 py-2.5 font-mono text-sm font-bold uppercase tracking-wider
          transition-all duration-200
          ${
            activeView === "list"
              ? "bg-black text-white"
              : "bg-white text-black hover:bg-neutral-100"
          }
        `}
      >
        <List className="w-4 h-4" />
        <span>History</span>
        {activeView === "list" && (
          <motion.div
            className="absolute inset-0 bg-black -z-10"
            layoutId="viewToggle"
          />
        )}
      </button>
    </div>
  );
}

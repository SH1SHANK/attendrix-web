"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Drawer } from "@/components/ui/Drawer";
import {
  X,
  Plus,
  Minus,
  RotateCcw,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface AttendanceCalculatorSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseData: {
    courseID: string;
    courseName: string;
    attendedClasses: number;
    totalClasses: number;
  } | null;
  targetGoal?: number; // Global target goal passed from parent
}

// ============================================================================
// Component
// ============================================================================

export function AttendanceCalculatorSheet({
  open,
  onOpenChange,
  courseData,
  targetGoal = 80, // Default to 80 if not provided
}: AttendanceCalculatorSheetProps) {
  const [simAttended, setSimAttended] = useState(
    courseData?.attendedClasses || 0,
  );
  const [simTotal, setSimTotal] = useState(courseData?.totalClasses || 0);

  if (!courseData) return null;

  // Calculate percentages
  const currentPct =
    courseData.totalClasses > 0
      ? Math.round((courseData.attendedClasses / courseData.totalClasses) * 100)
      : 0;

  const projectedPct =
    simTotal > 0 ? Math.round((simAttended / simTotal) * 100) : 0;

  const pctChange = projectedPct - currentPct;

  // Determine status based on target goal
  const getStatus = (pct: number) => {
    if (pct >= targetGoal) return "safe";
    if (pct >= targetGoal - 5) return "warning";
    return "critical";
  };

  // Handle actions
  const handleAttend = () => {
    setSimAttended((prev) => prev + 1);
    setSimTotal((prev) => prev + 1);
  };

  const handleMiss = () => {
    setSimTotal((prev) => prev + 1);
  };

  const handleReset = () => {
    setSimAttended(courseData.attendedClasses);
    setSimTotal(courseData.totalClasses);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <Drawer.Content className="bg-white border-l-4 border-black shadow-[-8px_0_0_0_#000]">
        {/* Header */}
        <div className="border-b-2 border-black bg-neutral-900 text-white p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-black uppercase text-lg tracking-tight">
              Simulation Deck
            </h2>
            <button
              onClick={() => onOpenChange(false)}
              className="w-8 h-8 border-2 border-white hover:bg-white hover:text-black transition-colors flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="font-mono text-xs text-yellow-400 uppercase tracking-wide">
            {"// "}
            {courseData.courseID}
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-80px)]">
          {/* Course Name */}
          <div>
            <h3 className="font-bold uppercase text-sm text-neutral-500 mb-1">
              Course
            </h3>
            <p className="font-black text-lg leading-tight">
              {courseData.courseName}
            </p>
          </div>

          {/* Current State Display */}
          <div className="border-2 border-black bg-neutral-100 p-4">
            <p className="font-mono text-xs uppercase text-neutral-600 mb-2">
              Current Status
            </p>
            <div className="flex items-baseline gap-3">
              <motion.span
                key={currentPct}
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="font-black text-5xl leading-none"
              >
                {currentPct}%
              </motion.span>
              <span className="font-mono text-sm text-neutral-600">
                {courseData.attendedClasses} / {courseData.totalClasses}
              </span>
            </div>
            <p className="font-bold text-xs uppercase mt-2 text-neutral-600">
              Target: {targetGoal}% • Status:{" "}
              {getStatus(currentPct) === "safe"
                ? "✓ Safe"
                : getStatus(currentPct) === "warning"
                  ? "⚠ Warning"
                  : "✗ Critical"}
            </p>
          </div>

          {/* Simulator Controls */}
          <div>
            <p className="font-mono text-xs uppercase text-neutral-600 mb-3">
              Simulator Controls
            </p>
            <div className="grid grid-cols-2 gap-3">
              {/* Attend Button */}
              <button
                onClick={handleAttend}
                className="border-2 border-black bg-green-400 hover:bg-green-500 p-4 transition-all hover:shadow-[4px_4px_0px_0px_#000] hover:-translate-y-1 active:translate-y-0 active:shadow-none"
              >
                <Plus className="w-6 h-6 mx-auto mb-2" />
                <span className="font-black uppercase text-sm block">
                  Attend Next
                </span>
                <span className="font-mono text-xs opacity-70">
                  +1 Attended
                </span>
              </button>

              {/* Miss Button */}
              <button
                onClick={handleMiss}
                className="border-2 border-black bg-red-400 hover:bg-red-500 text-white p-4 transition-all hover:shadow-[4px_4px_0px_0px_#000] hover:-translate-y-1 active:translate-y-0 active:shadow-none"
              >
                <Minus className="w-6 h-6 mx-auto mb-2" />
                <span className="font-black uppercase text-sm block">
                  Miss Next
                </span>
                <span className="font-mono text-xs opacity-70">
                  +1 Total Only
                </span>
              </button>
            </div>
          </div>

          {/* Projected Result */}
          <AnimatePresence mode="wait">
            {(simAttended !== courseData.attendedClasses ||
              simTotal !== courseData.totalClasses) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={cn(
                  "border-2 border-black p-4",
                  getStatus(projectedPct) === "safe"
                    ? "bg-green-100"
                    : getStatus(projectedPct) === "warning"
                      ? "bg-yellow-100"
                      : "bg-red-100",
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-mono text-xs uppercase text-neutral-700">
                    Projection
                  </p>
                  {pctChange !== 0 && (
                    <span
                      className={cn(
                        "flex items-center gap-1 font-bold text-xs",
                        pctChange > 0 ? "text-green-700" : "text-red-700",
                      )}
                    >
                      {pctChange > 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {pctChange > 0 ? "+" : ""}
                      {pctChange}%
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-3">
                  <span className="font-black text-4xl leading-none">
                    {projectedPct}%
                  </span>
                  <span className="font-mono text-sm text-neutral-600">
                    {simAttended} / {simTotal}
                  </span>
                </div>

                {/* Status Message */}
                <p className="font-bold text-xs uppercase mt-3 text-neutral-700">
                  {getStatus(projectedPct) === "safe"
                    ? `✓ Above ${targetGoal}% Target`
                    : getStatus(projectedPct) === "warning"
                      ? `⚠ Near ${targetGoal}% Target`
                      : `✗ Below ${targetGoal}% Target`}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reset Button */}
          <button
            onClick={handleReset}
            disabled={
              simAttended === courseData.attendedClasses &&
              simTotal === courseData.totalClasses
            }
            className="w-full border-2 border-black bg-neutral-200 hover:bg-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed p-3 transition-all hover:shadow-[2px_2px_0px_0px_#000] flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="font-bold uppercase text-sm">
              Reset Simulation
            </span>
          </button>

          {/* Info Box */}
          <div className="border border-neutral-300 bg-neutral-50 p-3">
            <p className="font-mono text-xs text-neutral-600 leading-relaxed">
              <span className="font-bold">TIP:</span> Use the simulator to plan
              your attendance strategy. The global target goal of {targetGoal}%
              is used for calculations.
            </p>
          </div>
        </div>
      </Drawer.Content>
    </Drawer>
  );
}

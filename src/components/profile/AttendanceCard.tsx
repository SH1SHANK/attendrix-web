"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  FlaskConical,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
} from "lucide-react";
import type { Variants } from "framer-motion";

// ============================================================================
// Types
// ============================================================================

interface AttendanceCardProps {
  courseID: string;
  courseName: string;
  attendedClasses: number;
  totalClasses: number;
  credits?: number;
  isLab?: boolean;
  index?: number;
  onClick?: () => void;
  targetGoal?: number; // Global attendance goal
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_TARGET = 80;

// ============================================================================
// Animation Variants
// ============================================================================

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.08,
      duration: 0.4,
      ease: "easeOut" as const,
    },
  }),
};

// ============================================================================
// Helper Functions
// ============================================================================

function calculateInsight(attended: number, total: number, targetPct: number) {
  if (total === 0) {
    return { type: "none", value: 0, message: "No classes yet" };
  }

  const currentPct = (attended / total) * 100;

  if (currentPct >= targetPct) {
    // Calculate bunk margin: How many classes can be skipped while staying at target
    // Formula: attended / (total + missed) = targetPct/100
    // Solving for missed: missed = (attended / (targetPct/100)) - total
    const maxTotalWithTarget = attended / (targetPct / 100);
    const bunkMargin = Math.floor(maxTotalWithTarget - total);

    return {
      type: "safe",
      value: Math.max(0, bunkMargin),
      message: "Bunk Margin",
    };
  } else {
    // Calculate classes needed to reach target
    // Formula: (attended + needed) / (total + needed) = targetPct/100
    // Solving for needed: needed = (targetPct/100 * total - attended) / (1 - targetPct/100)
    const needed = Math.ceil(
      ((targetPct / 100) * total - attended) / (1 - targetPct / 100),
    );

    return {
      type: "critical",
      value: Math.max(0, needed),
      message: "Need Next",
    };
  }
}

// ============================================================================
// Barber Pole Striped Progress Bar
// ============================================================================

function StripedProgressBar({
  percentage,
  colorClass,
}: {
  percentage: number;
  colorClass: string;
}) {
  return (
    <div className="h-6 w-full border-2 border-black bg-neutral-100 overflow-hidden relative">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        className={cn("h-full relative overflow-hidden", colorClass)}
      >
        {/* Barber Pole Stripes */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 8px,
              rgba(0,0,0,0.2) 8px,
              rgba(0,0,0,0.2) 16px
            )`,
            animation: "barberpole 1s linear infinite",
          }}
        />
      </motion.div>

      {/* Percentage Overlay */}
      <span className="absolute inset-0 flex items-center justify-center font-black text-xs text-black mix-blend-difference">
        {percentage}%
      </span>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function AttendanceCard({
  courseID,
  courseName,
  attendedClasses,
  totalClasses,
  credits = 3,
  isLab = false,
  index = 0,
  onClick,
  targetGoal = DEFAULT_TARGET,
}: AttendanceCardProps) {
  // Calculate percentage
  const percentage =
    totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0;

  // Calculate tactical insight using global target goal
  const insight = calculateInsight(attendedClasses, totalClasses, targetGoal);

  // Determine status tier based on target goal
  const getStatus = () => {
    if (percentage >= targetGoal) return "safe";
    if (percentage >= targetGoal - 5) return "warning";
    return "danger";
  };

  const status = getStatus();

  // Color mapping based on status
  const colorMap = {
    safe: {
      bg: "bg-green-100",
      border: "border-green-800",
      bar: "bg-green-500",
      text: "text-green-700",
      badge: "bg-green-500 text-white",
      insightBg: "bg-green-500",
      insightText: "text-white",
    },
    warning: {
      bg: "bg-yellow-100",
      border: "border-yellow-700",
      bar: "bg-yellow-400",
      text: "text-yellow-700",
      badge: "bg-yellow-400 text-black",
      insightBg: "bg-yellow-400",
      insightText: "text-black",
    },
    danger: {
      bg: "bg-red-100",
      border: "border-red-800",
      bar: "bg-red-500",
      text: "text-red-700",
      badge: "bg-red-500 text-white",
      insightBg: "bg-red-500",
      insightText: "text-white",
    },
  };

  const colors = colorMap[status];

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      onClick={onClick}
      whileHover={{
        y: -8,
        boxShadow: "8px 8px 0px 0px #000",
      }}
      className={cn(
        "border-2 p-4 transition-all cursor-pointer relative overflow-hidden group",
        colors.bg,
        colors.border,
        "shadow-[4px_4px_0px_0px_#000]",
      )}
    >
      {/* Status Indicator Strip */}
      <div className={cn("absolute top-0 left-0 right-0 h-1", colors.bar)} />

      {/* Header Row: Course Code + Status Badge */}
      <div className="flex justify-between items-start mb-3 pt-1">
        {/* Course Code Badge */}
        <span className="font-mono text-[10px] uppercase px-2 py-1 bg-black text-white border border-black">
          {courseID}
        </span>

        {/* Status Badge */}
        <span
          className={cn(
            "font-black text-[10px] uppercase px-2 py-1 border-2 border-black",
            colors.badge,
          )}
        >
          {status === "safe" && "SAFE"}
          {status === "warning" && "WARNING"}
          {status === "danger" && "CRITICAL"}
        </span>
      </div>

      {/* Course Name */}
      <h4 className="font-black uppercase text-sm leading-tight line-clamp-2 tracking-tight mb-3">
        {courseName}
      </h4>

      {/* INSIGHT ENGINE - Tactical Display */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 + index * 0.08 }}
        className={cn(
          "border-2 border-black p-3 mb-3 relative overflow-hidden",
          colors.insightBg,
          colors.insightText,
        )}
      >
        {/* Background Pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 10px,
              rgba(0,0,0,0.1) 10px,
              rgba(0,0,0,0.1) 20px
            )`,
          }}
        />

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {insight.type === "safe" ? (
              <TrendingUp className="w-4 h-4" />
            ) : insight.type === "critical" ? (
              <AlertTriangle className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span className="font-bold text-xs uppercase tracking-wide">
              {insight.message}
            </span>
          </div>
          <span className="font-black text-2xl leading-none">
            {insight.value}
          </span>
        </div>

        {/* Subtitle */}
        <p className="text-[10px] font-mono uppercase mt-1 opacity-80 relative z-10">
          {insight.type === "safe"
            ? "Classes you can skip"
            : insight.type === "critical"
              ? `To reach ${targetGoal}%`
              : "Classes"}
        </p>
      </motion.div>

      {/* Progress Bar */}
      <StripedProgressBar percentage={percentage} colorClass={colors.bar} />

      {/* Footer: Stats + Badges */}
      <div className="flex justify-between items-center mt-3">
        <span className="font-mono text-xs text-neutral-700">
          Attended: {attendedClasses} / {totalClasses} ({percentage}%)
        </span>

        {/* Badges */}
        <div className="flex items-center gap-1">
          {isLab && (
            <span className="bg-purple-400 text-black font-black text-[9px] uppercase px-1.5 py-0.5 border border-black flex items-center gap-0.5">
              <FlaskConical className="w-2.5 h-2.5" />
              LAB
            </span>
          )}
          <span className="bg-neutral-900 text-white font-black text-[9px] uppercase px-1.5 py-0.5 border border-black">
            {credits}CR
          </span>
        </div>
      </div>
    </motion.div>
  );
}

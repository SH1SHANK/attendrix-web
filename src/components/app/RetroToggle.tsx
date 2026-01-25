"use client";

import { motion } from "framer-motion";
import { Check, X, Clock } from "lucide-react";
import { AttendanceStatus } from "@/hooks/queries/useAttendance";

interface RetroToggleProps {
  status: AttendanceStatus;
  onCycle: () => void;
  disabled?: boolean;
}

const statusConfig = {
  pending: {
    bg: "bg-neutral-200",
    border: "border-neutral-400",
    icon: null,
    label: "Mark",
  },
  present: {
    bg: "bg-green-400",
    border: "border-green-600",
    icon: Check,
    label: "Present",
  },
  absent: {
    bg: "bg-red-400",
    border: "border-red-600",
    icon: X,
    label: "Absent",
  },
  upcoming: {
    label: "Upcoming",
    bg: "bg-neutral-200",
    border: "border-neutral-400",
    icon: Clock,
  },
  cancelled: {
    label: "Cancelled",
    bg: "bg-neutral-400",
    border: "border-neutral-600",
    icon: X,
  },
};

export function RetroToggle({
  status,
  onCycle,
  disabled = false,
}: RetroToggleProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <motion.button
      onClick={onCycle}
      disabled={disabled}
      className={`
        relative w-14 h-14 border-2 ${config.border} ${config.bg}
        flex items-center justify-center
        shadow-[3px_3px_0px_0px_#000]
        transition-colors duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${!disabled ? "hover:shadow-[4px_4px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none" : ""}
      `}
      whileHover={!disabled ? { scale: 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
    >
      {Icon ? (
        <Icon className="w-6 h-6 text-white" strokeWidth={3} />
      ) : (
        <span className="font-mono text-[10px] font-bold uppercase text-neutral-600">
          TAP
        </span>
      )}

      {/* Status Label */}
      <span
        className={`
          absolute -bottom-5 left-1/2 -translate-x-1/2
          font-mono text-[9px] font-bold uppercase tracking-wider
          ${status === "pending" ? "text-neutral-500" : status === "present" ? "text-green-700" : "text-red-700"}
        `}
      >
        {config.label}
      </span>
    </motion.button>
  );
}

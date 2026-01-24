"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface RetroSwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function RetroSwitch({
  checked,
  onCheckedChange,
  disabled = false,
}: RetroSwitchProps) {
  return (
    <button
      onClick={() => !disabled && onCheckedChange(!checked)}
      disabled={disabled}
      className={cn(
        "relative w-14 h-8 border-2 border-black transition-colors duration-200",
        checked ? "bg-black" : "bg-neutral-200",
        disabled && "opacity-50 cursor-not-allowed",
      )}
    >
      <motion.div
        initial={false}
        animate={{
          x: checked ? 24 : 2,
        }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={cn(
          "absolute top-1 left-0 w-6 h-6 border-2 border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]",
        )}
      />
    </button>
  );
}

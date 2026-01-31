import React, { useMemo } from "react";
import { cn } from "@/lib/utils";

interface NeoAvatarProps {
  name?: string | null;
  className?: string;
}

const COLORS = ["bg-[#FFD02F]", "bg-[#C4B5FD]", "bg-[#86EFAC]", "bg-[#93C5FD]"]; // Yellow, Purple, Green, Blue
const SHAPES = ["circle", "square", "triangle", "diamond"];

export function NeoAvatar({ name, className }: NeoAvatarProps) {
  const seed = name || "User";

  const { color, shape } = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorIndex = Math.abs(hash) % COLORS.length;
    const shapeIndex = Math.abs(hash) % SHAPES.length;
    return {
      color: COLORS[colorIndex],
      shape: SHAPES[shapeIndex],
    };
  }, [seed]);

  return (
    <div
      className={cn(
        "w-8 h-8 min-w-8 border-2 border-black flex items-center justify-center overflow-hidden relative",
        color,
        className,
      )}
    >
      {/* Geometric Shape Overlay */}
      {shape === "circle" && (
        <div className="w-4 h-4 rounded-full bg-black/20" />
      )}
      {shape === "square" && <div className="w-4 h-4 bg-black/20" />}
      {shape === "triangle" && (
        <div className="w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-b-14 border-b-black/20" />
      )}
      {shape === "diamond" && <div className="w-4 h-4 bg-black/20 rotate-45" />}

      {/* Optional: Fallback Icon if preferred, but shapes are abstract enough */}
      {/* <User className="w-4 h-4 text-black absolute opacity-50" /> */}
    </div>
  );
}

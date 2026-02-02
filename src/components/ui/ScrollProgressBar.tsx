"use client";

import { useScrollProgress } from "@/hooks/useScrollDirection";

export function ScrollProgressBar() {
  const progress = useScrollProgress();

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-stone-200">
      <div
        className="h-full bg-yellow-400 transition-all duration-150 ease-out"
        style={{
          width: `${progress * 100}%`,
          boxShadow: progress > 0 ? "0 0 8px rgba(255, 208, 47, 0.6)" : "none",
        }}
      />
    </div>
  );
}

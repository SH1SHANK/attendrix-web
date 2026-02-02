"use client";

import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{
          duration: 0.3,
          ease: [0.4, 0, 0.2, 1],
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export function SectionSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse space-y-4 ${className}`}>
      <div className="h-12 bg-stone-200 rounded border-2 border-black" />
      <div className="h-64 bg-stone-100 rounded border-2 border-black" />
      <div className="grid grid-cols-3 gap-4">
        <div className="h-32 bg-stone-200 rounded border-2 border-black" />
        <div className="h-32 bg-stone-200 rounded border-2 border-black" />
        <div className="h-32 bg-stone-200 rounded border-2 border-black" />
      </div>
    </div>
  );
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse bg-stone-100 border-2 border-black shadow-[4px_4px_0_#0a0a0a] p-6 space-y-4"
        >
          <div className="h-12 w-12 bg-stone-300 border-2 border-black" />
          <div className="h-6 bg-stone-300 rounded w-3/4" />
          <div className="space-y-2">
            <div className="h-4 bg-stone-200 rounded" />
            <div className="h-4 bg-stone-200 rounded w-5/6" />
          </div>
        </div>
      ))}
    </div>
  );
}

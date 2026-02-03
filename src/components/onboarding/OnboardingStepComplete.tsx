"use client";

import { useEffect } from "react";
import { CheckCircle2, Sparkles, PartyPopper, TrendingUp } from "lucide-react";
import { NeoBrutalButton } from "@/components/ui/NeoBrutalButton";
import { motion } from "framer-motion";

interface Props {
  batchLabel: string;
  semesterLabel: string;
  coursesCount: number;
  onFinish: () => void;
}

export default function OnboardingStepComplete({
  batchLabel,
  semesterLabel,
  coursesCount,
  onFinish,
}: Props) {
  useEffect(() => {
    const timer = setTimeout(() => onFinish(), 5000);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="space-y-6 text-center">
      {/* Success Icon */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", duration: 0.8, bounce: 0.5 }}
        className="flex justify-center"
      >
        <div className="relative">
          <div className="w-24 h-24 bg-black border-3 border-black flex items-center justify-center shadow-[8px_8px_0_#0a0a0a]">
            <CheckCircle2 className="w-12 h-12 text-white" strokeWidth={3} />
          </div>
        </div>
      </motion.div>

      {/* Title */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="space-y-2"
      >
        <h2 className="font-display text-3xl sm:text-4xl font-black uppercase tracking-tight text-black">
          All Set
        </h2>
        <p className="text-sm sm:text-base font-semibold text-neutral-600">
          Your profile has been configured successfully
        </p>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-2 max-w-2xl mx-auto"
      >
        <div className="border-2 border-black bg-neutral-50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-600 mb-1">
            Batch
          </p>
          <p className="text-sm sm:text-base font-bold text-black">
            {batchLabel}
          </p>
        </div>

        <div className="border-2 border-black bg-neutral-50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-600 mb-1">
            Semester
          </p>
          <p className="text-sm sm:text-base font-bold text-black">
            {semesterLabel}
          </p>
        </div>

        <div className="border-2 border-black bg-neutral-50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-600 mb-1">
            Courses
          </p>
          <p className="text-sm sm:text-base font-bold text-black">
            {coursesCount}
          </p>
        </div>
      </motion.div>

      {/* What's Next */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="border-2 border-black bg-neutral-50 p-4 max-w-2xl mx-auto"
      >
        <h3 className="text-base font-black uppercase text-black mb-3">
          Next Steps
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
          {[
            { text: "View your attendance dashboard" },
            { text: "Mark your attendance" },
            { text: "Track your progress" },
            { text: "Customize your settings" },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.8 + idx * 0.1 }}
              className="flex items-center gap-2 bg-white border-2 border-black p-2"
            >
              <span className="w-2 h-2 bg-black" />
              <span className="text-xs sm:text-sm font-semibold text-black">
                {item.text}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Action Button */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1 }}
        className="pt-2 sm:pt-3"
      >
        <NeoBrutalButton
          variant="primary"
          size="sm"
          onClick={onFinish}
          className="w-full sm:w-auto sm:min-w-48 touch-manipulation"
        >
          Go to Dashboard
        </NeoBrutalButton>
        <p className="text-xs font-semibold text-neutral-500 mt-2">
          Redirecting in 5 seconds...
        </p>
      </motion.div>
    </div>
  );
}

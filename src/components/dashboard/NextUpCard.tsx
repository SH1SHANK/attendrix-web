import { motion } from "framer-motion";
import { Clock, MapPin, Zap } from "lucide-react";
import type { ParsedClass } from "@/hooks/queries/useNextClass";

const pulseVariants = {
  pulse: {
    borderColor: ["#FFD02F", "#FBBF24", "#F59E0B", "#FFD02F"],
    boxShadow: [
      "8px 8px 0px 0px #000",
      "10px 10px 0px 0px #000",
      "12px 12px 0px 0px #000",
      "8px 8px 0px 0px #000",
    ],
    transition: {
      duration: 1.2,
      repeat: Infinity,
      ease: "easeInOut" as const,
    },
  },
};

type NextUpCardProps = {
  nextClass: ParsedClass | null;
  minutesUntilNext: number | null;
};

export function NextUpCard({ nextClass, minutesUntilNext }: NextUpCardProps) {
  // If no nextClass provided, render nothing (handled by parent)
  if (!nextClass || minutesUntilNext === null) return null;

  const hours = Math.floor(minutesUntilNext / 60);
  const mins = minutesUntilNext % 60;
  const countdownText = hours > 0 ? `${hours}h ${mins}m` : `${mins} mins`;
  const isUrgent = minutesUntilNext <= 15;
  const isImminent = minutesUntilNext <= 5;

  return (
    <motion.div
      className={`relative border-4 p-6 md:p-8 overflow-hidden shadow-[8px_8px_0px_0px_#000] ${
        isImminent
          ? "border-red-500 bg-red-50"
          : isUrgent
            ? "border-yellow-500 bg-yellow-50"
            : "border-[#FFD02F] bg-white"
      }`}
      variants={pulseVariants}
      animate={isUrgent ? "pulse" : undefined}
    >
      <div className="absolute top-0 right-0 h-16 w-16 bg-black" />
      <div className="absolute top-2 right-2 h-3 w-3 bg-[#FFD02F]" />

      <div className="relative z-10 space-y-6">
        <div className="flex items-center gap-2">
          <Zap
            className={`w-5 h-5 ${isImminent ? "text-red-600" : "text-yellow-600"}`}
          />
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-neutral-600">
            Next Up
          </span>
        </div>

        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              Starts in
            </p>
            <motion.h2
              key={countdownText}
              className={`text-5xl font-black leading-none ${isImminent ? "text-red-600" : "text-black"}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {countdownText}
            </motion.h2>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex rounded-full bg-black px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
                {nextClass.courseID}
              </span>
              {nextClass.type === "lab" && (
                <span className="inline-flex rounded-full bg-purple-500 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
                  Lab
                </span>
              )}
            </div>
            <h3 className="font-bold text-xl md:text-2xl">
              {nextClass.courseName}
            </h3>
            <div className="flex flex-wrap gap-4 text-neutral-600">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span className="font-mono text-sm">
                  {nextClass.classVenue || "TBA"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span className="font-mono text-sm">
                  {nextClass.startTime} - {nextClass.endTime}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

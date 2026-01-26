import { motion } from "framer-motion";
import { Clock, MapPin } from "lucide-react";
import type { ParsedClass } from "@/hooks/queries/useNextClass";
import { useEffect, useState } from "react";

export function CurrentClassCard({
  currentClass,
}: {
  currentClass: ParsedClass;
}) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const now = new Date();
      const start = currentClass.startDate.getTime();
      const end = currentClass.endDate.getTime();
      const total = end - start;
      const elapsed = now.getTime() - start;
      const pct = Math.min(100, Math.max(0, (elapsed / total) * 100));
      setProgress(pct);
    };

    updateProgress();
    const timer = setInterval(updateProgress, 1000 * 60); // Update every minute
    return () => clearInterval(timer);
  }, [currentClass]);

  return (
    <motion.div
      className="relative overflow-hidden border-4 border-black bg-[#FFD02F] p-6 shadow-[6px_6px_0px_0px_#000] md:p-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Background Pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 50%)`,
          backgroundSize: "10px 10px",
        }}
      />

      <div className="relative z-10 flex flex-col items-center justify-center text-center">
        <div className="mb-4 flex items-center gap-2 rounded-full border-2 border-black bg-white px-3 py-1 shadow-[2px_2px_0px_0px_#000]">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest sm:text-xs">
            Currently Happening
          </span>
        </div>

        <div className="my-2 sm:my-4 w-full">
          <h2 className="font-black text-2xl md:text-3xl lg:text-4xl uppercase leading-tight">
            {currentClass.courseName}
          </h2>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="font-mono text-sm font-bold bg-black text-white px-2 py-0.5 rounded">
              {currentClass.courseID}
            </span>
          </div>
        </div>

        <div className="flex w-full flex-col gap-3 rounded-lg border-2 border-black bg-white/50 p-4 backdrop-blur-sm mt-4">
          <div className="flex items-center justify-between text-sm font-bold">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>
                {currentClass.startTime} - {currentClass.endTime}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{currentClass.classVenue || "TBA"}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-4 bg-white border-2 border-black rounded-full overflow-hidden relative">
            <div
              className="h-full bg-black/80 transition-all duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
            />
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-bold text-white mix-blend-difference">
              {Math.round(progress)}% Completed
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

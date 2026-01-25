import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock, MapPin } from "lucide-react";
import type { ParsedClass } from "@/hooks/queries/useNextClass";

export function CountdownCard({ nextClass }: { nextClass: ParsedClass }) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const diff = nextClass.startDate.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft(null); // Or {0,0,0,0}
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [nextClass]);

  if (!timeLeft) return null;

  const isLongWait = timeLeft.days > 0;

  return (
    <motion.div
      className="relative overflow-hidden border-4 border-black bg-[#4ADE80] p-6 shadow-[6px_6px_0px_0px_#000] md:p-8"
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
        <div className="mb-2 flex items-center gap-2 rounded-full border-2 border-black bg-white px-3 py-1 shadow-[2px_2px_0px_0px_#000]">
          <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest sm:text-xs">
            Next Session In
          </span>
        </div>

        <div className="my-4 sm:my-6">
          <div className="font-mono text-4xl font-black tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
            {isLongWait ? (
              <span>
                {timeLeft.days}d : {timeLeft.hours}h
              </span>
            ) : (
              <span>
                {timeLeft.hours.toString().padStart(2, "0")}h :{" "}
                {timeLeft.minutes.toString().padStart(2, "0")}m
              </span>
            )}
          </div>
        </div>

        <div className="flex w-full flex-col gap-1 rounded-lg border-2 border-black bg-white/50 p-3 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <div className="flex items-center gap-2">
            <span className="rounded bg-black px-1.5 py-0.5 font-mono text-xs font-bold text-white">
              {nextClass.courseID}
            </span>
            <span className="font-bold truncate max-w-[150px] sm:max-w-xs text-left">
              {nextClass.courseName}
            </span>
          </div>
          <div className="flex items-center gap-1 text-sm font-medium">
            <span className="hidden sm:inline">@</span>
            <span>{nextClass.startTime}</span>
            <span className="mx-1 text-neutral-400">|</span>
            <MapPin className="h-3 w-3" />
            <span>{nextClass.classVenue || "TBA"}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

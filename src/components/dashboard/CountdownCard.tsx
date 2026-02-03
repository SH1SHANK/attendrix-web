"use client";

import { useEffect, useState, useMemo, memo } from "react";
import { cn } from "@/lib/utils";
import { TodayScheduleClass, UpcomingClass } from "@/types/supabase-academic";

interface CountdownCardProps {
  classData: TodayScheduleClass | UpcomingClass | null;
  type: "current" | "next" | "none";
  loading?: boolean;
  className?: string;
}

export const CountdownCard = memo(function CountdownCard({
  classData,
  type,
  loading = false,
  className,
}: CountdownCardProps) {
  if (loading) {
    return <CountdownCardLoading className={className} />;
  }

  if (!classData || type === "none") {
    return <CountdownCardEmpty className={className} />;
  }

  return (
    <CountdownCardView
      classData={classData}
      type={type}
      className={className}
    />
  );
});

function CountdownCardLoading({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative border-2 border-black bg-white shadow-[4px_4px_0px_0px_#000] overflow-hidden",
        className,
      )}
    >
      <div className="p-4 sm:p-6 md:p-8 animate-pulse">
        <div className="h-4 bg-gray-300 rounded w-1/4 mb-4"></div>
        <div className="h-8 bg-gray-300 rounded w-1/2 mb-4"></div>
        <div className="h-4 bg-gray-300 rounded w-1/3"></div>
      </div>
    </div>
  );
}

function CountdownCardEmpty({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden w-full border-2 border-black transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]",
        "bg-neutral-100",
        "shadow-[4px_4px_0px_0px_#000] sm:shadow-[6px_6px_0px_0px_#000] md:shadow-[8px_8px_0px_0px_#000]",
        className,
      )}
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.07]"
        style={{
          backgroundImage: `repeating-linear-gradient(
              -45deg,
              #000,
              #000 2px,
              transparent 2px,
              transparent 12px
            )`,
        }}
      />
      <div
        className="relative p-4 sm:p-6 md:p-8 lg:p-10 flex items-center justify-center"
        style={{ minHeight: "200px" }}
      >
        <div className="text-center space-y-4">
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-black uppercase text-neutral-500 tracking-tighter">
            No More Classes Today
          </h2>
          <p className="font-mono text-sm sm:text-base font-bold text-neutral-400 uppercase tracking-wide">
            You&apos;re all done for today!
          </p>
        </div>
      </div>
    </div>
  );
}

import { useUserPreferences } from "@/context/UserPreferencesContext";

interface CountdownCardViewProps {
  classData: TodayScheduleClass | UpcomingClass;
  type: "current" | "next";
  className?: string;
}

function CountdownCardView({
  classData,
  type,
  className,
}: CountdownCardViewProps) {
  const { formatTime } = useUserPreferences();
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [progress, setProgress] = useState(0);

  /* Safe Date Handling */
  const isValidDate = (d: Date) => d instanceof Date && !isNaN(d.getTime());

  const { targetTime, timeRange } = useMemo(() => {
    let start = new Date(classData.classStartTime);
    let end = new Date(classData.classEndTime);

    if (!isValidDate(start)) start = new Date();
    if (!isValidDate(end)) end = new Date(start.getTime() + 1000 * 60 * 60);

    return {
      targetTime: start,
      timeRange: isValidDate(new Date(classData.classStartTime))
        ? `${formatTime(start)} - ${formatTime(end)}`
        : "Time N/A",
    };
  }, [classData, formatTime]);

  useEffect(() => {
    let animationFrameId: number;
    let lastUpdate = Date.now();

    const updateCountdown = () => {
      const now = Date.now();
      const nowTime = new Date();

      const startTime = new Date(classData.classStartTime);
      const endTime = new Date(classData.classEndTime);

      if (!isValidDate(startTime) || !isValidDate(endTime)) {
        setProgress(0);
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      // Progress Calculation
      let newProgress = 0;
      if (nowTime > endTime) {
        newProgress = 100;
      } else if (startTime > nowTime && type === "next") {
        newProgress = 0;
      } else {
        const totalDuration = endTime.getTime() - startTime.getTime();
        const elapsed = nowTime.getTime() - startTime.getTime();

        if (totalDuration <= 0) {
          newProgress = 100;
        } else {
          newProgress = Math.min(
            100,
            Math.max(0, (elapsed / totalDuration) * 100),
          );
        }
      }

      if (isNaN(newProgress)) newProgress = 0;
      setProgress(newProgress);

      if (now - lastUpdate >= 1000) {
        lastUpdate = now;
        // Time Left Calculation
        const diff = targetTime.getTime() - now;
        if (diff > 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);

          setTimeLeft({
            hours: isNaN(hours) ? 0 : hours,
            minutes: isNaN(minutes) ? 0 : minutes,
            seconds: isNaN(seconds) ? 0 : seconds,
          });
        } else {
          setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        }
      }

      animationFrameId = requestAnimationFrame(updateCountdown);
    };

    animationFrameId = requestAnimationFrame(updateCountdown);

    return () => cancelAnimationFrame(animationFrameId);
  }, [targetTime, classData, type]);

  const isCurrent = type === "current";

  const cardBg = isCurrent ? "bg-[#FF6B6B]" : "bg-[#FFD02F]";

  return (
    <div
      className={cn(
        "relative overflow-hidden w-full border-2 border-black transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]",
        cardBg,
        "shadow-[4px_4px_0px_0px_#000] sm:shadow-[6px_6px_0px_0px_#000] md:shadow-[8px_8px_0px_0px_#000]",
        "hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_0px_#000] sm:hover:shadow-[10px_10px_0px_0px_#000] md:hover:shadow-[12px_12px_0px_0px_#000]",
        "active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0px_0px_#000] active:scale-[0.99]",
        "touch-manipulation select-none",
        "group cursor-pointer",
        className,
      )}
    >
      {/* Diagonal Stripe Pattern Background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.07]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            -45deg,
            #000,
            #000 2px,
            transparent 2px,
            transparent 12px
          )`,
        }}
      />

      <div className="relative p-4 sm:p-6 md:p-8 lg:p-10 flex flex-col md:flex-row gap-4 sm:gap-6 md:gap-8 items-start justify-between">
        {/* Left Section: Info */}
        <div className="flex-1 space-y-6 z-10 w-full">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "inline-flex items-center border-2 border-black px-4 py-1.5 text-sm font-black uppercase tracking-[0.12em] shadow-[3px_3px_0px_0px_#000]",
                "transition-all duration-200",
                isCurrent
                  ? "bg-black text-white animate-pulse"
                  : "bg-white text-black",
              )}
              style={{
                animationDuration: isCurrent ? "2s" : "0s",
              }}
            >
              {isCurrent && (
                <span className="mr-2 h-2 w-2 rounded-full bg-white animate-pulse" />
              )}
              {isCurrent ? "LIVE NOW" : "UP NEXT"}
            </div>

            {isCurrent && (
              <div className="hidden sm:block font-mono text-sm font-bold border-2 border-black bg-white px-3 py-1.5 shadow-[2px_2px_0px_0px_#000]">
                {Math.floor(progress)}% COMPLETED
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase leading-[0.85] text-black tracking-tighter drop-shadow-sm stroke-black">
              {classData.courseName}
            </h1>
            <div className="inline-block bg-black text-white px-3 py-1 font-mono text-lg font-bold transform -rotate-1 border-2 border-transparent">
              {timeRange}
            </div>
          </div>
        </div>

        {/* Right Section: Timer */}
        <div className="w-full md:w-auto z-10">
          <div className="bg-white border-2 border-black p-6 shadow-[6px_6px_0px_0px_#000] transition-transform duration-200 hover:scale-105">
            <div className="text-center mb-3 font-display font-black uppercase tracking-[0.12em] text-xs border-b-2 border-black pb-2">
              Time Remaining
            </div>
            <div className="flex items-center justify-center gap-2">
              {/* Hours */}
              <div className="flex flex-col items-center">
                <span className="font-mono text-4xl sm:text-5xl font-black text-black leading-none tabular-nums transition-all duration-150">
                  {String(timeLeft.hours).padStart(2, "0")}
                </span>
                <span className="text-[10px] font-bold uppercase text-neutral-500">
                  Hr
                </span>
              </div>
              <span className="text-2xl font-black">:</span>
              {/* Minutes */}
              <div className="flex flex-col items-center">
                <span className="font-mono text-4xl sm:text-5xl font-black text-black leading-none tabular-nums">
                  {String(timeLeft.minutes).padStart(2, "0")}
                </span>
                <span className="text-[10px] font-bold uppercase text-neutral-500">
                  Min
                </span>
              </div>
              <span className="text-2xl font-black">:</span>
              {/* Seconds */}
              <div className="flex flex-col items-center">
                <span className="font-mono text-4xl sm:text-5xl font-black text-[#FF6B6B] leading-none tabular-nums">
                  {String(timeLeft.seconds).padStart(2, "0")}
                </span>
                <span className="text-[10px] font-bold uppercase text-neutral-500">
                  Sec
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Progress Bar (Attached) */}
      {isCurrent && (
        <div className="absolute bottom-0 left-0 right-0 h-3 border-t-2 border-black bg-white">
          <div
            className="h-full bg-black relative overflow-hidden transition-all duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

"use client";

import { MockClass, getMockClassProgress } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface CurrentClassHeroProps {
  classData: MockClass | null;
  className?: string;
}

export function CurrentClassHero({
  classData,
  className,
}: CurrentClassHeroProps) {
  const [progress, setProgress] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!classData) return;

    const updateProgress = () => {
      const newProgress = getMockClassProgress(classData);
      setProgress(newProgress);
    };

    updateProgress();
    const interval = setInterval(updateProgress, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [classData]);

  if (!classData) {
    return (
      <div
        className={cn(
          "group relative overflow-hidden rounded-lg border-4 border-black bg-gradient-to-br from-muted to-secondary p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-4px] hover:translate-y-[-4px]",
          "animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100",
          className,
        )}
      >
        <div className="text-center">
          <p className="text-xl font-medium text-muted-foreground">
            No more classes today! 🎉
          </p>
          <p className="mt-2 text-muted-foreground">Enjoy your free time</p>
        </div>
      </div>
    );
  }

  const isOngoing = progress > 0 && progress < 100;
  const statusLabel = isOngoing ? "Current Class" : "Next Up";
  const statusColor = isOngoing ? "bg-accent" : "bg-[#51CF66]";

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-lg border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-4px] hover:translate-y-[-4px]",
        "animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100",
        isOngoing
          ? "bg-gradient-to-br from-[#FFD93D] via-[#FFF4CC] to-[#FFEB99]"
          : "bg-gradient-to-br from-[#A8E6CF] via-[#DCEDC8] to-[#C8E6C9]",
        className,
      )}
    >
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute h-full w-full bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.1)_10px,rgba(0,0,0,0.1)_20px)]" />
      </div>

      <div className="relative p-8">
        {/* Status Badge */}
        <div className="mb-4 inline-block">
          <span
            className={cn(
              "rounded-full border-2 border-black px-4 py-1.5 text-sm font-bold uppercase tracking-wide shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 group-hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
              statusColor,
            )}
          >
            {statusLabel}
          </span>
        </div>

        {/* Class Details */}
        <div className="space-y-4">
          <div>
            <h2 className="text-4xl font-bold tracking-tight">
              {classData.subject}
            </h2>
            <p className="mt-1 text-lg font-medium text-muted-foreground">
              {classData.subjectCode}
            </p>
          </div>

          {/* Time and Venue Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border-2 border-black bg-white/80 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-sm font-medium text-muted-foreground">Time</p>
              <p className="mt-1 text-2xl font-bold">
                {classData.time} - {classData.endTime}
              </p>
            </div>
            <div className="rounded-lg border-2 border-black bg-white/80 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-sm font-medium text-muted-foreground">Venue</p>
              <p className="mt-1 text-2xl font-bold">{classData.venue}</p>
            </div>
          </div>

          {/* Type Badge */}
          <div>
            <span className="inline-block rounded border-2 border-black bg-primary px-3 py-1 text-sm font-bold uppercase text-primary-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              {classData.type}
            </span>
          </div>

          {/* Progress Bar (only for ongoing classes) */}
          {isOngoing && mounted && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Class Progress</p>
                <p className="text-sm font-bold">{Math.round(progress)}%</p>
              </div>
              <div className="h-4 overflow-hidden rounded-full border-2 border-black bg-white shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)]">
                <div
                  className="h-full bg-accent transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {progress < 25
                  ? "Just started!"
                  : progress < 50
                    ? "Getting there..."
                    : progress < 75
                      ? "More than halfway!"
                      : "Almost done!"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

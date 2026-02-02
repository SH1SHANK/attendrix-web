"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import { Clock, MapPin, Check } from "lucide-react";
import { TodayScheduleClass } from "@/types/supabase-academic";

interface TodayClassesProps {
  classes: TodayScheduleClass[];
  className?: string;
}

/**
 * READ-ONLY Attendance Display
 * Shows attendance status from userAttended field
 * Button is DISABLED - no marking allowed in Phase 2
 */
const AttendanceDisplay = memo(function AttendanceDisplay({
  attended,
}: {
  attended: boolean;
}) {
  return (
    <div
      className={cn(
        "h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 border-2 border-black flex flex-col items-center justify-center",
        "shadow-[2px_2px_0px_0px_#000] sm:shadow-[3px_3px_0px_0px_#000] md:shadow-[4px_4px_0px_0px_#000]",
        "opacity-60 cursor-not-allowed select-none",
      )}
      style={{
        backgroundColor: attended ? "#51CF66" : "#ffffff",
      }}
    >
      {attended ? (
        <>
          <Check className="w-4 h-4 sm:w-5 sm:h-5 md:w-8 md:h-8 stroke-[3px] mb-0.5 text-black" />
          <span className="text-[6px] sm:text-[7px] md:text-[10px] font-black uppercase tracking-wide text-black">
            PRESENT
          </span>
        </>
      ) : (
        <span className="text-[8px] sm:text-[9px] md:text-xs font-bold uppercase text-neutral-400">
          —
        </span>
      )}
    </div>
  );
});

const ClassRow = memo(function ClassRow({
  classData,
  index,
}: {
  classData: TodayScheduleClass;
  index: number;
}) {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  };

  const startTime = formatTime(classData.classStartTime);
  const endTime = formatTime(classData.classEndTime);

  return (
    <div
      className={cn(
        "group relative flex flex-row items-stretch border-2 border-black bg-white transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]",
        "shadow-[4px_4px_0px_0px_#000] sm:shadow-[6px_6px_0px_0px_#000]",
        "hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_0px_#000] sm:hover:shadow-[10px_10px_0px_0px_#000]",
        "active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0px_0px_#000]",
        "touch-manipulation cursor-pointer",
        classData.isCancelled && "opacity-60",
      )}
      style={{
        animationDelay: `${index * 50}ms`,
        animationFillMode: "backwards",
      }}
    >
      {/* 1. Time Column */}
      <div className="flex flex-col justify-center items-start pl-2 pr-2 py-2 sm:pl-4 sm:pr-4 sm:py-4 md:pl-6 md:pr-6 md:py-6 lg:pl-8 lg:pr-8 border-r-2 border-black min-w-17.5 sm:min-w-25 md:min-w-30 lg:min-w-35">
        <span className="font-mono text-lg sm:text-2xl md:text-3xl lg:text-4xl font-black text-black leading-none mb-0.5">
          {startTime}
        </span>
        <span className="font-mono text-[9px] sm:text-[10px] md:text-xs font-bold text-neutral-500 tracking-wide">
          {endTime}
        </span>
      </div>

      {/* 2. Info Column */}
      <div className="flex-1 flex flex-col justify-center px-2 py-2 sm:px-3 sm:py-3 md:px-4 md:py-4 lg:px-6 lg:py-6 min-w-0">
        <div className="mb-0.5 sm:mb-1 md:mb-1.5 flex items-center gap-2">
          <span className="font-mono text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs font-bold text-neutral-500 uppercase tracking-wide">
            {classData.courseID}
          </span>
          {classData.isCancelled && (
            <span className="bg-red-200 border border-black px-1 text-[8px] sm:text-[9px] font-black uppercase">
              CANCELLED
            </span>
          )}
        </div>
        <h3 className="font-display text-xs sm:text-sm md:text-lg lg:text-xl xl:text-2xl font-black uppercase leading-tight tracking-tight mb-0.5 sm:mb-1 md:mb-1.5 line-clamp-2">
          {classData.courseName}
        </h3>
        <div className="flex items-center gap-1 sm:gap-1.5 text-neutral-600">
          <MapPin className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 lg:w-4 lg:h-4" />
          <span className="font-mono text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs font-medium">
            {classData.classVenue || "TBA"}
          </span>
        </div>
      </div>

      {/* 3. Read-only Attendance Display */}
      <div className="flex items-center justify-center px-1.5 sm:px-3 md:px-4 lg:px-6 border-l-2 border-black bg-neutral-50 group-hover:bg-[#FFFDF5] transition-colors duration-300">
        <AttendanceDisplay attended={classData.userAttended} />
      </div>
    </div>
  );
});

export function TodayClasses({ classes, className }: TodayClassesProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-black pb-3 sm:pb-4 md:pb-6 mb-2">
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
          <Clock className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 stroke-[2.5px]" />
          <h2 className="font-display text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-black uppercase tracking-tight">
            Today&apos;s Schedule
          </h2>
        </div>
        <span className="font-mono text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-bold text-neutral-500 uppercase tracking-wide">
          {classes.length} classes
        </span>
      </div>

      <div className="grid gap-3 sm:gap-4 md:gap-6">
        {classes.length > 0 ? (
          classes.map((c, idx) => {
            const uniqueKey = `class-${idx}-${c.classID || "no-id"}-${c.classStartTime || "no-time"}`;
            return <ClassRow key={uniqueKey} classData={c} index={idx} />;
          })
        ) : (
          <div className="border-2 border-dashed border-black/20 p-12 text-center bg-neutral-50 transition-all duration-300 hover:border-black/40 hover:bg-neutral-100">
            <div
              className="inline-block mb-4 p-4 bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000] animate-bounce"
              style={{ animationDuration: "3s" }}
            >
              <Clock className="w-8 h-8 stroke-[2px] text-neutral-400" />
            </div>
            <p className="font-display text-xl font-bold text-neutral-400 uppercase">
              No classes today
            </p>
            <p className="font-mono text-xs text-neutral-400 mt-2 uppercase tracking-wider">
              Enjoy your free day!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

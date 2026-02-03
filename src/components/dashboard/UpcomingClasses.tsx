"use client";

import { useState } from "react";
import { useTimeFormat } from "@/context/TimeFormatContext";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon } from "lucide-react";
import { ClassByDate, UpcomingClass } from "@/types/supabase-academic";
import { useClassesByDate } from "@/hooks/useDashboardData";

interface DateData {
  date: Date;
  dayName: string;
  dayNumber: number;
  isToday: boolean;
  isWeekend: boolean;
}

interface UpcomingClassesProps {
  userId: string | null;
  batchId: string;
  defaultClasses: UpcomingClass[]; // From get_upcoming_classes
  className?: string;
}

function HorizontalCalendar({
  dates,
  selectedDate,
  onDateSelect,
}: {
  dates: DateData[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}) {
  return (
    <div className="mb-6 sm:mb-8 md:mb-12 w-full -mx-3 sm:-mx-4 md:-mx-6 lg:-mx-8">
      {/* Scrollable Container */}
      <div className="overflow-x-auto pb-4 sm:pb-6 md:pb-8 px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex gap-2 sm:gap-2.5 md:gap-3 min-w-max">
          {dates.map((dateData) => {
            const isSelected =
              dateData.date.toDateString() === selectedDate.toDateString();

            return (
              <button
                key={dateData.date.toISOString()}
                onClick={() => onDateSelect(dateData.date)}
                disabled={dateData.isWeekend}
                className={cn(
                  "group relative shrink-0 flex flex-col items-center justify-center h-16 w-14 sm:h-20 sm:w-16 md:h-24 md:w-20 lg:w-24 border-2 border-black",
                  "transition-all duration-200 ease-out touch-manipulation",
                  isSelected
                    ? "bg-[#FFD02F] shadow-[4px_4px_0px_0px_#000] -translate-y-1 scale-105" // Active: Brand Yellow + Lift
                    : dateData.isWeekend
                      ? "bg-neutral-100 border-neutral-300 opacity-60 cursor-not-allowed"
                      : "bg-white hover:bg-neutral-50 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_#000] hover:scale-105 active:scale-95 active:translate-y-0 active:shadow-[2px_2px_0px_0px_#000]",
                )}
              >
                <span
                  className={cn(
                    "font-display text-[9px] sm:text-[10px] md:text-xs font-black uppercase tracking-widest mb-0.5 sm:mb-1",
                    isSelected ? "text-black" : "text-neutral-500",
                  )}
                >
                  {dateData.dayName.slice(0, 3)}
                </span>
                <span className="font-mono text-xl sm:text-2xl md:text-3xl font-black leading-none">
                  {dateData.dayNumber}
                </span>

                {/* Today Dot Indicator */}
                {dateData.isToday && (
                  <div className="absolute top-1 right-1 sm:top-2 sm:right-2 h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-red-500 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function UpcomingClassRow({
  classData,
}: {
  classData: ClassByDate | UpcomingClass;
}) {
  const { formatTime } = useTimeFormat();

  const time = formatTime(classData.classStartTime);
  const isLab = "courseType" in classData && classData.courseType?.isLab;
  const isPlusSlot = "isPlusSlot" in classData && classData.isPlusSlot;

  return (
    <div
      className={cn(
        "flex w-full items-center gap-2 sm:gap-3 md:gap-4 bg-white border-2 border-black p-2 sm:p-3 md:p-4",
        "shadow-sm hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] sm:hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
        "hover:-translate-y-0.5 hover:-translate-x-0.5 active:translate-y-0 active:translate-x-0 active:shadow-none",
        "transition-all duration-200 ease-out touch-manipulation cursor-pointer",
        "group",
      )}
    >
      <div className="shrink-0 w-12 sm:w-14 md:w-16 text-center border-r-2 border-black/10 pr-2 sm:pr-3 md:pr-4 transition-colors duration-200 group-hover:border-black/30">
        <span className="block font-mono text-sm sm:text-base md:text-lg font-black transition-transform duration-200 group-hover:scale-110">
          {time}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <h4 className="font-display text-xs sm:text-sm md:text-lg font-bold uppercase truncate">
          {classData.courseName}
        </h4>
        <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 mt-0.5 sm:mt-1 flex-wrap">
          <span className="text-[9px] sm:text-[10px] md:text-xs font-mono font-bold text-neutral-500">
            {classData.courseID}
          </span>
          {isLab && (
            <span className="bg-purple-200 border border-black px-0.5 sm:px-1 text-[8px] sm:text-[9px] md:text-[10px] font-bold uppercase">
              LAB
            </span>
          )}
          {isPlusSlot && (
            <span className="bg-yellow-200 border border-black px-0.5 sm:px-1 text-[8px] sm:text-[9px] md:text-[10px] font-bold uppercase">
              PLUS
            </span>
          )}
          {classData.classVenue && (
            <span className="text-[9px] sm:text-[10px] md:text-xs font-mono text-neutral-400">
              • {classData.classVenue}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function UpcomingClasses({
  userId,
  batchId,
  defaultClasses = [],
  className,
}: UpcomingClassesProps) {
  // Helper to check for weekend
  const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;

  // Generate Date Range (excluding weekends)
  const dateRange: DateData[] = [];
  const today = new Date();
  let daysAdded = 0;
  let dayOffset = 0;

  while (daysAdded < 14) {
    const date = new Date(today);
    date.setDate(today.getDate() + dayOffset);
    dayOffset++;

    if (isWeekend(date)) continue;

    const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
    const dayNumber = date.getDate();
    // Check if truly today (ignoring time)
    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    dateRange.push({
      date,
      dayName,
      dayNumber,
      isToday,
      isWeekend: false, // We filtered them out
    });
    daysAdded++;
  }

  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    // 1. If we have default classes (upcoming), use the first one's date
    if (
      defaultClasses &&
      Array.isArray(defaultClasses) &&
      defaultClasses.length > 0 &&
      defaultClasses[0]
    ) {
      const classDate = new Date(defaultClasses[0].classStartTime);
      if (!isNaN(classDate.getTime())) {
        return classDate;
      }
    }

    // 2. Otherwise default to the first available day in our range (usually Today or next Monday)
    // We can re-calculate the first valid day here briefly
    const d = new Date();
    while (d.getDay() === 0 || d.getDay() === 6) {
      d.setDate(d.getDate() + 1);
    }
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const formatDateForRPC = (date: Date) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return null;
    }
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    // Matches ClassesService format: D/M/YYYY (no padding)
    return `${day}/${month}/${year}`;
  };

  const targetDateString =
    formatDateForRPC(selectedDate) || formatDateForRPC(new Date());

  const { data: dateClasses, loading: dateLoading } = useClassesByDate(
    userId,
    batchId,
    targetDateString,
  );

  const displayClasses = (() => {
    if (!selectedDate || isNaN(selectedDate.getTime())) {
      return defaultClasses;
    }

    if (
      defaultClasses &&
      Array.isArray(defaultClasses) &&
      defaultClasses.length > 0 &&
      defaultClasses[0]
    ) {
      const defaultDate = new Date(defaultClasses[0].classStartTime);
      if (
        !isNaN(defaultDate.getTime()) &&
        defaultDate.getDate() === selectedDate.getDate() &&
        defaultDate.getMonth() === selectedDate.getMonth() &&
        defaultDate.getFullYear() === selectedDate.getFullYear()
      ) {
        // FILTER to only show classes for this specific date
        // defaultClasses contains next 5 classes which might span multiple days
        return defaultClasses.filter((c) => {
          const cDate = new Date(c.classStartTime);
          return (
            cDate.getDate() === selectedDate.getDate() &&
            cDate.getMonth() === selectedDate.getMonth() &&
            cDate.getFullYear() === selectedDate.getFullYear()
          );
        });
      }
    }

    return Array.isArray(dateClasses) ? dateClasses : [];
  })();

  const handleDateSelect = (date: Date) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return;
    }
    setSelectedDate(date);
  };

  return (
    <div
      className={cn(
        "rounded-none border-2 border-black bg-[#fffdf5] p-3 sm:p-4 md:p-6 lg:p-8 shadow-[4px_4px_0px_0px_#000] sm:shadow-[5px_5px_0px_0px_#000] md:shadow-[6px_6px_0px_0px_#000] mt-6 sm:mt-8 md:mt-12",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6 md:mb-8">
        <h2 className="font-display text-base sm:text-xl md:text-2xl lg:text-3xl font-black uppercase tracking-tight flex items-center gap-1.5 sm:gap-2 md:gap-3">
          <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 stroke-[2.5px]" />
          Upcoming
        </h2>
        <div className="hidden sm:block px-2 py-0.5 sm:px-3 sm:py-1 bg-black text-white font-mono text-[9px] sm:text-xs md:text-sm font-bold border-2 border-transparent transform rotate-2">
          PLAN AHEAD
        </div>
      </div>

      {/* Date Selector */}
      <HorizontalCalendar
        dates={dateRange}
        selectedDate={selectedDate}
        onDateSelect={handleDateSelect}
      />

      {/* Classes List */}
      <div className="space-y-2 sm:space-y-2.5 md:space-y-3">
        {dateLoading && targetDateString ? (
          <div className="flex h-24 items-center justify-center">
            <p className="font-mono text-sm text-neutral-400 uppercase">
              Loading...
            </p>
          </div>
        ) : displayClasses.length > 0 ? (
          displayClasses
            .filter(Boolean)
            .map((c, idx) => (
              <UpcomingClassRow
                key={c.classID || `upcoming-${idx}`}
                classData={c}
              />
            ))
        ) : (
          <div className="flex h-24 sm:h-28 md:h-32 flex-col items-center justify-center border-2 border-dashed border-black/20 bg-neutral-50/50 transition-all duration-300 hover:border-black/40 hover:bg-neutral-100/50">
            <div
              className="inline-block mb-3 p-3 bg-white border-2 border-black shadow-[3px_3px_0px_0px_#000] animate-bounce"
              style={{ animationDuration: "3s" }}
            >
              <CalendarIcon className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2px] text-neutral-400" />
            </div>
            <p className="font-display text-sm sm:text-base md:text-lg font-bold text-neutral-400 uppercase">
              No classes on this day
            </p>
            <p className="font-mono text-[9px] sm:text-[10px] text-neutral-400 mt-1 uppercase tracking-wider">
              Select another date
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { cn } from "@/lib/utils";
import { useUserPreferences } from "@/context/UserPreferencesContext";
import { Clock, MapPin, Check, RotateCcw } from "lucide-react";
import { CourseSlotBadge } from "@/components/ui/CourseSlotBadge";
import { TodayScheduleClass } from "@/types/supabase-academic";
import { parseTimestampAsIST } from "@/lib/time/ist";
import { useEffect, useState } from "react";

interface TodayClassesProps {
  classes: TodayScheduleClass[];
  className?: string;
  onRefresh?: () => void;
  loading?: boolean;
  onCheckIn?: (args: {
    classID: string;
    classStartTime: string;
  }) => Promise<unknown>;
  onMarkAbsent?: (args: {
    classID: string;
    classStartTime: string;
  }) => Promise<unknown>;
  pendingByClassId?: Set<string>;
}

function StatusTile({
  label,
  backgroundColor,
  onClick,
  disabled,
  title,
}: {
  label: string;
  backgroundColor: string;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClick?.();
      }}
      disabled={disabled || !onClick}
      title={title}
      aria-label={title ?? label}
      className={cn(
        "h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 border-2 border-black flex flex-col items-center justify-center",
        "shadow-[2px_2px_0px_0px_#000] sm:shadow-[3px_3px_0px_0px_#000] md:shadow-[4px_4px_0px_0px_#000]",
        "select-none",
        "transition-colors duration-150 transition-transform motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
        !(disabled || !onClick) &&
          "cursor-pointer hover:-translate-y-0.5 hover:-translate-x-0.5 active:translate-x-0.5 active:translate-y-0.5",
        (disabled || !onClick) && "opacity-60 cursor-not-allowed",
      )}
      style={{ backgroundColor }}
    >
      {label === "PRESENT" ? (
        <>
          <Check className="w-4 h-4 sm:w-5 sm:h-5 md:w-8 md:h-8 stroke-[3px] mb-0.5 text-black" />
          <span className="text-[6px] sm:text-[7px] md:text-[10px] font-black uppercase tracking-wide text-black">
            {label}
          </span>
        </>
      ) : (
        <span className="text-[clamp(0.35rem,0.9vw,0.55rem)] font-black uppercase tracking-[0.08em] text-center text-black leading-[1.1] whitespace-normal break-normal hyphens-auto px-0.5 w-full">
          {label}
        </span>
      )}
    </button>
  );
}

function formatDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return {
    hours: String(hours).padStart(2, "0"),
    minutes: String(minutes).padStart(2, "0"),
    seconds: String(seconds).padStart(2, "0"),
  };
}

// Palette for progress bars to ensure variety
const PROGRESS_COLORS = [
  "#FF6B6B", // Red
  "#4ECDC4", // Teal
  "#45B7D1", // Blue
  "#FFA07A", // Salmon
  "#98D8C8", // Mint
  "#F7DC6F", // Yellow
  "#BB8FCE", // Purple
];

function ClassRow({
  classData,
  index,
  now,
  onCheckIn,
  onMarkAbsent,
  pendingByClassId,
}: {
  classData: TodayScheduleClass;
  index: number;
  now: Date;
  onCheckIn?: (args: {
    classID: string;
    classStartTime: string;
  }) => Promise<unknown>;
  onMarkAbsent?: (args: {
    classID: string;
    classStartTime: string;
  }) => Promise<unknown>;
  pendingByClassId?: Set<string>;
}) {
  const { formatTime, attendanceGoal } = useUserPreferences();

  const startTime = formatTime(classData.classStartTime);
  const endTime = formatTime(classData.classEndTime);
  const start = parseTimestampAsIST(classData.classStartTime);
  const end = parseTimestampAsIST(classData.classEndTime);

  const isCancelled = classData.isCancelled;
  const isCheckedIn = classData.userAttended;
  const hasStarted = now >= start;
  const isOngoing = now >= start && now <= end;
  const hasEnded = now > end;
  const isPending = pendingByClassId?.has(classData.classID) ?? false;

  const totalMs = Math.max(0, end.getTime() - start.getTime());
  const elapsedMs = Math.min(
    Math.max(0, now.getTime() - start.getTime()),
    totalMs,
  );
  const progressPercent =
    totalMs > 0 ? Math.min(100, (elapsedMs / totalMs) * 100) : 0;
  const remaining = formatDuration(end.getTime() - now.getTime());

  const statusLabel = isCancelled
    ? "CANCELLED"
    : isCheckedIn
      ? hasEnded
        ? "PRESENT"
        : "MARK ABSENT"
      : hasStarted
        ? "MARK ATTENDANCE"
        : "UPCOMING";

  const statusColor = isCancelled
    ? "#FF6B6B"
    : isCheckedIn
      ? hasEnded
        ? "#51CF66"
        : "#FF6B6B"
      : hasStarted
        ? "#FFD02F"
        : "#ffffff";

  const tileDisabledReason = isCancelled
    ? "Cancelled"
    : isPending
      ? "Updating…"
      : !hasStarted
        ? "Class hasn't started yet"
        : !isCheckedIn && !onCheckIn
          ? "Check-in unavailable"
          : isCheckedIn && !onMarkAbsent
            ? "Mark absent unavailable"
            : null;

  const tileTitle =
    tileDisabledReason ?? (isCheckedIn ? "Mark absent" : "Mark attendance");

  const handleToggle = () => {
    if (tileDisabledReason) return;

    if (!isCheckedIn && onCheckIn) {
      void onCheckIn({
        classID: classData.classID,
        classStartTime: classData.classStartTime,
      });
      return;
    }

    if (isCheckedIn && onMarkAbsent) {
      void onMarkAbsent({
        classID: classData.classID,
        classStartTime: classData.classStartTime,
      });
    }
  };

  // Determine progress bar color based on index
  const progressColor = PROGRESS_COLORS[index % PROGRESS_COLORS.length];

  // Logic for the descriptive text
  let insightText = "";
  let isRisk = false;

  if (classData.classesRequiredToReachGoal > 0) {
    insightText = `You must attend ${classData.classesRequiredToReachGoal} more ${classData.classesRequiredToReachGoal === 1 ? "class" : "classes"} to reach ${attendanceGoal}%!`;
    isRisk = true;
  } else if (classData.classesCanSkipAndStayAboveGoal > 0) {
    insightText = `You can skip ${classData.classesCanSkipAndStayAboveGoal} ${classData.classesCanSkipAndStayAboveGoal === 1 ? "class" : "classes"} and still stay above ${attendanceGoal}%`;
  } else {
    insightText = `You are exactly on track for ${attendanceGoal}%`;
  }

  if (classData.currentAttendancePercentage >= 100) {
    insightText = "Perfect attendance! Keep it up!";
  } else if (classData.totalClasses === 0) {
    insightText = "First class of the course!";
  }

  return (
    <div
      className={cn(
        "group relative flex flex-row items-stretch border-2 border-black bg-white transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]",
        "shadow-[3px_3px_0px_0px_#000] sm:shadow-[4px_4px_0px_0px_#000]",
        "hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[4px_4px_0px_0px_#000]",
        "active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#000]",
        "touch-manipulation cursor-default motion-reduce:transition-none",
        classData.isCancelled && "opacity-60",
      )}
      style={{
        animationDelay: `${index * 50}ms`,
        animationFillMode: "backwards",
      }}
    >
      {/* 1. Time Column */}
      <div className="flex flex-col justify-center items-start pl-2 pr-2 py-2 sm:pl-4 sm:pr-4 sm:py-4 md:pl-6 md:pr-6 md:py-6 lg:pl-8 lg:pr-8 border-r-2 border-black w-20 sm:w-24 md:w-28 lg:w-32">
        <span className="font-mono text-[clamp(0.85rem,2.6vw,2.2rem)] font-black text-black leading-none mb-0.5 whitespace-nowrap">
          {startTime}
        </span>
        <span className="font-mono text-[clamp(0.5rem,1.1vw,0.8rem)] font-bold text-neutral-500 tracking-wide whitespace-nowrap">
          {endTime}
        </span>
      </div>

      {/* 2. Info Column */}
      <div className="flex-1 flex flex-col justify-between px-2 py-2 sm:px-3 sm:py-3 md:px-4 md:py-4 lg:px-6 lg:py-6 min-w-0">
        <div>
          <div className="mb-0.5 sm:mb-1 md:mb-1.5 flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs font-bold text-neutral-500 uppercase tracking-wide">
              {classData.courseID}
            </span>
            <CourseSlotBadge courseId={classData.courseID} />
            {classData.isCancelled && (
              <span className="bg-red-200 border border-black px-1 text-[8px] sm:text-[9px] font-black uppercase">
                CANCELLED
              </span>
            )}
          </div>
          <h3 className="font-display text-xs sm:text-sm md:text-lg lg:text-xl xl:text-2xl font-black uppercase leading-tight tracking-tight mb-1 line-clamp-2 whitespace-normal wrap-break-word">
            {classData.courseName}
          </h3>
          <div className="flex items-center gap-1 sm:gap-1.5 text-neutral-600 mb-3">
            <MapPin className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 lg:w-4 lg:h-4" />
            <span className="font-mono text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs font-medium">
              {classData.classVenue || "TBA"}
            </span>
          </div>
        </div>

        {/* Enhanced Attendance Stats - Progress Bar & Text */}
        {classData.totalClasses > 0 && (
          <div className="flex flex-col gap-1.5 mt-auto">
            <div className="flex items-center gap-3 w-full">
              {/* Current % Label */}
              <span className="font-mono text-[10px] sm:text-xs font-black min-w-12">
                {classData.currentAttendancePercentage.toFixed(1)}%
              </span>

              {/* Visual Progress Bar */}
              <div className="flex-1 h-2 sm:h-2.5 border border-black bg-white rounded-full overflow-hidden relative shadow-[1px_1px_0px_0px_rgba(0,0,0,0.2)]">
                <div
                  className="h-full absolute top-0 left-0 transition-all duration-500 ease-out rounded-full"
                  style={{
                    width: `${Math.min(100, Math.max(0, classData.currentAttendancePercentage))}%`,
                    backgroundColor: progressColor,
                  }}
                />
                {/* Goal Marker (75%) */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-black z-10"
                  style={{ left: `${attendanceGoal}%` }}
                />
              </div>
            </div>

            {/* Insight Text */}
            <p
              className={cn(
                "font-mono text-[9px] sm:text-[10px] font-bold uppercase tracking-wide whitespace-normal wrap-break-word leading-tight",
                isRisk ? "text-red-600" : "text-neutral-500",
              )}
            >
              {insightText}
            </p>
          </div>
        )}
      </div>

      {/* 3. Status / Timer */}
      <div className="flex flex-col items-center justify-center gap-2 px-1.5 sm:px-3 md:px-4 lg:px-6 border-l-2 border-black bg-neutral-50 group-hover:bg-[#FFFDF5] transition-colors duration-300">
        <StatusTile
          label={statusLabel}
          backgroundColor={statusColor}
          onClick={handleToggle}
          disabled={Boolean(tileDisabledReason)}
          title={tileTitle}
        />

        {isOngoing && (
          <div className="min-w-27.5 sm:min-w-35 border-2 border-black bg-white px-2 py-2 shadow-[2px_2px_0px_0px_#000]">
            <div className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-center">
              Time Remaining
            </div>
            <div className="mt-1 font-mono text-sm sm:text-base md:text-lg font-black text-center tabular-nums">
              {remaining.hours}:{remaining.minutes}:{remaining.seconds}
            </div>
            <div className="mt-2 h-1.5 border border-black bg-white">
              <div
                className="h-full bg-black transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function TodayClasses({
  classes,
  className,
  onRefresh,
  loading,
  onCheckIn,
  onMarkAbsent,
  pendingByClassId,
}: TodayClassesProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    if (!onRefresh || isRefreshing || loading) return;
    setIsRefreshing(true);
    const start = Date.now();
    try {
      await onRefresh();
    } finally {
      const elapsed = Date.now() - start;
      const minDelay = 450;
      const delay = Math.max(minDelay - elapsed, 0);
      window.setTimeout(() => setIsRefreshing(false), delay);
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-black pb-3 sm:pb-4 md:pb-6 mb-2">
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
          <Clock className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 stroke-[2.5px]" />
          <h2 className="font-display text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-black uppercase tracking-tight">
            Today&apos;s Schedule
          </h2>
          {onRefresh && (
            <button
              onClick={handleRefresh}
              disabled={isRefreshing || loading}
              aria-busy={isRefreshing || loading}
              className={cn(
                "ml-2 sm:ml-4 inline-flex items-center gap-1.5 rounded-full p-1.5 sm:p-2 transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 motion-reduce:transition-none",
                isRefreshing || loading
                  ? "opacity-70 cursor-not-allowed bg-neutral-100"
                  : "hover:bg-neutral-100",
              )}
              title="Refresh Schedule"
            >
              <RotateCcw
                className={cn(
                  "w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5",
                  (isRefreshing || loading) && "animate-spin",
                )}
              />
              {isRefreshing && (
                <span className="hidden sm:inline text-[9px] sm:text-[10px] font-black uppercase tracking-wide text-neutral-500">
                  Refreshing
                </span>
              )}
            </button>
          )}
        </div>
        <span className="font-mono text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-bold text-neutral-500 uppercase tracking-wide">
          {classes.length} classes
        </span>
      </div>

      <div className="grid gap-3 sm:gap-4 md:gap-6">
        {classes.length > 0 ? (
          classes.map((c, idx) => {
            const uniqueKey = `${c.classID || c.courseID || "class"}-${c.classStartTime || "start"}-${c.classEndTime || "end"}-${idx}`;
            return (
              <ClassRow
                key={uniqueKey}
                classData={c}
                index={idx}
                now={now}
                onCheckIn={onCheckIn}
                onMarkAbsent={onMarkAbsent}
                pendingByClassId={pendingByClassId}
              />
            );
          })
        ) : (
          <div className="border-2 border-dashed border-black/20 p-12 text-center bg-neutral-50 transition-all duration-300 hover:border-black/40 hover:bg-neutral-100">
            <div
              className="inline-block mb-4 p-4 bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000] animate-bounce motion-reduce:animate-none"
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

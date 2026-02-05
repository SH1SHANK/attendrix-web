"use client";

import { useEffect, useState, useMemo, memo } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { TodayScheduleClass, UpcomingClass } from "@/types/supabase-academic";
import { parseTimestampAsIST } from "@/lib/time/ist";
import { useUserPreferences } from "@/context/UserPreferencesContext";
import { Menu } from "@/components/ui/Menu";
import { CourseSlotBadge } from "@/components/ui/CourseSlotBadge";
import { MoreVertical, Target } from "lucide-react";

interface CountdownCardProps {
  classData: TodayScheduleClass | UpcomingClass | null;
  type: "current" | "next" | "none";
  loading?: boolean;
  className?: string;
  onCheckIn?: (args: { classID: string; classStartTime: string }) => Promise<unknown>;
  onMarkAbsent?: (args: { classID: string; classStartTime: string }) => Promise<unknown>;
  pendingByClassId?: Set<string>;
}

export const CountdownCard = memo(function CountdownCard({
  classData,
  type,
  loading = false,
  className,
  onCheckIn,
  onMarkAbsent,
  pendingByClassId,
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
      onCheckIn={onCheckIn}
      onMarkAbsent={onMarkAbsent}
      pendingByClassId={pendingByClassId}
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
      <div className="p-4 sm:p-6 md:p-8 animate-pulse motion-reduce:animate-none">
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

type CourseTypeMeta = {
  isLab?: boolean;
  courseType?: string | null;
} | null;

const TIME_ONLY_REGEX = /^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i;

const isValidDate = (value: Date) =>
  value instanceof Date && !Number.isNaN(value.getTime());

function parseClassDateString(value?: string | null): Date | null {
  if (!value) return null;
  const parts = value.split("/");
  if (parts.length !== 3) return null;
  const day = Number(parts[0]);
  const month = Number(parts[1]);
  const year = Number(parts[2]);
  if (!day || !month || !year) return null;
  const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(
    2,
    "0",
  )}T00:00:00+05:30`;
  const parsed = new Date(iso);
  return isValidDate(parsed) ? parsed : null;
}

function parseTimeOnDate(
  value: string | null | undefined,
  baseDate: Date,
): Date | null {
  if (!value) return null;
  const match = value.trim().match(TIME_ONLY_REGEX);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2] || 0);
  const second = Number(match[3] || 0);
  const meridiem = match[4]?.toUpperCase();
  if (Number.isNaN(hour) || Number.isNaN(minute) || Number.isNaN(second)) {
    return null;
  }
  if (meridiem === "PM" && hour < 12) hour += 12;
  if (meridiem === "AM" && hour === 12) hour = 0;
  const date = new Date(baseDate.getTime());
  date.setHours(hour, minute, second, 0);
  return isValidDate(date) ? date : null;
}

function getCourseTypeLabel(courseType?: CourseTypeMeta): string | null {
  if (!courseType) return null;
  if (courseType.isLab) return "LAB";
  if (courseType.courseType) return courseType.courseType.toUpperCase();
  return null;
}

interface CountdownCardViewProps {
  classData: TodayScheduleClass | UpcomingClass;
  type: "current" | "next";
  className?: string;
  onCheckIn?: (args: { classID: string; classStartTime: string }) => Promise<unknown>;
  onMarkAbsent?: (args: { classID: string; classStartTime: string }) => Promise<unknown>;
  pendingByClassId?: Set<string>;
}

function CountdownCardView({
  classData,
  type,
  className,
  onCheckIn,
  onMarkAbsent,
  pendingByClassId,
}: CountdownCardViewProps) {
  const router = useRouter();
  const { formatTime, attendanceGoal } = useUserPreferences();
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [progress, setProgress] = useState(0);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const isTodayClass = "userAttended" in classData;
  const isCheckedIn = isTodayClass ? classData.userAttended : false;
  const isPending = pendingByClassId?.has(classData.classID) ?? false;

  const {
    startMs,
    endMs,
    timeRange,
    dateLabel,
    courseTypeLabel,
    attendanceSummary,
    attendanceHint,
  } = useMemo(() => {
    const classDateValue =
      "classDate" in classData ? classData.classDate : null;
    const courseTypeValue = classData.courseType ?? null;

    let start = parseTimestampAsIST(classData.classStartTime);
    let end = parseTimestampAsIST(classData.classEndTime);
    let validTimes = isValidDate(start) && isValidDate(end);

    if (!validTimes) {
      const baseDate = parseClassDateString(classDateValue) ?? new Date();
      const startFallback = parseTimeOnDate(
        classData.classStartTime,
        baseDate,
      );
      const endFallback = parseTimeOnDate(classData.classEndTime, baseDate);
      if (startFallback) start = startFallback;
      if (endFallback) end = endFallback;
      validTimes = isValidDate(start) && isValidDate(end);
    }

    if (!isValidDate(start)) start = new Date();
    if (!isValidDate(end)) end = new Date(start.getTime() + 60 * 60 * 1000);

    const displayTimeRange = validTimes
      ? `${formatTime(start)} - ${formatTime(end)}`
      : "Time N/A";

    const baseDate =
      isValidDate(start) ? start : parseClassDateString(classDateValue);
    const displayDate = baseDate
      ? baseDate.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
          timeZone: "Asia/Kolkata",
        })
      : null;

    let summary: {
      attended: number;
      total: number;
      percent: number;
      needed: number;
      canSkip: number;
    } | null = null;
    let hint: string | null = null;

    if ("userAttended" in classData) {
      const attended = classData.attendedClasses ?? 0;
      const total = classData.totalClasses ?? 0;
      const percent = Number.isFinite(classData.currentAttendancePercentage)
        ? classData.currentAttendancePercentage
        : 0;
      const needed = classData.classesRequiredToReachGoal ?? 0;
      const canSkip = classData.classesCanSkipAndStayAboveGoal ?? 0;

      summary = { attended, total, percent, needed, canSkip };

      if (total === 0) {
        hint = "No attendance recorded yet.";
      } else if (needed > 0) {
        hint = `Attend ${needed} more ${
          needed === 1 ? "class" : "classes"
        } to reach ${attendanceGoal}%.`;
      } else if (canSkip > 0) {
        hint = `You can skip ${canSkip} ${
          canSkip === 1 ? "class" : "classes"
        } and stay above ${attendanceGoal}%.`;
      } else {
        hint = `On track for ${attendanceGoal}%.`;
      }
    } else {
      hint = "Attendance details will update after class.";
    }

    return {
      startMs: start.getTime(),
      endMs: end.getTime(),
      timeRange: displayTimeRange,
      dateLabel: displayDate,
      courseTypeLabel: getCourseTypeLabel(courseTypeValue),
      attendanceSummary: summary,
      attendanceHint: hint,
    };
  }, [classData, formatTime, attendanceGoal]);

  const targetMs = type === "current" ? endMs : startMs;
  const hasStarted = nowMs >= startMs;
  const isUpcoming = nowMs < startMs;
  const canCheckIn = hasStarted && !isCheckedIn;
  const canMarkAbsent = hasStarted && isCheckedIn;

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      setNowMs(now);

      if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) {
        setProgress(0);
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const totalDuration = endMs - startMs;
      let newProgress = 0;

      if (now >= endMs) {
        newProgress = 100;
      } else if (type === "next" && now < startMs) {
        newProgress = 0;
      } else if (totalDuration <= 0) {
        newProgress = 100;
      } else {
        newProgress = Math.min(
          100,
          Math.max(0, ((now - startMs) / totalDuration) * 100),
        );
      }

      setProgress(Number.isFinite(newProgress) ? newProgress : 0);

      const diff = targetMs - now;
      if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        setTimeLeft({
          hours: Number.isFinite(hours) ? hours : 0,
          minutes: Number.isFinite(minutes) ? minutes : 0,
          seconds: Number.isFinite(seconds) ? seconds : 0,
        });
      } else {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
      }
    };

    tick();
    const intervalId = setInterval(tick, 1000);

    return () => clearInterval(intervalId);
  }, [startMs, endMs, targetMs, type]);

  const isCurrent = type === "current";

  const cardBg = isCurrent ? "bg-[#FF6B6B]" : "bg-[#FFD02F]";

  return (
    <div
      className={cn(
        "relative overflow-hidden w-full border-2 border-black transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]",
        cardBg,
        "shadow-[3px_3px_0px_0px_#000] sm:shadow-[4px_4px_0px_0px_#000] md:shadow-[5px_5px_0px_0px_#000]",
        "hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[4px_4px_0px_0px_#000] sm:hover:shadow-[5px_5px_0px_0px_#000]",
        "active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#000]",
        "touch-manipulation select-none motion-reduce:transition-none",
        "group cursor-default focus-within:outline-none focus-within:ring-2 focus-within:ring-black focus-within:ring-offset-2",
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "inline-flex items-center border-2 border-black px-4 py-1.5 text-sm font-black uppercase tracking-[0.12em] shadow-[3px_3px_0px_0px_#000]",
                "transition-all duration-200 motion-reduce:transition-none",
                isCurrent
                  ? "bg-black text-white animate-pulse motion-reduce:animate-none"
                  : "bg-white text-black",
              )}
              style={{
                animationDuration: isCurrent ? "2s" : "0s",
              }}
            >
              {isCurrent && (
                <span className="mr-2 h-2 w-2 rounded-full bg-white animate-pulse motion-reduce:animate-none" />
              )}
              {isCurrent ? "LIVE NOW" : "UP NEXT"}
            </div>

            {isCurrent && (
              <div className="hidden sm:block font-mono text-sm font-bold border-2 border-black bg-white px-3 py-1.5 shadow-[2px_2px_0px_0px_#000]">
                {Math.floor(progress)}% COMPLETED
              </div>
            )}
          </div>

          <Menu>
            <Menu.Trigger asChild>
              <button
                type="button"
                aria-label="Open course actions"
                className="h-9 w-9 border-2 border-black bg-white flex items-center justify-center shadow-[2px_2px_0px_0px_#000] transition-colors duration-150 transition-transform hover:bg-yellow-50 active:scale-95 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </Menu.Trigger>
            <Menu.Content
              align="end"
              sideOffset={6}
              className="border-2 border-black bg-white shadow-[3px_3px_0px_0px_#000] min-w-[190px]"
            >
              <Menu.Item
                className="flex items-center gap-2 px-3 py-2 text-xs font-black uppercase tracking-wide hover:bg-yellow-100 focus:bg-yellow-100"
                disabled={!classData.courseID}
                onSelect={() => {
                  if (!classData.courseID) return;
                  router.push(`/resources/course/${classData.courseID}`);
                }}
              >
                <Target className="h-4 w-4" />
                Go to Course Resources
              </Menu.Item>
            </Menu.Content>
          </Menu>
        </div>

          <div className="space-y-2">
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase leading-[0.85] text-black tracking-tighter drop-shadow-sm stroke-black">
              {classData.courseName}
            </h1>
            <div className="inline-block bg-black text-white px-3 py-1 font-mono text-lg font-bold transform -rotate-1 border-2 border-transparent">
              {timeRange}
            </div>
            <div className="flex flex-wrap gap-2 pt-3">
              {dateLabel && (
                <span className="inline-flex items-center border-2 border-black bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] leading-none shadow-[2px_2px_0px_0px_#000]">
                  {dateLabel}
                </span>
              )}
              <CourseSlotBadge
                courseId={classData.courseID}
                className="bg-black text-white shadow-[2px_2px_0px_0px_#000]"
              />
              <span className="inline-flex items-center border-2 border-black bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] leading-none shadow-[2px_2px_0px_0px_#000]">
                Type: {courseTypeLabel ?? "N/A"}
              </span>
              {classData.classVenue && (
                <span className="inline-flex items-center border-2 border-black bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] leading-none shadow-[2px_2px_0px_0px_#000]">
                  Venue: {classData.classVenue}
                </span>
              )}
              {attendanceSummary && (
                <span className="inline-flex items-center border-2 border-black bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] leading-none shadow-[2px_2px_0px_0px_#000]">
                  Attendance: {attendanceSummary.attended}/
                  {attendanceSummary.total} •{" "}
                  {attendanceSummary.percent.toFixed(1)}%
                </span>
              )}
            </div>
            {attendanceHint && (
              <p className="font-mono text-xs sm:text-sm font-bold text-black/70">
                {attendanceHint}
              </p>
            )}
            {(type === "current" || type === "next") && (
              <div className="flex flex-wrap gap-2 pt-2">
                {type === "current" && isTodayClass && (
                  <>
                    {isCheckedIn && (
                      <span className="inline-flex items-center border-2 border-black bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] shadow-[2px_2px_0px_0px_#000]">
                        Checked In
                      </span>
                    )}
                    {canCheckIn && (
                      <button
                        onClick={() =>
                          onCheckIn?.({
                            classID: classData.classID,
                            classStartTime: classData.classStartTime,
                          })
                        }
                        disabled={!onCheckIn || isPending}
                        className={cn(
                          "border-2 border-black px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] shadow-[2px_2px_0px_0px_#000] transition-colors duration-150 transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
                          isPending || !onCheckIn
                            ? "bg-neutral-200 text-neutral-500 cursor-not-allowed"
                            : "bg-[#51CF66] text-black hover:-translate-y-0.5 hover:-translate-x-0.5",
                        )}
                      >
                        {isPending ? "Checking In..." : "Check In"}
                      </button>
                    )}
                    {canMarkAbsent && (
                      <button
                        onClick={() =>
                          onMarkAbsent?.({
                            classID: classData.classID,
                            classStartTime: classData.classStartTime,
                          })
                        }
                        disabled={!onMarkAbsent || isPending}
                        className={cn(
                          "border-2 border-black px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] shadow-[2px_2px_0px_0px_#000] transition-colors duration-150 transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
                          isPending || !onMarkAbsent
                            ? "bg-neutral-200 text-neutral-500 cursor-not-allowed"
                            : "bg-[#FF6B6B] text-black hover:-translate-y-0.5 hover:-translate-x-0.5",
                        )}
                      >
                        {isPending ? "Updating..." : "Mark Absent"}
                      </button>
                    )}
                    {!isCheckedIn && isUpcoming && (
                      <span className="inline-flex items-center border-2 border-black bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] shadow-[2px_2px_0px_0px_#000]">
                        Upcoming
                      </span>
                    )}
                  </>
                )}
                {type === "next" && (
                  <span className="inline-flex items-center border-2 border-black bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] shadow-[2px_2px_0px_0px_#000]">
                    Upcoming
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Timer */}
        <div className="w-full md:w-auto z-10">
          <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_#000] transition-transform duration-150 hover:scale-[1.02] motion-reduce:transition-none">
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

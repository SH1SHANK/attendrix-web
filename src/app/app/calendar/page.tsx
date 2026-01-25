"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  Check,
  X,
  FlaskConical,
  BookOpen,
  Flame,
  Trophy,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isAfter,
} from "date-fns";
import { type CalendarClass } from "@/app/actions/calendar";
import { useCalendar } from "@/hooks/queries/useCalendar";
import {
  useHistory,
  HistoryRange,
  ClassRecord,
} from "@/hooks/queries/useHistory";
import { useProfile } from "@/hooks/queries/useProfile";
import { ViewToggle } from "@/components/app/ViewToggle";

// ============================================================================
// Types
// ============================================================================

type DayStatus = "all-present" | "missed" | "future" | "no-classes";

interface DayAttendance {
  date: Date;
  status: DayStatus;
  classes: CalendarClass[];
}

// ============================================================================
// Animation Variants
// ============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

// ============================================================================
// Sub-Components
// ============================================================================

function CalendarGrid({
  days,
  currentMonth,
  streakDates,
}: {
  days: DayAttendance[];
  currentMonth: Date;
  streakDates: Set<string>;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Get the first day of the month to calculate offset
  const firstDay = startOfMonth(currentMonth);
  const firstDayOffset = firstDay.getDay();

  return (
    <div className="bg-white border-2 border-black shadow-[6px_6px_0px_0px_#000]">
      {/* Week Day Headers */}
      <div className="grid grid-cols-7 border-b-2 border-black">
        {weekDays.map((day) => (
          <div
            key={day}
            className="p-2 text-center font-mono text-xs font-bold uppercase tracking-wider bg-neutral-100 border-r-2 border-black last:border-r-0"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Cells */}
      <div className="grid grid-cols-7">
        {/* Empty cells for offset */}
        {Array.from({ length: firstDayOffset }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="aspect-square border-r-2 border-b-2 border-black last:border-r-0 bg-neutral-50"
          />
        ))}

        {/* Day cells */}
        {days.map((day, index) => {
          const dateKey = format(day.date, "yyyy-MM-dd");
          const isStreakDay = streakDates.has(dateKey);
          const isToday = isSameDay(day.date, today);
          const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6;

          return (
            <motion.div
              key={day.date.toISOString()}
              className={`
                aspect-square border-r-2 border-b-2 border-black last:border-r-0
                p-1 md:p-2 flex flex-col items-center justify-center relative
                ${
                  isStreakDay
                    ? "bg-purple-100" // Highlight streak days
                    : isToday
                      ? "bg-yellow-100"
                      : isWeekend
                        ? "bg-neutral-50"
                        : "bg-white"
                }
                ${day.status === "future" ? "opacity-50" : ""}
                transition-colors hover:bg-neutral-100
              `}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.02 }}
            >
              {/* Streak Flame */}
              {isStreakDay && (
                <div className="absolute top-1 left-1 opacity-100">
                  <Flame className="w-3 h-3 md:w-4 md:h-4 text-purple-600 fill-purple-600 animate-pulse" />
                </div>
              )}

              {/* Date Number */}
              <span
                className={`
                  font-mono text-sm md:text-base font-bold z-10
                  ${isToday ? "text-yellow-800" : isStreakDay ? "text-purple-900" : "text-neutral-800"}
                `}
              >
                {day.date.getDate()}
              </span>

              {/* Status Indicator */}
              {day.status !== "future" && day.status !== "no-classes" && (
                <div
                  className={`
                    w-2 h-2 md:w-2.5 md:h-2.5 mt-1
                    ${
                      isStreakDay
                        ? "bg-purple-500"
                        : day.status === "all-present"
                          ? "bg-green-500"
                          : "bg-red-500"
                    }
                    border border-black
                  `}
                />
              )}

              {/* Today Marker */}
              {isToday && (
                <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-yellow-500 border border-black" />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 md:gap-6 p-3 border-t-2 border-black bg-neutral-50 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-green-500 border border-black" />
          <span className="font-mono text-[10px] uppercase">Present</span>
        </div>
        <div className="flex items-center gap-2">
          <Flame className="w-3 h-3 text-purple-600 fill-purple-600" />
          <span className="font-mono text-[10px] uppercase">Streak Day</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-red-500 border border-black" />
          <span className="font-mono text-[10px] uppercase">Missed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-yellow-500 border border-black" />
          <span className="font-mono text-[10px] uppercase">Today</span>
        </div>
      </div>
    </div>
  );
}

function HistoryClassCard({
  classRecord,
  isEditable,
  onToggle,
}: {
  classRecord: ClassRecord;
  isEditable: boolean;
  onToggle?: (c: ClassRecord) => void;
}) {
  const TypeIcon = classRecord.type === "lab" ? FlaskConical : BookOpen;

  return (
    <div
      className={`
        flex items-center gap-3 p-3 border-2 border-black bg-white
        shadow-[3px_3px_0px_0px_#000]
        ${!isEditable ? "opacity-75" : ""}
      `}
    >
      <div
        className={`
          w-10 h-10 flex items-center justify-center border-2 border-black shrink-0
          ${classRecord.attended ? "bg-green-400" : "bg-red-400"}
          ${isEditable ? "cursor-pointer hover:scale-105 active:scale-95 transition-transform" : "cursor-not-allowed opacity-50"}
        `}
        onClick={() => isEditable && onToggle?.(classRecord)}
      >
        {classRecord.attended ? (
          <Check className="w-5 h-5 text-white" strokeWidth={3} />
        ) : (
          <X className="w-5 h-5 text-white" strokeWidth={3} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <TypeIcon className="w-3 h-3 text-neutral-500" />
          <span className="font-mono text-[10px] font-bold text-neutral-500">
            {classRecord.courseCode}
          </span>
        </div>
        <h4 className="font-bold text-sm truncate">{classRecord.courseName}</h4>
      </div>

      <div className="flex flex-col items-end text-right shrink-0">
        <div className="flex items-center gap-1 text-neutral-500">
          <Clock className="w-3 h-3" />
          <span className="font-mono text-xs">{classRecord.startTime}</span>
        </div>
        <div className="flex items-center gap-1 text-neutral-400">
          <MapPin className="w-3 h-3" />
          <span className="font-mono text-[10px]">{classRecord.venue}</span>
        </div>
      </div>
    </div>
  );
}

function HistoryList({
  history,
  onToggle,
}: {
  history: {
    date: Date;
    label: string;
    classes: ClassRecord[];
  }[];
  onToggle: (c: ClassRecord) => void;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="space-y-6">
      {history.map((group) => {
        const isToday = isSameDay(group.date, today);

        return (
          <motion.div key={group.date.toISOString()} variants={itemVariants}>
            <div className="flex items-center gap-3 mb-3">
              <h3
                className={`
                  font-black uppercase text-lg
                  ${isToday ? "text-yellow-700" : "text-neutral-800"}
                `}
              >
                {group.label}
              </h3>
              <div className="flex-1 h-[2px] bg-neutral-200" />
              <span className="font-mono text-xs text-neutral-500">
                {group.classes.length} classes
              </span>
            </div>

            <div className="space-y-2">
              {group.classes.map((classRecord) => (
                <HistoryClassCard
                  key={classRecord.id}
                  classRecord={classRecord}
                  isEditable={isToday}
                  onToggle={onToggle}
                />
              ))}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function RangeFilter({
  value,
  onChange,
}: {
  value: HistoryRange;
  onChange: (v: HistoryRange) => void;
}) {
  return (
    <div className="flex items-center gap-2 bg-white border-2 border-black p-1 shadow-[4px_4px_0px_0px_#000]">
      {(["7d", "14d", "30d", "all"] as const).map((r) => (
        <button
          key={r}
          onClick={() => onChange(r)}
          className={`
            px-3 py-1 font-mono text-xs font-bold uppercase transition-all
            ${
              value === r
                ? "bg-purple-400 text-black border-2 border-black -translate-y-px shadow-[2px_2px_0px_0px_#000]"
                : "text-neutral-500 hover:text-black hover:bg-neutral-100"
            }
          `}
        >
          {r === "all" ? "All Time" : r}
        </button>
      ))}
    </div>
  );
}

// ============================================================================
// Main Calendar Page
// ============================================================================

export default function CalendarPage() {
  const [activeView, setActiveView] = useState<"calendar" | "list">("calendar");
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [range, setRange] = useState<HistoryRange>("7d");

  // Hooks
  const {
    rawData: calendarData,
    isLoading: calendarLoading,
    toggleAttendance,
  } = useCalendar(currentMonth);
  const { history, isLoading: historyLoading } = useHistory(range);
  const { profile } = useProfile();

  const loading = activeView === "calendar" ? calendarLoading : historyLoading;

  const monthName = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const streakDates = useMemo(
    () => new Set(profile?.calendarDates || []),
    [profile],
  );

  const days = useMemo(() => {
    if (!calendarData?.classes) return [];

    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const daysInMonth = eachDayOfInterval({ start, end });
    const today = new Date();

    return daysInMonth.map((date) => {
      const dateKey = format(date, "yyyy-MM-dd");
      const dayClasses = calendarData.classes.filter((c) =>
        c.date.startsWith(dateKey),
      );

      let status: DayStatus = "no-classes";
      if (dayClasses.length > 0) {
        if (isAfter(date, today)) {
          status = "future";
        } else {
          const allPresent = dayClasses.every((c) => c.attended);
          status = allPresent ? "all-present" : "missed";
        }
      }

      return {
        date,
        status,
        classes: dayClasses,
      };
    });
  }, [calendarData, currentMonth]);

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => {
      const next = new Date(prev);
      next.setMonth(prev.getMonth() - 1);
      return next;
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => {
      const next = new Date(prev);
      next.setMonth(prev.getMonth() + 1);
      return next;
    });
  };

  const handleToggleHistory = (c: ClassRecord) => {
    // Map ClassRecord to CalendarClass structure for mutation if needed
    // toggleAttendance takes CalendarClass
    toggleAttendance.mutate({
      id: c.id,
      courseID: c.courseID,
      courseCode: c.courseCode,
      courseName: c.courseName,
      startTime: c.startTime,
      endTime: c.endTime,
      venue: c.venue,
      attended: c.attended,
      type: c.type,
      date: c.date.toISOString(),
    });
  };

  return (
    <motion.div
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Page Header */}
      <motion.header variants={itemVariants} className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-400 border-2 border-black flex items-center justify-center shadow-[3px_3px_0px_0px_#000]">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <h1 className="font-black text-3xl md:text-4xl uppercase tracking-tight">
            HISTORY
          </h1>
        </div>
        <p className="font-medium text-neutral-600 max-w-xl">
          Time-travel through your attendance. Spot patterns and trends.
        </p>
      </motion.header>

      {/* Controls Row */}
      <motion.section
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        {activeView === "calendar" ? (
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrevMonth}
              className="w-10 h-10 border-2 border-black bg-white flex items-center justify-center shadow-[2px_2px_0px_0px_#000] hover:bg-neutral-100 active:translate-x-px active:translate-y-px active:shadow-none transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-black text-xl uppercase tracking-wider min-w-[180px] text-center">
              {monthName}
            </span>
            <button
              onClick={handleNextMonth}
              className="w-10 h-10 border-2 border-black bg-white flex items-center justify-center shadow-[2px_2px_0px_0px_#000] hover:bg-neutral-100 active:translate-x-px active:translate-y-px active:shadow-none transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <RangeFilter value={range} onChange={setRange} />
        )}

        <ViewToggle activeView={activeView} onViewChange={setActiveView} />
      </motion.section>

      {/* Content */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-[400px] flex items-center justify-center"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-black border-t-purple-400 rounded-full animate-spin" />
              <p className="font-mono text-sm font-bold uppercase tracking-widest text-neutral-500 animate-pulse">
                Loading Data...
              </p>
            </div>
          </motion.div>
        ) : activeView === "calendar" ? (
          <motion.section
            key="calendar"
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -20 }}
          >
            <CalendarGrid
              days={days}
              currentMonth={currentMonth}
              streakDates={streakDates}
            />
          </motion.section>
        ) : (
          <motion.section
            key="list"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -20 }}
          >
            {history.length > 0 ? (
              <HistoryList history={history} onToggle={handleToggleHistory} />
            ) : (
              <div className="p-8 border-2 border-black bg-neutral-50 text-center">
                <p className="font-bold text-neutral-500">
                  No history found for this period.
                </p>
              </div>
            )}
          </motion.section>
        )}
      </AnimatePresence>

      {/* Stats Summary */}
      <motion.section variants={itemVariants}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-green-100 border-2 border-black shadow-[4px_4px_0px_0px_#000]">
            <span className="font-mono text-[10px] uppercase tracking-wider text-green-700 block mb-1">
              Total Perfect Days
            </span>
            <span className="font-black text-3xl text-green-800">
              {profile?.perfectDays || 0}
            </span>
          </div>

          <div className="p-4 bg-purple-100 border-2 border-black shadow-[4px_4px_0px_0px_#000]">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-4 h-4 text-purple-700" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-purple-700 block">
                Longest Streak
              </span>
            </div>
            <span className="font-black text-3xl text-purple-800">
              {profile?.longestStreak || 0}
            </span>
          </div>

          <div className="p-4 bg-neutral-100 border-2 border-black shadow-[4px_4px_0px_0px_#000]">
            <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-600 block mb-1">
              Classes (Month)
            </span>
            <span className="font-black text-3xl text-neutral-800">
              {days.reduce(
                (acc, d) => acc + d.classes.filter((c) => c.attended).length,
                0,
              )}
            </span>
          </div>

          <div className="p-4 bg-red-100 border-2 border-black shadow-[4px_4px_0px_0px_#000]">
            <span className="font-mono text-[10px] uppercase tracking-wider text-red-700 block mb-1">
              Missed (Month)
            </span>
            <span className="font-black text-3xl text-red-800">
              {days.reduce(
                (acc, d) => acc + d.classes.filter((c) => !c.attended).length,
                0,
              )}
            </span>
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
}

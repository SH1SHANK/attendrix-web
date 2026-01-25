"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/Calendar";
import { Popover } from "@/components/ui/Popover";
import { Badge } from "@/components/ui/Badge";
import { CalendarDays, Clock, MapPin, Loader2 } from "lucide-react";
import { getDaySchedule } from "@/app/actions/profile";

// ============================================================================
// Types
// ============================================================================

interface ScheduleClass {
  id: string;
  time: string;
  endTime: string;
  courseName: string;
  courseID: string;
  location: string;
  slot: string;
  status: "past" | "live" | "upcoming" | "cancelled" | "late" | string;
}

interface DayItem {
  date: Date;
  dayName: string;
  dayNum: number;
  isToday: boolean;
}

// ============================================================================
// Animation Variants
// ============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
} as const;

// ============================================================================
// Piano Key Day Strip
// ============================================================================

function PianoKeyStrip({
  days,
  selectedDate,
  onSelectDate,
}: {
  days: DayItem[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}) {
  return (
    <div className="flex gap-0 overflow-x-auto pb-2 scrollbar-hide">
      {days.map((day, index) => {
        const isSelected =
          day.date.toDateString() === selectedDate.toDateString();

        return (
          <motion.button
            key={day.date.toISOString()}
            onClick={() => onSelectDate(day.date)}
            whileTap={{ scale: 0.9 }}
            whileHover={{ y: -4 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
              // Piano Key Base Style
              "flex flex-col w-16 h-24 min-w-16 items-center justify-center cursor-pointer transition-all border-2 border-black border-l-0 first:border-l-2",
              // Selected = Black Key (inverted)
              isSelected
                ? "bg-black text-white shadow-[4px_4px_0px_0px_#FFD02F] -translate-y-2 z-10"
                : // Today = Yellow Key
                  day.isToday
                  ? "bg-yellow-400 text-black hover:bg-yellow-300"
                  : // Default = White Key
                    "bg-white text-black hover:bg-neutral-100",
            )}
          >
            <span className="font-black text-xs uppercase tracking-wide">
              {day.dayName}
            </span>
            <span className="font-black text-3xl leading-none mt-1">
              {day.dayNum}
            </span>
            {day.isToday && !isSelected && (
              <span className="text-[8px] font-bold uppercase tracking-widest mt-1 bg-black text-white px-1">
                TODAY
              </span>
            )}
            {isSelected && (
              <motion.div
                layoutId="selectedIndicator"
                className="w-2 h-2 bg-yellow-400 mt-1"
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

// ============================================================================
// Class Card Component
// ============================================================================

function ClassCard({ cls, index }: { cls: ScheduleClass; index: number }) {
  return (
    <motion.div
      variants={itemVariants}
      custom={index}
      className={cn(
        "border-2 border-black p-4 transition-all relative",
        // Past
        (cls.status === "present" || cls.status === "absent") &&
          "opacity-80 bg-neutral-50",
        // Live (needs client logic or status)
        cls.status === "upcoming" &&
          "bg-white hover:shadow-[4px_4px_0px_0px_#000] hover:-translate-y-1",
        cls.status === "cancelled" && "bg-red-50 border-red-200 opacity-70",
      )}
    >
      <div className="flex gap-4">
        {/* Time Column */}
        <div
          className={cn(
            "flex flex-col items-center justify-center min-w-[80px] border-r-2 pr-4",
            "border-black",
          )}
        >
          <Clock className={cn("w-4 h-4 mb-1", "text-neutral-400")} />
          <span className="font-mono font-bold text-sm">{cls.time}</span>
          <span className="font-mono text-xs text-neutral-400">
            {cls.endTime}
          </span>
        </div>

        {/* Details Column */}
        <div className="flex-1 min-w-0">
          <h4 className="font-black uppercase text-base leading-tight truncate">
            {cls.courseName}
          </h4>
          <p className="font-mono text-xs text-neutral-500 mt-1">
            {cls.courseID}
          </p>

          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <div className="flex items-center gap-1 text-neutral-600">
              <MapPin className="w-3 h-3" />
              <span className="font-bold text-xs">{cls.location}</span>
            </div>

            {/* Status Badge */}
            <Badge
              variant={"dark"}
              size="default"
              className={cn(
                "text-[10px] uppercase",
                cls.status === "present" && "bg-green-500 border-green-700",
                cls.status === "absent" && "bg-red-500 border-red-700",
                cls.status === "upcoming" && "bg-blue-500 border-blue-700",
              )}
            >
              {cls.status}
            </Badge>
            <Badge variant={"outline"} size="default" className="text-[10px]">
              {cls.slot}
            </Badge>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ScheduleTimeline() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleClass[]>([]);
  const [loading, setLoading] = useState(true);

  // Generate next 7 days
  const days = useMemo<DayItem[]>(() => {
    const today = new Date();
    const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      return {
        date,
        dayName: dayNames[date.getDay()],
        dayNum: date.getDate(),
        isToday: i === 0,
      };
    });
  }, []);

  // Fetch Schedule Data
  useEffect(() => {
    let isMounted = true;

    async function fetchSchedule() {
      setLoading(true);
      try {
        const data = await getDaySchedule(selectedDate);

        if (isMounted) {
          const formattedSchedule: ScheduleClass[] = data.map((item) => {
            // Convert timestamps to time strings "09:00 AM" in local client time
            // input item.time_start is ISO/UTC usually
            const start = new Date(item.time_start);
            const end = new Date(item.time_end);

            return {
              id: item.slot_id,
              time: start.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              endTime: end.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              courseName: item.course_name,
              courseID: item.course_name.substring(0, 3) + "...", // Fallback ID from name? Or slot_id?
              // The API doesn't return courseID directly in the defined ScheduleSlot currently,
              // it returns slot_id, course_name.
              // Using slot_id as ID proxy.
              location: item.venue,
              slot: "Slot?", // API needs slot name? Using basic mapping
              status: item.status,
            };
          });
          setSchedule(formattedSchedule);
        }
      } catch (error) {
        console.error("Failed to fetch schedule", error);
        if (isMounted) setSchedule([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchSchedule();
    return () => {
      isMounted = false;
    };
  }, [selectedDate]);

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setCalendarOpen(false);
    }
  };

  return (
    <motion.div
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header: Piano Key Strip + Calendar Button */}
      <div className="flex items-start gap-4">
        {/* Piano Key Day Strip */}
        <div className="flex-1 overflow-hidden">
          <PianoKeyStrip
            days={days}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        </div>

        {/* Calendar Toggle */}
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <Popover.Trigger asChild>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="h-24 px-4 bg-neutral-900 text-white border-2 border-black flex items-center gap-2 font-black uppercase text-xs hover:bg-black transition-colors shadow-[4px_4px_0px_0px_#FFD02F]"
            >
              <CalendarDays className="w-5 h-5" />
              <span className="hidden md:inline">JUMP TO</span>
            </motion.button>
          </Popover.Trigger>
          <Popover.Content
            align="end"
            className="w-auto p-0 border-2 border-black bg-white shadow-[8px_8px_0px_0px_#000]"
          >
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleCalendarSelect}
              initialFocus
            />
          </Popover.Content>
        </Popover>
      </div>

      {/* Selected Date Label */}
      <motion.div
        className="flex items-center gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="h-[3px] flex-1 bg-black" />
        <span className="font-mono font-black text-sm bg-yellow-400 text-black px-4 py-2 border-2 border-black shadow-[3px_3px_0px_0px_#000]">
          {selectedDate.toLocaleDateString("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric",
          })}
        </span>
        <div className="h-[3px] flex-1 bg-black" />
      </motion.div>

      {/* Timeline */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex justify-center py-12"
          >
            <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
          </motion.div>
        ) : (
          <motion.div
            key={selectedDate.toISOString()}
            className="space-y-3"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={containerVariants}
          >
            {schedule.length > 0 ? (
              schedule.map((cls, index) => (
                <ClassCard key={cls.id} cls={cls} index={index} />
              ))
            ) : (
              <motion.div
                variants={itemVariants}
                className="border-2 border-dashed border-neutral-400 p-12 text-center bg-neutral-50"
              >
                <CalendarDays className="w-12 h-12 mx-auto text-neutral-300 mb-4" />
                <p className="font-black text-neutral-500 uppercase text-lg">
                  No Classes Scheduled
                </p>
                <p className="text-sm text-neutral-400 mt-1">
                  Enjoy your day off! 🎉
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

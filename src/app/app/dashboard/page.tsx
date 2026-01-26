"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Coffee } from "lucide-react";

import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton";

import { useAttendance } from "@/hooks/queries/useAttendance";
import { useNextClass, type ParsedClass } from "@/hooks/queries/useNextClass";
import { CountdownCard } from "@/components/dashboard/CountdownCard";
import { NextUpCard } from "@/components/dashboard/NextUpCard";
import { ClassCard } from "@/components/dashboard/ClassCard";
import { CurrentClassCard } from "@/components/dashboard/CurrentClassCard";
import { AttendanceCalculatorSheet } from "@/components/profile/AttendanceCalculatorSheet";
import type { AttendanceStat } from "@/types/dashboard";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
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

function ChillModeCard() {
  return (
    <motion.div
      className="relative overflow-hidden border-4 border-black bg-linear-to-br from-green-200 to-emerald-300 p-8 shadow-[8px_8px_0px_0px_#000]"
      variants={itemVariants}
    >
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(0,0,0,0.1) 20px, rgba(0,0,0,0.1) 40px)`,
        }}
      />
      <div className="relative z-10 flex flex-col items-center justify-center text-center">
        <motion.div
          className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-black bg-white shadow-[4px_4px_0px_0px_#000]"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <Coffee className="h-10 w-10 text-green-700" />
        </motion.div>
        <h2 className="font-black text-3xl uppercase tracking-tight text-green-900">
          Chill Mode
        </h2>
        <p className="mt-2 text-neutral-800">
          No classes remain today. You&apos;ve earned the rest!
        </p>
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const today = useMemo(() => new Date(), []);
  const { classes, isLoading, toggleAttendance, profile } =
    useAttendance(today);
  const { nextClass: globalNextClass } = useNextClass();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute to check for updates
  // Note: logic in sub-components handles countdowns, but we need state refresh for "Current Class" switch.
  // Actually, useAttendance/useNextClass should drive this if they re-run, but for pure time-based checks:

  // Use a simple effect to update "now" for filtering
  useState(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  });

  const greeting = useMemo(() => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Morning";
    if (hour < 17) return "Afternoon";
    return "Evening";
  }, [currentTime]);

  const parsedClasses = useMemo<ParsedClass[]>(() => {
    return (classes || []).map((c) => {
      const startDate = new Date(c.classStartTime);
      const endDate = new Date(c.classEndTime);
      return {
        ...c,
        startDate,
        endDate,
        startTime: startDate.toTimeString().slice(0, 5),
        endTime: endDate.toTimeString().slice(0, 5),
        type: typeof c.courseType === "string" ? c.courseType : "lecture",
      };
    });
  }, [classes]);

  const todaysClasses = parsedClasses;

  // Determine Current Class (is Happening Now?)
  // const currentClass = useMemo(() => {
  //   const now = new Date();
  //   return (
  //     todaysClasses.find((c) => now >= c.startDate && now < c.endDate) || null
  //   );
  // }, [todaysClasses]); // Dependency on time is implicity via re-render loop if needed, but 'currentTime' state drives it.

  // Actually we need to depend on currentTime to refresh this:
  const activeClass = useMemo(() => {
    return (
      todaysClasses.find(
        (c) => currentTime >= c.startDate && currentTime < c.endDate,
      ) || null
    );
  }, [todaysClasses, currentTime]);

  const nextClass = useMemo(() => {
    // const now = new Date(); // Unused variable removed
    // Use currentTime state to be in sync
    const upcoming = todaysClasses
      .filter((c) => c.startDate > currentTime)
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
    return upcoming[0] ?? null;
  }, [todaysClasses, currentTime]);

  const minutesUntilNext = useMemo(() => {
    if (!nextClass) return null;
    const diffMs = nextClass.startDate.getTime() - currentTime.getTime();
    return Math.max(0, Math.floor(diffMs / 60000));
  }, [nextClass, currentTime]);

  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

  const parseMinutes = (timeStr: string) => {
    const parts = timeStr.split(":").map(Number);
    const h = parts[0] ?? 0;
    const m = parts[1] ?? 0;
    return h * 60 + m;
  };

  // Calculator State
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [selectedCourseData, setSelectedCourseData] = useState<{
    courseID: string;
    courseName: string;
    attendedClasses: number;
    totalClasses: number;
  } | null>(null);

  const handleOpenCalculator = (
    classItem: ParsedClass,
    stat?: AttendanceStat,
  ) => {
    if (!stat) {
      // Fallback if no stat found (should rarely happen for enrolled courses)
      setSelectedCourseData({
        courseID: classItem.courseID,
        courseName: classItem.courseName,
        attendedClasses: 0,
        totalClasses: 0,
      });
    } else {
      setSelectedCourseData({
        courseID: stat.courseID,
        courseName: stat.courseName,
        attendedClasses: stat.attendedClasses,
        totalClasses: stat.totalClasses,
      });
    }
    setCalculatorOpen(true);
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // const mageRank = profile?.mageRank; // Unused variable removed
  // Get attendance stats map for easier lookup
  const attendanceStatsMap = new Map(
    profile?.coursesEnrolled?.map((c) => [c.courseID, c]),
  );

  return (
    <motion.div
      className="space-y-6 md:space-y-8" // Reduced vertical spacing
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.header
        variants={itemVariants}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="font-black text-3xl md:text-4xl uppercase tracking-tight">
            {greeting}, {profile?.name || "Student"}
          </h1>
          <p className="text-sm font-medium text-neutral-500">
            {currentTime.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </motion.header>

      <motion.section variants={itemVariants}>
        {activeClass ? (
          <CurrentClassCard currentClass={activeClass} />
        ) : nextClass ? (
          <NextUpCard
            nextClass={nextClass}
            minutesUntilNext={minutesUntilNext}
          />
        ) : globalNextClass ? (
          <CountdownCard nextClass={globalNextClass} />
        ) : (
          <ChillModeCard />
        )}
      </motion.section>

      <motion.section variants={itemVariants}>
        <div className="flex items-center gap-3 mb-4">
          <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
          <h2 className="font-black uppercase text-lg sm:text-xl">
            Today&apos;s Schedule
          </h2>
          <div className="flex-1 h-[2px] sm:h-[3px] bg-black" />
          <span className="font-mono text-xs sm:text-sm text-neutral-500">
            {todaysClasses.length} classes
          </span>
        </div>

        <div className="space-y-3">
          <AnimatePresence>
            {todaysClasses.length > 0 ? (
              todaysClasses.map((classItem) => {
                const classEndMinutes = parseMinutes(classItem.endTime);
                const isPast = classEndMinutes <= currentMinutes;
                const stat = attendanceStatsMap.get(classItem.courseID);

                return (
                  <ClassCard
                    key={classItem.classID}
                    classItem={classItem}
                    onToggle={() => toggleAttendance.mutate(classItem)}
                    isPast={isPast}
                    attendanceStat={stat}
                    onOpenCalculator={() =>
                      handleOpenCalculator(classItem, stat)
                    }
                    attendanceGoal={80} // Default goal, could come from props later
                  />
                );
              })
            ) : (
              <motion.div
                variants={itemVariants}
                className="flex flex-col items-center justify-center gap-3 rounded border-2 border-dashed border-neutral-300 bg-neutral-100 p-8"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-black bg-white shadow-[4px_4px_0px_0px_#ccc]">
                  <Coffee className="h-8 w-8 text-neutral-400" />
                </div>
                <h3 className="font-bold text-lg text-neutral-600">
                  No classes scheduled
                </h3>
                <p className="text-sm text-neutral-500 max-w-xs text-center">
                  Your timetable is clear for today. Enjoy the break!
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.section>

      <AttendanceCalculatorSheet
        open={calculatorOpen}
        onOpenChange={setCalculatorOpen}
        courseData={selectedCourseData}
        targetGoal={80}
      />
    </motion.div>
  );
}

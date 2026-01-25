"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Clock,
  Coffee,
  FlaskConical,
  GraduationCap,
  MapPin,
  Zap,
} from "lucide-react";

import { RetroToggle } from "@/components/app/RetroToggle";
import { RetroSkeleton } from "@/components/ui/RetroSkeleton";
import {
  useAttendance,
  type AttendanceStatus,
} from "@/hooks/queries/useAttendance";
import { useNextClass, type ParsedClass } from "@/hooks/queries/useNextClass";
import { CountdownCard } from "@/components/dashboard/CountdownCard";

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

const pulseVariants = {
  pulse: {
    borderColor: ["#FFD02F", "#FBBF24", "#F59E0B", "#FFD02F"],
    boxShadow: [
      "8px 8px 0px 0px #000",
      "10px 10px 0px 0px #000",
      "12px 12px 0px 0px #000",
      "8px 8px 0px 0px #000",
    ],
    transition: {
      duration: 1.2,
      repeat: Infinity,
      ease: "easeInOut" as const,
    },
  },
};

type NextUpCardProps = {
  nextClass: ParsedClass | null;
  minutesUntilNext: number | null;
};

function GamificationPill({ level, title }: { level: number; title: string }) {
  return (
    <div className="inline-flex items-center gap-3 rounded border-2 border-black bg-white px-4 py-2 text-left shadow-[4px_4px_0px_0px_#000]">
      <span className="font-mono text-[10px] uppercase text-neutral-500">
        Level
      </span>
      <span className="text-2xl font-black leading-none">{level}</span>
      <span className="font-mono text-xs uppercase tracking-wide text-neutral-500">
        {title}
      </span>
    </div>
  );
}

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

function NextUpCard({ nextClass, minutesUntilNext }: NextUpCardProps) {
  // If no nextClass provided, render nothing (handled by parent)
  if (!nextClass || minutesUntilNext === null) return null;

  const hours = Math.floor(minutesUntilNext / 60);
  const mins = minutesUntilNext % 60;
  const countdownText = hours > 0 ? `${hours}h ${mins}m` : `${mins} mins`;
  const isUrgent = minutesUntilNext <= 15;
  const isImminent = minutesUntilNext <= 5;

  return (
    <motion.div
      className={`relative border-4 p-6 md:p-8 overflow-hidden shadow-[8px_8px_0px_0px_#000] ${
        isImminent
          ? "border-red-500 bg-red-50"
          : isUrgent
            ? "border-yellow-500 bg-yellow-50"
            : "border-[#FFD02F] bg-white"
      }`}
      variants={pulseVariants}
      animate={isUrgent ? "pulse" : undefined}
    >
      <div className="absolute top-0 right-0 h-16 w-16 bg-black" />
      <div className="absolute top-2 right-2 h-3 w-3 bg-[#FFD02F]" />

      <div className="relative z-10 space-y-6">
        <div className="flex items-center gap-2">
          <Zap
            className={`w-5 h-5 ${isImminent ? "text-red-600" : "text-yellow-600"}`}
          />
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-neutral-600">
            Next Up
          </span>
        </div>

        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              Starts in
            </p>
            <motion.h2
              key={countdownText}
              className={`text-5xl font-black leading-none ${isImminent ? "text-red-600" : "text-black"}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {countdownText}
            </motion.h2>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex rounded-full bg-black px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
                {nextClass.courseID}
              </span>
              {nextClass.type === "lab" && (
                <span className="inline-flex rounded-full bg-purple-500 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
                  Lab
                </span>
              )}
            </div>
            <h3 className="font-bold text-xl md:text-2xl">
              {nextClass.courseName}
            </h3>
            <div className="flex flex-wrap gap-4 text-neutral-600">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span className="font-mono text-sm">
                  {nextClass.classVenue || "TBA"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span className="font-mono text-sm">
                  {nextClass.startTime} - {nextClass.endTime}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ClassCard({
  classItem,
  onToggle,
  isPast,
}: {
  classItem: ParsedClass;
  onToggle: () => void;
  isPast: boolean;
}) {
  const TypeIcon =
    classItem.type === "lab"
      ? FlaskConical
      : classItem.type === "tutorial"
        ? GraduationCap
        : BookOpen;

  const toggleStatus: AttendanceStatus =
    classItem.status === "present"
      ? "present"
      : classItem.status === "absent"
        ? "absent"
        : "pending";

  return (
    <motion.div
      className={`flex items-center gap-4 overflow-hidden rounded border-2 border-black bg-white p-4 shadow-[4px_4px_0px_0px_#000] ${isPast ? "opacity-70" : ""}`}
      variants={itemVariants}
      layout
    >
      <div className="flex flex-col items-center min-w-[60px]">
        <span className="font-mono text-lg font-bold">
          {classItem.startTime}
        </span>
        <div className="my-1 h-px w-full bg-neutral-200" />
        <span className="text-xs font-mono text-neutral-500">
          {classItem.endTime}
        </span>
      </div>

      <div className="border-l border-neutral-200" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <TypeIcon className="w-4 h-4 text-neutral-500" />
          <span className="font-mono text-xs font-bold text-neutral-500">
            {classItem.courseID}
          </span>
          {classItem.type !== "lecture" && (
            <span className="rounded bg-purple-100 px-2 py-0.5 text-[10px] font-bold uppercase text-purple-700">
              {classItem.type}
            </span>
          )}
        </div>
        <h4 className="font-bold text-base truncate">{classItem.courseName}</h4>
        <div className="flex items-center gap-1 text-neutral-500 mt-1">
          <MapPin className="w-3 h-3" />
          <span className="font-mono text-xs">
            {classItem.classVenue || "TBA"}
          </span>
        </div>
      </div>

      <RetroToggle
        status={toggleStatus}
        onCycle={onToggle}
        disabled={classItem.status === "upcoming"}
      />
    </motion.div>
  );
}

export default function DashboardPage() {
  const today = useMemo(() => new Date(), []);
  const { classes, isLoading, toggleAttendance, profile } =
    useAttendance(today);
  const { nextClass: globalNextClass } = useNextClass();
  const currentTime = useMemo(() => new Date(), []);

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

  const nextClass = useMemo(() => {
    const now = new Date();
    const upcoming = todaysClasses
      .filter((c) => c.startDate > now)
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
    return upcoming[0] ?? null;
  }, [todaysClasses]);

  const minutesUntilNext = useMemo(() => {
    if (!nextClass) return null;
    const diffMs = nextClass.startDate.getTime() - currentTime.getTime();
    return Math.max(0, Math.floor(diffMs / 60000));
  }, [nextClass, currentTime]);

  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

  const parseMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(":").map(Number);
    return h * 60 + m;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <RetroSkeleton className="h-20" />
        <RetroSkeleton className="h-48" />
        <RetroSkeleton className="h-64" />
      </div>
    );
  }

  const mageRank = profile?.mageRank;

  return (
    <motion.div
      className="space-y-8"
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
        <GamificationPill
          level={mageRank?.level ?? 1}
          title={mageRank?.title ?? "Novice"}
        />
      </motion.header>

      <motion.section variants={itemVariants}>
        {nextClass ? (
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
        <div className="flex items-center gap-3 mb-5">
          <Clock className="w-6 h-6" />
          <h2 className="font-black uppercase text-xl">
            Today&apos;s Schedule
          </h2>
          <div className="flex-1 h-[3px] bg-black" />
          <span className="font-mono text-sm text-neutral-500">
            {todaysClasses.length} classes
          </span>
        </div>

        <div className="space-y-4">
          <AnimatePresence>
            {todaysClasses.length > 0 ? (
              todaysClasses.map((classItem) => {
                const classEndMinutes = parseMinutes(classItem.endTime);
                const isPast = classEndMinutes <= currentMinutes;

                return (
                  <ClassCard
                    key={classItem.classID}
                    classItem={classItem}
                    onToggle={() => toggleAttendance.mutate(classItem)}
                    isPast={isPast}
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
    </motion.div>
  );
}

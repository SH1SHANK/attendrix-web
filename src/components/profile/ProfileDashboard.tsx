"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NeoAvatar } from "@/components/ui/NeoAvatar";
import { Badge } from "@/components/ui/Badge";
import { AttendanceCard } from "@/components/profile/AttendanceCard";
import { ScheduleTimeline } from "@/components/profile/ScheduleTimeline";
import {
  Flame,
  Trophy,
  BookOpen,
  Clock,
  GraduationCap,
  Building2,
  Hash,
  Target,
  RefreshCw,
} from "lucide-react";
import { Switch } from "@/components/ui/Switch";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { AttendanceCalculatorSheet } from "@/components/profile/AttendanceCalculatorSheet";
import { DashboardData, AttendanceStat } from "@/types/dashboard";

// ============================================================================
// Animation Variants
// ============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
} as const;

const bounceVariants = {
  hidden: { scale: 0 },
  visible: {
    scale: 1,
    transition: { type: "spring" as const, stiffness: 400, damping: 15 },
  },
} as const;

// ============================================================================
// Helper Functions
// ============================================================================

function extractDepartment(batchID: string): string {
  const match = batchID.match(/^([A-Z]+)/);
  return match ? match[1]! : "N/A";
}

// ============================================================================
// Component
// ============================================================================

interface ProfileDashboardProps {
  initialData: DashboardData | null;
  error?: string | null;
  onRefresh?: () => Promise<void>;
  isRefreshing?: boolean;
}

export function ProfileDashboard({
  initialData,
  error,
  onRefresh,
  isRefreshing,
}: ProfileDashboardProps) {
  // Derived state from props (no need for local state if not modified)
  const userData = initialData ? initialData.user : null;
  const courses = initialData ? initialData.user.coursesEnrolled : [];

  // Calculator Sheet State
  const [selectedCourse, setSelectedCourse] = useState<{
    courseID: string;
    courseName: string;
    attendedClasses: number;
    totalClasses: number;
  } | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Global Custom Attendance Goal
  const [attendanceSettings, setAttendanceSettings] = useState({
    useCustomGoal: false,
    customGoal: 80,
    isLoaded: false,
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    // Wrap in setTimeout to avoid "setState synchronously within effect" warning
    // This defers the update to the next tick, which is acceptable for client-side hydration
    const timer = setTimeout(() => {
      const savedEnabled = localStorage.getItem("attendance_custom_enabled");
      const savedGoal = localStorage.getItem("attendance_target_goal");

      if (savedEnabled !== null || savedGoal !== null) {
        setAttendanceSettings((prev) => ({
          ...prev,
          useCustomGoal:
            savedEnabled !== null
              ? savedEnabled === "true"
              : prev.useCustomGoal,
          customGoal:
            savedGoal !== null ? parseInt(savedGoal, 10) : prev.customGoal,
          isLoaded: true,
        }));
      } else {
        setAttendanceSettings((prev) => ({ ...prev, isLoaded: true }));
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // Save settings to localStorage when they change
  useEffect(() => {
    if (attendanceSettings.isLoaded) {
      localStorage.setItem(
        "attendance_custom_enabled",
        String(attendanceSettings.useCustomGoal),
      );
      localStorage.setItem(
        "attendance_target_goal",
        String(attendanceSettings.customGoal),
      );
    }
  }, [attendanceSettings]);

  const { useCustomGoal, customGoal } = attendanceSettings;
  const attendanceGoal = useCustomGoal ? customGoal : 80;

  // Error or Loading State
  if (error || !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-100 p-4">
        <motion.div
          className="flex flex-col items-center gap-6 max-w-md w-full bg-white border-2 border-black shadow-[8px_8px_0px_0px_#000] p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-16 h-16 bg-red-100 border-2 border-black rounded-full flex items-center justify-center">
            <span className="text-3xl">⚠️</span>
          </div>
          <div className="text-center space-y-2">
            <h2 className="font-black text-2xl uppercase">
              {error || "Access Denied"}
            </h2>
            <p className="font-medium text-neutral-600">
              {error === "Unauthorized: No session"
                ? "You need to be logged in to view this page."
                : "We couldn't load your profile data. Please try again."}
            </p>
          </div>
          <a href="/login" className="w-full">
            <button className="w-full h-12 bg-yellow-400 border-2 border-black shadow-[4px_4px_0px_0px_#000] font-bold uppercase hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
              {error === "Unauthorized: No session"
                ? "Go to Login"
                : "Return Home"}
            </button>
          </a>
        </motion.div>
      </div>
    );
  }

  const department = extractDepartment(userData.batchID);

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Dot Pattern Background */}
      <div
        className="fixed inset-0 z-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: `radial-gradient(circle, #000 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
        }}
      />

      {/* Command Deck Header - Using real data here might require prop update if ProfileHeader expects specific user obj but userData fits mostly */}
      <ProfileHeader />

      {/* Main Content */}
      <motion.main
        className="relative z-10 max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* ============================================================ */}
        {/* SECTION 1: BENTO GRID ID CARD */}
        {/* ============================================================ */}
        <motion.section
          className="grid grid-cols-1 lg:grid-cols-12 gap-4"
          variants={itemVariants}
        >
          {/* LEFT: Identity Card (with Dot Pattern) */}
          <motion.div
            variants={bounceVariants}
            className="lg:col-span-4 border-2 border-black p-6 shadow-[6px_6px_0px_0px_#000] relative overflow-hidden"
            style={{
              backgroundColor: "white",
              backgroundImage: `radial-gradient(circle, #e5e5e5 1px, transparent 1px)`,
              backgroundSize: "12px 12px",
            }}
          >
            <div className="flex flex-col items-center gap-4">
              {/* Avatar with Rotating Badge Effect */}
              <div className="relative">
                <motion.div
                  className="absolute -inset-2 border-2 border-dashed border-yellow-400"
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
                <NeoAvatar
                  name={userData.display_name || userData.username}
                  className="w-24 h-24 text-3xl relative z-10"
                />
              </div>

              {/* Name */}
              <div className="text-center">
                <h2 className="font-black uppercase text-2xl leading-tight">
                  {userData.display_name || userData.username}
                </h2>
                <p className="font-mono text-sm text-neutral-500 mt-1">
                  @{userData.username}
                </p>
              </div>

              {/* Role Badge */}
              <Badge
                className="uppercase bg-black text-white hover:bg-neutral-800 border-black"
                size="lg"
              >
                {userData.userRole}
              </Badge>
            </div>
          </motion.div>

          {/* MIDDLE: Stats Bento Grid */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-4">
            {/* Batch - Pastel Blue */}
            <motion.div
              variants={bounceVariants}
              className="bg-blue-200 border-2 border-black p-4 shadow-[4px_4px_0px_0px_#000] flex flex-col items-center justify-center"
            >
              <Hash className="w-6 h-6 text-blue-700 mb-1" />
              <span className="font-mono text-[10px] text-blue-800 uppercase tracking-widest">
                Batch
              </span>
              <span className="font-black text-2xl text-blue-900">
                {userData.batchID}
              </span>
            </motion.div>

            {/* Semester - Pastel Green (Assuming Sem ID derived or stored) */}
            <motion.div
              variants={bounceVariants}
              className="bg-green-200 border-2 border-black p-4 shadow-[4px_4px_0px_0px_#000] flex flex-col items-center justify-center"
            >
              <GraduationCap className="w-6 h-6 text-green-700 mb-1" />
              <span className="font-mono text-[10px] text-green-800 uppercase tracking-widest">
                Semester
              </span>
              <span className="font-black text-2xl text-green-900">
                {/* TODO: Add semester to DashboardData or derived */}
              </span>
            </motion.div>

            {/* Department - Pastel Orange */}
            <motion.div
              variants={bounceVariants}
              className="bg-orange-200 border-2 border-black p-4 shadow-[4px_4px_0px_0px_#000] flex flex-col items-center justify-center"
            >
              <Building2 className="w-6 h-6 text-orange-700 mb-1" />
              <span className="font-mono text-[10px] text-orange-800 uppercase tracking-widest">
                Department
              </span>
              <span className="font-black text-2xl text-orange-900">
                {department}
              </span>
            </motion.div>

            {/* Streak - Dark with Hot Pink Accent */}
            <motion.div
              variants={bounceVariants}
              className="bg-neutral-900 border-2 border-black p-4 shadow-[4px_4px_0px_0px_#d946ef] flex flex-col items-center justify-center"
            >
              <Flame className="w-6 h-6 text-[#d946ef] mb-1" />
              <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-widest">
                Streak
              </span>
              <span className="font-black text-2xl text-yellow-400">
                {userData.stats.streak}
              </span>
            </motion.div>
          </div>

          {/* RIGHT: Amplix Score */}
          <motion.div
            variants={bounceVariants}
            className="lg:col-span-3 border-2 border-black shadow-[6px_6px_0px_0px_#000] flex flex-col items-center justify-center p-6 relative overflow-hidden"
            style={{ backgroundColor: "#FACC15" }}
          >
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage: `repeating-linear-gradient(
                  -45deg,
                  transparent,
                  transparent 10px,
                  rgba(0,0,0,0.3) 10px,
                  rgba(0,0,0,0.3) 20px
                )`,
              }}
            />

            <div className="relative z-10 text-center">
              <Trophy className="w-10 h-10 text-black mb-2 mx-auto" />
              <span className="font-mono text-xs uppercase tracking-widest text-neutral-700 block">
                Amplix Score
              </span>
              <motion.span
                className="font-black text-6xl text-black leading-none mt-2 block"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.5 }}
                style={{
                  textShadow: "4px 4px 0px rgba(0,0,0,0.2)",
                }}
              >
                {userData.amplix}
              </motion.span>
              <span className="font-bold text-xs uppercase text-neutral-700 mt-2 block">
                POINTS
              </span>
            </div>
          </motion.div>
        </motion.section>

        {/* ============================================================ */}
        {/* SECTION 2: ATTENDANCE MATRIX */}
        {/* ============================================================ */}
        <motion.section variants={itemVariants}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <BookOpen className="w-6 h-6" />
              <h2 className="font-black uppercase text-xl">
                Attendance Matrix
              </h2>
              <div className="w-12 h-[3px] bg-black" />

              {/* Refresh Button */}
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  className="ml-2 w-10 h-10 border-2 border-black bg-white hover:bg-yellow-400 flex items-center justify-center shadow-[3px_3px_0px_0px_#000] hover:shadow-[4px_4px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Refresh attendance data"
                >
                  <RefreshCw
                    className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`}
                  />
                </button>
              )}
            </div>

            {/* Global Goal Control */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-yellow-50 border-2 border-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-neutral-700" />
                  <span className="font-bold uppercase text-xs sm:text-sm whitespace-nowrap">
                    Custom Goal
                  </span>
                </div>
                <Switch
                  checked={useCustomGoal}
                  onCheckedChange={(checked) =>
                    setAttendanceSettings((prev) => ({
                      ...prev,
                      useCustomGoal: checked,
                    }))
                  }
                  className="scale-75 origin-left"
                />
              </div>

              <AnimatePresence>
                {useCustomGoal && (
                  <motion.div
                    initial={{ opacity: 0, width: 0, overflow: "hidden" }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="flex items-center gap-3"
                  >
                    <div className="h-6 w-[2px] bg-neutral-300 hidden sm:block" />
                    <div className="flex items-center gap-3 min-w-[200px]">
                      <span className="font-black text-lg w-12 text-right">
                        {customGoal}%
                      </span>
                      <input
                        type="range"
                        min="50"
                        max="100"
                        step="5"
                        value={customGoal}
                        onChange={(e) =>
                          setAttendanceSettings((prev) => ({
                            ...prev,
                            customGoal: Number(e.target.value),
                          }))
                        }
                        className="w-full h-2 bg-neutral-200 border border-black appearance-none cursor-pointer slider-thumb-sm"
                        style={{
                          background: `linear-gradient(to right, #facc15 0%, #facc15 ${(customGoal - 50) * 2}%, #e5e5e5 ${(customGoal - 50) * 2}%, #e5e5e5 100%)`,
                        }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Styles for Slider embedded here but handled by styled-jsx global in parent? 
               Since this is a client component, styled-jsx might not apply if parent is server component.
               Actually, Next.js handles CSS modules or global CSS better.
               I'll use inline styles or standard CSS. 
               The previous implementation had a <style jsx global> block.
               I should include it here or ensure it's loaded.
           */}
          <style jsx global>{`
            @keyframes barberpole {
              0% {
                background-position: 0 0;
              }
              100% {
                background-position: 50px 50px;
              }
            }
            .animate-pulse-slow {
              animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            }
            @keyframes pulse {
              0%,
              100% {
                opacity: 1;
              }
              50% {
                opacity: 0.85;
              }
            }
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
            .scrollbar-hide {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
            .slider-thumb-sm::-webkit-slider-thumb {
              appearance: none;
              width: 14px;
              height: 14px;
              background: #000;
              border: 2px solid #000;
              cursor: pointer;
            }
            .slider-thumb-sm::-moz-range-thumb {
              width: 14px;
              height: 14px;
              background: #000;
              border: 2px solid #000;
              cursor: pointer;
            }
          `}</style>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course: AttendanceStat, index: number) => (
              <AttendanceCard
                key={course.courseID}
                courseID={course.courseID}
                courseName={course.courseName}
                attendedClasses={course.attendedClasses}
                totalClasses={course.totalClasses}
                credits={course.credits}
                isLab={course.isLab}
                index={index}
                targetGoal={attendanceGoal}
                onClick={() => {
                  setSelectedCourse({
                    courseID: course.courseID,
                    courseName: course.courseName,
                    attendedClasses: course.attendedClasses,
                    totalClasses: course.totalClasses,
                  });
                  setIsSheetOpen(true);
                }}
              />
            ))}
          </div>
        </motion.section>

        {/* ============================================================ */}
        {/* SECTION 3: TIME-MACHINE (Schedule) */}
        {/* ============================================================ */}
        <motion.section variants={itemVariants}>
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-6 h-6" />
            <h2 className="font-black uppercase text-xl">Time-Machine</h2>
            <div className="flex-1 h-[3px] bg-black" />
          </div>

          <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_#000] p-6">
            <ScheduleTimeline />
          </div>
        </motion.section>
      </motion.main>

      {/* Footer */}
      <footer className="relative z-10 border-t-2 border-black bg-neutral-900 py-6 mt-12">
        <p className="text-center font-bold text-xs uppercase tracking-widest text-neutral-400">
          © {new Date().getFullYear()} Attendrix • Profile Dashboard
        </p>
      </footer>

      {/* Attendance Calculator Sheet */}
      <AttendanceCalculatorSheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        courseData={selectedCourse}
        key={selectedCourse?.courseID}
        targetGoal={attendanceGoal}
      />
    </div>
  );
}

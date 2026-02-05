"use client";

export const dynamic = "force-dynamic";

import nextDynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardHeaderMenu } from "@/components/dashboard/DashboardHeaderMenu";
import { CountdownCard } from "@/components/dashboard/CountdownCard";
import { useAuth } from "@/context/AuthContext";
import { useUserPreferences } from "@/context/UserPreferencesContext";
import { useDashboardSchedule, getCurrentOrNextClass } from "@/hooks/useDashboardData";
import { useAttendanceActions } from "@/hooks/useAttendanceActions";
import { useCourseTotalsSync } from "@/hooks/useCourseTotalsSync";
import { useUserCourseRecords } from "@/hooks/useUserCourseRecords";
import { DEFAULT_BATCH_ID } from "@/lib/constants";
import { useEffect, useMemo, useCallback } from "react";
import { TodayScheduleClass, UpcomingClass } from "@/types/supabase-academic";
import { getISTParts } from "@/lib/time/ist";
import DotPatternBackground from "@/components/ui/DotPatternBackground";
import { RetroSkeleton } from "@/components/ui/skeleton";
import { SmoothSection } from "@/components/ui/SmoothSection";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";

// Lazy load heavy components for code splitting
const TodayClasses = nextDynamic(
  () =>
    import("@/components/dashboard/TodayClasses").then((mod) => ({
      default: mod.TodayClasses,
    })),
  {
    loading: () => <RetroSkeleton className="h-64 w-full" />,
    ssr: true,
  },
);

const UpcomingClasses = nextDynamic(
  () =>
    import("@/components/dashboard/UpcomingClasses").then((mod) => ({
      default: mod.UpcomingClasses,
    })),
  {
    loading: () => <RetroSkeleton className="h-64 w-full" />,
    ssr: true,
  },
);

export default function DashboardPage() {
  // Get Firebase user and routing
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { attendanceGoal } = useUserPreferences();

  const courseRecordQuery = useUserCourseRecords(user?.uid ?? null);
  const courseRecord = courseRecordQuery.data;
  const userLoading = courseRecordQuery.isLoading;
  const batchId = courseRecord?.batchID || DEFAULT_BATCH_ID;
  const enrolledCourses = Array.isArray(courseRecord?.enrolledCourses)
    ? courseRecord?.enrolledCourses
    : [];
  const rawName = user?.displayName?.trim();
  const firstName = rawName ? rawName.split(/\s+/)[0] : null;

  // Verify authentication on mount and redirect if needed
  useEffect(() => {
    if (!authLoading && !user) {
      console.warn("[Dashboard] User not authenticated, redirecting to signin");
      router.push("/auth/signin");
      return;
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (courseRecordQuery.error) {
      console.error("Error fetching user data:", courseRecordQuery.error);
    }
  }, [courseRecordQuery.error]);

  // Fetch schedule data (single cached query + single realtime subscription)
  const scheduleOptions = useMemo(() => ({ subscribe: true }), []);
  const {
    data: scheduleData,
    loading: scheduleLoading,
    error: scheduleError,
    refetch: refreshSchedule,
  } = useDashboardSchedule(
    user?.uid || null,
    batchId,
    attendanceGoal,
    enrolledCourses,
    scheduleOptions,
  );

  const todaySchedule = scheduleData.todaySchedule;
  const upcomingClasses = scheduleData.upcomingClasses;
  const nextEnrolledClass = upcomingClasses[0] ?? null;
  const upcomingLoading = scheduleLoading;

  const { refreshTotals } = useCourseTotalsSync(user?.uid || null);
  const { checkIn, markAbsent, pendingByClassId } = useAttendanceActions({
    userId: user?.uid || null,
    onAfterSuccess: async () => {
      await refreshSchedule();
      await refreshTotals();
    },
  });

  const handleManualRefresh = useCallback(async () => {
    await refreshSchedule();
    await refreshTotals();
  }, [refreshSchedule, refreshTotals]);

  // Determine current or next class
  const { class: currentOrNextClass, type: classType } =
    getCurrentOrNextClass(todaySchedule);

  let displayClass: TodayScheduleClass | UpcomingClass | null =
    currentOrNextClass;
  let displayType: "current" | "next" | "none" = classType;

  // If no class today, show next upcoming class from enrolled courses
  if (displayType === "none" && nextEnrolledClass) {
    displayClass = nextEnrolledClass;
    displayType = "next";
  } else if (displayType === "none" && upcomingClasses.length > 0) {
    displayClass = upcomingClasses[0] || null;
    displayType = "next";
  }

  const cardLoading = scheduleLoading;

  // Generate greeting based on time of day
  const hour = getISTParts(new Date()).hour;
  const greeting =
    hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

  // Format current date
  const dateString = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Kolkata",
  });

  // Show loading state
  if (authLoading || userLoading) {
    return <div className="min-h-screen bg-[#fffdf5]" />;
  }

  // Verify user is authenticated
  if (!user?.uid) {
    return (
      <div className="min-h-screen bg-[#fffdf5] flex items-center justify-center p-4">
        <div className="border-2 border-black bg-white p-8 shadow-[8px_8px_0px_0px_#000] max-w-md">
          <h2 className="font-display text-2xl font-black uppercase mb-4">
            Authentication Required
          </h2>
          <p className="font-mono text-sm text-neutral-600 mb-6">
            Please sign in to access your dashboard.
          </p>
          <button
            onClick={() => router.push("/auth/signin")}
            className="w-full bg-black text-white font-bold py-3 px-4 uppercase border-2 border-black hover:bg-neutral-800 transition-colors"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  // Show error state
  if (scheduleError) {
    return (
      <div className="min-h-screen bg-[#fffdf5] flex items-center justify-center p-4">
        <div className="border-2 border-black bg-white p-8 shadow-[8px_8px_0px_0px_#000] max-w-md">
          <h2 className="font-display text-2xl font-black uppercase mb-4">
            Error Loading Dashboard
          </h2>
          <p className="font-mono text-sm text-neutral-600">
            {scheduleError?.message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fffdf5] relative overflow-x-hidden">
      {/* Dot Grid Background */}
      <DotPatternBackground
        dotColor="#000"
        dotSize={1.5}
        dotSpacing={24}
        opacity={0.15}
      />

      <div className="mx-auto max-w-7xl px-4 pt-2 pb-3 sm:px-6 sm:pt-3 sm:pb-4 lg:px-8 lg:pt-4 lg:pb-5 relative z-10">
        {/* Top Navigation */}
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-2">
            <nav aria-label="Breadcrumb">
              <ol className="flex items-center gap-2 text-xs sm:text-sm font-bold uppercase">
                <li>
                  <Link
                    href="/"
                    className="text-neutral-500 hover:text-black transition-colors"
                  >
                    Home
                  </Link>
                </li>
                <li className="text-neutral-300">/</li>
                <li className="text-black">Dashboard</li>
              </ol>
            </nav>
          </div>
          <DashboardHeaderMenu className="self-start" />
        </div>

        {/* Header Section */}
        <header className="mb-6 flex flex-col items-start gap-3">
          <div>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase text-black tracking-tighter leading-[0.9]">
              {firstName ? (
                <>
                  {greeting},{" "}
                  <span className="text-transparent bg-clip-text bg-linear-to-r from-black to-neutral-600">
                    {firstName}
                  </span>
                </>
              ) : (
                greeting
              )}
            </h1>
            <p className="mt-2 font-mono text-base sm:text-lg font-bold text-neutral-500 uppercase tracking-wide sm:tracking-widest">
              Here&apos;s what&apos;s on deck for {dateString}.
            </p>
          </div>
        </header>

        <InstallPrompt variant="banner" className="mb-4" />

        {/* Vertical Stack Layout */}
        <div className="flex flex-col gap-6 sm:gap-8 md:gap-10 lg:gap-12">
          {/* Main Hero: Countdown Card */}
          <SmoothSection delay={120} className="w-full">
            <CountdownCard
              classData={displayClass}
              type={displayType}
              loading={cardLoading}
              className="h-full"
              onCheckIn={checkIn}
              onMarkAbsent={markAbsent}
              pendingByClassId={pendingByClassId}
            />
          </SmoothSection>

          {/* Divider */}
          <div className="relative w-full h-8 flex items-center justify-center">
            <div
              className="absolute inset-0 flex items-center"
              aria-hidden="true"
            >
              <div className="w-full border-t-2 border-black border-dashed" />
            </div>
            <div className="relative flex items-center gap-2 bg-[#fffdf5] px-4">
              <div className="h-3 w-3 rotate-45 bg-black border-2 border-black" />
              <div className="h-3 w-3 rotate-45 bg-[#FFD02F] border-2 border-black" />
              <div className="h-3 w-3 rotate-45 bg-black border-2 border-black" />
            </div>
          </div>

          {/* Today's Classes List */}
          <SmoothSection delay={160} className="w-full">
            {scheduleLoading ? (
              <RetroSkeleton className="h-64 w-full" />
            ) : todaySchedule.length > 0 ? (
              <TodayClasses
                classes={todaySchedule}
                onRefresh={handleManualRefresh}
                loading={scheduleLoading}
                onCheckIn={checkIn}
                onMarkAbsent={markAbsent}
                pendingByClassId={pendingByClassId}
              />
            ) : (
              <div className="border-2 border-black bg-white p-8 shadow-[4px_4px_0px_0px_#000]">
                <p className="font-mono text-sm font-bold text-neutral-600">
                  No classes today. Your next class appears below.
                </p>
                <button
                  onClick={handleManualRefresh}
                  className="mt-4 px-4 py-2 bg-black text-white font-bold uppercase text-xs transition-transform hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#000] active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#000]"
                >
                  Refresh
                </button>
              </div>
            )}
          </SmoothSection>

          {/* Divider */}
          <div className="relative w-full h-8 flex items-center justify-center">
            <div
              className="absolute inset-0 flex items-center"
              aria-hidden="true"
            >
              <div className="w-full border-t-2 border-black border-dashed" />
            </div>
            <div className="relative flex items-center gap-2 bg-[#fffdf5] px-4">
              <div className="h-3 w-3 rotate-45 bg-black border-2 border-black" />
              <div className="h-3 w-3 rotate-45 bg-[#FFD02F] border-2 border-black" />
              <div className="h-3 w-3 rotate-45 bg-black border-2 border-black" />
            </div>
          </div>

          {/* Upcoming Classes Widget */}
          <SmoothSection delay={200} className="w-full">
            {upcomingLoading ? (
              <RetroSkeleton className="h-64 w-full" />
            ) : upcomingClasses.length > 0 ? (
              <UpcomingClasses
                userId={user?.uid || null}
                batchId={batchId}
                defaultClasses={upcomingClasses}
              />
            ) : (
              <div className="border-2 border-black bg-white p-8 shadow-[4px_4px_0px_0px_#000]">
                <p className="font-mono text-sm font-bold text-neutral-600">
                  No upcoming classes scheduled
                </p>
              </div>
            )}
          </SmoothSection>
        </div>

        {/* Footer Spacer */}
        <div className="h-16 sm:h-20 md:h-24" />
      </div>
    </div>
  );
}

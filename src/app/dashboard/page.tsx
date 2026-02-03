"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CountdownCard } from "@/components/dashboard/CountdownCard";
import { useAuth } from "@/context/AuthContext";
import {
  useTodaySchedule,
  useUpcomingClasses,
  getCurrentOrNextClass,
} from "@/hooks/useDashboardData";
import { useAttendanceActions } from "@/hooks/useAttendanceActions";
import { useCourseTotalsSync } from "@/hooks/useCourseTotalsSync";
import { DEFAULT_BATCH_ID } from "@/lib/constants";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { TodayScheduleClass, UpcomingClass } from "@/types/supabase-academic";
import { getISTParts } from "@/lib/time/ist";
import DotPatternBackground from "@/components/ui/DotPatternBackground";

// Lazy load heavy components for code splitting
const TodayClasses = dynamic(
  () =>
    import("@/components/dashboard/TodayClasses").then((mod) => ({
      default: mod.TodayClasses,
    })),
  {
    loading: () => (
      <div className="h-64 animate-pulse bg-gray-100 rounded-lg" />
    ),
    ssr: true,
  },
);

const UpcomingClasses = dynamic(
  () =>
    import("@/components/dashboard/UpcomingClasses").then((mod) => ({
      default: mod.UpcomingClasses,
    })),
  {
    loading: () => (
      <div className="h-64 animate-pulse bg-gray-100 rounded-lg" />
    ),
    ssr: true,
  },
);

export default function DashboardPage() {
  console.log("[DEBUG] DashboardPage loaded");
  // Get Firebase user and routing
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // State for user data
  const [batchId, setBatchId] = useState<string>(DEFAULT_BATCH_ID);
  const [displayName, setDisplayName] = useState<string>("Student");
  const [userLoading, setUserLoading] = useState(true);
  const [enrolledCourses, setEnrolledCourses] = useState<string[]>([]);

  // Verify authentication on mount and redirect if needed
  useEffect(() => {
    if (!authLoading && !user) {
      console.warn("[Dashboard] User not authenticated, redirecting to signin");
      router.push("/auth/signin");
      return;
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function fetchUserData() {
      if (!user?.uid) {
        setUserLoading(false);
        return;
      }

      try {
        console.log("[Dashboard] Fetching user data for:", user.uid);

        // Fetch from Supabase 'userCourseRecords'
        const { data: userRecord, error } = await supabase
          .from("userCourseRecords")
          .select("*")
          .eq("userID", user.uid)
          .single();

        if (error) {
          console.error("Error fetching user data from Supabase:", error);
          // Fallback to default if error (or not found)
          setBatchId(DEFAULT_BATCH_ID);
        } else if (userRecord) {
          console.log("[Dashboard] Found user record:", userRecord);
          setBatchId(userRecord.batchID || DEFAULT_BATCH_ID);
          setEnrolledCourses(userRecord.enrolledCourses || []);
          // userCourseRecords doesn't strictly have display_name in schema provided
          // but we can try to get it if it exists or fallback to Auth
          // Schema: userID, batchID, semesterID, enrolledCourses, lastUpdated, metadata
          // No display_name column in Schema provided.
          // Stick to Auth display name or "Student"
        } else {
          setBatchId(DEFAULT_BATCH_ID);
          setEnrolledCourses([]);
        }

        // Always set display name from Auth if available
        setDisplayName(user.displayName || "Student");
      } catch (error) {
        console.error("Error in fetchUserData:", error);
        setBatchId(DEFAULT_BATCH_ID);
        setEnrolledCourses([]);
      } finally {
        setUserLoading(false);
      }
    }

    fetchUserData();
  }, [user]);

  // Fetch today's schedule with enrolled courses filter
  const {
    data: todaySchedule,
    loading: scheduleLoading,
    error: scheduleError,
    refetch: refreshSchedule,
  } = useTodaySchedule(user?.uid || null, batchId, 75, enrolledCourses);

  // Fetch upcoming classes with enrolled courses filter
  const {
    data: upcomingClasses,
    loading: upcomingLoading,
    error: upcomingError,
  } = useUpcomingClasses(user?.uid || null, batchId, enrolledCourses);

  const { refreshTotals } = useCourseTotalsSync(user?.uid || null);
  const { checkIn, markAbsent, pendingByClassId } = useAttendanceActions({
    userId: user?.uid || null,
    onAfterSuccess: async () => {
      await refreshSchedule();
      await refreshTotals();
    },
  });

  const handleManualRefresh = async () => {
    await refreshSchedule();
    await refreshTotals();
  };

  const handleBackNavigation = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/");
  };

  // Determine current or next class
  const { class: currentOrNextClass, type: classType } =
    getCurrentOrNextClass(todaySchedule);

  let displayClass: TodayScheduleClass | UpcomingClass | null =
    currentOrNextClass;
  let displayType: "current" | "next" | "none" = classType;

  // If no class today, show next upcoming class
  // Check for length > 0 to be safe
  if (displayType === "none" && upcomingClasses.length > 0) {
    displayClass = upcomingClasses[0] || null;
    displayType = "next";
  }

  const cardLoading =
    scheduleLoading || (classType === "none" && upcomingLoading);

  console.log("[Dashboard] Render state:", {
    authLoading,
    userLoading,
    scheduleLoading,
    upcomingLoading,
    user: user?.uid,
    batchId,
    displayClass: displayClass?.courseName,
    displayType,
    cardLoading,
    todayScheduleLength: todaySchedule.length,
  });

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
  if (scheduleError || upcomingError) {
    return (
      <div className="min-h-screen bg-[#fffdf5] flex items-center justify-center p-4">
        <div className="border-2 border-black bg-white p-8 shadow-[8px_8px_0px_0px_#000] max-w-md">
          <h2 className="font-display text-2xl font-black uppercase mb-4">
            Error Loading Dashboard
          </h2>
          <p className="font-mono text-sm text-neutral-600">
            {scheduleError?.message || upcomingError?.message}
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

      <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6 sm:py-3 lg:px-8 lg:py-4 relative z-10">
        {/* Top Navigation */}
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBackNavigation}
              className="inline-flex items-center gap-2 border-2 border-black bg-white px-3 py-2 text-xs sm:text-sm font-bold uppercase shadow-[4px_4px_0_#000] transition-all duration-200 hover:translate-y-1 active:translate-y-2 active:translate-x-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

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
        </div>

        {/* Header Section */}
        <header className="mb-8 flex flex-col items-start gap-3">
          <div>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase text-black tracking-tighter leading-[0.9]">
              {greeting},{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-black to-neutral-600">
                {displayName}
              </span>
            </h1>
            <p className="mt-2 font-mono text-base sm:text-lg font-bold text-neutral-500 uppercase tracking-wide sm:tracking-widest">
              {dateString}
            </p>
          </div>
        </header>

        {/* Vertical Stack Layout */}
        <div className="flex flex-col gap-6 sm:gap-8 md:gap-10 lg:gap-12">
          {/* Main Hero: Countdown Card */}
          <div className="w-full">
            <CountdownCard
              classData={displayClass}
              type={displayType}
              loading={cardLoading}
              className="h-full"
              onCheckIn={checkIn}
              onMarkAbsent={markAbsent}
              pendingByClassId={pendingByClassId}
            />
          </div>

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
          <div className="w-full">
            {scheduleLoading ? (
              <div className="h-64 animate-pulse bg-gray-100 rounded-lg border-2 border-black" />
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
                  No classes found for today
                </p>
                <button
                  onClick={() => handleManualRefresh()}
                  className="mt-4 px-4 py-2 bg-black text-white font-bold uppercase text-xs"
                >
                  Refresh
                </button>
              </div>
            )}
          </div>

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
          <div className="w-full">
            {upcomingLoading ? (
              <div className="h-64 animate-pulse bg-gray-100 rounded-lg border-2 border-black" />
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
          </div>
        </div>

        {/* Footer Spacer */}
        <div className="h-16 sm:h-20 md:h-24" />
      </div>
    </div>
  );
}

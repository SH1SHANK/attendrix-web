"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { CountdownCard } from "@/components/dashboard/CountdownCard";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { usePerformanceMonitor } from "@/hooks/useOptimizations";
import { useAuth } from "@/context/AuthContext";
import {
  useTodaySchedule,
  useUpcomingClasses,
  getCurrentOrNextClass,
} from "@/hooks/useDashboardData";
import { useEffect, useState } from "react";
import { getFirestore, doc, getDoc } from "firebase/firestore";

// Lazy load heavy components for code splitting
const TodayClasses = dynamic(
  () =>
    import("@/components/dashboard/TodayClasses").then((mod) => ({
      default: mod.TodayClasses,
    })),
  {
    loading: () => <DashboardSkeleton />,
    ssr: true,
  },
);

const UpcomingClasses = dynamic(
  () =>
    import("@/components/dashboard/UpcomingClasses").then((mod) => ({
      default: mod.UpcomingClasses,
    })),
  {
    loading: () => <DashboardSkeleton />,
    ssr: true,
  },
);

export default function DashboardPage() {
  // Monitor component performance
  usePerformanceMonitor("DashboardPage");

  // Get Firebase user
  const { user, loading: authLoading } = useAuth();

  // Fetch user data from Firestore
  const [batchId, setBatchId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>("Student");
  const [firestoreLoading, setFirestoreLoading] = useState(true);

  useEffect(() => {
    async function fetchUserData() {
      if (!user?.uid) {
        setFirestoreLoading(false);
        return;
      }

      try {
        const db = getFirestore();
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const data = userDoc.data();
          setBatchId(data.batchID || null);
          setDisplayName(data.display_name || user.displayName || "Student");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setFirestoreLoading(false);
      }
    }

    fetchUserData();
  }, [user]);

  // Fetch today's schedule
  const {
    data: todaySchedule,
    loading: scheduleLoading,
    error: scheduleError,
  } = useTodaySchedule(user?.uid || null, batchId, 75);

  // Fetch upcoming classes
  const {
    data: upcomingClasses,
    loading: upcomingLoading,
    error: upcomingError,
  } = useUpcomingClasses(user?.uid || null);

  // Determine current or next class
  const { class: currentOrNextClass, type: classType } = useMemo(
    () => getCurrentOrNextClass(todaySchedule),
    [todaySchedule],
  );

  // Generate greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  }, []);

  // Format current date
  const dateString = useMemo(() => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return new Date().toLocaleDateString("en-US", options);
  }, []);

  // Show loading state
  if (authLoading || firestoreLoading) {
    return <DashboardSkeleton />;
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
    <div className="min-h-screen bg-[#fffdf5] relative overflow-x-hidden will-change-transform">
      {/* Global Dotted Grid Background - Memoized */}
      <div
        className="fixed inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: "radial-gradient(#000 1.5px, transparent 1.5px)",
          backgroundSize: "24px 24px",
          willChange: "transform",
        }}
      />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12 relative z-10">
        {/* Header Section */}
        <header
          className="mb-8 sm:mb-10 lg:mb-12 flex flex-col items-start gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-500"
          style={{ willChange: "transform, opacity" }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-black bg-white px-3 py-1.5 sm:py-1 text-xs font-bold uppercase tracking-widest shadow-[2px_2px_0_#0a0a0a] transition-all duration-200 hover:shadow-[4px_4px_0_#0a0a0a] hover:-translate-y-0.5 hover:-translate-x-0.5 active:translate-y-0.5 active:translate-x-0.5 active:shadow-none">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            Online
          </div>

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
          <div
            className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700"
            style={{ animationDelay: "100ms", animationFillMode: "backwards" }}
          >
            <CountdownCard
              classData={currentOrNextClass}
              type={classType}
              className="h-full"
            />
          </div>

          {/* Divider */}
          <div
            className="relative w-full h-8 sm:h-10 md:h-12 flex items-center justify-center animate-in fade-in zoom-in duration-500"
            style={{ animationDelay: "200ms", animationFillMode: "backwards" }}
          >
            <div
              className="absolute inset-0 flex items-center"
              aria-hidden="true"
            >
              <div className="w-full border-t-2 sm:border-t-3 md:border-t-4 border-black border-dashed" />
            </div>
            <div className="relative flex items-center gap-2 sm:gap-3 bg-[#fffdf5] px-4 sm:px-6">
              <div className="h-3 w-3 sm:h-4 sm:w-4 rotate-45 bg-black border-2 border-black" />
              <div className="h-3 w-3 sm:h-4 sm:w-4 rotate-45 bg-[#FFD02F] border-2 border-black" />
              <div className="h-3 w-3 sm:h-4 sm:w-4 rotate-45 bg-black border-2 border-black" />
            </div>
          </div>

          {/* Today's Classes List */}
          <div
            className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700"
            style={{ animationDelay: "300ms", animationFillMode: "backwards" }}
          >
            {scheduleLoading ? (
              <DashboardSkeleton />
            ) : (
              <TodayClasses classes={todaySchedule} />
            )}
          </div>

          {/* Divider */}
          <div
            className="relative w-full h-8 sm:h-10 md:h-12 flex items-center justify-center animate-in fade-in zoom-in duration-500"
            style={{ animationDelay: "400ms", animationFillMode: "backwards" }}
          >
            <div
              className="absolute inset-0 flex items-center"
              aria-hidden="true"
            >
              <div className="w-full border-t-2 sm:border-t-3 md:border-t-4 border-black border-dashed" />
            </div>
            <div className="relative flex items-center gap-2 sm:gap-3 bg-[#fffdf5] px-4 sm:px-6">
              <div className="h-3 w-3 sm:h-4 sm:w-4 rotate-45 bg-black border-2 border-black" />
              <div className="h-3 w-3 sm:h-4 sm:w-4 rotate-45 bg-[#FFD02F] border-2 border-black" />
              <div className="h-3 w-3 sm:h-4 sm:w-4 rotate-45 bg-black border-2 border-black" />
            </div>
          </div>

          {/* Upcoming Classes Widget */}
          <div
            className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700"
            style={{ animationDelay: "500ms", animationFillMode: "backwards" }}
          >
            {upcomingLoading ? (
              <DashboardSkeleton />
            ) : (
              <UpcomingClasses
                userId={user?.uid || null}
                defaultClasses={upcomingClasses}
              />
            )}
          </div>
        </div>

        {/* Footer Spacer */}
        <div className="h-16 sm:h-20 md:h-24" />
      </div>
    </div>
  );
}

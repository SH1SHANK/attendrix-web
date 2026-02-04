"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useAttendanceSummary } from "@/hooks/useAttendanceSummary";
import { useUserPreferences } from "@/context/UserPreferencesContext";
import DotPatternBackground from "@/components/ui/DotPatternBackground";

const SESSION_KEY = "attendrix.edits";

type EditSession = {
  addedCourseIds: string[];
  removedCourseIds: string[];
  enrolledCourseIds: string[];
};

export default function CoursesCompletedPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { attendanceGoal } = useUserPreferences();
  const userId = user?.uid ?? null;

  const [session, setSession] = useState<EditSession | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/auth/signin");
      return;
    }
    if (typeof window === "undefined") return;
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) {
      router.push("/profile");
      return;
    }
    try {
      const parsed = JSON.parse(raw) as EditSession;
      setSession(parsed);
    } catch {
      router.push("/profile");
    }
  }, [authLoading, router, user]);

  const attendanceQuery = useAttendanceSummary(userId, attendanceGoal);
  const summary = attendanceQuery.data ?? [];

  const addedSummaries = useMemo(() => {
    if (!session) return [];
    const added = new Set(session.addedCourseIds);
    return summary.filter((item) => added.has(item.courseID));
  }, [session, summary]);

  const handleNavigate = (path: string) => {
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(SESSION_KEY);
    }
    router.push(path);
  };

  return (
    <div className="relative min-h-screen bg-[#fffdf5]">
      <DotPatternBackground />
      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-8 pt-20 pb-16">
        <div className="mb-6 border-[3px] border-black bg-white px-6 py-5 shadow-[5px_5px_0px_0px_#000]">
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-2">
            Courses Updated
          </h1>
          <p className="text-sm font-bold text-neutral-600">
            Your enrollment changes are saved. Here&apos;s a quick summary.
          </p>
        </div>

        {attendanceQuery.isLoading ? (
          <div className="border-[3px] border-black bg-white px-6 py-6 shadow-[5px_5px_0px_0px_#000]">
            <p className="text-sm font-bold text-neutral-600">
              Loading attendance summary…
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <section className="border-[3px] border-black bg-white px-6 py-6 shadow-[5px_5px_0px_0px_#000]">
              <h2 className="text-lg font-black uppercase tracking-tight mb-4">
                Newly Added Courses
              </h2>
              {session?.addedCourseIds?.length ? (
                <div className="space-y-3">
                  {session.addedCourseIds.map((courseId) => {
                    const stats = addedSummaries.find(
                      (item) => item.courseID === courseId,
                    );
                    return (
                      <div
                        key={courseId}
                        className="border-[3px] border-black bg-[#22c55e] px-4 py-3 shadow-[4px_4px_0px_0px_#000] flex items-center justify-between"
                      >
                        <div>
                          <p className="text-sm font-black uppercase text-black">
                            {stats?.courseName ?? courseId}
                          </p>
                          <p className="text-xs font-bold text-black/70">
                            {courseId}
                          </p>
                        </div>
                        <div className="text-xs font-black uppercase text-black border-[3px] border-black bg-white px-4 py-2 shadow-[3px_3px_0px_0px_#000]">
                          {stats
                            ? `${stats.attendedClasses} / ${stats.totalClasses}`
                            : "—"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm font-bold text-neutral-600">
                  No new courses were added.
                </p>
              )}
            </section>

            <section className="border-[3px] border-black bg-white px-6 py-6 shadow-[5px_5px_0px_0px_#000]">
              <h2 className="text-lg font-black uppercase tracking-tight mb-4">
                Next Steps
              </h2>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => handleNavigate("/dashboard")}
                  className="inline-flex items-center gap-2 border-[3px] border-black bg-black px-5 py-3 text-sm font-black uppercase text-white shadow-[5px_5px_0px_0px_#000] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#000]"
                >
                  Go to Dashboard
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigate("/attendance")}
                  className="inline-flex items-center gap-2 border-[3px] border-black bg-white px-5 py-3 text-sm font-black uppercase shadow-[5px_5px_0px_0px_#000] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#000]"
                >
                  View Attendance
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

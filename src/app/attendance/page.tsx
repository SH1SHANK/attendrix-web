"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  MoreVertical,
  Minus,
  Plus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import DotPatternBackground from "@/components/ui/DotPatternBackground";
import { useAuth } from "@/context/AuthContext";
import { useUserPreferences } from "@/context/UserPreferencesContext";
import { getCourseAttendanceSummaryRpc } from "@/lib/attendance/attendance-service";
import type { CourseAttendanceSummary } from "@/types/types-defination";

const VIEW_ACTIONS = [
  { value: "syllabus", label: "Syllabus", icon: BookOpen },
  { value: "analytics", label: "Analytics", icon: BarChart3 },
] as const;

type CourseSummaryLike = CourseAttendanceSummary & {
  courseid?: string;
  coursename?: string;
  coursetype?: string;
  credits?: number;
  islab?: boolean;
  totalclasses?: number;
  attendedclasses?: number;
  attendancepercentage?: number;
  numbersofclassesneededtobeaboveattendancegoal?: number;
  numbersofclassescanbeskippedstillstayaboveattendancegoal?: number;
};

function getProgressTone(percent: number) {
  if (percent >= 100) return "bg-green-500";
  if (percent >= 80) return "bg-yellow-400";
  return "bg-red-500";
}

function getAttendanceInsight(
  summary: CourseAttendanceSummary,
  attendanceGoal: number,
) {
  const total = summary.totalClasses ?? 0;
  if (total === 0) {
    return "No classes recorded yet. Attendance starts once sessions begin. 📝";
  }

  const mustAttend =
    summary.numbersOfClassesNeededToBeAboveAttendanceGoal ?? 0;
  const canSkip =
    summary.numbersOfClassesCanBeSkippedStillStayAboveGoal ?? 0;

  if (mustAttend > 0) {
    return `Attend ${mustAttend} more ${
      mustAttend === 1 ? "class" : "classes"
    } to reach ${attendanceGoal}%.`;
  }

  if (canSkip > 0) {
    return `You can skip ${canSkip} ${
      canSkip === 1 ? "class" : "classes"
    } and stay above ${attendanceGoal}%.`;
  }

  if (summary.attendancePercentage >= 100) {
    return "Perfect attendance. Keep it locked. ✅";
  }

  return `You are exactly on track for ${attendanceGoal}%.`;
}

export default function AttendancePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { attendanceGoal } = useUserPreferences();
  const [summary, setSummary] = useState<CourseAttendanceSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [calculatorCourse, setCalculatorCourse] =
    useState<CourseAttendanceSummary | null>(null);
  const [plannedAttend, setPlannedAttend] = useState(0);
  const [plannedMiss, setPlannedMiss] = useState(0);

  useEffect(() => {
    if (!user?.uid || authLoading) return;

    const loadSummary = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getCourseAttendanceSummaryRpc(user.uid);
        const normalized = (data ?? []).map((item) => {
          const entry = item as CourseSummaryLike;
          return {
            courseID: entry.courseID ?? entry.courseid ?? "",
            courseName: entry.courseName ?? entry.coursename ?? "Untitled Course",
            courseType: entry.courseType ?? entry.coursetype ?? "core",
            credits: entry.credits ?? 0,
            isLab: entry.isLab ?? entry.islab ?? false,
            totalClasses: entry.totalClasses ?? entry.totalclasses ?? 0,
            attendedClasses: entry.attendedClasses ?? entry.attendedclasses ?? 0,
            attendancePercentage:
              entry.attendancePercentage ?? entry.attendancepercentage ?? 0,
            numbersOfClassesNeededToBeAboveAttendanceGoal:
              entry.numbersOfClassesNeededToBeAboveAttendanceGoal ??
              entry.numbersofclassesneededtobeaboveattendancegoal ??
              0,
            numbersOfClassesCanBeSkippedStillStayAboveAttendanceGoal:
              entry.numbersOfClassesCanBeSkippedStillStayAboveAttendanceGoal ??
              entry.numbersofclassescanbeskippedstillstayaboveattendancegoal ??
              0,
          };
        });
        setSummary(normalized);
      } catch (err) {
        console.error("Failed to load attendance summary", err);
        setError("Unable to load attendance summary.");
        toast.error("Unable to load attendance summary.");
      } finally {
        setLoading(false);
      }
    };

    void loadSummary();
  }, [authLoading, user?.uid]);

  useEffect(() => {
    if (!openMenuId) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current && menuRef.current.contains(target)) return;
      setOpenMenuId(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenuId]);

  useEffect(() => {
    if (!calculatorCourse) return;
    setPlannedAttend(0);
    setPlannedMiss(0);
  }, [calculatorCourse]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!calculatorCourse) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [calculatorCourse]);

  const sortedSummary = useMemo(() => {
    const items = [...summary];
    return items.sort((a, b) => {
      const nameA = a.courseName ?? "";
      const nameB = b.courseName ?? "";
      return nameA.localeCompare(nameB);
    });
  }, [summary]);

  const calculatorStats = useMemo(() => {
    if (!calculatorCourse) return null;
    const baseAttended = calculatorCourse.attendedClasses ?? 0;
    const baseTotal = calculatorCourse.totalClasses ?? 0;
    const currentPercent =
      baseTotal > 0 ? (baseAttended / baseTotal) * 100 : 0;
    const projectedAttended = baseAttended + plannedAttend;
    const projectedTotal = baseTotal + plannedAttend + plannedMiss;
    const projectedPercent =
      projectedTotal > 0 ? (projectedAttended / projectedTotal) * 100 : 0;
    const safeProjected = Number.isFinite(projectedPercent)
      ? projectedPercent
      : 0;
    const delta = safeProjected - currentPercent;

    const goalFraction = attendanceGoal / 100;
    let canSkip = 0;
    let mustAttend = 0;
    let goalNote = "";

    if (projectedTotal === 0) {
      goalNote = "Add upcoming classes to see projections.";
    } else if (goalFraction >= 1) {
      if (safeProjected >= 100) {
        goalNote = "Perfect attendance maintained.";
      } else {
        goalNote = "Goal is 100%. You must attend every class from now.";
      }
    } else if (safeProjected >= attendanceGoal) {
      canSkip = Math.max(
        0,
        Math.floor(projectedAttended / goalFraction - projectedTotal),
      );
    } else {
      mustAttend = Math.max(
        0,
        Math.ceil(
          (goalFraction * projectedTotal - projectedAttended) /
            (1 - goalFraction),
        ),
      );
    }

    return {
      baseAttended,
      baseTotal,
      currentPercent,
      projectedAttended,
      projectedTotal,
      projectedPercent: safeProjected,
      delta,
      canSkip,
      mustAttend,
      goalNote,
    };
  }, [calculatorCourse, plannedAttend, plannedMiss, attendanceGoal]);

  const handleBackNavigation = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/dashboard");
  };

  const handleOverflowMenuKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>,
  ) => {
    if (!menuRef.current) return;
    const items = Array.from(
      menuRef.current.querySelectorAll<HTMLButtonElement>(
        "[role='menuitem']",
      ),
    );
    if (items.length === 0) return;
    const currentIndex = items.findIndex(
      (item) => item === document.activeElement,
    );

    if (event.key === "Escape") {
      event.preventDefault();
      setOpenMenuId(null);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % items.length;
      items[nextIndex]?.focus();
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      const nextIndex =
        currentIndex < 0
          ? items.length - 1
          : (currentIndex - 1 + items.length) % items.length;
      items[nextIndex]?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-24 transition-colors duration-300 relative isolate">
      <DotPatternBackground />

      <div className="mx-auto max-w-3xl relative z-10">
        <header className="bg-white border-b-4 border-black px-4 py-3 sm:px-6 shadow-[0_6px_0_#0a0a0a]">
          {/* token: border-4 + shadow-[0_6px_0_#0a0a0a] for Neo-Brutalist elevation */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBackNavigation}
              aria-label="Go back"
              className="h-10 w-10 border-2 border-black bg-white flex items-center justify-center shadow-[3px_3px_0_#0a0a0a] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#0a0a0a] active:translate-y-0 active:shadow-[2px_2px_0_#0a0a0a]"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-black uppercase text-stone-900 tracking-tight">
                Attendance
              </h1>
              <p className="text-xs sm:text-sm font-bold uppercase tracking-wide text-stone-500">
                Course-wise overview
              </p>
            </div>
          </div>
        </header>

        <section className="bg-white border-b-4 border-black px-4 py-4 sm:px-6 shadow-[0_6px_0_#0a0a0a]">
          <div
            aria-label="Attendance view actions"
            className="flex items-center gap-2"
          >
            {VIEW_ACTIONS.map((action) => {
              const Icon = action.icon;
              const baseTone =
                action.value === "syllabus"
                  ? "bg-yellow-400 text-stone-900"
                  : "bg-blue-500 text-white";
              return (
                <button
                  key={action.value}
                  type="button"
                  onClick={() => {
                    toast.message(`${action.label} view coming soon.`);
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 h-12 text-xs font-black uppercase tracking-wide transition-all duration-200 border-2 border-black shadow-[4px_4px_0_#0a0a0a] hover:shadow-[5px_5px_0_#0a0a0a] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[2px_2px_0_#0a0a0a] focus:outline-none focus-visible:ring-2 focus-visible:ring-black/60 focus-visible:ring-offset-2 ${baseTone}`}
                  aria-label={`${action.label} view`}
                >
                  <Icon className="h-4 w-4" />
                  {action.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => toast.message("CGPA calculator is coming soon!")}
            className="mt-4 w-full flex items-center justify-center gap-2 h-12 border-2 border-black bg-green-400 text-stone-900 text-sm font-black uppercase tracking-wide shadow-[5px_5px_0_#0a0a0a] transition-all duration-200 hover:shadow-[6px_6px_0_#0a0a0a] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[3px_3px_0_#0a0a0a]"
            aria-label="Open CGPA calculator"
          >
            CGPA Calculator
          </button>
        </section>

        <section className="px-4 py-4 sm:px-6">
          {error && (
            <div className="mb-4 border-2 border-black bg-red-100 px-4 py-3 shadow-[4px_4px_0_#0a0a0a]">
              <p className="text-xs font-black uppercase text-red-700">
                {error}
              </p>
            </div>
          )}

          {loading ? (
            <div className="border-2 border-black bg-white px-6 py-8 shadow-[6px_6px_0_#0a0a0a]">
              <p className="text-lg font-black uppercase text-stone-900 mb-2">
                Loading attendance...
              </p>
              <p className="text-sm font-bold text-stone-600">
                Syncing your course progress.
              </p>
            </div>
          ) : sortedSummary.length === 0 ? (
            <div className="border-2 border-black bg-white px-6 py-8 shadow-[6px_6px_0_#0a0a0a]">
              <p className="text-lg font-black uppercase text-stone-900 mb-2">
                No attendance yet
              </p>
              <p className="text-sm font-bold text-stone-600">
                Attendance data will appear after your first class check-in.
              </p>
            </div>
          ) : (
            <div className="space-y-3" style={{ contentVisibility: "auto" }}>
              {sortedSummary.map((item, index) => {
                const attended = item.attendedClasses ?? 0;
                const total = item.totalClasses ?? 0;
                const percent = total > 0 ? item.attendancePercentage : 0;
                const safePercent = Number.isFinite(percent) ? percent : 0;
                const progress = Math.min(safePercent, 100);
                const toneClass = getProgressTone(safePercent);
                const insight = getAttendanceInsight(item, attendanceGoal);
                const courseKey = item.courseID || item.courseName || `${index}`;
                const isMenuOpen = openMenuId === courseKey;
                const accentClass =
                  safePercent >= 100
                    ? "border-l-green-500 from-white via-white to-green-50"
                    : safePercent >= 80
                      ? "border-l-yellow-400 from-white via-white to-yellow-50"
                      : "border-l-red-500 from-white via-white to-red-50";
                const stripeClass =
                  safePercent >= 100
                    ? "bg-green-500"
                    : safePercent >= 80
                      ? "bg-yellow-400"
                      : "bg-red-500";
                const courseTypeLabel = item.isLab ? "Lab" : "Core";
                const courseTypeTone = item.isLab
                  ? "bg-blue-200 text-stone-900"
                  : "bg-yellow-200 text-stone-900";

                return (
                  <div
                    key={courseKey}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setOpenMenuId(null);
                      setCalculatorCourse(item);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setOpenMenuId(null);
                        setCalculatorCourse(item);
                      }
                    }}
                    className={`border-2 border-black border-l-4 bg-gradient-to-br px-4 py-4 shadow-[5px_5px_0_#0a0a0a] transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-2 motion-reduce:animate-none focus:outline-none focus-visible:ring-2 focus-visible:ring-black/60 focus-visible:ring-offset-2 cursor-pointer ${accentClass}`}
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <div className={`h-2 w-full border-2 border-black shadow-[2px_2px_0_#0a0a0a] ${stripeClass}`} />
                    <div className="mt-3 flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-black text-lg sm:text-xl uppercase tracking-tight text-stone-900 leading-tight">
                            {item.courseName}
                          </h3>
                          <span
                            className={`border-2 border-black px-2 py-0.5 text-[10px] font-black uppercase tracking-wide shadow-[2px_2px_0_#0a0a0a] ${courseTypeTone}`}
                          >
                            {courseTypeLabel}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-stone-600 flex flex-wrap items-center gap-2">
                          <span>Attended {attended}/{total}</span>
                          <span className="text-stone-400">•</span>
                          <span>Type: {courseTypeLabel}</span>
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-lg font-black text-stone-900">
                          {safePercent.toFixed(1)}%
                        </span>
                        <div className="relative" ref={isMenuOpen ? menuRef : null}>
                          <button
                            type="button"
                            aria-label="Open course actions"
                            onClick={(event) => {
                              event.stopPropagation();
                              setOpenMenuId(isMenuOpen ? null : courseKey);
                            }}
                            className="h-9 w-9 border-2 border-black bg-white flex items-center justify-center shadow-[2px_2px_0_#0a0a0a] transition-all duration-200 hover:shadow-[3px_3px_0_#0a0a0a] hover:-translate-y-0.5 active:translate-y-0.5"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          {isMenuOpen && (
                            <div
                              className="absolute right-0 mt-2 w-40 border-2 border-black bg-white shadow-[4px_4px_0_#0a0a0a] z-20"
                              role="menu"
                              aria-label="Course actions"
                              onKeyDown={handleOverflowMenuKeyDown}
                              onClick={(event) => event.stopPropagation()}
                            >
                              <button
                                type="button"
                                role="menuitem"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  toast.message("View details coming soon");
                                  setOpenMenuId(null);
                                }}
                                className="w-full px-3 py-2 text-xs font-black uppercase text-left border-b border-stone-200 hover:bg-stone-50"
                              >
                                View Details
                              </button>
                              <button
                                type="button"
                                role="menuitem"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  toast.message("Edit attendance goal");
                                  setOpenMenuId(null);
                                }}
                                className="w-full px-3 py-2 text-xs font-black uppercase text-left border-b border-stone-200 hover:bg-stone-50"
                              >
                                Edit Goal
                              </button>
                              <button
                                type="button"
                                role="menuitem"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  toast.message("Open syllabus");
                                  setOpenMenuId(null);
                                }}
                                className="w-full px-3 py-2 text-xs font-black uppercase text-left hover:bg-stone-50"
                              >
                                Open Syllabus
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3">
                      {/* token: border-2 border-black + tone-based fill */}
                      <div
                        className="h-3 border-2 border-black bg-white"
                        role="progressbar"
                        aria-valuenow={Math.min(100, Math.round(safePercent))}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <div
                          className={`h-full ${toneClass} transition-all duration-300`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="mt-2 text-xs font-bold text-stone-700">
                        {insight}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {calculatorCourse && calculatorStats && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 animate-in fade-in duration-200"
          onClick={() => setCalculatorCourse(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Attendance calculator"
            className="w-full max-w-2xl max-h-[72vh] sm:max-h-[80vh] overflow-y-auto border-3 border-black bg-white shadow-[8px_8px_0_#0a0a0a] animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 motion-reduce:animate-none"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="bg-yellow-400 border-b-3 border-black px-5 py-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-base sm:text-lg font-black uppercase text-stone-900 leading-tight tracking-tight truncate">
                    Attendance Calculator
                  </h2>
                  <p className="mt-1 text-sm sm:text-base font-black uppercase tracking-tight text-stone-900 truncate">
                    {calculatorCourse.courseName}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="border-2 border-black bg-white px-2 py-0.5 text-[10px] font-black uppercase tracking-wide shadow-[2px_2px_0_#0a0a0a]">
                      Attended {calculatorStats.baseAttended}/
                      {calculatorStats.baseTotal}
                    </span>
                    <span
                      className={`border-2 border-black px-2 py-0.5 text-[10px] font-black uppercase tracking-wide shadow-[2px_2px_0_#0a0a0a] ${
                        calculatorCourse.isLab
                          ? "bg-blue-200 text-stone-900"
                          : "bg-yellow-200 text-stone-900"
                      }`}
                    >
                      {calculatorCourse.isLab ? "Lab" : "Core"}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCalculatorCourse(null)}
                  className="h-9 w-9 border-2 border-black bg-white flex items-center justify-center font-black text-xl shadow-[2px_2px_0_#0a0a0a] transition-all duration-200 hover:shadow-[3px_3px_0_#0a0a0a] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_#0a0a0a]"
                  aria-label="Close calculator"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="bg-white px-4 py-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="border-2 border-black border-l-4 border-l-yellow-400 bg-yellow-50 px-4 py-3 shadow-[4px_4px_0_#0a0a0a]">
                  <p className="text-[10px] font-black uppercase tracking-wide text-stone-500 mb-2">
                    Current Attendance
                  </p>
                  <p className="text-base font-black text-stone-900">
                    {calculatorStats.baseAttended}/{calculatorStats.baseTotal}
                  </p>
                  <div className="mt-1 inline-flex items-center gap-2">
                    <span className="text-sm font-black text-stone-900">
                      {calculatorStats.currentPercent.toFixed(1)}%
                    </span>
                    <span className="border-2 border-black bg-yellow-200 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide shadow-[2px_2px_0_#0a0a0a]">
                      Now
                    </span>
                  </div>
                </div>
                <div className="border-2 border-black border-l-4 border-l-blue-500 bg-blue-50 px-4 py-3 shadow-[4px_4px_0_#0a0a0a]">
                  <p className="text-[10px] font-black uppercase tracking-wide text-stone-500 mb-2">
                    Projected Attendance
                  </p>
                  <p className="text-base font-black text-stone-900">
                    {calculatorStats.projectedAttended}/
                    {calculatorStats.projectedTotal}
                  </p>
                  <div className="mt-1 inline-flex items-center gap-2">
                    <span className="text-sm font-black text-stone-900">
                      {calculatorStats.projectedPercent.toFixed(1)}%
                    </span>
                    <span className="border-2 border-black bg-blue-200 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide shadow-[2px_2px_0_#0a0a0a]">
                      Projected
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="w-full border-2 border-black bg-green-100 px-3 py-2.5 shadow-[4px_4px_0_#0a0a0a]">
                  <p className="text-[10px] font-black uppercase tracking-wide text-stone-600">
                    Plan to Attend
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setPlannedAttend((prev) => Math.max(0, prev - 1))
                      }
                      className="h-8 w-8 border-2 border-black bg-white flex items-center justify-center shadow-[2px_2px_0_#0a0a0a] transition-all duration-200 hover:shadow-[3px_3px_0_#0a0a0a]"
                      aria-label="Decrease planned attendance"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="text-lg font-black text-stone-900">
                      {plannedAttend}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPlannedAttend((prev) => prev + 1)}
                      className="h-8 w-8 border-2 border-black bg-white flex items-center justify-center shadow-[2px_2px_0_#0a0a0a] transition-all duration-200 hover:shadow-[3px_3px_0_#0a0a0a]"
                      aria-label="Increase planned attendance"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="w-full border-2 border-black bg-red-100 px-3 py-2.5 shadow-[4px_4px_0_#0a0a0a]">
                  <p className="text-[10px] font-black uppercase tracking-wide text-stone-600">
                    Plan to Miss
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setPlannedMiss((prev) => Math.max(0, prev - 1))
                      }
                      className="h-8 w-8 border-2 border-black bg-white flex items-center justify-center shadow-[2px_2px_0_#0a0a0a] transition-all duration-200 hover:shadow-[3px_3px_0_#0a0a0a]"
                      aria-label="Decrease planned misses"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="text-lg font-black text-stone-900">
                      {plannedMiss}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPlannedMiss((prev) => prev + 1)}
                      className="h-8 w-8 border-2 border-black bg-white flex items-center justify-center shadow-[2px_2px_0_#0a0a0a] transition-all duration-200 hover:shadow-[3px_3px_0_#0a0a0a]"
                      aria-label="Increase planned misses"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="border-2 border-black bg-white px-4 py-3 shadow-[4px_4px_0_#0a0a0a]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[10px] font-black uppercase tracking-wide text-stone-500">
                    Projected Change
                  </p>
                  <span
                    className={`text-sm font-black uppercase ${
                      calculatorStats.delta >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {calculatorStats.delta >= 0 ? "+" : ""}
                    {calculatorStats.delta.toFixed(1)}%
                  </span>
                </div>
                <div className="mt-3 h-3 border-2 border-black bg-white">
                  <div
                    className={`h-full ${getProgressTone(
                      calculatorStats.projectedPercent,
                    )} transition-all duration-300`}
                    style={{
                      width: `${Math.min(
                        calculatorStats.projectedPercent,
                        100,
                      )}%`,
                    }}
                  />
                </div>
                <p className="mt-2 text-xs font-bold text-stone-700">
                  {calculatorStats.goalNote ||
                    (calculatorStats.mustAttend > 0
                      ? `Attend ${calculatorStats.mustAttend} more ${calculatorStats.mustAttend === 1 ? "class" : "classes"} to reach ${attendanceGoal}%.`
                      : `You can skip ${calculatorStats.canSkip} ${calculatorStats.canSkip === 1 ? "class" : "classes"} and stay above ${attendanceGoal}%.`)}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <div className="flex-1 min-w-[120px] border-2 border-black bg-yellow-100 px-3 py-2 shadow-[3px_3px_0_#0a0a0a]">
                  <p className="text-[10px] font-black uppercase tracking-wide text-stone-600">
                    Target Goal
                  </p>
                  <p className="text-base font-black text-stone-900">
                    {attendanceGoal}%
                  </p>
                </div>
                <div className="flex-1 min-w-[120px] border-2 border-black bg-green-100 px-3 py-2 shadow-[3px_3px_0_#0a0a0a]">
                  <p className="text-[10px] font-black uppercase tracking-wide text-stone-600">
                    Can Skip
                  </p>
                  <p className="text-base font-black text-stone-900">
                    {calculatorStats.canSkip}
                  </p>
                </div>
                <div className="flex-1 min-w-[120px] border-2 border-black bg-red-100 px-3 py-2 shadow-[3px_3px_0_#0a0a0a]">
                  <p className="text-[10px] font-black uppercase tracking-wide text-stone-600">
                    Must Attend
                  </p>
                  <p className="text-base font-black text-stone-900">
                    {calculatorStats.mustAttend}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCalculatorCourse(null)}
                className="w-full flex items-center justify-center gap-2 h-11 border-2 border-black bg-white px-4 text-sm font-black uppercase tracking-wide text-stone-900 shadow-[4px_4px_0_#0a0a0a] transition-all duration-300 hover:shadow-[5px_5px_0_#0a0a0a] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0_#0a0a0a]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

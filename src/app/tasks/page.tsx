"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  ClipboardList,
  GraduationCap,
} from "lucide-react";
import DotPatternBackground from "@/components/ui/DotPatternBackground";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { DashboardHeaderMenu } from "@/components/dashboard/DashboardHeaderMenu";
import { useAuth } from "@/context/AuthContext";
import { useUserPreferences } from "@/context/UserPreferencesContext";
import { useTasks } from "@/hooks/useTasks";
import type { TaskRecord } from "@/types/types-defination";

type TaskTab = "assignment" | "exam";

const TAB_OPTIONS: Array<{ key: TaskTab; label: string; icon: typeof ClipboardList }> =
  [
    { key: "assignment", label: "Assignments", icon: ClipboardList },
    { key: "exam", label: "Exams", icon: GraduationCap },
  ];

const getTaskType = (task: TaskRecord): TaskTab => {
  const normalized = String(task.taskType || "").toLowerCase();
  return normalized === "exam" ? "exam" : "assignment";
};

const getTaskTimestamp = (task: TaskRecord) => {
  const date =
    task.taskDueDate || task.taskStartTime || task.taskEndTime || task.created_at;
  const timestamp = Date.parse(date ?? "");
  return Number.isNaN(timestamp) ? null : timestamp;
};

const formatDateLabel = (dateValue: string) => {
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) {
    return "TBA";
  }
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

function buildCountdown(now: number, target: number) {
  const diff = target - now;
  if (diff <= 0) return "Due now";
  const totalMinutes = Math.floor(diff / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `${days} day${days === 1 ? "" : "s"} ${hours} hour${
      hours === 1 ? "" : "s"
    }`;
  }
  if (hours > 0) {
    return `${hours} hour${hours === 1 ? "" : "s"} ${minutes} min${
      minutes === 1 ? "" : "s"
    }`;
  }
  return `${minutes} min${minutes === 1 ? "" : "s"}`;
}

function formatTaskTime(task: TaskRecord, formatTime: (date: Date | string) => string) {
  const safeFormat = (value: string) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "TBA";
    return formatTime(value);
  };

  if (task.taskStartTime && task.taskEndTime) {
    const dateLabel = formatDateLabel(task.taskStartTime);
    return `${dateLabel} ${safeFormat(task.taskStartTime)}–${safeFormat(
      task.taskEndTime,
    )}`;
  }
  if (task.taskDueDate) {
    return `Due ${formatDateLabel(task.taskDueDate)} ${safeFormat(
      task.taskDueDate,
    )}`;
  }
  if (task.taskStartTime) {
    return `${formatDateLabel(task.taskStartTime)} ${safeFormat(
      task.taskStartTime,
    )}`;
  }
  return "Time to be announced";
}

export default function TasksPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { formatTime } = useUserPreferences();
  const tasksQuery = useTasks(user?.uid ?? null);
  const tasks = useMemo(() => tasksQuery.data ?? [], [tasksQuery.data]);
  const [activeTab, setActiveTab] = useState<TaskTab>("assignment");
  const [now, setNow] = useState(() => Date.now());
  const listVisibilityStyle = useMemo(
    () =>
      ({
        contentVisibility: "auto",
        containIntrinsicSize: "1px 520px",
      }) as React.CSSProperties,
    [],
  );

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const { assignments, exams } = useMemo(() => {
    const nextAssignments: TaskRecord[] = [];
    const nextExams: TaskRecord[] = [];
    tasks.forEach((task) => {
      const type = getTaskType(task);
      if (type === "exam") {
        nextExams.push(task);
      } else {
        nextAssignments.push(task);
      }
    });
    return { assignments: nextAssignments, exams: nextExams };
  }, [tasks]);

  const upcomingTask = useMemo<TaskRecord | null>(() => {
    let bestTask: TaskRecord | null = null;
    let bestTime = Infinity;
    tasks.forEach((task) => {
      const time = getTaskTimestamp(task);
      if (time === null || time < now) return;
      if (time < bestTime) {
        bestTime = time;
        bestTask = task;
      }
    });
    return bestTask;
  }, [tasks, now]);

  const upcomingCountdown = useMemo(() => {
    if (!upcomingTask) return null;
    const timestamp = getTaskTimestamp(upcomingTask);
    if (!timestamp) return null;
    return buildCountdown(now, timestamp);
  }, [now, upcomingTask]);

  const tabTasks = useMemo(
    () => (activeTab === "assignment" ? assignments : exams),
    [activeTab, assignments, exams],
  );

  if (authLoading || tasksQuery.isLoading) {
    return <div className="min-h-screen bg-neutral-50" />;
  }

  if (!user?.uid) {
    return (
      <div className="min-h-screen bg-[#fffdf5] flex items-center justify-center p-4">
        <div className="border-2 border-black bg-white p-8 shadow-[8px_8px_0px_0px_#000] max-w-md">
          <h2 className="font-display text-2xl font-black uppercase mb-4">
            Authentication Required
          </h2>
          <p className="font-mono text-sm text-neutral-600 mb-6">
            Please sign in to access your tasks.
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

  return (
    <div className="min-h-screen bg-neutral-50 pb-24 transition-colors duration-300 relative isolate">
      <DotPatternBackground />

      <div className="mx-auto max-w-3xl relative z-10">
        <header className="bg-white border-b-4 border-black px-4 py-1 sm:px-6 shadow-[0_6px_0_#0a0a0a]">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => router.back()}
                  aria-label="Go back"
                className="h-10 w-10 border-2 border-black bg-white flex items-center justify-center shadow-[3px_3px_0_#0a0a0a] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#0a0a0a] active:translate-y-0 active:shadow-[2px_2px_0_#0a0a0a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-black uppercase text-stone-900 tracking-tight">
                  Tasks
                </h1>
                <p className="text-xs sm:text-sm font-bold uppercase tracking-wide text-stone-500">
                  Upcoming exams and assignments
                </p>
                {tasksQuery.isFetching && (
                  <p className="mt-1 text-[10px] font-black uppercase tracking-wide text-stone-400">
                    Syncing latest tasks…
                  </p>
                )}
              </div>
            </div>
            <DashboardHeaderMenu className="self-start" />
          </div>
        </header>

        <section className="bg-white border-b-4 border-black px-4 py-5 sm:px-6 shadow-[0_6px_0_#0a0a0a]">
          <div className="border-[3px] border-black bg-white px-4 py-4 shadow-[4px_4px_0px_0px_#000]">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 items-center justify-center border-[3px] border-black bg-[#FFD700] shadow-[3px_3px_0px_0px_#000]">
                  <CalendarClock className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-black uppercase text-neutral-600">
                    Next Up
                  </p>
                  <p className="text-lg font-black uppercase text-black">
                    {upcomingTask?.taskName ||
                      upcomingTask?.courseID ||
                      "No upcoming tasks"}
                  </p>
                  {upcomingTask && (
                    <p className="text-xs font-bold uppercase text-neutral-600">
                      {formatTaskTime(upcomingTask, formatTime)}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-black uppercase text-neutral-600">
                  Countdown
                </p>
                <p className="text-base font-black uppercase text-black">
                  {upcomingCountdown || "—"}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white border-b-4 border-black px-4 py-4 sm:px-6 shadow-[0_6px_0_#0a0a0a]">
          <div
            role="tablist"
            aria-label="Task type filters"
            className="grid grid-cols-2 gap-2"
          >
            {TAB_OPTIONS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`tasks-panel-${tab.key}`}
                  id={`tasks-tab-${tab.key}`}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center justify-center gap-2 border-[3px] border-black px-4 py-3 text-xs font-black uppercase shadow-[4px_4px_0px_0px_#000] transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/60 ${
                    isActive
                      ? "bg-[#FFD02F] text-black"
                      : "bg-white text-black hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_#000]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </section>

        <section
          id={`tasks-panel-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`tasks-tab-${activeTab}`}
          className="bg-white border-b-4 border-black px-4 py-6 sm:px-6 shadow-[0_6px_0_#0a0a0a]"
        >
          {tabTasks.length === 0 ? (
            <div className="border-[3px] border-black bg-white px-4 py-6 text-center shadow-[4px_4px_0px_0px_#000]">
              <p className="text-sm font-black uppercase text-neutral-600">
                No tasks or exams found yet.
              </p>
            </div>
          ) : (
            <ul className="space-y-3" style={listVisibilityStyle}>
              {tabTasks.map((task) => {
                const taskType = getTaskType(task);
                const Icon =
                  taskType === "exam" ? GraduationCap : ClipboardList;
                const extra =
                  task.additional_info || task.taskDescription || "";
                return (
                  <li
                    key={task.id}
                    aria-label={`${task.taskName || task.courseID} ${
                      task.taskType
                    }`}
                    className="border-[3px] border-black bg-white px-4 py-4 shadow-[4px_4px_0px_0px_#000] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_#000]"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-9 w-9 items-center justify-center border-[3px] border-black bg-white shadow-[3px_3px_0px_0px_#000]">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-black uppercase text-black">
                            {task.taskName || "Untitled Task"}
                          </p>
                          <span className="text-[10px] font-black uppercase text-neutral-500">
                            {task.courseID}
                          </span>
                        </div>
                        <p className="text-xs font-bold uppercase text-neutral-600">
                          {formatTaskTime(task, formatTime)}
                        </p>
                        {task.taskVenue && (
                          <p className="text-xs font-bold uppercase text-neutral-500">
                            Venue: {task.taskVenue}
                          </p>
                        )}
                        {extra && (
                          <p className="mt-2 text-sm font-bold text-neutral-700">
                            {extra}
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <DashboardNav />
    </div>
  );
}

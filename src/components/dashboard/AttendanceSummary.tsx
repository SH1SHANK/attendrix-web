"use client";

import { MOCK_ATTENDANCE_SUMMARY } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface AttendanceSummaryProps {
  className?: string;
}

const STATUS_STYLES = {
  safe: {
    bg: "bg-gradient-to-br from-[#A8E6CF] to-[#C8E6C9]",
    border: "border-[#51CF66]",
    icon: "✓",
  },
  warning: {
    bg: "bg-gradient-to-br from-[#FFD93D] to-[#FFEB99]",
    border: "border-[#FFA000]",
    icon: "⚠",
  },
  critical: {
    bg: "bg-gradient-to-br from-[#FF6B6B] to-[#FF9999]",
    border: "border-[#E53935]",
    icon: "!",
  },
};

export function AttendanceSummary({ className }: AttendanceSummaryProps) {
  // Calculate overall stats
  const totalClasses = MOCK_ATTENDANCE_SUMMARY.reduce(
    (sum, item) => sum + item.total,
    0,
  );
  const totalAttended = MOCK_ATTENDANCE_SUMMARY.reduce(
    (sum, item) => sum + item.attended,
    0,
  );
  const overallPercentage = ((totalAttended / totalClasses) * 100).toFixed(1);

  return (
    <div
      className={cn(
        "animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500",
        className,
      )}
    >
      {/* Section Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold">Attendance Overview</h2>
        <p className="mt-1 text-muted-foreground">
          Track your progress across all subjects
        </p>
      </div>

      {/* Overall Summary Card */}
      <div className="mb-6 rounded-lg border-4 border-black bg-gradient-to-br from-primary to-black p-6 text-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium opacity-90">Overall Attendance</p>
            <p className="mt-1 text-5xl font-bold">{overallPercentage}%</p>
            <p className="mt-2 text-sm opacity-75">
              {totalAttended} / {totalClasses} classes attended
            </p>
          </div>
          <div className="text-6xl opacity-20">📊</div>
        </div>
      </div>

      {/* Subject Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {MOCK_ATTENDANCE_SUMMARY.map((subject, index) => {
          const styles = STATUS_STYLES[subject.status];

          return (
            <div
              key={subject.subjectCode}
              className={cn(
                "group relative overflow-hidden rounded-lg border-3 p-5 transition-all duration-200",
                "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
                "hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]",
                styles.bg,
                styles.border,
                "animate-in fade-in slide-in-from-bottom-4",
              )}
              style={{
                animationDelay: `${index * 100}ms`,
                animationFillMode: "backwards",
              }}
            >
              {/* Status Icon */}
              <div className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border-2 border-black bg-white text-lg font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                {styles.icon}
              </div>

              {/* Subject Info */}
              <div className="mb-4">
                <h3 className="text-lg font-bold leading-tight">
                  {subject.subject}
                </h3>
                <p className="text-sm font-medium opacity-75">
                  {subject.subjectCode}
                </p>
              </div>

              {/* Percentage Display */}
              <div className="mb-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">
                    {subject.percentage.toFixed(1)}%
                  </span>
                  <span className="text-sm font-medium opacity-75">
                    {subject.attended}/{subject.total}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="h-3 overflow-hidden rounded-full border-2 border-black bg-white shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)]">
                  <div
                    className={cn(
                      "h-full transition-all duration-500",
                      subject.status === "safe" && "bg-[#51CF66]",
                      subject.status === "warning" && "bg-[#FFA000]",
                      subject.status === "critical" && "bg-[#FF6B6B]",
                    )}
                    style={{ width: `${subject.percentage}%` }}
                  />
                </div>
              </div>

              {/* Action Text */}
              <div className="rounded border-2 border-black bg-white/90 px-3 py-2 text-sm font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                {subject.canSkip > 0 ? (
                  <span className="text-[#51CF66]">
                    Can skip {subject.canSkip} classes
                  </span>
                ) : subject.mustAttend > 0 ? (
                  <span className="text-[#FF6B6B]">
                    Must attend next {subject.mustAttend}
                  </span>
                ) : (
                  <span className="text-[#FFA000]">Attend to maintain 80%</span>
                )}
              </div>

              {/* Hover overlay */}
              <div className="pointer-events-none absolute inset-0 bg-white opacity-0 transition-opacity duration-200 group-hover:opacity-[0.05]" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

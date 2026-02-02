"use client";

import { MockClass } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface ClassCardProps {
  classData: MockClass;
  onClick?: () => void;
  showAttendanceToggle?: boolean;
  className?: string;
}

const TYPE_COLORS = {
  lecture: "bg-[#A8E6CF] border-[#4CAF50]",
  lab: "bg-[#FFD93D] border-[#FFA000]",
  tutorial: "bg-[#B39DDB] border-[#7B1FA2]",
};

const STATUS_STYLES = {
  attended: "border-[#51CF66] bg-[#D4F4DD]",
  missed: "border-[#FF6B6B] bg-[#FFE5E5]",
  pending: "border-black bg-white",
  upcoming: "border-black bg-white",
};

export function ClassCard({
  classData,
  onClick,
  showAttendanceToggle = false,
  className,
}: ClassCardProps) {
  const isPast =
    classData.status === "attended" || classData.status === "missed";
  const canToggle = showAttendanceToggle && classData.status !== "upcoming";

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-lg border-3 transition-all duration-200",
        "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
        "hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]",
        onClick && "cursor-pointer",
        STATUS_STYLES[classData.status],
        className,
      )}
    >
      {/* Color accent bar */}
      <div
        className={cn(
          "absolute left-0 top-0 h-full w-2",
          TYPE_COLORS[classData.type],
        )}
      />

      <div className="p-4 pl-6">
        <div className="flex items-start justify-between gap-4">
          {/* Class Info */}
          <div className="flex-1 space-y-2">
            <div>
              <h3 className="text-lg font-bold leading-tight">
                {classData.subject}
              </h3>
              <p className="text-sm font-medium text-muted-foreground">
                {classData.subjectCode}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm">
              <div className="flex items-center gap-1.5">
                <span className="text-base">🕐</span>
                <span className="font-medium">
                  {classData.time} - {classData.endTime}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-base">📍</span>
                <span className="font-medium">{classData.venue}</span>
              </div>
            </div>

            {/* Type Badge */}
            <div>
              <span
                className={cn(
                  "inline-block rounded border-2 border-black px-2 py-0.5 text-xs font-bold uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
                  TYPE_COLORS[classData.type],
                )}
              >
                {classData.type}
              </span>
            </div>
          </div>

          {/* Status/Action Area */}
          <div className="flex flex-col items-end gap-2">
            {isPast && (
              <div
                className={cn(
                  "rounded-full border-2 border-black px-3 py-1 text-xs font-bold uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
                  classData.status === "attended"
                    ? "bg-[#51CF66]"
                    : "bg-[#FF6B6B]",
                )}
              >
                {classData.status === "attended" ? "✓ Present" : "✗ Absent"}
              </div>
            )}

            {canToggle && classData.status === "pending" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Toggle action (UI only)
                }}
                className={cn(
                  "rounded-lg border-2 border-black bg-white px-4 py-2 text-sm font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]",
                  "transition-all duration-150",
                  "hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px]",
                  "active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px]",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                )}
                disabled
              >
                Mark Present
              </button>
            )}

            {classData.status === "upcoming" && (
              <div className="rounded border-2 border-black bg-muted px-3 py-1 text-xs font-medium text-muted-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]">
                Upcoming
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hover effect overlay */}
      {onClick && (
        <div className="pointer-events-none absolute inset-0 bg-black opacity-0 transition-opacity duration-200 group-hover:opacity-[0.02]" />
      )}
    </div>
  );
}

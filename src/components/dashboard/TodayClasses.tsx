"use client";

import { useState, memo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Clock, MapPin, Check, X } from "lucide-react";

type AttendanceStatus = "present" | "absent" | null;

interface ClassData {
  id: string;
  time: string;
  subject: string;
  code: string;
  type: "Regular" | "Lab";
}

interface TodayClassesProps {
  classes: ClassData[];
  className?: string;
}

const AttendanceButton = memo(function AttendanceButton({
  status,
  onChange,
  disabled = false,
}: {
  status: AttendanceStatus;
  onChange: (status: AttendanceStatus) => void;
  disabled?: boolean;
}) {
  // Cycle: null -> present -> absent -> null
  const handleClick = () => {
    if (disabled) return;
    if (status === null) onChange("present");
    else if (status === "present") onChange("absent");
    else onChange(null);
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        "h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 border-2 border-black flex flex-col items-center justify-center",
        "transition-all duration-200 ease-out",
        "shadow-[2px_2px_0px_0px_#000] sm:shadow-[3px_3px_0px_0px_#000] md:shadow-[4px_4px_0px_0px_#000]",
        "hover:shadow-[3px_3px_0px_0px_#000] sm:hover:shadow-[5px_5px_0px_0px_#000] md:hover:shadow-[6px_6px_0px_0px_#000] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:scale-105",
        "active:shadow-none active:translate-x-0.5 active:translate-y-0.5 sm:active:translate-x-0.75 sm:active:translate-y-0.75 md:active:translate-x-1 md:active:translate-y-1 active:scale-95",
        "touch-manipulation select-none",
        disabled && "opacity-50 cursor-not-allowed pointer-events-none",
      )}
      style={{
        backgroundColor:
          status === "present"
            ? "#51CF66"
            : status === "absent"
              ? "#FF6B6B"
              : "#ffffff",
      }}
    >
      {status === "present" && (
        <>
          <Check className="w-4 h-4 sm:w-5 sm:h-5 md:w-8 md:h-8 stroke-[3px] mb-0.5 text-black" />
          <span className="text-[6px] sm:text-[7px] md:text-[10px] font-black uppercase tracking-wide text-black">
            PRESENT
          </span>
        </>
      )}
      {status === "absent" && (
        <>
          <X className="w-4 h-4 sm:w-5 sm:h-5 md:w-8 md:h-8 stroke-[3px] mb-0.5 text-black" />
          <span className="text-[6px] sm:text-[7px] md:text-[10px] font-black uppercase tracking-wide text-black">
            ABSENT
          </span>
        </>
      )}
      {status === null && (
        <span className="text-[8px] sm:text-[9px] md:text-xs font-bold uppercase text-neutral-400">
          MARK
        </span>
      )}
    </button>
  );
});

const ClassRow = memo(function ClassRow({
  classData,
  status,
  onStatusChange,
  index,
}: {
  classData: ClassData;
  status: AttendanceStatus;
  onStatusChange: (s: AttendanceStatus) => void;
  index: number;
}) {
  // Ensure we have end time simulated for display if not provided
  const startTime = classData.time;
  // Creating a fake end time for visual consistency with the design sample (e.g. +50 mins)
  const [hours, mins] = startTime.split(":").map(Number);
  const endDate = new Date();
  endDate.setHours(hours ?? 0, (mins ?? 0) + 50);
  const endTime = `${String(endDate.getHours()).padStart(2, "0")}:${String(endDate.getMinutes()).padStart(2, "0")}`;

  return (
    <div
      className="group relative flex flex-row items-stretch border-2 border-black bg-white transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] shadow-[4px_4px_0px_0px_#000] sm:shadow-[6px_6px_0px_0px_#000] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_0px_#000] sm:hover:shadow-[10px_10px_0px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0px_0px_#000] touch-manipulation cursor-pointer"
      style={{
        animationDelay: `${index * 50}ms`,
        animationFillMode: "backwards",
      }}
    >
      {/* 1. Time Column */}
      <div className="flex flex-col justify-center items-start pl-2 pr-2 py-2 sm:pl-4 sm:pr-4 sm:py-4 md:pl-6 md:pr-6 md:py-6 lg:pl-8 lg:pr-8 border-r-2 border-black min-w-17.5 sm:min-w-25 md:min-w-30 lg:min-w-35">
        <span className="font-mono text-lg sm:text-2xl md:text-3xl lg:text-4xl font-black text-black leading-none mb-0.5">
          {startTime}
        </span>
        <span className="font-mono text-[9px] sm:text-[10px] md:text-xs font-bold text-neutral-500 tracking-wide">
          {endTime}
        </span>
      </div>

      {/* 2. Info Column */}
      <div className="flex-1 flex flex-col justify-center px-2 py-2 sm:px-3 sm:py-3 md:px-4 md:py-4 lg:px-6 lg:py-6 min-w-0">
        <div className="mb-0.5 sm:mb-1 md:mb-1.5">
          <span className="font-mono text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs font-bold text-neutral-500 uppercase tracking-wide">
            {classData.code}
          </span>
        </div>
        <h3 className="font-display text-xs sm:text-sm md:text-lg lg:text-xl xl:text-2xl font-black uppercase leading-tight tracking-tight mb-0.5 sm:mb-1 md:mb-1.5 line-clamp-2">
          {classData.subject}
        </h3>
        <div className="flex items-center gap-1 sm:gap-1.5 text-neutral-600">
          <MapPin className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 lg:w-4 lg:h-4" />
          <span className="font-mono text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs font-medium">
            TBA
          </span>
        </div>
      </div>

      {/* 3. Action Column */}
      <div className="flex items-center justify-center px-1.5 sm:px-3 md:px-4 lg:px-6 border-l-2 border-black bg-neutral-50 group-hover:bg-[#FFFDF5] transition-colors duration-300">
        <AttendanceButton status={status} onChange={onStatusChange} />
      </div>
    </div>
  );
});

export function TodayClasses({ classes, className }: TodayClassesProps) {
  const [attendance, setAttendance] = useState<
    Record<string, AttendanceStatus>
  >({
    "2": "present", // Mock initial state based on image
    "3": "absent",
  });

  const handleStatusChange = useCallback(
    (id: string, status: AttendanceStatus) => {
      setAttendance((prev) => ({ ...prev, [id]: status }));
    },
    [],
  );

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-black pb-3 sm:pb-4 md:pb-6 mb-2">
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
          <Clock className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 stroke-[2.5px]" />
          <h2 className="font-display text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-black uppercase tracking-tight">
            Today&apos;s Schedule
          </h2>
        </div>
        <span className="font-mono text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-bold text-neutral-500 uppercase tracking-wide">
          {classes.length} classes
        </span>
      </div>

      <div className="grid gap-3 sm:gap-4 md:gap-6">
        {classes.length > 0 ? (
          classes.map((c, idx) => (
            <ClassRow
              key={c.id}
              classData={c}
              status={attendance[c.id] || null}
              onStatusChange={(s) => handleStatusChange(c.id, s)}
              index={idx}
            />
          ))
        ) : (
          <div className="border-2 border-dashed border-black/20 p-12 text-center bg-neutral-50 transition-all duration-300 hover:border-black/40 hover:bg-neutral-100">
            <div
              className="inline-block mb-4 p-4 bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000] animate-bounce"
              style={{ animationDuration: "3s" }}
            >
              <Clock className="w-8 h-8 stroke-[2px] text-neutral-400" />
            </div>
            <p className="font-display text-xl font-bold text-neutral-400 uppercase">
              No classes today
            </p>
            <p className="font-mono text-xs text-neutral-400 mt-2 uppercase tracking-wider">
              Enjoy your free day!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

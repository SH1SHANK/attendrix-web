"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";
import { TodayClassesList } from "./TodayClassesList";
import { UpcomingClasses } from "./UpcomingClasses";

type Tab = "today" | "upcoming";

interface ClassesTabsProps {
  onClassClick: (classId: string) => void;
  className?: string;
}

export function ClassesTabs({ onClassClick, className }: ClassesTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("today");

  return (
    <div
      className={cn(
        "rounded-lg border-4 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]",
        "animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300",
        className,
      )}
    >
      {/* Tab Bar */}
      <div className="mb-6 flex gap-2 rounded-lg border-2 border-black bg-muted p-1">
        <button
          onClick={() => setActiveTab("today")}
          className={cn(
            "flex-1 rounded-md px-4 py-2.5 text-sm font-bold uppercase tracking-wide transition-all duration-200",
            activeTab === "today"
              ? "bg-accent shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] translate-x-[-1px] translate-y-[-1px]"
              : "hover:bg-white/50",
          )}
        >
          Today
        </button>
        <button
          onClick={() => setActiveTab("upcoming")}
          className={cn(
            "flex-1 rounded-md px-4 py-2.5 text-sm font-bold uppercase tracking-wide transition-all duration-200",
            activeTab === "upcoming"
              ? "bg-accent shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] translate-x-[-1px] translate-y-[-1px]"
              : "hover:bg-white/50",
          )}
        >
          Upcoming
        </button>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === "today" ? (
          <TodayClassesList onClassClick={onClassClick} />
        ) : (
          <UpcomingClasses onClassClick={onClassClick} />
        )}
      </div>
    </div>
  );
}

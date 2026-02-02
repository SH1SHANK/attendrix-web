"use client";

import { getMockCalendarDates, MOCK_UPCOMING_CLASSES } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

interface HorizontalCalendarProps {
  selectedDate: string;
  onDateSelect: (date: string) => void;
  className?: string;
}

export function HorizontalCalendar({
  selectedDate,
  onDateSelect,
  className,
}: HorizontalCalendarProps) {
  const dates = getMockCalendarDates();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollability = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 10,
    );
  };

  useEffect(() => {
    checkScrollability();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", checkScrollability);
      return () => container.removeEventListener("scroll", checkScrollability);
    }
  }, []);

  const scroll = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = 200;
    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <div className={cn("relative", className)}>
      {/* Left scroll button */}
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full border-2 border-black bg-white p-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px]"
          aria-label="Scroll left"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
      )}

      {/* Calendar container */}
      <div
        ref={scrollContainerRef}
        className="scrollbar-hide flex gap-3 overflow-x-auto scroll-smooth px-8"
      >
        {dates.map((dateItem) => {
          const isSelected = dateItem.date === selectedDate;
          const hasClasses =
            (MOCK_UPCOMING_CLASSES[dateItem.date]?.length ?? 0) > 0;

          return (
            <button
              key={dateItem.date}
              onClick={() => onDateSelect(dateItem.date)}
              className={cn(
                "group relative flex-shrink-0 rounded-lg border-3 border-black p-4 transition-all duration-200",
                "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
                "hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]",
                "active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px]",
                isSelected
                  ? "bg-accent scale-105"
                  : hasClasses
                    ? "bg-white"
                    : "bg-muted opacity-60",
              )}
              style={{ minWidth: "100px" }}
            >
              <div className="flex flex-col items-center gap-1">
                <span
                  className={cn(
                    "text-xs font-bold uppercase tracking-wide",
                    isSelected ? "text-black" : "text-muted-foreground",
                  )}
                >
                  {dateItem.dayName}
                </span>
                <span
                  className={cn(
                    "text-2xl font-bold",
                    isSelected ? "text-black" : "text-foreground",
                  )}
                >
                  {dateItem.display.split(" ")[0]}
                </span>
                <span
                  className={cn(
                    "text-xs font-medium",
                    isSelected ? "text-black" : "text-muted-foreground",
                  )}
                >
                  {dateItem.display.split(" ")[1]}
                </span>

                {/* Class count indicator */}
                {hasClasses && (
                  <div
                    className={cn(
                      "mt-1 rounded-full border-2 border-black px-2 py-0.5 text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
                      isSelected ? "bg-white" : "bg-[#A8E6CF]",
                    )}
                  >
                    {MOCK_UPCOMING_CLASSES[dateItem.date]?.length ?? 0} classes
                  </div>
                )}
              </div>

              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute -bottom-2 left-1/2 h-1.5 w-12 -translate-x-1/2 rounded-full bg-black" />
              )}
            </button>
          );
        })}
      </div>

      {/* Right scroll button */}
      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full border-2 border-black bg-white p-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px]"
          aria-label="Scroll right"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

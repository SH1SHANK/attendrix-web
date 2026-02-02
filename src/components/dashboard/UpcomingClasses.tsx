"use client";

import { getMockCalendarDates, MOCK_UPCOMING_CLASSES } from "@/lib/mock-data";
import { useState } from "react";
import { ClassCard } from "./ClassCard";
import { HorizontalCalendar } from "./HorizontalCalendar";
import { cn } from "@/lib/utils";

interface UpcomingClassesProps {
  onClassClick: (classId: string) => void;
  className?: string;
}

export function UpcomingClasses({
  onClassClick,
  className,
}: UpcomingClassesProps) {
  // Default to next working day
  const calendarDates = getMockCalendarDates();
  const defaultDate = calendarDates[0]?.date ?? "2026-02-04";
  const [selectedDate, setSelectedDate] = useState(defaultDate);

  const selectedClasses = MOCK_UPCOMING_CLASSES[selectedDate] || [];

  return (
    <div className={cn("space-y-6", className)}>
      {/* Horizontal Calendar */}
      <HorizontalCalendar
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
      />

      {/* Classes List */}
      <div>
        {selectedClasses.length === 0 ? (
          <div className="rounded-lg border-2 border-black bg-muted p-8 text-center">
            <p className="text-lg font-medium text-muted-foreground">
              No classes scheduled for this day
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedClasses.map((classItem, index) => (
              <div
                key={classItem.id}
                className="animate-in fade-in slide-in-from-bottom-4"
                style={{
                  animationDelay: `${index * 50}ms`,
                  animationFillMode: "backwards",
                }}
              >
                <ClassCard
                  classData={classItem}
                  onClick={() => onClassClick(classItem.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { MOCK_TODAY_CLASSES } from "@/lib/mock-data";
import { ClassCard } from "./ClassCard";
import { cn } from "@/lib/utils";

interface TodayClassesListProps {
  onClassClick: (classId: string) => void;
  className?: string;
}

export function TodayClassesList({
  onClassClick,
  className,
}: TodayClassesListProps) {
  if (MOCK_TODAY_CLASSES.length === 0) {
    return (
      <div
        className={cn(
          "rounded-lg border-2 border-black bg-muted p-8 text-center",
          className,
        )}
      >
        <p className="text-lg font-medium text-muted-foreground">
          No classes scheduled for today
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {MOCK_TODAY_CLASSES.map((classItem, index) => (
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
            showAttendanceToggle
          />
        </div>
      ))}
    </div>
  );
}

"use client";

import { getMockCurrentOrNextClass } from "@/lib/mock-data";
import { useState } from "react";
import { AttendanceCalculatorModal } from "@/components/dashboard/AttendanceCalculatorModal";
import { AttendanceSummary } from "@/components/dashboard/AttendanceSummary";
import { ClassesTabs } from "@/components/dashboard/ClassesTabs";
import { CurrentClassHero } from "@/components/dashboard/CurrentClassHero";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

export default function DashboardPage() {
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  // Get current/next class (static mock)
  const currentOrNextClass = getMockCurrentOrNextClass();

  const handleClassClick = (classId: string) => {
    setSelectedClassId(classId);
  };

  const handleCloseModal = () => {
    setSelectedClassId(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Main Container */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* 1. Greeting Header */}
          <DashboardHeader />

          {/* 2. Current/Next Class Hero */}
          <CurrentClassHero classData={currentOrNextClass} />

          {/* 3. Classes Section (Tabbed: Today / Upcoming) */}
          <ClassesTabs onClassClick={handleClassClick} />

          {/* 4. Attendance Summary */}
          <AttendanceSummary />
        </div>
      </div>

      {/* 5. Attendance Calculator Modal */}
      <AttendanceCalculatorModal
        classId={selectedClassId}
        onClose={handleCloseModal}
      />
    </div>
  );
}

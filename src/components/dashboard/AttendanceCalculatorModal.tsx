"use client";

import {
  MOCK_ATTENDANCE_SUMMARY,
  MOCK_TODAY_CLASSES,
  MOCK_UPCOMING_CLASSES,
  MockClass,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface AttendanceCalculatorModalProps {
  classId: string | null;
  onClose: () => void;
}

export function AttendanceCalculatorModal({
  classId,
  onClose,
}: AttendanceCalculatorModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (classId) {
      // Slight delay for entrance animation
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
    }
  }, [classId]);

  if (!classId) return null;

  // Find the class from all possible sources
  let classData: MockClass | undefined = MOCK_TODAY_CLASSES.find(
    (c) => c.id === classId,
  );
  if (!classData) {
    // Search in upcoming classes
    for (const classes of Object.values(MOCK_UPCOMING_CLASSES)) {
      const found = classes.find((c) => c.id === classId);
      if (found) {
        classData = found;
        break;
      }
    }
  }

  if (!classData) return null;

  // Get attendance data for this subject
  const attendanceData = MOCK_ATTENDANCE_SUMMARY.find(
    (a) => a.subjectCode === classData.subjectCode,
  );

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 transition-opacity duration-300",
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none",
      )}
    >
      <div
        className={cn(
          "relative w-full max-w-2xl rounded-lg border-4 border-black bg-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-300",
          isVisible ? "scale-100 translate-y-0" : "scale-95 translate-y-4",
        )}
      >
        {/* Header */}
        <div className="border-b-4 border-black bg-accent p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold">{classData.subject}</h2>
              <p className="mt-1 text-sm font-medium opacity-75">
                {classData.subjectCode}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full border-2 border-black bg-white p-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px]"
              aria-label="Close modal"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Class Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border-2 border-black bg-muted p-4">
              <p className="text-sm font-medium text-muted-foreground">Time</p>
              <p className="mt-1 text-lg font-bold">
                {classData.time} - {classData.endTime}
              </p>
            </div>
            <div className="rounded-lg border-2 border-black bg-muted p-4">
              <p className="text-sm font-medium text-muted-foreground">Venue</p>
              <p className="mt-1 text-lg font-bold">{classData.venue}</p>
            </div>
          </div>

          {/* Current Attendance */}
          {attendanceData && (
            <div className="rounded-lg border-3 border-black bg-gradient-to-br from-[#A8E6CF] to-[#C8E6C9] p-6">
              <h3 className="text-lg font-bold mb-4">Current Attendance</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium opacity-75">Percentage</p>
                  <p className="text-3xl font-bold">
                    {attendanceData.percentage.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium opacity-75">Attended</p>
                  <p className="text-3xl font-bold">
                    {attendanceData.attended}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium opacity-75">Total</p>
                  <p className="text-3xl font-bold">{attendanceData.total}</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4">
                <div className="h-4 overflow-hidden rounded-full border-2 border-black bg-white shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)]">
                  <div
                    className="h-full bg-[#51CF66] transition-all duration-500"
                    style={{ width: `${attendanceData.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Calculation Cards */}
          {attendanceData && (
            <div className="grid grid-cols-2 gap-4">
              {/* If you attend */}
              <div className="rounded-lg border-3 border-[#51CF66] bg-gradient-to-br from-[#D4F4DD] to-white p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">✓</span>
                  <h4 className="font-bold">If You Attend</h4>
                </div>
                <p className="text-3xl font-bold text-[#51CF66]">
                  {(
                    ((attendanceData.attended + 1) /
                      (attendanceData.total + 1)) *
                    100
                  ).toFixed(1)}
                  %
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {attendanceData.attended + 1}/{attendanceData.total + 1}{" "}
                  classes
                </p>
              </div>

              {/* If you skip */}
              <div className="rounded-lg border-3 border-[#FF6B6B] bg-gradient-to-br from-[#FFE5E5] to-white p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">✗</span>
                  <h4 className="font-bold">If You Skip</h4>
                </div>
                <p className="text-3xl font-bold text-[#FF6B6B]">
                  {(
                    (attendanceData.attended / (attendanceData.total + 1)) *
                    100
                  ).toFixed(1)}
                  %
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {attendanceData.attended}/{attendanceData.total + 1} classes
                </p>
              </div>
            </div>
          )}

          {/* Recommendation */}
          {attendanceData && (
            <div
              className={cn(
                "rounded-lg border-3 border-black p-4",
                attendanceData.canSkip > 0
                  ? "bg-[#A8E6CF]"
                  : attendanceData.mustAttend > 0
                    ? "bg-[#FFE5E5]"
                    : "bg-[#FFD93D]",
              )}
            >
              <p className="font-bold text-sm uppercase tracking-wide mb-1">
                Recommendation
              </p>
              <p className="text-lg font-medium">
                {attendanceData.canSkip > 0
                  ? `You can safely skip ${attendanceData.canSkip} more classes`
                  : attendanceData.mustAttend > 0
                    ? `You must attend the next ${attendanceData.mustAttend} classes to reach 80%`
                    : "Keep attending to maintain your attendance above 80%"}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t-4 border-black bg-muted p-6">
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="rounded-lg border-2 border-black bg-white px-6 py-2 font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px]"
            >
              Close
            </button>
            <button
              disabled
              className="rounded-lg border-2 border-black bg-accent px-6 py-2 font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] opacity-50 cursor-not-allowed"
            >
              Mark Attendance (Disabled)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

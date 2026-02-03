"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { formatISTTime } from "@/lib/time/ist";

/**
 * Global User Preferences
 *
 * Manages settings like:
 * - Time Format (12h vs 24h)
 * - Attendance Goal (e.g. 75%, 80%)
 *
 * Persists to localStorage.
 */

interface UserPreferencesContextType {
  // Time Format
  is24Hour: boolean;
  toggleTimeFormat: () => void;
  formatTime: (date: Date | string) => string;

  // Attendance Goal
  attendanceGoal: number;
  setAttendanceGoal: (goal: number) => void;
}

const UserPreferencesContext = createContext<
  UserPreferencesContextType | undefined
>(undefined);

export function UserPreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Default Settings
  const [is24Hour, setIs24Hour] = useState(false);
  const [attendanceGoal, setAttendanceGoalState] = useState(75);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Load preferences from localStorage
    const savedTime = localStorage.getItem("attendrix-time-format");
    if (savedTime) {
      setIs24Hour(savedTime === "24h");
    }

    const savedGoal = localStorage.getItem("attendrix-attendance-goal");
    if (savedGoal) {
      const parsed = parseInt(savedGoal, 10);
      if (!isNaN(parsed)) {
        setAttendanceGoalState(parsed);
      }
    }

    setMounted(true);
  }, []);

  const toggleTimeFormat = () => {
    setIs24Hour((prev) => {
      const newValue = !prev;
      localStorage.setItem("attendrix-time-format", newValue ? "24h" : "12h");
      return newValue;
    });
  };

  const setAttendanceGoal = (goal: number) => {
    setAttendanceGoalState(goal);
    localStorage.setItem("attendrix-attendance-goal", goal.toString());
  };

  const formatTime = (dateInput: Date | string): string => {
    return formatISTTime(dateInput, is24Hour);
  };

  return (
    <UserPreferencesContext.Provider
      value={{
        is24Hour,
        toggleTimeFormat,
        formatTime,
        attendanceGoal,
        setAttendanceGoal,
      }}
    >
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function useUserPreferences() {
  const context = useContext(UserPreferencesContext);
  if (context === undefined) {
    throw new Error(
      "useUserPreferences must be used within a UserPreferencesProvider",
    );
  }
  return context;
}

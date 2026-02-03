"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface TimeFormatContextType {
  is24Hour: boolean;
  toggleTimeFormat: () => void;
  formatTime: (date: Date | string) => string;
}

const TimeFormatContext = createContext<TimeFormatContextType | undefined>(
  undefined,
);

export function TimeFormatProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Default to 12-hour per requirements
  const [is24Hour, setIs24Hour] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Load preference from localStorage if available
    const saved = localStorage.getItem("attendrix-time-format");
    if (saved) {
      setIs24Hour(saved === "24h");
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

  const formatTime = (dateInput: Date | string): string => {
    const date =
      typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return "--:--";

    if (is24Hour) {
      // 24-hour format: HH:mm (e.g., 14:30)
      return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
    } else {
      // 12-hour format: h:mm A (e.g., 2:30 PM)
      let hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      return `${hours}:${String(minutes).padStart(2, "0")} ${ampm}`;
    }
  };

  if (!mounted) {
    // Return null or a placeholder to avoid hydration mismatch?
    // Actually, simple return children is risky if we render specific time.
    // Better to just render children but maybe with default?
    // Since this affects text content, we might get hydration mismatch if we render differently on server.
    // But this component runs on client.
    // If we return children immediately with default (false), and then useEffect updates it, we get a flicker.
    // But since defaults is 12h and user wants 12h default, it matches.
    // If user saved 24h, there will be a hydration mismatch if server renders 12h??
    // No, server renders static HTML. Time formatting usually happens in client components that use this hook.
    // We should be fine rendering children.
  }

  return (
    <TimeFormatContext.Provider
      value={{ is24Hour, toggleTimeFormat, formatTime }}
    >
      {children}
    </TimeFormatContext.Provider>
  );
}

export function useTimeFormat() {
  const context = useContext(TimeFormatContext);
  if (context === undefined) {
    throw new Error("useTimeFormat must be used within a TimeFormatProvider");
  }
  return context;
}

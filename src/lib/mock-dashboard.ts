// Mock data utilities for dashboard
export function getMockTodayClasses() {
  return [
    {
      id: "1",
      time: "09:00",
      subject: "Essentials of Management",
      code: "ME2111EPCA1",
      type: "Regular" as const,
    },
    {
      id: "2",
      time: "11:00",
      subject: "Innovation and Entrepreneurship",
      code: "IE2RN1EIEC1",
      type: "Regular" as const,
    },
    {
      id: "3",
      time: "18:00",
      subject: "Mathematics IV",
      code: "MA2013EIC01",
      type: "Regular" as const,
    },
  ];
}

export function getMockCurrentClass() {
  const now = new Date();
  const targetTime = new Date(now.getTime() + 50 * 60 * 1000); // 50 minutes from now

  return {
    type: "current" as const,
    subject: "Mathematics IV",
    timeRange: "18:00 - 19:30",
    targetTime,
  };
}

export function getMockNextClass() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);

  return {
    type: "next" as const,
    subject: "Thermal Engineering",
    timeRange: "09:00 - 10:30",
    targetTime: tomorrow,
  };
}

export function getMockDateRange() {
  const dates = [];
  const today = new Date();

  // Generate next 10 days
  for (let i = 1; i <= 10; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    const dayName = date
      .toLocaleDateString("en-US", { weekday: "short" })
      .toUpperCase();
    const dayNumber = date.getDate();
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;

    dates.push({
      date,
      dayName,
      dayNumber,
      isToday: false,
      isWeekend,
    });
  }

  return dates;
}

interface ClassData {
  id: string;
  time: string;
  subject: string;
  code: string;
  type: "Regular" | "Lab";
}

export function getMockClassesByDate() {
  const today = new Date();
  const classesByDate: Record<string, ClassData[]> = {};

  // Tomorrow's classes
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowKey = tomorrow.toISOString().split("T")[0]!;

  classesByDate[tomorrowKey] = [
    {
      id: "t1",
      time: "09:00",
      subject: "Thermal Engineering",
      code: "ME2211EPCE1",
      type: "Regular" as const,
    },
    {
      id: "t2",
      time: "14:00",
      subject: "Manufacturing Science",
      code: "ME2311EPCD1",
      type: "Lab" as const,
    },
  ];

  // Day after tomorrow
  const dayAfter = new Date(today);
  dayAfter.setDate(today.getDate() + 2);
  const dayAfterKey = dayAfter.toISOString().split("T")[0]!;

  classesByDate[dayAfterKey] = [
    {
      id: "d1",
      time: "10:00",
      subject: "Mathematics IV",
      code: "MA2013EIC01",
      type: "Regular" as const,
    },
    {
      id: "d2",
      time: "13:00",
      subject: "Innovation and Entrepreneurship",
      code: "IE2RN1EIEC1",
      type: "Regular" as const,
    },
  ];

  return classesByDate;
}

export function getMockGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "Morning";
  if (hour < 17) return "Afternoon";
  return "Evening";
}

export function getMockDate() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

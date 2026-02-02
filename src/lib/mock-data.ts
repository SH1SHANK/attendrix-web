/**
 * Mock Data for Dashboard Layout Phase
 * NO REAL DATA - Static fixtures only for UI development
 */

export interface MockClass {
  id: string;
  subject: string;
  subjectCode: string;
  time: string;
  endTime: string;
  venue: string;
  type: "lecture" | "lab" | "tutorial";
  status: "attended" | "missed" | "pending" | "upcoming";
  date: string; // ISO date string
}

export interface MockAttendanceSummary {
  subjectCode: string;
  subject: string;
  attended: number;
  total: number;
  percentage: number;
  canSkip: number;
  mustAttend: number;
  status: "safe" | "warning" | "critical";
}

export interface MockUser {
  name: string;
  greeting: string;
  subGreeting: string;
  level: string;
}

// Current time simulation (mock)
export const MOCK_CURRENT_TIME = new Date("2026-02-03T10:30:00");

// User data
export const MOCK_USER: MockUser = {
  name: "Shashank",
  greeting: "Good Morning",
  subGreeting: "How's Your Day Going Today?",
  level: "Year 2 • Semester 4",
};

// Today's classes
export const MOCK_TODAY_CLASSES: MockClass[] = [
  {
    id: "t1",
    subject: "Data Structures",
    subjectCode: "CS201",
    time: "09:00 AM",
    endTime: "10:00 AM",
    venue: "Room 301",
    type: "lecture",
    status: "attended",
    date: "2026-02-03",
  },
  {
    id: "t2",
    subject: "Database Management Systems",
    subjectCode: "CS202",
    time: "10:15 AM",
    endTime: "11:15 AM",
    venue: "Lab 2",
    type: "lab",
    status: "attended",
    date: "2026-02-03",
  },
  {
    id: "t3",
    subject: "Operating Systems",
    subjectCode: "CS203",
    time: "11:30 AM",
    endTime: "12:30 PM",
    venue: "Room 405",
    type: "lecture",
    status: "pending",
    date: "2026-02-03",
  },
  {
    id: "t4",
    subject: "Web Technologies",
    subjectCode: "CS204",
    time: "02:00 PM",
    endTime: "03:00 PM",
    venue: "Lab 1",
    type: "lab",
    status: "pending",
    date: "2026-02-03",
  },
  {
    id: "t5",
    subject: "Computer Networks",
    subjectCode: "CS205",
    time: "03:15 PM",
    endTime: "04:15 PM",
    venue: "Room 302",
    type: "lecture",
    status: "pending",
    date: "2026-02-03",
  },
];

// Upcoming classes for different dates
export const MOCK_UPCOMING_CLASSES: Record<string, MockClass[]> = {
  "2026-02-04": [
    {
      id: "u1",
      subject: "Data Structures",
      subjectCode: "CS201",
      time: "09:00 AM",
      endTime: "10:00 AM",
      venue: "Room 301",
      type: "tutorial",
      status: "upcoming",
      date: "2026-02-04",
    },
    {
      id: "u2",
      subject: "Database Management Systems",
      subjectCode: "CS202",
      time: "11:30 AM",
      endTime: "12:30 PM",
      venue: "Room 405",
      type: "lecture",
      status: "upcoming",
      date: "2026-02-04",
    },
    {
      id: "u3",
      subject: "Web Technologies",
      subjectCode: "CS204",
      time: "02:00 PM",
      endTime: "03:00 PM",
      venue: "Lab 1",
      type: "lab",
      status: "upcoming",
      date: "2026-02-04",
    },
  ],
  "2026-02-05": [
    {
      id: "u4",
      subject: "Operating Systems",
      subjectCode: "CS203",
      time: "10:15 AM",
      endTime: "11:15 AM",
      venue: "Room 302",
      type: "lecture",
      status: "upcoming",
      date: "2026-02-05",
    },
    {
      id: "u5",
      subject: "Computer Networks",
      subjectCode: "CS205",
      time: "01:00 PM",
      endTime: "02:00 PM",
      venue: "Lab 3",
      type: "lab",
      status: "upcoming",
      date: "2026-02-05",
    },
  ],
  "2026-02-06": [
    {
      id: "u6",
      subject: "Data Structures",
      subjectCode: "CS201",
      time: "09:00 AM",
      endTime: "10:00 AM",
      venue: "Lab 2",
      type: "lab",
      status: "upcoming",
      date: "2026-02-06",
    },
    {
      id: "u7",
      subject: "Database Management Systems",
      subjectCode: "CS202",
      time: "11:30 AM",
      endTime: "12:30 PM",
      venue: "Room 301",
      type: "tutorial",
      status: "upcoming",
      date: "2026-02-06",
    },
    {
      id: "u8",
      subject: "Operating Systems",
      subjectCode: "CS203",
      time: "02:00 PM",
      endTime: "03:00 PM",
      venue: "Room 405",
      type: "lecture",
      status: "upcoming",
      date: "2026-02-06",
    },
    {
      id: "u9",
      subject: "Web Technologies",
      subjectCode: "CS204",
      time: "03:15 PM",
      endTime: "04:15 PM",
      venue: "Lab 1",
      type: "lab",
      status: "upcoming",
      date: "2026-02-06",
    },
  ],
  "2026-02-07": [
    {
      id: "u10",
      subject: "Computer Networks",
      subjectCode: "CS205",
      time: "10:15 AM",
      endTime: "11:15 AM",
      venue: "Room 302",
      type: "lecture",
      status: "upcoming",
      date: "2026-02-07",
    },
    {
      id: "u11",
      subject: "Data Structures",
      subjectCode: "CS201",
      time: "01:00 PM",
      endTime: "02:00 PM",
      venue: "Room 301",
      type: "lecture",
      status: "upcoming",
      date: "2026-02-07",
    },
  ],
};

// Attendance summary
export const MOCK_ATTENDANCE_SUMMARY: MockAttendanceSummary[] = [
  {
    subjectCode: "CS201",
    subject: "Data Structures",
    attended: 28,
    total: 32,
    percentage: 87.5,
    canSkip: 3,
    mustAttend: 0,
    status: "safe",
  },
  {
    subjectCode: "CS202",
    subject: "Database Management Systems",
    attended: 24,
    total: 30,
    percentage: 80.0,
    canSkip: 0,
    mustAttend: 0,
    status: "safe",
  },
  {
    subjectCode: "CS203",
    subject: "Operating Systems",
    attended: 20,
    total: 28,
    percentage: 71.4,
    canSkip: 0,
    mustAttend: 3,
    status: "warning",
  },
  {
    subjectCode: "CS204",
    subject: "Web Technologies",
    attended: 18,
    total: 30,
    percentage: 60.0,
    canSkip: 0,
    mustAttend: 7,
    status: "critical",
  },
  {
    subjectCode: "CS205",
    subject: "Computer Networks",
    attended: 26,
    total: 29,
    percentage: 89.7,
    canSkip: 4,
    mustAttend: 0,
    status: "safe",
  },
];

// Helper to get current/next class
export function getMockCurrentOrNextClass(): MockClass | null {
  const now = MOCK_CURRENT_TIME;
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  for (const classItem of MOCK_TODAY_CLASSES) {
    const timeParts = classItem.time.split(" ");
    if (timeParts.length !== 2) continue;

    const time = timeParts[0]!;
    const period = timeParts[1]!;
    const timeSplit = time.split(":");
    if (timeSplit.length !== 2) continue;

    const hours = Number(timeSplit[0]!);
    const minutes = Number(timeSplit[1]!);
    const classHour = period === "PM" && hours !== 12 ? hours + 12 : hours;

    const endTimeParts = classItem.endTime.split(" ");
    if (endTimeParts.length !== 2) continue;

    const endTime = endTimeParts[0]!;
    const endPeriod = endTimeParts[1]!;
    const endTimeSplit = endTime.split(":");
    if (endTimeSplit.length !== 2) continue;

    const endHours = Number(endTimeSplit[0]!);
    const endMinutes = Number(endTimeSplit[1]!);
    const classEndHour =
      endPeriod === "PM" && endHours !== 12 ? endHours + 12 : endHours;

    // Check if class is currently ongoing
    if (
      (currentHour > classHour ||
        (currentHour === classHour && currentMinute >= minutes)) &&
      (currentHour < classEndHour ||
        (currentHour === classEndHour && currentMinute < endMinutes))
    ) {
      return classItem;
    }

    // Check if this is the next upcoming class
    if (
      currentHour < classHour ||
      (currentHour === classHour && currentMinute < minutes)
    ) {
      return classItem;
    }
  }

  return null;
}

// Helper to calculate class progress (for ongoing classes)
export function getMockClassProgress(classItem: MockClass): number {
  const now = MOCK_CURRENT_TIME;
  const timeParts = classItem.time.split(" ");
  if (timeParts.length !== 2) return 0;

  const time = timeParts[0]!;
  const period = timeParts[1]!;
  const timeSplit = time.split(":");
  if (timeSplit.length !== 2) return 0;

  const hours = Number(timeSplit[0]!);
  const minutes = Number(timeSplit[1]!);
  const classHour = period === "PM" && hours !== 12 ? hours + 12 : hours;

  const endTimeParts = classItem.endTime.split(" ");
  if (endTimeParts.length !== 2) return 0;

  const endTime = endTimeParts[0]!;
  const endPeriod = endTimeParts[1]!;
  const endTimeSplit = endTime.split(":");
  if (endTimeSplit.length !== 2) return 0;

  const endHours = Number(endTimeSplit[0]!);
  const endMins = Number(endTimeSplit[1]!);
  const classEndHour =
    endPeriod === "PM" && endHours !== 12 ? endHours + 12 : endHours;

  const startMinutes = classHour * 60 + minutes;
  const endMinutes = classEndHour * 60 + endMins;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  if (currentMinutes < startMinutes) return 0;
  if (currentMinutes >= endMinutes) return 100;

  return ((currentMinutes - startMinutes) / (endMinutes - startMinutes)) * 100;
}

// Calendar dates (7 days starting from tomorrow)
export function getMockCalendarDates(): Array<{
  date: string;
  display: string;
  dayName: string;
}> {
  const dates = [];
  const baseDate = new Date("2026-02-04"); // Tomorrow from mock current time

  for (let i = 0; i < 7; i++) {
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() + i);

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    dates.push({
      date: date.toISOString().split("T")[0]!,
      display: `${date.getDate()} ${monthNames[date.getMonth()]!}`,
      dayName: dayNames[date.getDay()]!,
    });
  }

  return dates;
}

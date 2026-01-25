import { UserChallenge } from "@/types/challenges";

export interface FirestoreUser {
  uid: string;
  email: string | null;
  username: string;
  display_name: string | null;
  photo_url: string | null;
  batchID: string;
  userRole: "ADMIN" | "STUDENT" | "FACULTY";
  department: string;
  stats: {
    streak: number;
    points: number;
  };
  amplix: number;
  challengesAllotted?: UserChallenge[]; // Array of challenge objects
  challengeKey?: string; // e.g., "0126-W4W"
  coursesEnrolled: string[]; // Raw form in Firestore
  mageRank?: {
    level: number;
    title: string;
    stars: number;
    xpCurrent: number;
    xpRequired: number;
  };
  longestStreak?: number;
  perfectDays?: number;
  calendarDates?: string[];
  settings?: {
    googleCalendarSync: boolean;
    darkMode: boolean;
    notifications: boolean;
  };
}

export interface AttendanceStat {
  courseID: string;
  courseName: string;
  attendedClasses: number;
  totalClasses: number;
  percentage: number;
  credits: number;
  isLab: boolean;
}

export interface DashboardData {
  user: Omit<FirestoreUser, "coursesEnrolled"> & {
    coursesEnrolled: AttendanceStat[];
  };
}

export interface ScheduleSlot {
  slot_id: string; // classID
  course_name: string;
  time_start: string; // ISO string
  time_end: string; // ISO string
  status: "present" | "absent" | "upcoming" | "cancelled" | "late";
  venue: string;
  is_lab: boolean;
}

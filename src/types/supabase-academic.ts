export interface BatchRecord {
  batchID: string;
  batchCode: string; // e.g., "cs_s4_a"
  semester: number;
  semester_name?: string; // Display name for the semester
  slot?: string;
  courseCatalog: string[]; // Array of courseIDs
  enrollmentCapacity?: number;
  electiveCatalog: string[]; // Array of Category Strings (e.g. "OE", "LAB1")
  department_id?: string;
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface CourseRecord {
  courseID: string;
  semesterID: number;
  courseName: string;
  credits?: number;
  syllabusAssets?: string;
  courseType?: Record<string, unknown>;
  isElective: boolean;
  electiveScope?: string[]; // Array of Category Strings (e.g. "OE")
  enrolledStudents: number;
  department_id?: string;
  course_faculty?: string;
}

export interface ElectiveSlot {
  category: string; // e.g. "OE"
  availableCourses: CourseRecord[];
}

// For UI State
export interface CurriculumState {
  core: CourseRecord[];
  electiveSlots: ElectiveSlot[];
  // Replaces flat 'electives' and 'count'
}

// ============================================
// RPC Response Types (Phase 2: READ-ONLY Integration)
// ============================================

/**
 * Response from get_today_schedule RPC
 * Used for: Today's Classes, Current/Next Class in CountdownCard
 */
export interface TodayScheduleClass {
  classID: string;
  courseID: string;
  courseName: string;
  classStartTime: string; // TIMESTAMP as ISO string
  classEndTime: string; // TIMESTAMP as ISO string
  classVenue: string | null;
  isCancelled: boolean;
  userAttended: boolean;
  userCheckinTime: string | null; // TIMESTAMP as ISO string
  totalClasses: number;
  attendedClasses: number;
  currentAttendancePercentage: number; // FLOAT
  classesRequiredToReachGoal: number;
  classesCanSkipAndStayAboveGoal: number;
}

/**
 * Response from get_upcoming_classes RPC
 * Used for: Upcoming Classes (default next working day)
 */
export interface UpcomingClass {
  classID: string;
  courseID: string;
  courseName: string;
  classStartTime: string; // TIMESTAMP as ISO string
  classEndTime: string; // TIMESTAMP as ISO string
  classVenue: string | null;
  classDate: string; // Display format: "D/M/YYYY"
}

/**
 * Response from get_classes_by_date RPC
 * Used for: Upcoming Classes when user selects specific date
 */
export interface ClassByDate {
  classID: string;
  courseID: string;
  courseName: string;
  classStartTime: string; // TIMESTAMP as ISO string
  classEndTime: string; // TIMESTAMP as ISO string
  classVenue: string | null;
  classDate: string; // Display format: "D/M/YYYY"
  classStatus: Record<string, unknown> | null; // JSONB
  courseType: {
    isLab: boolean;
    courseType: string; // "core" | "elective"
    electiveCategory: string;
  } | null; // JSONB
  isPlusSlot: boolean;
}

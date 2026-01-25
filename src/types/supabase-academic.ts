export interface BatchRecord {
  batchID: string;
  batchCode: string; // e.g., "cs_s4_a"
  semester: number;
  semester_name?: string; // Display name for the semester
  slot?: string;
  courseCatalog: string[]; // Array of courseIDs
  enrollmentCapacity?: number;
  electiveCatalog: string[]; // Array of Category Strings (e.g. "OE", "LAB1")
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

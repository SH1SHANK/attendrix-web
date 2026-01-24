export interface BatchRecord {
  batchID: string;
  batchCode: string; // e.g., "cs_s4_a"
  semester: number;
  slot?: string;
  courseCatalog: string[]; // Array of courseIDs
  enrollmentCapacity?: number;
  electiveCatalog: string[]; // Array of Category Strings (e.g. "OE", "LAB1")
  department_id: string;
  semester_name: string; // e.g., "S4 CSE"
}

export interface CourseRecord {
  courseID: string;
  semesterID: number;
  courseName: string;
  credits?: number;
  syllabusAssets?: string;
  courseType?: Record<string, any>;
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

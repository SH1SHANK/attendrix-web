// ============================================================================
// DATABASE TYPES - SUPABASE POSTGRESQL SCHEMA
// ============================================================================
// Version: 1.0
// Last Updated: January 31, 2026
// ============================================================================

// ============================================================================
// TABLE TYPES - Direct database table schemas
// ============================================================================

/**
 * amplixChallengeProgress Table
 * Tracks per-user progress for each challenge
 */
export interface AmplixChallengeProgress {
  progressID: string; // UUID
  userID: string;
  challengeID: string;
  challengeType: "weekly" | "monthly" | "seasonal" | "special";
  idempotentKey: string;
  progress: number;
  targetValue: number;
  isCompleted: boolean;
  completionDate: string | null; // ISO timestamp
  completedWithClassIDs: string[];
  isClaimed: boolean;
  lastUpdated: string; // ISO timestamp
}

/**
 * attendanceRecords Table
 * Stores attendance check-ins per class
 */
export interface AttendanceRecord {
  rowID: string; // UUID
  userID: string;
  classID: string;
  courseID: string | null;
  classTime: string | null; // ISO timestamp
  checkinTime: string; // ISO timestamp
}

/**
 * batchRecords Table
 * Defines academic batches
 */
export interface BatchRecord {
  batchID: string; // Primary key
  batchCode: string;
  semester: number | null;
  semester_name: string | null;
  slot: string | null;
  department_id: string | null;
  courseCatalog: string[] | null;
  electiveCatalog: string[] | null;
  enrollmentCapacity: number | null;
}

/**
 * challengeTemplates Table
 * Master definitions for challenges
 */
export interface ChallengeTemplate {
  challengeID: string; // Primary key
  challengeName: string;
  challengeDescription: string;
  challengeType: "weekly" | "monthly" | "seasonal" | "special";
  challengeCondition:
    | "attend_x_classes"
    | "attend_full_day"
    | "maintain_streak"
    | "early_checkin"
    | "perfect_week"
    | "course_completion";
  targetValue: number | null;
  dependentChallengeIDs: string[];
  amplixReward: number;
  isActive: boolean;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

/**
 * courseRecords Table
 * Academic course catalog
 */
export interface CourseRecord {
  courseID: string; // Primary key
  semesterID: number;
  courseName: string | null;
  credits: number | null;
  syllabusAssets: string | null;
  courseType: CourseTypeJSON | null;
  isElective: boolean;
  electiveScope: string[] | null;
  enrolledStudents: number;
  department_id: string;
  course_faculty: string | null;
}

/**
 * Course Type JSONB structure
 */
export interface CourseTypeJSON {
  isLab: boolean;
  courseType: "core" | "elective" | "audit";
  courseCategory?: "PC" | "IC" | "OE" | "PE";
  electiveCategory?: "OE" | "PE" | "UE" | null;
}

/**
 * timetableRecords Table
 * Timetable entries per class session
 */
export interface TimetableRecord {
  classID: string; // Primary key
  courseID: string;
  batchID: string | null;
  courseName: string | null;
  classDate: string | null; // Date string format: "DD/M/YYYY"
  classStartTime: string | null; // ISO timestamp
  classEndTime: string | null; // ISO timestamp
  classVenue: string | null;
  isPlusSlot: boolean;
  courseType: CourseTypeJSON | null;
  classStatus: ClassStatusJSON | null;
  eventid: string | null;
  createdTime: string | null; // ISO timestamp
  updated_at: string | null; // ISO timestamp with timezone
}

/**
 * Class Status JSONB structure
 */
export interface ClassStatusJSON {
  status: "scheduled" | "ongoing" | "completed" | "cancelled" | "rescheduled";
  reason?: string;
  updatedAt?: string;
}

/**
 * taskRecords Table
 * Read-only tasks and exams
 */
export type TaskType = "assignment" | "exam";

export interface TaskRecord {
  id: string;
  created_at: string; // ISO timestamp
  courseID: string;
  taskType: TaskType;
  taskName: string | null;
  taskDescription: string | null;
  taskDueDate: string | null;
  taskStartTime: string | null;
  taskEndTime: string | null;
  taskAssets: string | null;
  maxScore: number | null;
  taskVenue: string | null;
  additional_info: string | null;
}

/**
 * userCourseRecords Table
 * Per-user enrollment and academic context
 */
export interface UserCourseRecord {
  userID: string; // Primary key
  batchID: string;
  semesterID: number;
  enrolledCourses: string[]; // JSONB stored as array
  metadata: Record<string, unknown> | null; // JSONB
  lastUpdated: string | null; // ISO timestamp
}

// ============================================================================
// RPC FUNCTION RETURN TYPES
// ============================================================================

/**
 * get_current_or_next_class RPC function return type
 * Returns currently running class or next upcoming class
 */
export interface CurrentOrNextClass {
  classID: string;
  courseID: string;
  courseName: string;
  classStartTime: string; // ISO timestamp
  classEndTime: string; // ISO timestamp
  classVenue: string | null;
  isCurrent: boolean;
  progressRatio: number; // 0.0 to 1.0
}

/**
 * get_today_schedule RPC function return type
 * Returns all classes for a user on a given day with attendance status
 */
export interface TodayScheduleItem {
  classID: string;
  courseID: string;
  courseName: string;
  classStartTime: string; // ISO timestamp
  classEndTime: string; // ISO timestamp
  classVenue: string | null;
  isCancelled: boolean;
  userAttended: boolean;
  userCheckinTime: string | null; // ISO timestamp
  totalClasses: number;
  attendedClasses: number;
  currentAttendancePercentage: number;
  classesRequiredToReachGoal: number;
  classesCanSkipAndStayAboveGoal: number;
}

/**
 * get_upcoming_classes RPC function return type
 * Returns classes for next working day
 */
export interface UpcomingClass {
  classID: string;
  courseID: string;
  courseName: string;
  classStartTime: string; // ISO timestamp
  classEndTime: string; // ISO timestamp
  classVenue: string | null;
  classDate: string; // Date string
}

/**
 * get_user_past_classes RPC function return type
 * Returns historical classes with attendance status
 */
export interface PastClass {
  classID: string;
  courseID: string;
  courseName: string;
  classStartTime: string; // ISO timestamp
  classEndTime: string; // ISO timestamp
  classVenue: string | null;
  attendanceStatus: AttendanceStatus;
}

/**
 * get_user_course_attendance_summary RPC function return type
 * Authoritative per-course attendance statistics (ground truth)
 */
export interface CourseAttendanceSummary {
  courseID: string;
  courseName: string;
  courseType: string;
  credits: number;
  isLab: boolean;
  totalClasses: number;
  attendedClasses: number;
  attendancePercentage: number;
  numbersOfClassesNeededToBeAboveAttendanceGoal: number;
  numbersOfClassesCanBeSkippedStillStayAboveGoal: number;
}

/**
 * get_missed_classes RPC function return type
 * Returns classes that were missed (not attended) for specified courses
 */
export interface MissedClass {
  classID: string;
  courseID: string;
  courseName: string;
  classStartTime: string; // ISO timestamp
  classEndTime: string; // ISO timestamp
  classVenue: string | null;
  classDate: string; // Date string
}

/**
 * class_check_in RPC function return type
 * Response from checking in to a class with challenge progress
 */
export interface CheckInResponse {
  success: boolean;
  message: string;
  attendanceMarked: boolean;
  amplixEarned?: number;
  challengesCompleted?: string[];
  newStreak?: number;
  error?: string;
}

/**
 * class_check_in RPC function return type (authoritative)
 */
export interface ClassCheckInRpcResponse {
  status: string;
  message: string;
  amplix_gained?: number;
  amplix_lost?: number;
  full_day_completed?: boolean;
  attended_classes?: number;
  total_classes?: number;
  attended_class_ids?: string[];
}

/**
 * mark_class_absent RPC function return type (authoritative)
 */
export interface MarkClassAbsentRpcResponse {
  status: string;
  message: string;
  amplix_gained?: number;
  amplix_lost?: number;
  attended_classes?: number;
  total_classes?: number;
  attended_class_ids?: string[];
}

/**
 * evaluate_user_challenges RPC function return type
 */
export interface EvaluateChallengesResponse {
  status: string;
  message: string;
  claimable_challenges_count?: number;
  processed_challenges?: number;
  total_challenges?: number;
  points_to_deduct?: number;
  deduction_details?: unknown;
  processed_at?: string;
}

export type AttendanceActionState =
  | "upcoming"
  | "live"
  | "checked_in"
  | "absent"
  | "cancelled";

// ============================================================================
// RPC FUNCTION PARAMETER TYPES
// ============================================================================

/**
 * Parameters for get_current_or_next_class
 */
export interface GetCurrentOrNextClassParams {
  batch_id: string;
  now_ts?: string; // ISO timestamp, defaults to NOW()
}

/**
 * Parameters for get_today_schedule
 */
export interface GetTodayScheduleParams {
  batch_id: string;
  user_id: string;
  date?: string; // ISO date string (YYYY-MM-DD), defaults to CURRENT_DATE
  attendance_goal_percentage?: number; // defaults to 80.0
}

/**
 * Parameters for get_upcoming_classes
 */
export interface GetUpcomingClassesParams {
  user_id: string;
}

/**
 * Parameters for get_user_past_classes
 */
export interface GetUserPastClassesParams {
  uid: string;
  filter?: "7d" | "14d" | "30d" | "all"; // defaults to 'all'
}

/**
 * Parameters for get_user_course_attendance_summary
 */
export interface GetUserCourseAttendanceSummaryParams {
  uid: string;
  attendance_goal?: number; // defaults to 80.0
}

/**
 * Parameters for marking attendance
 */
export interface MarkAttendanceParams {
  userID: string;
  classID: string;
  courseID: string;
  classTime: string; // ISO timestamp
  checkinTime: string; // ISO timestamp
}

/**
 * Parameters for get_missed_classes
 */
export interface GetMissedClassesParams {
  user_id: string;
  course_ids: string[];
}

/**
 * Parameters for class_check_in
 */
export interface ClassCheckInParams {
  p_user_id: string;
  p_class_id: string;
  p_enrolled_courses: string[];
  p_class_start: string; // ISO timestamp
}

/**
 * Parameters for mark_class_absent
 */
export interface MarkClassAbsentParams {
  p_user_id: string;
  p_class_id: string;
  p_enrolled_courses: string[];
}

// ============================================================================
// FIREBASE USER TYPES
// ============================================================================

/**
 * Firebase User Document Structure
 * Stored in Firestore: users/{uid}
 */
export interface FirebaseUserDocument {
  uid: string;
  email: string;
  username: string;
  username_lower?: string;
  display_name: string;
  photo_url: string;
  userRole: "student" | "faculty" | "admin";
  userBio: string;

  // Academic Information
  batchID: string;
  semesterID: string; // Stored as string in Firebase

  // Gamification
  amplix: number;
  currentWeekAmplixGained: number;
  challengeKey: string; // Format: "MMYY-WXW" or "MMYY-M"
  currentStreak: number;
  longestStreak: number;
  streakHistory: number[]; // Array of day numbers (e.g., 20462 = days since epoch)

  // Course Enrollment (stored in Firebase)
  coursesEnrolled: FirebaseCourseEnrollment[];

  // Challenges
  challengesAllotted: FirebaseChallengeAllotment[];

  // Consents
  consentTerms?: boolean;
  consentPromotions?: boolean;

  // Metadata
  created_time: string; // ISO timestamp
  lastDataFetchTime: string; // ISO timestamp

  // Study materials personalization (optional)
  studyMaterialsPreferences?: Record<string, unknown>;
}

/**
 * Course Enrollment in Firebase
 * Note: This is advisory data - Supabase is source of truth
 */
export interface FirebaseCourseEnrollment {
  courseID: string;
  courseName: string;
  credits: number;
  courseType: {
    isLab: boolean;
    courseType: "core" | "elective" | "audit";
    electiveCategory: string;
  };
  isEditable: boolean;
  totalClasses: number; // Advisory counter
  attendedClasses: number; // Advisory counter
}

/**
 * Challenge Allotment in Firebase
 */
export interface FirebaseChallengeAllotment {
  progressID: string;
  challengeID: string;
  challengeKey: string;
  challengeName: string;
  challengeCondition: string;
  challengeDescription: string;
  targetValue?: number;
  amplixReward?: number;
}

/**
 * Firebase Authentication User
 * From Firebase Auth SDK
 */
export interface FirebaseAuthUser {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber: string | null;
  disabled: boolean;
  metadata: {
    creationTime: string;
    lastSignInTime: string;
  };
  providerData: Array<{
    providerId: string;
    uid: string;
    displayName: string | null;
    email: string | null;
    phoneNumber: string | null;
    photoURL: string | null;
  }>;
  customClaims?: Record<string, unknown>;
}

/**
 * Combined User Type for Application Use
 * Merges Firebase Auth + Firestore Document
 */
export interface AppUser {
  // From Firebase Auth
  uid: string;
  email: string;
  emailVerified: boolean;

  // From Firestore Document
  username: string;
  displayName: string;
  photoURL: string;
  userRole: "student" | "faculty" | "admin";
  userBio: string;

  // Academic
  batchID: string;
  semesterID: number;

  // Gamification
  amplix: number;
  currentWeekAmplixGained: number;
  currentStreak: number;
  longestStreak: number;

  // Metadata
  createdTime: Date;
  lastDataFetchTime: Date;
}

// ============================================================================
// DOMAIN MODEL TYPES (Application Layer)
// ============================================================================

/**
 * Enhanced class with computed status
 */
export interface ClassWithStatus extends TodayScheduleItem {
  status: "upcoming" | "ongoing" | "completed" | "missed" | "cancelled";
  canMarkAttendance: boolean;
  timeUntilStart?: number; // milliseconds
  timeUntilEnd?: number; // milliseconds
}

/**
 * Grouped classes by date for UI
 */
export interface GroupedClasses {
  date: string; // YYYY-MM-DD
  dateLabel: string; // "Today", "Yesterday", "Jan 15, 2026"
  classes: PastClass[];
  stats: {
    total: number;
    attended: number;
    missed: number;
    attendanceRate: number;
  };
}

/**
 * Attendance insights calculated from summary
 */
export interface AttendanceInsights {
  totalCourses: number;
  coursesAboveGoal: number;
  coursesAtRisk: number; // Below 75%
  coursesCritical: number; // Below 65%
  overallAttendancePercentage: number;
  totalClassesAttended: number;
  totalClassesHeld: number;
  criticalCourses: CourseAttendanceSummary[];
  performingWellCourses: CourseAttendanceSummary[];
}

/**
 * Dashboard aggregated data
 */
export interface DashboardData {
  currentClass: CurrentOrNextClass | null;
  todaySchedule: TodayScheduleItem[];
  attendanceSummary: CourseAttendanceSummary[];
  upcomingClasses: UpcomingClass[];
  insights: AttendanceInsights;
  lastUpdated: Date;
}

/**
 * User profile data (combines multiple sources)
 */
export interface UserProfile {
  // Personal
  uid: string;
  email: string;
  username: string;
  displayName: string;
  photoURL: string;
  bio: string;

  // Academic
  batchID: string;
  batchCode: string;
  semester: number;
  semesterName: string;
  department: string;
  enrolledCourses: string[];

  // Gamification
  amplix: number;
  currentStreak: number;
  longestStreak: number;
  weeklyAmplixGained: number;

  // Statistics
  overallAttendance: number;
  totalClassesAttended: number;
  totalClassesHeld: number;
  coursesCount: number;

  // Metadata
  memberSince: Date;
  lastActive: Date;
}

/**
 * Class statistics for a time period
 */
export interface ClassStatistics {
  period: "7d" | "14d" | "30d" | "all" | "custom";
  startDate: Date;
  endDate: Date;
  totalClasses: number;
  attendedClasses: number;
  missedClasses: number;
  attendanceRate: number;
  byCourse: Map<
    string,
    {
      courseName: string;
      total: number;
      attended: number;
      missed: number;
      rate: number;
    }
  >;
}

/**
 * Challenge progress with additional metadata
 */
export interface ChallengeProgress extends AmplixChallengeProgress {
  challengeName: string;
  challengeDescription: string;
  challengeCondition: string;
  amplixReward: number;
  progressPercentage: number; // progress / targetValue * 100
  remainingProgress: number; // targetValue - progress
  isClaimable: boolean; // isCompleted && !isClaimed
  expiresAt?: Date;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * API Response wrapper
 */
export interface APIResponse<T> {
  data: T | null;
  error: APIError | null;
  timestamp: Date;
}

/**
 * API Error structure
 */
export interface APIError {
  code: string;
  message: string;
  details?: unknown;
  userMessage?: string; // User-friendly message
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
  orderBy?: string;
  orderDirection?: "asc" | "desc";
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

/**
 * Filter period type
 */
export type FilterPeriod = "7d" | "14d" | "30d" | "all";

/**
 * Attendance status type
 */
export type AttendanceStatus = "PRESENT" | "ABSENT" | "PENDING";

/**
 * Class status type
 */
export type ClassStatus =
  | "upcoming"
  | "ongoing"
  | "completed"
  | "missed"
  | "cancelled";

/**
 * Sort order type
 */
export type SortOrder = "asc" | "desc";

/**
 * Loading state type
 */
export type LoadingState = "idle" | "loading" | "success" | "error";

// ============================================================================
// SUPABASE DATABASE TYPE (Auto-generated)
// ============================================================================

/**
 * Complete Supabase Database schema type
 * This would typically be auto-generated by: npx supabase gen types typescript
 */
export interface Database {
  public: {
    Tables: {
      amplixChallengeProgress: {
        Row: AmplixChallengeProgress;
        Insert: Omit<AmplixChallengeProgress, "progressID" | "lastUpdated"> & {
          progressID?: string;
          lastUpdated?: string;
        };
        Update: Partial<Omit<AmplixChallengeProgress, "progressID">>;
      };
      attendanceRecords: {
        Row: AttendanceRecord;
        Insert: Omit<AttendanceRecord, "rowID"> & {
          rowID?: string;
        };
        Update: Partial<Omit<AttendanceRecord, "rowID">>;
      };
      batchRecords: {
        Row: BatchRecord;
        Insert: BatchRecord;
        Update: Partial<BatchRecord>;
      };
      challengeTemplates: {
        Row: ChallengeTemplate;
        Insert: ChallengeTemplate;
        Update: Partial<ChallengeTemplate>;
      };
      courseRecords: {
        Row: CourseRecord;
        Insert: Omit<CourseRecord, "enrolledStudents"> & {
          enrolledStudents?: number;
        };
        Update: Partial<CourseRecord>;
      };
      timetableRecords: {
        Row: TimetableRecord;
        Insert: Omit<TimetableRecord, "updated_at"> & {
          updated_at?: string;
        };
        Update: Partial<Omit<TimetableRecord, "classID">>;
      };
      taskRecords: {
        Row: TaskRecord;
        Insert: TaskRecord;
        Update: Partial<TaskRecord>;
      };
      userCourseRecords: {
        Row: UserCourseRecord;
        Insert: Omit<UserCourseRecord, "lastUpdated"> & {
          lastUpdated?: string;
        };
        Update: Partial<Omit<UserCourseRecord, "userID">>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_current_or_next_class: {
        Args: GetCurrentOrNextClassParams;
        Returns: CurrentOrNextClass | null;
      };
      get_today_schedule: {
        Args: GetTodayScheduleParams;
        Returns: TodayScheduleItem[];
      };
      get_upcoming_classes: {
        Args: GetUpcomingClassesParams;
        Returns: UpcomingClass[];
      };
      get_user_past_classes: {
        Args: GetUserPastClassesParams;
        Returns: PastClass[];
      };
      get_user_course_attendance_summary: {
        Args: GetUserCourseAttendanceSummaryParams;
        Returns: CourseAttendanceSummary[];
      };
    };
  };
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if user is a student
 */
export function isStudent(user: AppUser | FirebaseUserDocument): boolean {
  return user.userRole === "student";
}

/**
 * Type guard to check if user is faculty
 */
export function isFaculty(user: AppUser | FirebaseUserDocument): boolean {
  return user.userRole === "faculty";
}

/**
 * Type guard to check if user is admin
 */
export function isAdmin(user: AppUser | FirebaseUserDocument): boolean {
  return user.userRole === "admin";
}

/**
 * Type guard to check if class is cancelled
 */
export function isCancelled(classItem: TimetableRecord): boolean {
  return classItem.classStatus?.status === "cancelled";
}

/**
 * Type guard to check if course is lab
 */
export function isLabCourse(
  course: CourseRecord | FirebaseCourseEnrollment,
): boolean {
  return course.courseType?.isLab === true;
}

/**
 * Type guard to check if course is elective
 */
export function isElectiveCourse(course: CourseRecord): boolean {
  return course.isElective === true;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default attendance goal percentage
 */
export const DEFAULT_ATTENDANCE_GOAL = 80.0;

/**
 * Filter period options
 */
export const FILTER_PERIODS: FilterPeriod[] = ["7d", "14d", "30d", "all"];

/**
 * User roles
 */
export const USER_ROLES = {
  STUDENT: "student",
  FACULTY: "faculty",
  ADMIN: "admin",
} as const;

/**
 * Challenge types
 */
export const CHALLENGE_TYPES = {
  WEEKLY: "weekly",
  MONTHLY: "monthly",
  SEASONAL: "seasonal",
  SPECIAL: "special",
} as const;

/**
 * Course types
 */
export const COURSE_TYPES = {
  CORE: "core",
  ELECTIVE: "elective",
  AUDIT: "audit",
} as const;

/**
 * Class status values
 */
export const CLASS_STATUSES = {
  SCHEDULED: "scheduled",
  ONGOING: "ongoing",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  RESCHEDULED: "rescheduled",
} as const;

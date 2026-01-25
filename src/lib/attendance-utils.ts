// Attendance Status Types and Calculations

export type AttendanceStatusLevel = "safe" | "warning" | "critical";

export interface AttendanceStatus {
  level: AttendanceStatusLevel;
  label: string;
  color: {
    bg: string;
    text: string;
    border: string;
    dot: string;
  };
}

export interface SubjectStats {
  courseCode: string;
  courseName: string;
  totalClasses: number;
  attendedClasses: number;
  percentage: number;
  status: AttendanceStatus;
  safeCutsLeft: number;
  credits: number;
  isLab: boolean;
}

// ============================================================================
// Status Configuration
// ============================================================================

const STATUS_CONFIG: Record<AttendanceStatusLevel, AttendanceStatus> = {
  safe: {
    level: "safe",
    label: "Safe",
    color: {
      bg: "bg-green-100",
      text: "text-green-800",
      border: "border-green-500",
      dot: "bg-green-500",
    },
  },
  warning: {
    level: "warning",
    label: "Condonation Zone",
    color: {
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      border: "border-yellow-500",
      dot: "bg-yellow-500",
    },
  },
  critical: {
    level: "critical",
    label: "Critical",
    color: {
      bg: "bg-red-100",
      text: "text-red-800",
      border: "border-red-500",
      dot: "bg-red-500",
    },
  },
};

// ============================================================================
// Core Calculations
// ============================================================================

/**
 * Calculate attendance status based on percentage thresholds:
 * - Green (Safe): >80%
 * - Yellow (Warning/Condonation Zone): 65-80%
 * - Red (Critical): <65%
 */
export function calculateStatus(
  totalClasses: number,
  attendedClasses: number,
): AttendanceStatus {
  if (totalClasses === 0) {
    return STATUS_CONFIG.safe; // No classes yet = safe
  }

  const percentage = (attendedClasses / totalClasses) * 100;

  if (percentage > 80) {
    return STATUS_CONFIG.safe;
  } else if (percentage >= 65) {
    return STATUS_CONFIG.warning;
  } else {
    return STATUS_CONFIG.critical;
  }
}

/**
 * Calculate how many classes can be missed before dropping to the next tier.
 *
 * For safe (>80%): How many can be missed before falling to 80%
 * For warning (65-80%): How many can be missed before falling to 65%
 * For critical (<65%): 0 (already critical)
 *
 * Formula: To maintain X% with T total classes and A attended:
 * After missing M classes: A / (T + M) >= X/100
 * Solving: M <= (A - X*T/100) / (X/100)
 * Simplified: M <= (100*A - X*T) / X
 */
export function calculateSafeCutsLeft(
  totalClasses: number,
  attendedClasses: number,
): number {
  if (totalClasses === 0) return 0;

  const percentage = (attendedClasses / totalClasses) * 100;

  let targetPercentage: number;

  if (percentage > 80) {
    targetPercentage = 80; // Stay above 80%
  } else if (percentage >= 65) {
    targetPercentage = 65; // Stay above 65%
  } else {
    return 0; // Already critical, no safe cuts
  }

  // Calculate: How many future classes can be missed while maintaining target?
  // (attended) / (total + missable) >= target/100
  // attended >= (total + missable) * target/100
  // attended * 100 >= total * target + missable * target
  // missable <= (attended * 100 - total * target) / target

  const missable = Math.floor(
    (attendedClasses * 100 - totalClasses * targetPercentage) /
      targetPercentage,
  );

  return Math.max(0, missable);
}

/**
 * Calculate full subject statistics
 */
export function calculateSubjectStats(
  courseCode: string,
  courseName: string,
  totalClasses: number,
  attendedClasses: number,
  credits: number = 3,
  isLab: boolean = false,
): SubjectStats {
  const percentage =
    totalClasses > 0 ? (attendedClasses / totalClasses) * 100 : 100;

  return {
    courseCode,
    courseName,
    totalClasses,
    attendedClasses,
    percentage,
    status: calculateStatus(totalClasses, attendedClasses),
    safeCutsLeft: calculateSafeCutsLeft(totalClasses, attendedClasses),
    credits,
    isLab,
  };
}

import "server-only";
import { AttendanceStat } from "@/types/dashboard";

/**
 * User Data Mapper
 *
 * Handles the translation between Firestore document formats and TypeScript interfaces.
 * Firestore Admin SDK returns NATIVE JavaScript objects (not REST format).
 *
 * This mapper ensures safe extraction of nested data.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FirestoreData = Record<string, any>;

/**
 * Maps Firestore coursesEnrolled array to AttendanceStat[]
 *
 * Firestore Admin SDK returns native objects, so we just need to safely extract values.
 * Handles both direct values and potential nested structures.
 */
export function mapCoursesEnrolled(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rawCourses: any[] | undefined,
): AttendanceStat[] {
  if (!rawCourses || !Array.isArray(rawCourses)) {
    console.log("[UserMapper] No courses to map or invalid format");
    return [];
  }

  console.log(
    `[UserMapper] Mapping ${rawCourses.length} courses`,
    JSON.stringify(rawCourses[0], null, 2),
  );

  return rawCourses.map((course) => {
    // Handle both direct properties and nested mapValue.fields (REST API format)
    const getValue = (key: string, fallback: unknown = "") => {
      // Direct property access (Admin SDK format)
      if (course[key] !== undefined) {
        return course[key];
      }
      // Nested mapValue.fields format (REST API format - shouldn't happen with Admin SDK but safety)
      if (course.mapValue?.fields?.[key]) {
        const field = course.mapValue.fields[key];
        return (
          field.stringValue ??
          field.integerValue ??
          field.booleanValue ??
          fallback
        );
      }
      return fallback;
    };

    // Extract courseType safely
    const courseType = course.courseType || course.mapValue?.fields?.courseType;
    const isLab =
      courseType?.isLab ??
      courseType?.mapValue?.fields?.isLab?.booleanValue ??
      String(getValue("courseName", "")).toLowerCase().includes("lab");

    return {
      courseID: String(getValue("courseID", "")),
      courseName: String(getValue("courseName", "")),
      attendedClasses: Number(getValue("attendedClasses", 0)),
      totalClasses: Number(getValue("totalClasses", 0)),
      percentage: calculatePercentage(
        Number(getValue("attendedClasses", 0)),
        Number(getValue("totalClasses", 0)),
      ),
      credits: Number(getValue("credits", 3)),
      isLab: Boolean(isLab),
    };
  });
}

/**
 * Calculate attendance percentage safely
 */
function calculatePercentage(attended: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((attended / total) * 100);
}

/**
 * Calculate streak metrics from Firestore streakHistory
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function calculateStreakMetrics(streakHistory: any) {
  // Extract values array from generic Firestore structure OR native array
  let days: number[] = [];

  if (Array.isArray(streakHistory)) {
    // Native array from Admin SDK
    // Ensure they are numbers
    days = streakHistory.map((v) => Number(v));
  } else {
    // REST format or other weirdness
    const values = streakHistory?.arrayValue?.values || [];
    days = values.map((v: { integerValue: string }) =>
      parseInt(v.integerValue),
    );
  }

  // Sort
  days = days.sort((a: number, b: number) => a - b);

  const uniqueDays = [...new Set(days)] as number[];

  // 1. Total Perfect Days
  const totalPerfectDays = uniqueDays.length;

  // 2. Calendar Dates
  const calendarDates = uniqueDays.map(
    (day) => new Date(day * 86400 * 1000).toISOString().split("T")[0],
  );

  // Helper to check if a day is Saturday (6) or Sunday (0)
  // detailed check: 1970-01-01 was Thursday (4).
  // (day + 4) % 7 === 6 => Saturday
  // (day + 4) % 7 === 0 => Sunday
  const isWeekend = (d: number) => {
    const weekday = (d + 4) % 7;
    return weekday === 0 || weekday === 6;
  };

  // 3. Longest Streak
  let maxStreak = 0;
  let currentStreak = 0;
  let prev = -1;

  for (let i = 0; i < uniqueDays.length; i++) {
    const day = uniqueDays[i];

    if (i === 0) {
      currentStreak = 1;
    } else {
      const diff = day - prev;

      if (diff === 1) {
        // Consecutive day
        currentStreak++;
      } else {
        // Gap detected
        // Check if the gap consists ONLY of weekends
        let gapOnlyWeekends = true;

        // Check every day between prev and day (exclusive)
        for (let gapDay = prev + 1; gapDay < day; gapDay++) {
          if (!isWeekend(gapDay)) {
            gapOnlyWeekends = false;
            break;
          }
        }

        if (gapOnlyWeekends) {
          // If the gap was just weekends, we continue the streak!
          // We don't add the weekend days to the count, we just increment for THIS day (Monday, etc.)
          currentStreak++;
        } else {
          // Gap contained a weekday -> streak broken
          maxStreak = Math.max(maxStreak, currentStreak);
          currentStreak = 1;
        }
      }
    }
    prev = day;
  }
  maxStreak = Math.max(maxStreak, currentStreak);

  return {
    totalPerfectDays,
    calendarDates,
    longestStreak: maxStreak,
  };
}

/**
 * Maps full Firestore user document to dashboard-ready format
 */
export function mapFirestoreUser(data: FirestoreData | undefined, uid: string) {
  if (!data) {
    return null;
  }

  const streakMetrics = calculateStreakMetrics(data.streakHistory);

  return {
    uid,
    name: data.display_name || data.name || data.username || "Student",
    email: data.email || null,
    username: data.username || "Student",
    display_name: data.display_name || null,
    photo_url: data.photo_url || null,
    batchID: data.batchID || data.batchId || "Unknown",
    userRole: data.userRole || "STUDENT",
    department: data.department || "General",
    semesterID: data.semesterID || null,
    stats: {
      streak: data.currentStreak || data.stats?.streak || 0,
      points: data.amplix || data.stats?.points || 0,
    },
    amplix: data.amplix || 0,
    coursesEnrolled: mapCoursesEnrolled(data.coursesEnrolled),
    settings: {
      googleCalendarSync: data.settings?.googleCalendarSync ?? false,
      darkMode: data.settings?.darkMode ?? false,
      notifications: data.settings?.notifications ?? true,
    },
    mageRank: calculateMageRank(data.amplix || data.stats?.points || 0),
    longestStreak: streakMetrics.longestStreak,
    perfectDays: streakMetrics.totalPerfectDays,
    calendarDates: streakMetrics.calendarDates,
  };
}

import { calculateMageRank } from "@/lib/gamification";

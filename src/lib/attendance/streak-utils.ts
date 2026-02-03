import { getISTParts } from "@/lib/time/ist";

export interface StreakData {
  dates: number[];
  currentStreak: number;
  longestStreak: number;
}

export interface StreakUpdateResult {
  streakHistory?: number[];
  currentStreak?: number;
  longestStreak?: number;
}

const EPOCH = new Date(Date.UTC(1970, 0, 1));
const DAY_MS = 24 * 60 * 60 * 1000;

export function dateToIntIST(date: Date) {
  const { year, month, day } = getISTParts(date);
  const istMidnightUtc = Date.UTC(year, month - 1, day);
  return Math.floor((istMidnightUtc - EPOCH.getTime()) / DAY_MS);
}

export function intToDateString(dateInt: number) {
  const date = new Date(EPOCH.getTime() + dateInt * DAY_MS);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day} IST`;
}

export function parseStreakHistory(streakHistoryData: unknown): number[] {
  if (!streakHistoryData) return [];

  let dates: number[] = [];

  if (Array.isArray(streakHistoryData)) {
    dates = streakHistoryData
      .filter((item) => item !== null && item !== undefined)
      .map((item) => {
        if (typeof item === "number") return Math.trunc(item);
        if (typeof item === "string") return Number.parseInt(item, 10);
        if (typeof item === "object" && "toString" in Object(item)) {
          return Number.parseInt(String(item), 10);
        }
        return 0;
      })
      .filter((item) => Number.isFinite(item) && item > 0);
  } else if (typeof streakHistoryData === "string") {
    dates = streakHistoryData
      .split(",")
      .map((s) => Number.parseInt(s.trim(), 10))
      .filter((val) => Number.isFinite(val) && val > 0);
  }

  dates.sort((a, b) => a - b);
  return dates;
}

export function containsDate(sortedDates: number[], targetDate: number) {
  if (sortedDates.length === 0) return false;

  let left = 0;
  let right = sortedDates.length - 1;

  while (left <= right) {
    const mid = left + ((right - left) >> 1);
    const midVal = sortedDates[mid];

    if (midVal === targetDate) return true;
    if (midVal < targetDate) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return false;
}

export function findInsertionIndex(sortedDates: number[], targetDate: number) {
  let left = 0;
  let right = sortedDates.length;

  while (left < right) {
    const mid = left + ((right - left) >> 1);
    if (sortedDates[mid] < targetDate) {
      left = mid + 1;
    } else {
      right = mid;
    }
  }

  return left;
}

export function calculateCurrentStreak(sortedDates: number[], currentDateInt: number) {
  if (sortedDates.length === 0) return 0;

  const hasToday = containsDate(sortedDates, currentDateInt);
  const hasYesterday = containsDate(sortedDates, currentDateInt - 1);

  if (!hasToday && !hasYesterday) return 0;

  let checkDate = hasToday ? currentDateInt : currentDateInt - 1;
  let streak = 0;

  while (checkDate >= 0 && containsDate(sortedDates, checkDate)) {
    streak += 1;
    checkDate -= 1;
  }

  return streak;
}

export function calculateStreakEndingAt(sortedDates: number[], endDate: number) {
  if (!containsDate(sortedDates, endDate)) return 0;

  let streak = 1;
  let checkDate = endDate - 1;

  while (checkDate >= 0 && containsDate(sortedDates, checkDate)) {
    streak += 1;
    checkDate -= 1;
  }

  return streak;
}

export function calculateLongestStreak(sortedDates: number[]) {
  if (sortedDates.length === 0) return 0;
  if (sortedDates.length === 1) return 1;

  let maxStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < sortedDates.length; i += 1) {
    if (sortedDates[i] === sortedDates[i - 1] + 1) {
      currentStreak += 1;
      if (currentStreak > maxStreak) {
        maxStreak = currentStreak;
      }
    } else {
      currentStreak = 1;
    }
  }

  return maxStreak;
}

export function computeStreakUpdatesForAddition(params: {
  streakData: StreakData;
  targetDateInt: number;
  currentDateInt: number;
}) : StreakUpdateResult {
  const { streakData, targetDateInt, currentDateInt } = params;
  const isPastDate = targetDateInt < currentDateInt;
  const isFutureDate = targetDateInt > currentDateInt;

  if (isFutureDate) {
    return {};
  }

  const dateExists = containsDate(streakData.dates, targetDateInt);

  if (dateExists) {
    if (isPastDate) {
      const historicalStreak = calculateStreakEndingAt(
        streakData.dates,
        targetDateInt,
      );
      if (historicalStreak > streakData.longestStreak) {
        return { longestStreak: historicalStreak };
      }
    }
    return {};
  }

  const updatedDates = [...streakData.dates];
  const insertIndex = findInsertionIndex(updatedDates, targetDateInt);
  updatedDates.splice(insertIndex, 0, targetDateInt);

  const newCurrentStreak = calculateCurrentStreak(
    updatedDates,
    currentDateInt,
  );
  const newLongestStreak = calculateLongestStreak(updatedDates);

  const updates: StreakUpdateResult = {
    streakHistory: updatedDates,
    currentStreak: newCurrentStreak,
  };

  if (newLongestStreak > streakData.longestStreak) {
    updates.longestStreak = newLongestStreak;
  }

  return updates;
}

export function computeStreakUpdatesForRemoval(params: {
  streakData: StreakData;
  targetDateInt: number;
  currentDateInt: number;
}) : StreakUpdateResult {
  const { streakData, targetDateInt, currentDateInt } = params;

  const dateExists = containsDate(streakData.dates, targetDateInt);
  if (!dateExists) {
    return {};
  }

  const updatedDates = streakData.dates.filter((date) => date !== targetDateInt);

  if (updatedDates.length === 0) {
    return {
      currentStreak: 0,
      streakHistory: [],
    };
  }

  const newCurrentStreak = calculateCurrentStreak(
    updatedDates,
    currentDateInt,
  );
  const newLongestStreak = calculateLongestStreak(updatedDates);

  const updates: StreakUpdateResult = {
    currentStreak: newCurrentStreak,
    streakHistory: updatedDates,
  };

  if (newLongestStreak > streakData.longestStreak) {
    updates.longestStreak = newLongestStreak;
  }

  return updates;
}

export type CacheProfileName = "balanced" | "fresh" | "relaxed";

export type CacheKey =
  | "dashboardSchedule"
  | "attendanceSummary"
  | "userCourseRecords"
  | "pastClasses"
  | "classesByDate"
  | "userCalendars"
  | "tasks"
  | "resourceCourses"
  | "driveFolder";

export type CacheConfig = {
  staleTimeMs: number;
  gcTimeMs: number;
  refetchOnWindowFocus?: boolean;
};

export type CacheOverrides = Partial<Record<CacheKey, Partial<CacheConfig>>>;

const PROFILE_DEFAULTS: Record<CacheProfileName, Record<CacheKey, CacheConfig>> =
  {
    balanced: {
      dashboardSchedule: {
        staleTimeMs: 90_000,
        gcTimeMs: 15 * 60_000,
      },
      attendanceSummary: {
        staleTimeMs: 150_000,
        gcTimeMs: 20 * 60_000,
      },
      userCourseRecords: {
        staleTimeMs: 45 * 60_000,
        gcTimeMs: 4 * 60 * 60_000,
      },
      pastClasses: {
        staleTimeMs: 180_000,
        gcTimeMs: 30 * 60_000,
      },
      classesByDate: {
        staleTimeMs: 180_000,
        gcTimeMs: 30 * 60_000,
      },
      userCalendars: {
        staleTimeMs: 30 * 60_000,
        gcTimeMs: 2 * 60 * 60_000,
      },
      tasks: {
        staleTimeMs: 5 * 60_000,
        gcTimeMs: 30 * 60_000,
      },
      resourceCourses: {
        staleTimeMs: 30 * 60_000,
        gcTimeMs: 6 * 60 * 60_000,
      },
      driveFolder: {
        staleTimeMs: 20 * 60_000,
        gcTimeMs: 2 * 60 * 60_000,
      },
    },
    fresh: {
      dashboardSchedule: {
        staleTimeMs: 25_000,
        gcTimeMs: 10 * 60_000,
      },
      attendanceSummary: {
        staleTimeMs: 60_000,
        gcTimeMs: 15 * 60_000,
      },
      userCourseRecords: {
        staleTimeMs: 15 * 60_000,
        gcTimeMs: 2 * 60 * 60_000,
      },
      pastClasses: {
        staleTimeMs: 90_000,
        gcTimeMs: 20 * 60_000,
      },
      classesByDate: {
        staleTimeMs: 90_000,
        gcTimeMs: 20 * 60_000,
      },
      userCalendars: {
        staleTimeMs: 10 * 60_000,
        gcTimeMs: 60 * 60_000,
      },
      tasks: {
        staleTimeMs: 2 * 60_000,
        gcTimeMs: 20 * 60_000,
      },
      resourceCourses: {
        staleTimeMs: 10 * 60_000,
        gcTimeMs: 2 * 60 * 60_000,
      },
      driveFolder: {
        staleTimeMs: 8 * 60_000,
        gcTimeMs: 60 * 60_000,
      },
    },
    relaxed: {
      dashboardSchedule: {
        staleTimeMs: 4 * 60_000,
        gcTimeMs: 20 * 60_000,
      },
      attendanceSummary: {
        staleTimeMs: 7 * 60_000,
        gcTimeMs: 30 * 60_000,
      },
      userCourseRecords: {
        staleTimeMs: 3 * 60 * 60_000,
        gcTimeMs: 8 * 60 * 60_000,
      },
      pastClasses: {
        staleTimeMs: 6 * 60_000,
        gcTimeMs: 45 * 60_000,
      },
      classesByDate: {
        staleTimeMs: 6 * 60_000,
        gcTimeMs: 45 * 60_000,
      },
      userCalendars: {
        staleTimeMs: 2 * 60 * 60_000,
        gcTimeMs: 6 * 60 * 60_000,
      },
      tasks: {
        staleTimeMs: 10 * 60_000,
        gcTimeMs: 60 * 60_000,
      },
      resourceCourses: {
        staleTimeMs: 2 * 60 * 60_000,
        gcTimeMs: 8 * 60 * 60_000,
      },
      driveFolder: {
        staleTimeMs: 60 * 60_000,
        gcTimeMs: 6 * 60 * 60_000,
      },
    },
  };

const CACHE_OVERRIDE_KEY = "attendrix.cacheOverrides";
const DEFAULT_PROFILE: CacheProfileName = "balanced";

function isCacheProfile(value: string | undefined): value is CacheProfileName {
  return value === "balanced" || value === "fresh" || value === "relaxed";
}

function safeParseOverrides(raw: string | null): CacheOverrides | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CacheOverrides;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

function getLocalOverrides(): CacheOverrides | null {
  if (typeof window === "undefined") return null;
  if (process.env.NODE_ENV === "production") return null;
  return safeParseOverrides(window.localStorage.getItem(CACHE_OVERRIDE_KEY));
}

export const CACHE_PROFILE: CacheProfileName = isCacheProfile(
  process.env.NEXT_PUBLIC_CACHE_PROFILE,
)
  ? process.env.NEXT_PUBLIC_CACHE_PROFILE
  : DEFAULT_PROFILE;

export function getCacheConfig(key: CacheKey): CacheConfig {
  const base = PROFILE_DEFAULTS[CACHE_PROFILE][key];
  const overrides = getLocalOverrides();
  const override = overrides?.[key];

  if (!override) return base;

  return {
    ...base,
    ...override,
  };
}

export function getCacheOverridesKey() {
  return CACHE_OVERRIDE_KEY;
}

export function getCacheProfileDefaults() {
  return PROFILE_DEFAULTS[CACHE_PROFILE];
}

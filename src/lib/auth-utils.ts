import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

type OnboardingCacheEntry = {
  value: boolean;
  checkedAt: number;
};

const ONBOARDING_CACHE_TTL_MS = 30 * 1000;
const onboardingCache = new Map<string, OnboardingCacheEntry>();

function isValidCourseEnrollment(entry: unknown): boolean {
  if (!entry || typeof entry !== "object") return false;
  const course = entry as Record<string, unknown>;
  const courseID = course.courseID;
  const courseType = course.courseType;

  if (typeof courseID !== "string" || courseID.trim().length === 0) {
    return false;
  }

  if (!courseType || typeof courseType !== "object") {
    return false;
  }

  const courseTypeValue = (courseType as Record<string, unknown>).courseType;
  return typeof courseTypeValue === "string" && courseTypeValue.length > 0;
}

/**
 * Verifies if the user has completed onboarding.
 * Checks if the 'coursesEnrolled' field exists and is non-empty in the user's Firestore document.
 * @param uid The user's Firebase UID
 * @returns true if onboarded, false otherwise
 */
export async function checkOnboardingStatus(
  uid: string,
  options: { bypassCache?: boolean } = {},
): Promise<boolean> {
  try {
    const cached = onboardingCache.get(uid);
    const now = Date.now();

    if (!options.bypassCache && cached && now - cached.checkedAt < ONBOARDING_CACHE_TTL_MS) {
      return cached.value;
    }

    const userDocRef = doc(db, "users", uid);
    const userSnap = await getDoc(userDocRef);

    if (!userSnap.exists()) {
      onboardingCache.set(uid, { value: false, checkedAt: now });
      return false;
    }

    const userData = userSnap.data();
    const courses = Array.isArray(userData?.coursesEnrolled)
      ? userData?.coursesEnrolled
      : [];

    const isValid =
      courses.length > 0 && courses.every((course) => isValidCourseEnrollment(course));

    onboardingCache.set(uid, { value: isValid, checkedAt: now });
    return isValid;
  } catch (error) {
    console.error("Error checking onboarding status:", error);
    onboardingCache.set(uid, { value: false, checkedAt: Date.now() });
    return false;
  }
}

export function setOnboardingCache(uid: string, value: boolean) {
  onboardingCache.set(uid, { value, checkedAt: Date.now() });
}

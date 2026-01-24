import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

/**
 * Verifies if the user has completed onboarding.
 * Checks if the 'coursesEnrolled' field exists and is non-empty in the user's Firestore document.
 * @param uid The user's Firebase UID
 * @returns true if onboarded, false otherwise
 */
export async function checkOnboardingStatus(uid: string): Promise<boolean> {
  try {
    const userDocRef = doc(db, "users", uid);
    const userSnap = await getDoc(userDocRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      // Check if coursesEnrolled is valid and has items
      if (
        Array.isArray(userData?.coursesEnrolled) &&
        userData.coursesEnrolled.length > 0
      ) {
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error("Error checking onboarding status:", error);
    // On error, default to false (safe fail) or handle specifically
    return false;
  }
}

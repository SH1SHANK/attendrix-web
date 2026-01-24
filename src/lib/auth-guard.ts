import { auth } from "firebase-admin";
import { firestore } from "./firebase-admin"; // Ensure admin is init

/**
 * Verifies the Firebase ID Token.
 * @param token The raw ID token string sent from the client.
 * @returns The decoded token object if valid, throws error if invalid.
 */
export async function verifySession(token: string | undefined | null) {
  if (!token) {
    throw new Error("Unauthorized: No token provided");
  }

  try {
    const decodedToken = await auth().verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error("Token verification failed:", error);
    throw new Error("Unauthorized: Invalid session");
  }
}

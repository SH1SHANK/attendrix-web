import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Helper to strip accidental shell artifacts (like '-n ' or trailing newlines)
const sanitize = (val: string | undefined): string | undefined => {
  if (!val) return val;
  // Handle accidental 'echo -n' prefix or trailing newlines/quotes
  return val
    .replace(/^-n\s+/, "")
    .trim()
    .replace(/^"(.*)"$/, "$1");
};

const firebaseConfig = {
  apiKey: sanitize(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
  authDomain: sanitize(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
  projectId: sanitize(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: sanitize(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: sanitize(
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  ),
  appId: sanitize(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
};

// Initialize Firebase (Singleton pattern)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Log warning if config is missing in dev
if (
  process.env.NODE_ENV === "development" &&
  !process.env.NEXT_PUBLIC_FIREBASE_API_KEY
) {
  console.warn("Firebase Config is missing! Check .env.local", firebaseConfig);
}

export { app, auth, db, googleProvider };

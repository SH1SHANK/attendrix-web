"use server";

import { cookies } from "next/headers";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { verifySession } from "@/lib/auth-guard";
import { SESSION_COOKIE_NAME } from "@/lib/auth-config";
import {
  getUsernameError,
  isReservedUsername,
  isUsernameValid,
  normalizeUsername,
  normalizeUsernameLower,
} from "@/lib/onboarding/username";

/**
 * Checks if a username is available in the 'users' collection.
 * Returns true if available (not taken), false otherwise.
 */
export async function checkUsernameAvailability(
  username: string,
): Promise<boolean> {
  const normalized = normalizeUsername(username);
  const normalizedLower = normalizeUsernameLower(username);

  if (!isUsernameValid(normalized) || isReservedUsername(normalized)) {
    return false;
  }

  try {
    let currentUid: string | null = null;
    try {
      const cookieStore = await cookies();
      const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
      if (sessionCookie) {
        const decoded = await verifySession(sessionCookie);
        currentUid = decoded.uid;
      }
    } catch {
      currentUid = null;
    }

    const db = getAdminFirestore();
    const [usernameDoc, lowerSnap, exactSnap] = await Promise.all([
      db.collection("usernames").doc(normalizedLower).get(),
      db
        .collection("users")
        .where("username_lower", "==", normalizedLower)
        .limit(1)
        .get(),
      db.collection("users").where("username", "==", normalized).limit(1).get(),
    ]);

    // Check usernames collection
    if (usernameDoc.exists) {
      const existingUid = usernameDoc.data()?.uid;
      if (!currentUid || existingUid !== currentUid) return false;
    }

    // Check users collection - exclude current user
    const lowerMatch = lowerSnap.docs.find((doc) => doc.id !== currentUid);
    const exactMatch = exactSnap.docs.find((doc) => doc.id !== currentUid);

    return !lowerMatch && !exactMatch;
  } catch (error) {
    console.error("Error checking username:", error);
    // Fail closed (assume taken or error) to be safe
    return false;
  }
}

export async function setUsername(username: string) {
  const normalized = normalizeUsername(username);
  const normalizedLower = normalizeUsernameLower(username);
  const error = getUsernameError(normalized);

  if (error) {
    return { success: false, message: error } as const;
  }

  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const decodedToken = await verifySession(sessionCookie);
    const uid = decodedToken.uid;

    const db = getAdminFirestore();
    const userRef = db.collection("users").doc(uid);
    const usernameRef = db.collection("usernames").doc(normalizedLower);

    await db.runTransaction(async (transaction) => {
      const usernameSnap = await transaction.get(usernameRef);
      if (usernameSnap.exists) {
        const existingUid = usernameSnap.data()?.uid;
        if (existingUid && existingUid !== uid) {
          throw new Error("Username is already taken");
        }
      }

      transaction.set(
        usernameRef,
        {
          uid,
          username: normalized,
          createdAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      transaction.set(
        userRef,
        {
          username: normalized,
          username_lower: normalizedLower,
        },
        { merge: true },
      );
    });

    return { success: true } as const;
  } catch (err) {
    console.error("Error setting username:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to save username",
    } as const;
  }
}

/**
 * Generates a random username using Gen Z slang and logic.
 */
export async function generateRandomUsername() {
  const adjectives = [
    "vibing",
    "chaotic",
    "noob",
    "lazy",
    "based",
    "wired",
    "fomo",
    "drippy",
    "salty",
    "caffeinated",
    "lofi",
    "spooky",
    "hyper",
    "edgy",
    "yeeted",
    "offline",
    "skippy",
    "woke",
    "ghosted",
    "slay",
    "sussy",
    "lost",
    "sleepdeprived",
    "procrastinating",
    "mid",
    "cancelled",
    "lit",
    "mood",
    "quirky",
    "wild",
    "unstoppable",
    "chill",
    "freaky",
    "emo",
    "vibing",
    "shook",
    "grunge",
    "unstoppable",
    "clout",
    "majestic",
    "underrated",
    "wavy",
  ];

  const nouns = [
    "rizzler",
    "goblin",
    "taco",
    "zombie",
    "dude",
    "slacker",
    "nugget",
    "meme",
    "vortex",
    "chad",
    "boba",
    "waffle",
    "lecture",
    "wifi",
    "toaster",
    "senpai",
    "energy",
    "groupchat",
    "hoodie",
    "playlist",
    "notes",
    "vibe",
    "airdrop",
    "assignment",
    "beanbag",
    "timetable",
    "gizmo",
    "shadow",
    "wizard",
    "snitch",
    "dobby",
    "slytherin",
    "granger",
    "potterhead",
    "hermione",
    "hufflepuff",
    "ravenclaw",
    "marauder",
    "wand",
    "grimm",
    "stranger",
    "hopper",
    "demogorgon",
    "eleven",
    "lucas",
    "will",
    "nancy",
    "steve",
    "enola",
    "wednesday",
    "addams",
    "chucky",
    "freddy",
    "slasher",
    "voldemort",
    "lucifer",
    "spike",
    "hopper",
    "demogorgon",
    "starfire",
    "rick",
    "morty",
    "katniss",
    "mockingjay",
    "dumbledore",
    "mystic",
    "hawkins",
    "upside-down",
    "sherlock",
    "matrix",
    "avatar",
    "gollum",
    "ringbearer",
    "hobbit",
    "frodo",
    "naruto",
    "kage",
    "sasuke",
    "uchiha",
    "bender",
  ];

  for (let attempt = 0; attempt < 10; attempt++) {
    // Porting logic: now = DateTime.now().millisecondsSinceEpoch + attempt
    const now = Date.now() + attempt;

    // adjective = adjectives[now % adjectives.length]
    const adjective = adjectives[now % adjectives.length];

    // noun = nouns[(now ~/ 1000) % nouns.length] -> Use Math.floor for integer division
    const noun = nouns[Math.floor(now / 1000) % nouns.length];

    // number = now % 1000
    const number = now % 1000;

    const candidate = `${adjective}${noun}${number}`;

    // Check availability
    const available = await checkUsernameAvailability(candidate);
    if (available) {
      return candidate;
    }
  }

  // Fallback if all candidates exist
  const fallback = `user${Date.now() % 10000}`;
  return fallback;
}

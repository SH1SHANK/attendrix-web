"use server";

import { getAdminFirestore } from "@/lib/firebase-admin";

/**
 * Checks if a username is available in the 'users' collection.
 * Returns true if available (not taken), false otherwise.
 */
export async function checkUsernameAvailability(
  username: string,
): Promise<boolean> {
  // Simple regex validation (alphanumeric, underscores, 3-20 chars)
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  if (!usernameRegex.test(username)) {
    return false;
  }

  try {
    const db = getAdminFirestore();
    const snapshot = await db
      .collection("users")
      .where("username", "==", username)
      .limit(1)
      .get();

    return snapshot.empty;
  } catch (error) {
    console.error("Error checking username:", error);
    // Fail closed (assume taken or error) to be safe
    return false;
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

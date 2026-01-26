/**
 * Gamification Levels Configuration
 * Shared between server and client to ensure consistent progress tracking.
 */
export const MAGE_LEVELS = [
  { level: 1, title: "Novice Mage", min: 0, stars: 1 },
  { level: 2, title: "Apprentice Mage", min: 201, stars: 1 },
  { level: 3, title: "One-Star Mage", min: 501, stars: 1 },
  { level: 4, title: "Two-Star Mage", min: 1001, stars: 2 },
  { level: 5, title: "Three-Star Mage", min: 2001, stars: 3 },
  { level: 6, title: "Four-Star Mage", min: 3501, stars: 4 },
  { level: 7, title: "Five-Star Mage", min: 5501, stars: 5 },
  { level: 8, title: "Arcane Mage", min: 8001, stars: 6 },
  { level: 9, title: "Lunar Mage", min: 10001, stars: 7 },
  { level: 10, title: "Solar Mage", min: 13001, stars: 8 },
  { level: 11, title: "Starborn Mage", min: 16001, stars: 9 },
  { level: 12, title: "Master Mage", min: 20001, stars: 10 },
];

/**
 * Calculates the user's current rank, stars, and XP progress based on total XP.
 */
export function calculateMageRank(xp: number) {
  // Find current level (iterate in reverse to find highest matching threshold)
  const current =
    MAGE_LEVELS.slice()
      .reverse()
      .find((l) => xp >= l.min) ?? MAGE_LEVELS[0]!;

  // Find next level
  const currentIndex = MAGE_LEVELS.indexOf(current);
  const nextLevel = MAGE_LEVELS[currentIndex + 1];

  // For max level, we can just set a high arbitrary number or handle uniquely
  const xpRequired = nextLevel ? nextLevel.min : 999999;

  return {
    level: current.level,
    title: current.title,
    stars: current.stars,
    xpCurrent: xp,
    xpRequired: xpRequired,
  };
}

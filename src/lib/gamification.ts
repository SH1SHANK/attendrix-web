// Amplix Gamification System

export interface RankTier {
  level: number;
  title: string;
  minXP: number;
  maxXP: number | null; // null for infinite (Master Mage)
  description: string;
}

export const RANK_TIERS: RankTier[] = [
  {
    level: 1,
    title: "Novice Mage",
    minXP: 0,
    maxXP: 200,
    description: "Just starting your journey",
  },
  {
    level: 2,
    title: "Apprentice Mage",
    minXP: 201,
    maxXP: 500,
    description: "Learning the basics",
  },
  {
    level: 3,
    title: "One-Star Mage",
    minXP: 501,
    maxXP: 1000,
    description: "First spark of skill",
  },
  {
    level: 4,
    title: "Two-Star Mage",
    minXP: 1001,
    maxXP: 2000,
    description: "Growing powers",
  },
  {
    level: 5,
    title: "Three-Star Mage",
    minXP: 2001,
    maxXP: 3500,
    description: "Building consistency",
  },
  {
    level: 6,
    title: "Four-Star Mage",
    minXP: 3501,
    maxXP: 5500,
    description: "Skilled caster",
  },
  {
    level: 7,
    title: "Five-Star Mage",
    minXP: 5501,
    maxXP: 8000,
    description: "Rising reputation",
  },
  {
    level: 8,
    title: "Arcane Mage",
    minXP: 8001,
    maxXP: 10000,
    description: "Unleashing real magic",
  },
  {
    level: 9,
    title: "Lunar Mage",
    minXP: 10001,
    maxXP: 13000,
    description: "Balanced, disciplined",
  },
  {
    level: 10,
    title: "Solar Mage",
    minXP: 13001,
    maxXP: 16000,
    description: "Bright, inspiring",
  },
  {
    level: 11,
    title: "Starborn Mage",
    minXP: 16001,
    maxXP: 20000,
    description: "Mystic, radiant presence",
  },
  {
    level: 12,
    title: "Master Mage",
    minXP: 20001,
    maxXP: null,
    description: "Supreme attendance legend",
  },
];

export function getRankFromXP(xp: number): {
  current: RankTier;
  next: RankTier | null;
} {
  // Find the highest tier where xp >= minXP
  // Since tiers are ordered, we can find the last one that fits
  let currentTier = RANK_TIERS[0];

  for (const tier of RANK_TIERS) {
    if (xp >= tier.minXP) {
      currentTier = tier;
    } else {
      break;
    }
  }

  const nextTier =
    RANK_TIERS.find((t) => t.level === currentTier.level + 1) || null;

  return { current: currentTier, next: nextTier };
}

export function getStars(level: number): number {
  // Map level to visual stars if needed (legacy visual aid)
  // 1-2: 0 stars
  // 3: 1 star
  // 4: 2 stars
  // 5: 3 stars? No, names imply:
  // One-Star (L3) -> 1
  // Two-Star (L4) -> 2
  // Three-Star (L5) -> 3
  // Four-Star (L6) -> 4
  // Five-Star (L7) -> 5

  if (level === 3) return 1;
  if (level === 4) return 2;
  if (level === 5) return 3;
  if (level === 6) return 4;
  if (level >= 7) return 5;
  return 0;
}

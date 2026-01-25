import React from "react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/Progress";
import { calculateMageRank } from "@/lib/user-mapper";
import { Sparkles, Trophy } from "lucide-react";

interface LevelProgressProps {
  currentAmplix: number;
}

export function LevelProgress({ currentAmplix }: LevelProgressProps) {
  const { level, title, xpCurrent, xpRequired, stars } =
    calculateMageRank(currentAmplix);

  // Calculate percentage to next level
  // Note: calculateMageRank returns xpCurrent as total XP.
  // We need to know the XP range for current level to show meaningful progress bar within the level?
  // Or just show total XP? Usually games show progress TO next level.
  // user-mapper doesn't export the LEVELS array, so we might not know the START of the current level.
  // However, looking at calculator:
  // Novice Mage (L1): 0 - 200.
  // Apprentice (L2): 201.
  // If I have 100 XP. I am level 1.
  // Progress should be 100 / 200 * 100 = 50%.

  // If I am level 2 (201 XP). Next level is 501.
  // Range is 501 - 201 = 300.
  // My progress into this level is 201 - 201 = 0.
  // So progress bar 0%.

  // To do this accurately, I need the LEVELS array or previous level cap.
  // I will just approximate or modifying user-mapper to return previous level cap?
  // Or I can copy the levels array here. It's safe to duplicate for UI or move to shared constant.
  // Let's copy strictly for now to avoid breaking mapper.

  const levels = [
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

  const currentLevelObj = levels.find((l) => l.level === level) || levels[0];
  const nextLevelIndex = levels.indexOf(currentLevelObj) + 1;
  const nextLevelObj = levels[nextLevelIndex];

  const levelMin = currentLevelObj.min;
  const levelMax = nextLevelObj ? nextLevelObj.min : levelMin + 5000; // Cap for max level

  const xpIntoLevel = Math.max(0, currentAmplix - levelMin);
  const xpNeededForNext = levelMax - levelMin;

  const progressPercent = Math.min(
    100,
    Math.round((xpIntoLevel / xpNeededForNext) * 100),
  );

  return (
    <div className="w-full bg-white rounded-xl border-2 border-neutral-900 shadow-[4px_4px_0px_0px_#171717] p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-orange-100 border-2 border-orange-200">
            <Trophy size={20} className="text-orange-600" />
          </div>
          <div>
            <h3 className="font-bold text-lg leading-tight text-neutral-900">
              {title}
            </h3>
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Level {level}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-neutral-100 px-2 py-1 rounded-md border border-neutral-200">
          <Sparkles size={12} className="text-yellow-600 fill-yellow-600" />
          <span className="text-xs font-bold text-neutral-700">
            {currentAmplix} XP
          </span>
        </div>
      </div>

      {/* Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs font-bold text-neutral-500">
          <span>{levelMin} XP</span>
          <span>{levelMax} XP</span>
        </div>
        <Progress
          value={progressPercent}
          className="h-4 border-2 border-neutral-900 bg-neutral-100"
        />
      </div>

      <div className="text-center text-xs font-medium text-neutral-400">
        {nextLevelObj ? (
          <span>{xpNeededForNext - xpIntoLevel} XP to next rank</span>
        ) : (
          <span>Max Level Reached!</span>
        )}
      </div>
    </div>
  );
}

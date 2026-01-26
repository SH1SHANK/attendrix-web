import React from "react";

import { Progress } from "@/components/ui/Progress";
import { calculateMageRank, MAGE_LEVELS } from "@/lib/gamification";
import { Sparkles, Trophy } from "lucide-react";

interface LevelProgressProps {
  currentAmplix: number;
}

export function LevelProgress({ currentAmplix }: LevelProgressProps) {
  const { level, title } = calculateMageRank(currentAmplix);

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

  const levels = MAGE_LEVELS;

  const currentLevelObj = levels.find((l) => l.level === level) ?? levels[0]!;
  const nextLevelIndex = levels.indexOf(currentLevelObj) + 1;
  const nextLevelObj = levels[nextLevelIndex] as
    | (typeof MAGE_LEVELS)[0]
    | undefined;

  const levelMin = currentLevelObj.min;
  const levelMax = nextLevelObj ? nextLevelObj.min : levelMin + 5000; // Cap for max level

  const xpIntoLevel = Math.max(0, currentAmplix - levelMin);
  const xpNeededForNext = levelMax - levelMin;

  const progressPercent = Math.min(
    100,
    Math.round((xpIntoLevel / xpNeededForNext) * 100),
  );

  return (
    <div className="w-full bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000] p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 flex items-center justify-center bg-orange-200 border-2 border-black shadow-[4px_4px_0px_0px_#000]">
            <Trophy size={24} className="text-black" />
          </div>
          <div>
            <h3 className="font-black text-2xl leading-tight text-black uppercase tracking-tight">
              {title}
            </h3>
            <p className="text-sm font-bold text-neutral-600 uppercase tracking-widest border-b-2 border-black inline-block">
              Level {level}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-yellow-300 px-3 py-1 border-2 border-black shadow-[4px_4px_0px_0px_#000]">
          <Sparkles size={16} className="text-black fill-white" />
          <span className="text-sm font-black text-black mono">
            {currentAmplix} XP
          </span>
        </div>
      </div>

      {/* Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-bold font-mono text-neutral-500">
          <span>{levelMin} XP</span>
          <span>{levelMax} XP</span>
        </div>
        <Progress
          value={progressPercent}
          className="h-8 border-4 border-black bg-white rounded-none shadow-[2px_2px_0px_0px_#000]"
          indicatorClassName="bg-orange-500 bg-[linear-gradient(45deg,transparent_25%,rgba(0,0,0,0.2)_25%,rgba(0,0,0,0.2)_50%,transparent_50%,transparent_75%,rgba(0,0,0,0.2)_75%,rgba(0,0,0,0.2))] bg-[length:20px_20px] border-r-4 border-black"
        />
      </div>

      <div className="text-right text-xs font-bold font-mono text-neutral-600">
        {nextLevelObj ? (
          <span>{xpNeededForNext - xpIntoLevel} XP TO NEXT RANK!</span>
        ) : (
          <span>MAX LEVEL REACHED!</span>
        )}
      </div>
    </div>
  );
}

"use client";

import { useChallenges } from "@/hooks/queries/useChallenges";
import { useProfile } from "@/hooks/queries/useProfile";
import { ChallengeCard } from "@/components/gamification/ChallengeCard";
import { LevelProgress } from "@/components/gamification/LevelProgress";
import { Loader2, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { useMemo } from "react";

export default function ChallengesPage() {
  const { data: challenges, isLoading: isChallengesLoading } = useChallenges();
  const { profile, loading: isProfileLoading } = useProfile();

  const isLoading = isChallengesLoading || isProfileLoading;

  const weeklyChallenges = useMemo(
    () => challenges?.filter((c) => c.challengeType === "weekly") || [],
    [challenges],
  );

  const monthlyChallenges = useMemo(
    () => challenges?.filter((c) => c.challengeType === "monthly") || [],
    [challenges],
  );

  const semesterChallenges = useMemo(
    () => challenges?.filter((c) => c.challengeType === "semester") || [],
    [challenges],
  );

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8">
        <Loader2 className="animate-spin text-neutral-400" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-400 border-2 border-neutral-900 shadow-[4px_4px_0px_0px_#171717]">
              <Trophy className="text-neutral-900 fill-white" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-neutral-900 tracking-tight">
                CHALLENGES
              </h1>
              <p className="text-sm font-medium text-neutral-500">
                Complete quests to earn Amplix & rank up!
              </p>
            </div>
          </div>
        </div>

        {/* Level Progress */}
        <LevelProgress currentAmplix={profile?.mageRank.xpCurrent || 0} />
      </div>

      {/* Weekly Challenges */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200">
            WEEKLY RESET
          </Badge>
          <div className="h-px flex-1 bg-neutral-200" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {weeklyChallenges.map((challenge) => (
            <ChallengeCard key={challenge.challengeID} challenge={challenge} />
          ))}
          {weeklyChallenges.length === 0 && (
            <p className="text-sm text-neutral-400 italic">
              No weekly challenges active.
            </p>
          )}
        </div>
      </section>

      {/* Monthly Challenges */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200">
            MONTHLY GRIND
          </Badge>
          <div className="h-px flex-1 bg-neutral-200" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {monthlyChallenges.map((challenge) => (
            <ChallengeCard key={challenge.challengeID} challenge={challenge} />
          ))}
          {monthlyChallenges.length === 0 && (
            <p className="text-sm text-neutral-400 italic">
              No monthly challenges active.
            </p>
          )}
        </div>
      </section>

      {/* Semester Challenges (if any) */}
      {semesterChallenges.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200">
              SEMESTER GOALS
            </Badge>
            <div className="h-px flex-1 bg-neutral-200" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {semesterChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.challengeID}
                challenge={challenge}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

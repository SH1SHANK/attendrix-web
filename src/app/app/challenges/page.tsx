"use client";

import { useChallenges } from "@/hooks/queries/useChallenges";
import { useProfile } from "@/hooks/queries/useProfile";
import { ChallengeCard } from "@/components/gamification/ChallengeCard";
import { LevelProgress } from "@/components/gamification/LevelProgress";
import { Loader2, Calendar, Target } from "lucide-react";
import { useMemo } from "react";
import { Carousel } from "@/components/ui/Carousel";
import { UserChallenge } from "@/types/challenges";
import Image from "next/image";

export default function ChallengesPage() {
  const { data: challenges, isLoading: isChallengesLoading } = useChallenges();
  const { profile, loading: isProfileLoading } = useProfile();

  const isLoading = isChallengesLoading || isProfileLoading;

  // Sorting Logic: Claimable -> In Progress -> Completed/Claimed
  const sortChallenges = (list: UserChallenge[]) => {
    return [...list].sort((a, b) => {
      const aCanClaim = a.isCompleted && !a.isClaimed;
      const bCanClaim = b.isCompleted && !b.isClaimed;

      if (aCanClaim && !bCanClaim) return -1;
      if (!aCanClaim && bCanClaim) return 1;

      const aActive = !a.isCompleted && !a.isClaimed;
      const bActive = !b.isCompleted && !b.isClaimed;

      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;

      return 0;
    });
  };

  const weeklyChallenges = useMemo(
    () =>
      sortChallenges(
        challenges?.filter((c) => c.challengeType === "weekly") || [],
      ),
    [challenges],
  );

  const monthlyChallenges = useMemo(
    () =>
      sortChallenges(
        challenges?.filter((c) => c.challengeType === "monthly") || [],
      ),
    [challenges],
  );

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-neutral-50">
        <Loader2 className="animate-spin text-black" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(#000_1px,transparent_1px)] bg-size-[20px_20px] p-6 md:p-12 space-y-12 pb-32">
      {/* HERO SECTION */}
      <section className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-4 w-4 bg-black" />
          <h1 className="text-4xl md:text-6xl font-black text-black tracking-tighter uppercase">
            Player Dashboard
          </h1>
        </div>

        <div className="grid md:grid-cols-[300px_1fr] gap-8 items-start">
          {/* AVATAR / PROFILE CARD */}
          <div className="bg-purple-600 border-4 border-black shadow-[8px_8px_0px_0px_#000] p-6 flex flex-col items-center justify-center gap-4 text-center h-full min-h-[250px] relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-10 mix-blend-overlay"></div>
            <div className="relative z-10 h-24 w-24 rounded-none border-4 border-black bg-white shadow-[4px_4px_0px_0px_#000] overflow-hidden">
              <Image
                src={`https://api.dicebear.com/7.x/notionists/svg?seed=${profile?.username || "user"}`}
                alt="Avatar"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="relative z-10">
              <h2 className="text-xl font-black text-white uppercase tracking-tight bg-black/20 px-2 py-1 inline-block">
                {profile?.display_name || profile?.name || "Attendrix User"}
              </h2>
              <p className="text-white/80 font-mono text-sm mt-1">
                {profile?.email}
              </p>
            </div>
          </div>

          {/* LEVEL PROGRESS */}
          <LevelProgress currentAmplix={profile?.mageRank.xpCurrent || 0} />
        </div>
      </section>

      {/* WEEKLY CHALLENGES (CAROUSEL) */}
      <section className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-3 border-b-4 border-black pb-2 w-fit pr-12">
          <Calendar className="h-8 w-8 text-black" />
          <h2 className="text-3xl font-black text-black uppercase tracking-tight">
            Weekly Drops
          </h2>
        </div>

        {weeklyChallenges.length > 0 ? (
          <Carousel
            opts={{
              align: "start",
              loop: false,
            }}
            className="w-full"
          >
            <Carousel.Content className="-ml-4 pb-4">
              {weeklyChallenges.map((challenge, index) => (
                <Carousel.Item
                  key={challenge.challengeID}
                  className="pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4"
                >
                  <div className="h-full p-1">
                    {" "}
                    {/* Padding for hover effects/shadows */}
                    <ChallengeCard challenge={challenge} index={index} />
                  </div>
                </Carousel.Item>
              ))}
            </Carousel.Content>
            <div className="flex justify-end gap-2 mt-4">
              <Carousel.Previous className="static translate-y-0 rounded-none border-2 border-black bg-white hover:bg-neutral-100 shadow-[2px_2px_0px_0px_#000]" />
              <Carousel.Next className="static translate-y-0 rounded-none border-2 border-black bg-white hover:bg-neutral-100 shadow-[2px_2px_0px_0px_#000]" />
            </div>
          </Carousel>
        ) : (
          <div className="p-8 border-2 border-dashed border-neutral-400 bg-neutral-50 text-center font-mono text-neutral-500">
            NO WEEKLY DROPS ACTIVE
          </div>
        )}
      </section>

      {/* MONTHLY CHALLENGES (MASONRY) */}
      <section className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-3 border-b-4 border-black pb-2 w-fit pr-12">
          <Target className="h-8 w-8 text-black" />
          <h2 className="text-3xl font-black text-black uppercase tracking-tight">
            Monthly Grind
          </h2>
        </div>

        {monthlyChallenges.length > 0 ? (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            {monthlyChallenges.map((challenge, index) => (
              <div key={challenge.challengeID} className="break-inside-avoid">
                <ChallengeCard challenge={challenge} index={index + 5} />
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 border-2 border-dashed border-neutral-400 bg-neutral-50 text-center font-mono text-neutral-500">
            NO MONTHLY CHALLENGES ACTIVE
          </div>
        )}
      </section>

      {/* Background decoration */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[-1] opacity-5">
        <div className="absolute top-20 left-10 w-64 h-64 border-4 border-black rounded-full mix-blend-multiply"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 border-4 border-black rotate-12 mix-blend-multiply"></div>
      </div>
    </div>
  );
}

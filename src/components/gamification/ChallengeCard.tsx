import { memo } from "react";
import { UserChallenge } from "@/types/challenges";
import { cn } from "@/lib/utils";
import { Zap, CheckCircle2, Star, Loader2, Clock, Flame } from "lucide-react";
import { Progress } from "@/components/ui/Progress";
import { Button } from "@/components/ui/Button";
import { useClaimChallenge } from "@/hooks/queries/useChallenges";
import { motion } from "framer-motion";

interface ChallengeCardProps {
  challenge: UserChallenge;
  index?: number;
}

export const ChallengeCard = memo(function ChallengeCard({
  challenge,
  index = 0,
}: ChallengeCardProps) {
  const { mutate: claim, isPending } = useClaimChallenge();

  const isCompleted = challenge.isCompleted;
  const isClaimed = challenge.isClaimed;
  const canClaim = isCompleted && !isClaimed;

  const progressPercent = Math.min(
    100,
    Math.round((challenge.progress / challenge.targetValue) * 100),
  );

  const handleClaim = async () => {
    if (canClaim && challenge.progressID) {
      // Dynamic import for heavy confetti library
      const confetti = (await import("canvas-confetti")).default;

      const duration = 2000;
      const end = Date.now() + duration;
      const colors = ["#fbbf24", "#0ea5e9", "#ef4444", "#a855f7"];

      (function frame() {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors,
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();

      claim(challenge.progressID);
    }
  };

  const getConditionIcon = () => {
    if (challenge.challengeCondition?.includes("streak"))
      return <Flame size={20} />;
    if (challenge.challengeCondition?.includes("early"))
      return <Clock size={20} />;
    return <Zap size={20} />;
  };

  // 1. CLAIMABLE STATE
  if (canClaim) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className={cn(
          "relative flex flex-col gap-4 border-4 border-black bg-yellow-400 p-6 transition-all",
          "shadow-[8px_8px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[6px_6px_0px_0px_#000]",
        )}
      >
        <div className="absolute -right-3 -top-3 rotate-12 bg-purple-600 px-3 py-1 font-mono text-sm font-bold text-white border-2 border-black shadow-[4px_4px_0px_0px_#000]">
          CLAIM NOW!
        </div>

        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-black text-xl text-black uppercase tracking-tight line-clamp-1">
              {challenge.challengeName}
            </h3>
            <p className="font-medium text-neutral-800 text-sm line-clamp-2 mt-1">
              {challenge.challengeDescription}
            </p>
          </div>
          <div className="bg-white border-2 border-black p-2 shadow-[2px_2px_0px_0px_#000]">
            <Star className="fill-yellow-400 text-black" size={24} />
          </div>
        </div>

        <div className="mt-auto">
          <div className="flex items-center gap-2 mb-3 bg-black/5 p-2 border-2 border-black/10">
            <span className="font-mono text-lg font-bold text-black">
              REWARD:
            </span>
            <span className="font-mono text-lg font-bold text-purple-700">
              +{challenge.amplixReward} XP
            </span>
          </div>

          <Button
            onClick={handleClaim}
            disabled={isPending}
            className={cn(
              "w-full h-12 border-2 border-black bg-white text-black text-lg font-black uppercase",
              "hover:bg-neutral-100 shadow-[4px_4px_0px_0px_#000]",
              "active:translate-y-[2px] active:translate-x-[2px] active:shadow-[2px_2px_0px_0px_#000]",
            )}
          >
            {isPending ? <Loader2 className="animate-spin" /> : "CLAIM REWARD"}
          </Button>
        </div>
      </motion.div>
    );
  }

  // 2. COMPLETED STATE
  if (isCompleted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 0.6, scale: 1 }}
        className="relative flex flex-col gap-3 border-2 border-neutral-400 bg-neutral-100 p-5 grayscale"
      >
        <div className="absolute right-4 top-8 rotate-[-15deg] border-4 border-neutral-500 px-2 py-1 text-2xl font-black text-neutral-500 opacity-30 select-none">
          COMPLETED
        </div>

        <div className="flex justify-between items-start">
          <h3 className="font-bold text-lg text-neutral-600 line-clamp-1">
            {challenge.challengeName}
          </h3>
          <CheckCircle2 className="text-neutral-500" size={24} />
        </div>

        <div className="mt-auto">
          <div className="w-full h-3 bg-neutral-300 border border-neutral-400">
            <div className="h-full w-full bg-neutral-500" />
          </div>
          <div className="flex justify-between text-xs font-mono text-neutral-500 mt-1">
            <span>100%</span>
            <span>+{challenge.amplixReward} XP</span>
          </div>
        </div>
      </motion.div>
    );
  }

  // 3. IN PROGRESS STATE
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        "flex flex-col justify-between gap-3 border-2 border-black bg-white p-5 transition-all",
        "shadow-[4px_4px_0px_0px_#000] hover:shadow-[6px_6px_0px_0px_#000] hover:-translate-y-0.5",
      )}
    >
      <div>
        <div className="flex justify-between items-start mb-2">
          <div className="bg-purple-100 border-2 border-black p-1.5 shadow-[2px_2px_0px_0px_#000]">
            {getConditionIcon()}
          </div>
          <span className="font-mono text-sm font-bold bg-neutral-100 border border-black px-2 py-0.5">
            {challenge.progress} / {challenge.targetValue}
          </span>
        </div>

        <h3 className="font-bold text-lg text-neutral-900 leading-tight mb-1">
          {challenge.challengeName}
        </h3>
        <p className="text-xs text-neutral-500 font-medium line-clamp-2">
          {challenge.challengeDescription}
        </p>
      </div>

      <div className="mt-2 space-y-1">
        <Progress
          value={progressPercent}
          className="h-4 border-2 border-black bg-neutral-100 rounded-none"
          indicatorClassName="bg-purple-500 bg-[linear-gradient(45deg,transparent_25%,rgba(0,0,0,0.1)_25%,rgba(0,0,0,0.1)_50%,transparent_50%,transparent_75%,rgba(0,0,0,0.1)_75%,rgba(0,0,0,0.1))] bg-[length:10px_10px]"
        />
        <div className="flex justify-end">
          <span className="font-mono text-xs font-bold text-purple-600">
            Reward: {challenge.amplixReward} XP
          </span>
        </div>
      </div>
    </motion.div>
  );
});

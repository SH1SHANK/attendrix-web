import { UserChallenge } from "@/types/challenges";
import { cn } from "@/lib/utils";
import { Zap, CheckCircle2, Star, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/Progress";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useClaimChallenge } from "@/hooks/queries/useChallenges";

interface ChallengeCardProps {
  challenge: UserChallenge;
}

export function ChallengeCard({ challenge }: ChallengeCardProps) {
  const { mutate: claim, isPending } = useClaimChallenge();

  const isCompleted = challenge.isCompleted;
  const isClaimed = challenge.isClaimed;
  const canClaim = isCompleted && !isClaimed;

  const progressPercent = Math.min(
    100,
    Math.round((challenge.progress / challenge.targetValue) * 100),
  );

  const handleClaim = () => {
    if (canClaim && challenge.progressID) {
      claim(challenge.progressID);
    }
  };

  return (
    <div
      className={cn(
        "relative flex flex-col gap-3 rounded-xl border-2 p-4 transition-all duration-300",
        isClaimed
          ? "border-green-600 bg-green-50/50 shadow-none border-dashed" // Claimed style
          : isCompleted
            ? "border-green-600 bg-green-50 shadow-[4px_4px_0px_0px_#16a34a]" // Completed but not claimed
            : "border-neutral-900 bg-white shadow-[4px_4px_0px_0px_#171717] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#171717]", // Active
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h3 className="font-bold text-lg text-neutral-900 line-clamp-1">
            {challenge.challengeName}
          </h3>
          <p className="text-xs font-medium text-neutral-500 line-clamp-2">
            {challenge.challengeDescription}
          </p>
        </div>
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2",
            isCompleted
              ? "border-green-600 bg-green-200 text-green-700"
              : "border-neutral-900 bg-yellow-400 text-neutral-900",
          )}
        >
          {isCompleted ? <CheckCircle2 size={16} /> : <Zap size={16} />}
        </div>
      </div>

      {/* Reward Badge */}
      <div className="flex items-center gap-2">
        <Badge
          variant="outline"
          className="bg-purple-100 text-purple-700 border-purple-200 flex items-center"
        >
          <Star size={12} className="mr-1 fill-purple-700" />
          {challenge.amplixReward} XP
        </Badge>

        {isClaimed && (
          <Badge className="bg-green-600 border-green-700">Claimed</Badge>
        )}
      </div>

      {/* Progress & Action */}
      <div className="space-y-2 mt-auto pt-2">
        {!isClaimed && (
          <div className="flex justify-between text-xs font-bold text-neutral-600">
            <span>Progress</span>
            <span>
              {Math.min(challenge.progress, challenge.targetValue)} /{" "}
              {challenge.targetValue}
            </span>
          </div>
        )}

        {!isClaimed && (
          <Progress
            value={progressPercent}
            className="h-3 border border-neutral-900/20"
          />
        )}

        {canClaim && (
          <Button
            onClick={handleClaim}
            disabled={isPending}
            className="w-full mt-2 border-2 border-green-800 bg-green-600 hover:bg-green-700 text-white font-bold shadow-[2px_2px_0px_0px_#14532d] active:translate-y-[2px] active:shadow-none transition-all"
          >
            {isPending ? (
              <Loader2 className="animate-spin w-4 h-4 mr-2" />
            ) : (
              "CLAIM REWARD"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { format } from "date-fns";
import { UserChallenge, ChallengeProgress } from "@/types/challenges";
import { FirestoreUser } from "@/types/dashboard";
import { toast } from "sonner";

// Helper to generate keys
const generateKeys = () => {
  const now = new Date();
  const month = format(now, "MM");
  const year = format(now, "yy");
  // Format: MMYY-W[Week]W (e.g., 0126-W04W)
  const weekNum = format(now, "w");
  const currentWeeklyKey = `${month}${year}-W${weekNum}W`;

  return { currentWeeklyKey };
};

interface EvalRpcResponse {
  points_to_deduct?: number;
}

export const useChallenges = () => {
  const { user } = useAuth();
  const supabase = createClient();

  return useQuery({
    queryKey: ["challenges", user?.uid],
    queryFn: async (): Promise<UserChallenge[]> => {
      if (!user?.uid) return [];

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) return [];

      const userData = userSnap.data() as FirestoreUser;
      const { currentWeeklyKey } = generateKeys();

      let challengesAllotted = userData.challengesAllotted || [];
      const storedKey = userData.challengeKey;

      // 1. Sync Logic (Generation)
      if (storedKey !== currentWeeklyKey) {
        console.log(
          `[Challenges] Key mismatch: ${storedKey} vs ${currentWeeklyKey}. Generating...`,
        );

        // Prepare input for Generation RPC
        // p_current_challenges expects JSON array.
        const { data: generatedData, error: genError } = await supabase.rpc(
          "generate_user_challenges_v2",
          {
            p_user_id: user.uid,
            p_current_challenges: challengesAllotted,
            p_weekly_amplix_limit: 1000, // Default limit, can be adjusted
            p_monthly_amplix_limit: 5000,
          },
        );

        if (genError) {
          console.error("[Challenges] Generation RPC failed:", genError);
          // Fallback: return existing textual challenges or empty
        } else if (generatedData?.status && generatedData?.challenges) {
          // Update Firebase
          const newChallenges = generatedData.challenges as UserChallenge[];

          await updateDoc(userRef, {
            challengesAllotted: newChallenges,
            challengeKey: currentWeeklyKey,
          });

          challengesAllotted = newChallenges;
        }
      }

      // 2. Evaluation Logic (Always)
      // Extract progressIDs and courseIDs
      const progressIds = challengesAllotted
        .map((c) => c.progressID)
        .filter(Boolean) as string[];

      const courseIds = userData.coursesEnrolled || [];
      const streak = userData.stats?.streak || 0;

      if (progressIds.length > 0) {
        const { data: evalData, error: evalError } = await supabase.rpc(
          "evaluate_user_challenges",
          {
            p_user_id: user.uid,
            p_progress_ids: progressIds,
            p_current_streak: streak,
            p_course_ids: courseIds,
          },
        );

        if (evalError) {
          console.error("[Challenges] Evaluation RPC failed:", evalError);
        } else if (evalData) {
          // RPC updates Supabase tables in background.
          // It might return info about deductions or updates.
          // If it returns details, we can merge them.
          // Assuming it returns updated status or we fetch latest status now?
          // The prompt says "This RPC updates the Supabase tables in the background and returns a summary of claimable items."
          // But to get the PRECISE progress bars, we might need to fetch from `amplixChallengeProgress` table
          // OR trust the RPC return if it returns the full objects.
          // Let's assume we need to RE-MERGE current progress from Supabase to be safe and accurate.
          // OR simpler: `evaluate` updates `amplixChallengeProgress`.
          // So we should fetch `amplixChallengeProgress` for these IDs to get the latest `progress` value.
        }

        // Handle deductions if any (prompt mentioned "return points_to_deduct")
        // We'll inspect `evalData` if needed.
        if (
          evalData &&
          typeof evalData === "object" &&
          "points_to_deduct" in evalData
        ) {
          const deduction = (evalData as EvalRpcResponse).points_to_deduct;
          if (deduction && deduction > 0) {
            await updateDoc(userRef, {
              amplix: increment(-deduction),
              "stats.points": increment(-deduction),
            });
            toast.error(`Lost ${deduction} Amplix due to removed attendance!`);
          }
        }
      }

      // 3. Fetch final latest progress to render UI accurately
      // We rely on what `generate` gave us (which contains progressIDs)
      // and query Supabase for the latest state of those progressIDs.

      const { data: progressData } = await supabase
        .from("amplixChallengeProgress")
        .select("*")
        .in("progressID", progressIds);

      const progressMap = new Map<string, ChallengeProgress>();
      progressData?.forEach((p) =>
        progressMap.set(p.progressID, p as ChallengeProgress),
      );

      // Merge back into challengesAllotted
      const merged: UserChallenge[] = challengesAllotted.map((ch) => {
        if (!ch.progressID) return ch;
        const fresh = progressMap.get(ch.progressID);
        return fresh ? { ...ch, ...fresh } : ch; // Overlay fresh progress data
      });

      return merged;
    },
    enabled: !!user?.uid,
    staleTime: 1000 * 60 * 5, // 5 mins
  });
};

export const useClaimChallenge = () => {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (progressID: string) => {
      if (!user?.uid) throw new Error("User not found");

      const { data, error } = await supabase.rpc(
        "complete_challenge_and_award",
        {
          progress_id: progressID,
        },
      );

      if (error) throw error;
      return data; // Returns amplix_reward_amount
    },
    onSuccess: async (rewardAmount) => {
      if (user?.uid && typeof rewardAmount === "number") {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          amplix: increment(rewardAmount),
          "stats.points": increment(rewardAmount),
        });

        toast.success(`Claimed +${rewardAmount} Amplix!`);
        queryClient.invalidateQueries({ queryKey: ["challenges", user.uid] });
      }
    },
    onError: (error) => {
      console.error(error);
      toast.error("Failed to claim challenge");
    },
  });
};

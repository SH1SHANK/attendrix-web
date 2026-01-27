import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { doc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserChallenge } from "@/types/challenges";
import { toast } from "sonner";

export const useChallenges = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["challenges", user?.uid],
    queryFn: async (): Promise<UserChallenge[]> => {
      if (!user?.uid) return [];

      const res = await fetch("/api/challenges");
      if (!res.ok) {
        throw new Error("Failed to fetch challenges");
      }
      const data = await res.json();
      return data as UserChallenge[];
    },

    enabled: !!user?.uid,
    staleTime: 1000 * 60 * 5, // 5 mins
  });
};

export const useClaimChallenge = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (progressID: string) => {
      if (!user?.uid) throw new Error("User not found");

      const res = await fetch("/api/challenges/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progressID }),
      });

      if (!res.ok) {
        throw new Error("Failed to claim challenge");
      }

      const data = await res.json();
      return data.reward; // API returns { success: true, reward: number }
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

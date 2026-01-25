import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

const AmplixLogSchema = z.object({
  id: z.string().uuid(),
  userID: z.string(),
  currentAmplixScore: z.number().int().nonnegative(),
  amplixObtained: z.number().int().nullable().optional(),
  lastUpdatedAt: z.string(),
  streak: z.number().int().optional().default(0),
});

export interface AmplixStats {
  currentXP: number;
  level: number;
  rankTitle: "Novice" | "Adept" | "Expert" | "Master";
  nextLevelXP: number;
  progress: number;
  streak: number;
}

function calculateLevel(xp: number) {
  return Math.floor(Math.sqrt(xp / 100));
}

function getRankTitle(level: number): AmplixStats["rankTitle"] {
  if (level < 5) return "Novice";
  if (level < 10) return "Adept";
  if (level < 20) return "Expert";
  return "Master";
}

export const useAmplix = () => {
  const { user } = useAuth();
  const queryKey = ["amplix", user?.uid];

  const {
    data: stats,
    isLoading,
    error,
  } = useQuery<AmplixStats>({
    queryKey,
    queryFn: async (): Promise<AmplixStats> => {
      if (!user?.uid)
        return {
          currentXP: 0,
          level: 0,
          rankTitle: "Novice",
          nextLevelXP: 100,
          progress: 0,
          streak: 0,
        };

      const { data, error: supaError } = await supabase
        .from("amplixLogs")
        .select("*")
        .eq("userID", user.uid)
        .order("lastUpdatedAt", { ascending: false })
        .limit(1);

      if (supaError) throw supaError;

      const parsed =
        data && data.length > 0
          ? AmplixLogSchema.parse(data[0])
          : { currentAmplixScore: 0, streak: 0 };

      const xp = parsed.currentAmplixScore ?? 0;
      const level = calculateLevel(xp);
      const rankTitle = getRankTitle(level);

      const nextLevel = level + 1;
      const nextLevelXP = 100 * (nextLevel * nextLevel);
      const currentLevelBaseXP = 100 * (level * level);
      const gainedInThisLevel = xp - currentLevelBaseXP;
      const neededForNextLevel = Math.max(1, nextLevelXP - currentLevelBaseXP);
      const progress = Math.max(
        0,
        Math.min(100, (gainedInThisLevel / neededForNextLevel) * 100),
      );

      return {
        currentXP: xp,
        level,
        rankTitle,
        nextLevelXP,
        progress,
        streak: parsed.streak ?? 0,
      };
    },
    enabled: !!user?.uid,
    staleTime: 1000 * 60 * 5,
  });

  return {
    stats,
    isLoading,
    error,
  };
};

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";

import { doc, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { AttendanceStat } from "@/types/dashboard";

export interface UserProfile {
  name: string;
  username: string;
  display_name: string | null;
  email: string | null;
  photo_url: string | null;
  avatarInitials: string;
  batchID: string;
  batchLabel: string;
  settings: {
    googleCalendarSync: boolean;
    darkMode: boolean;
    notifications: boolean;
  };
  mageRank: {
    level: number;
    title: string;
    stars: number;
    xpCurrent: number;
    xpRequired: number;
  };
  streak: number;
  longestStreak: number;
  totalClassesAttended: number;
  perfectDays: number;
  coursesEnrolled: AttendanceStat[]; // refined type
  calendarDates: string[]; // for streak calc
}

export const useProfile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["profile", user?.uid];

  const {
    data: profile,
    isLoading,
    error,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user?.uid) return null;

      const res = await fetch("/api/dashboard");
      if (!res.ok) {
        // Parse error message if available
        let errorMessage = "Failed to fetch dashboard data";
        try {
          const errorData = await res.json();
          if (errorData.error) errorMessage = errorData.error;
        } catch {
          // ignore parsing error
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();
      return data.user as unknown as UserProfile;
    },
    enabled: !!user?.uid,
    staleTime: 5 * 60 * 1000,
  });

  const updateSetting = useMutation({
    mutationFn: async ({
      key,
      value,
    }: {
      key: keyof UserProfile["settings"];
      value: boolean;
    }) => {
      if (!user?.uid) throw new Error("No user");
      const ref = doc(db, "users", user.uid);
      await updateDoc(ref, {
        [`settings.${key}`]: value,
      });
      return { key, value };
    },
    onMutate: async ({ key, value }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<UserProfile>(queryKey);
      queryClient.setQueryData<UserProfile>(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          settings: { ...old.settings, [key]: value },
        };
      });
      return { previous };
    },
    onError: (err, vars, context) => {
      toast.error("Failed to update setting");
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const resetData = useMutation({
    mutationFn: async () => {
      if (!user?.uid) throw new Error("No user");
      const batch = writeBatch(db);
      const userRef = doc(db, "users", user.uid);

      // Reset logic - adjust specific fields as necessary
      batch.update(userRef, {
        "stats.streak": 0,
        "stats.totalClassesAttended": 0,
        "settings.googleCalendarSync": false,
        // Add more reset fields as required
        amplix: 0,
      });

      await batch.commit();
    },
    onSuccess: () => {
      toast.success("Data reset successfully");
      queryClient.invalidateQueries({ queryKey });
    },
    onError: () => {
      toast.error("Failed to reset data");
    },
  });

  return {
    profile,
    loading: isLoading,
    error,
    updateSetting: (key: keyof UserProfile["settings"], value: boolean) =>
      updateSetting.mutate({ key, value }),
    resetData: () => resetData.mutate(),
  };
};

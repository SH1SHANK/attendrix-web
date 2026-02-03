import { useQuery } from "@tanstack/react-query";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  getAvailableBatches,
  getBatchOnboardingData,
} from "@/app/actions/onboarding";
import type { FirebaseUserDocument } from "@/types/types-defination";

export function useAvailableBatches() {
  return useQuery({
    queryKey: ["onboarding", "batches"],
    queryFn: () => getAvailableBatches(),
    staleTime: 30 * 60 * 1000,
  });
}

export function useBatchOnboardingData(batchID: string | null) {
  return useQuery({
    queryKey: ["onboarding", "batch", batchID],
    queryFn: () => getBatchOnboardingData(batchID as string),
    enabled: Boolean(batchID),
    staleTime: 30 * 60 * 1000,
  });
}

export function useUserOnboardingProfile(uid: string | null) {
  return useQuery({
    queryKey: ["onboarding", "user", uid],
    enabled: Boolean(uid),
    queryFn: async (): Promise<FirebaseUserDocument | null> => {
      if (!uid) return null;
      const ref = doc(db, "users", uid);
      const snap = await getDoc(ref);
      return snap.exists() ? (snap.data() as FirebaseUserDocument) : null;
    },
    staleTime: 5 * 60 * 1000,
  });
}

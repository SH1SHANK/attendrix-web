import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/context/AuthContext";

const supabase = createClient();

export type LedgerStatus = "safe" | "condonation" | "critical";

export interface SubjectLedgerItem {
  courseID: string;
  courseName: string;
  credits: number;
  totalClasses: number;
  attendedClasses: number;
  percentage: number;
  status: LedgerStatus;
  safeSkip: number; // How many more can be skipped
  required: number; // How many need to be attended
}

// RPC Response Type
interface RPCStat {
  course_id: string;
  course_name: string;
  attended_classes: number;
  total_classes: number;
  percentage: number;
}

export const useSubjectLedger = () => {
  const { user } = useAuth();
  const queryKey = ["subject-ledger", user?.uid];

  const {
    data: ledger,
    isLoading,
    error,
  } = useQuery<SubjectLedgerItem[]>({
    queryKey,
    queryFn: async (): Promise<SubjectLedgerItem[]> => {
      if (!user?.uid) return [];

      // Call the same RPC used by the Profile page actions
      const { data, error } = await supabase.rpc(
        "get_student_attendance_stats",
        {
          p_user_id: user.uid,
        },
      );

      if (error) {
        console.error("Supabase RPC Error (Ledger):", error);
        throw error;
      }

      // Transform RPC data to SubjectLedgerItem
      const rpcData = (data as unknown as RPCStat[]) || [];

      // Filter out diagnostic errors if any (same logic as profile action)
      const validData = rpcData.filter((item) => item.course_id !== "ERROR");

      return validData.map((item) => {
        const total = Number(item.total_classes);
        const attended = Number(item.attended_classes);
        const percentage = Number(item.percentage);

        // --- Logic duplicated from previous hook for consistency ---

        // Safe Cuts: floor((Attended - (Total * 0.75)) / 0.75)
        const rawSafeCuts =
          total === 0 ? 0 : Math.floor((attended - total * 0.75) / 0.75);
        const safeSkip = Math.max(0, rawSafeCuts);

        // Required to reach 75%
        let required = 0;
        if (percentage < 75) {
          required = Math.ceil((0.75 * total - attended) / 0.25);
        }

        // Status Determination
        let status: LedgerStatus = "safe";
        if (percentage < 65)
          status = "critical"; // Red (< 65%)
        else if (percentage <= 80)
          status = "condonation"; // Yellow (65-80%)
        else status = "safe"; // Green (> 80%)

        return {
          courseID: item.course_id,
          courseName: item.course_name,
          credits: 3, // RPC doesn't return credits yet, defaulting to 3
          totalClasses: total,
          attendedClasses: attended,
          percentage: percentage,
          status,
          safeSkip: safeSkip > 0 ? safeSkip : 0,
          required: required > 0 ? required : 0,
        };
      });
    },
    enabled: !!user?.uid,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  return { ledger, isLoading, error };
};

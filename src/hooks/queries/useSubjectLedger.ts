import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";

export type LedgerStatus = "safe" | "condonation" | "critical";

export interface SubjectLedgerItem {
  courseID: string;
  courseName: string;
  credits: number;
  totalClasses: number;
  attendedClasses: number;
  percentage: number;
  status: LedgerStatus;
  safeSkip: number;
  required: number;
  // Optional enhanced fields
  departmentId?: string;
  courseFaculty?: string;
  isElective?: boolean;
  courseType?: Record<string, unknown>;
}

// RPC Response matches database output exactly - no transformation needed
interface RpcLedgerRecord {
  course_id: string;
  course_name: string;
  credits: number;
  total_classes: number;
  attended_classes: number;
  percentage: number;
  status: LedgerStatus;
  safe_skip: number;
  required: number;
  // Enhanced fields
  department_id?: string;
  course_faculty?: string;
  is_elective?: boolean;
  course_type?: Record<string, unknown>;
}

export type LedgerMode = "basic" | "enhanced";

export const useSubjectLedger = (mode: LedgerMode = "basic") => {
  const { user } = useAuth();
  const queryKey = ["subject-ledger", user?.uid, mode];

  const {
    data: ledger = [],
    isLoading,
    error,
    refetch,
  } = useQuery<SubjectLedgerItem[]>({
    queryKey,
    queryFn: async () => {
      if (!user?.uid) return [];

      const params = new URLSearchParams();
      if (mode) params.append("mode", mode);

      const res = await fetch(`/api/ledger?${params.toString()}`);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("Subject Ledger API Error:", errorData);
        throw new Error(errorData.error || "Failed to fetch ledger");
      }

      const data = await res.json();

      // Direct mapping - no computation needed (all done in database)
      return ((data as RpcLedgerRecord[]) || []).map((item) => ({
        courseID: item.course_id,
        courseName: item.course_name,
        credits: item.credits,
        totalClasses: item.total_classes,
        attendedClasses: item.attended_classes,
        percentage: item.percentage,
        status: item.status,
        safeSkip: item.safe_skip,
        required: item.required,
        // Enhanced fields (only present in enhanced mode)
        ...(mode === "enhanced" && {
          departmentId: item.department_id,
          courseFaculty: item.course_faculty,
          isElective: item.is_elective,
          courseType: item.course_type,
        }),
      }));
    },
    enabled: !!user?.uid,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false,
  });

  // Computed aggregates (memoized via React Query)
  const summary = {
    totalCourses: ledger.length,
    criticalCount: ledger.filter((l) => l.status === "critical").length,
    condonationCount: ledger.filter((l) => l.status === "condonation").length,
    safeCount: ledger.filter((l) => l.status === "safe").length,
    overallPercentage:
      ledger.length > 0
        ? Math.round(
            ledger.reduce((sum, l) => sum + l.percentage, 0) / ledger.length,
          )
        : 0,
    totalAttended: ledger.reduce((sum, l) => sum + l.attendedClasses, 0),
    totalClasses: ledger.reduce((sum, l) => sum + l.totalClasses, 0),
    totalCredits: ledger.reduce((sum, l) => sum + l.credits, 0),
  };

  return {
    ledger,
    summary,
    isLoading,
    error,
    refetch,
  };
};

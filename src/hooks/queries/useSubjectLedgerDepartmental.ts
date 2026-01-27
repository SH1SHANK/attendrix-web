import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/context/AuthContext";
import type { LedgerStatus } from "./useSubjectLedger";

const supabase = createClient();

interface DepartmentCourse {
  courseID: string;
  courseName: string;
  percentage: number;
  status: LedgerStatus;
}

export interface DepartmentLedger {
  departmentId: string;
  departmentCourses: number;
  totalClasses: number;
  attendedClasses: number;
  percentage: number;
  criticalCourses: number;
  courses: DepartmentCourse[];
}

interface RpcDepartmentRecord {
  department_id: string;
  department_courses: number;
  total_classes: number;
  attended_classes: number;
  percentage: number;
  critical_courses: number;
  courses: DepartmentCourse[];
}

export const useDepartmentLedger = () => {
  const { user } = useAuth();
  const queryKey = ["department-ledger", user?.uid];

  const {
    data: departments = [],
    isLoading,
    error,
    refetch,
  } = useQuery<DepartmentLedger[]>({
    queryKey,
    queryFn: async () => {
      if (!user?.uid) return [];

      const { data, error: rpcError } = await supabase.rpc(
        "get_subject_ledger_by_department",
        {
          p_user_id: user.uid,
        },
      );

      if (rpcError) {
        console.error("Department Ledger RPC Error:", rpcError);
        throw rpcError;
      }

      return ((data as RpcDepartmentRecord[]) || []).map((item) => ({
        departmentId: item.department_id,
        departmentCourses: item.department_courses,
        totalClasses: item.total_classes,
        attendedClasses: item.attended_classes,
        percentage: item.percentage,
        criticalCourses: item.critical_courses,
        courses: item.courses,
      }));
    },
    enabled: !!user?.uid,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const summary = {
    totalDepartments: departments.length,
    totalCourses: departments.reduce((sum, d) => sum + d.departmentCourses, 0),
    totalClasses: departments.reduce((sum, d) => sum + d.totalClasses, 0),
    totalAttended: departments.reduce((sum, d) => sum + d.attendedClasses, 0),
    overallPercentage:
      departments.length > 0
        ? Math.round(
            departments.reduce((sum, d) => sum + d.percentage, 0) /
              departments.length,
          )
        : 0,
    criticalCoursesCount: departments.reduce(
      (sum, d) => sum + d.criticalCourses,
      0,
    ),
  };

  return {
    departments,
    summary,
    isLoading,
    error,
    refetch,
  };
};

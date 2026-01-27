import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const supabase = createClient();

export interface CalendarClass {
  id: string;
  courseID: string;
  courseCode: string;
  courseName: string;
  venue: string;
  startTime: string;
  endTime: string;
  date: Date;
  type: "lecture" | "lab" | "tutorial";
  status: "scheduled" | "cancelled" | "completed";
  attended: boolean;
}

export interface MonthData {
  year: number;
  month: number;
  classes: CalendarClass[];
}

interface RpcCalendarRecord {
  class_id: string;
  course_id: string;
  course_name: string;
  class_venue: string;
  class_start_time: string;
  class_end_time: string;
  course_type: {
    isLab: boolean;
    courseType: string;
    electiveCategory?: string;
  };
  class_status: {
    status: string;
  };
  attended: boolean;
}

// Extract course code from courseID
const extractCourseCode = (courseID: string): string => {
  const match = courseID.match(/^([A-Z]{2}\d{4})/);
  return match?.[1] ?? courseID;
};

// Determine class type
const getClassType = (
  courseType: RpcCalendarRecord["course_type"],
): "lecture" | "lab" | "tutorial" => {
  if (courseType?.isLab) return "lab";
  return "lecture";
};

// Get class status
const getClassStatus = (
  classStatus: RpcCalendarRecord["class_status"],
): "scheduled" | "cancelled" | "completed" => {
  const status = classStatus?.status?.toLowerCase();
  if (status === "cancelled") return "cancelled";
  if (status === "completed") return "completed";
  return "scheduled";
};

export const useCalendar = (currentMonth: Date) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth() + 1; // JS months are 0-indexed, SQL expects 1-12

  const queryKey = ["calendar", user?.uid, year, month];

  const {
    data: monthData,
    isLoading,
    error,
  } = useQuery<MonthData>({
    queryKey,
    queryFn: async () => {
      if (!user?.uid) throw new Error("User not authenticated");

      const params = new URLSearchParams({
        year: year.toString(),
        month: month.toString(),
      });

      const res = await fetch(`/api/calendar?${params.toString()}`);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch calendar data");
      }

      const data = await res.json();

      const classes: CalendarClass[] = (
        (data as RpcCalendarRecord[]) || []
      ).map((record) => {
        const startDate = new Date(record.class_start_time);
        const endDate = new Date(record.class_end_time);

        return {
          id: record.class_id,
          courseID: record.course_id,
          courseCode: extractCourseCode(record.course_id),
          courseName: record.course_name,
          venue: record.class_venue,
          startTime: startDate.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }),
          endTime: endDate.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }),
          date: startDate,
          type: getClassType(record.course_type),
          status: getClassStatus(record.class_status),
          attended: record.attended,
        };
      });

      return {
        year,
        month: month - 1, // Convert back to JS month (0-indexed)
        classes,
      };
    },
    enabled: !!user?.uid,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const toggleAttendance = useMutation({
    mutationFn: async (classItem: CalendarClass) => {
      if (!user?.uid) throw new Error("User not authenticated");

      const { data, error } = await supabase.rpc("toggle_attendance", {
        p_user_id: user.uid,
        p_class_id: classItem.id,
        p_course_id: classItem.courseID,
        p_class_time: classItem.date.toISOString(),
      });

      if (error) throw error;

      const result = data?.[0];
      return {
        action: result?.action as "inserted" | "deleted",
        attended: result?.attended as boolean,
      };
    },
    onMutate: async (classItem) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous value
      const previous = queryClient.getQueryData<MonthData>(queryKey);

      // Optimistically update
      queryClient.setQueryData<MonthData>(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          classes: old.classes.map((c) =>
            c.id === classItem.id ? { ...c, attended: !c.attended } : c,
          ),
        };
      });

      return { previous };
    },
    onError: (error, classItem, context) => {
      console.error("Toggle attendance error:", error);
      toast.error("Failed to update attendance");

      // Rollback to previous state
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSuccess: (result) => {
      const message =
        result.action === "inserted"
          ? "Attendance marked"
          : "Attendance removed";
      toast.success(message);
    },
    onSettled: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      queryClient.invalidateQueries({ queryKey: ["history"] });
      queryClient.invalidateQueries({ queryKey: ["subject-ledger"] });
    },
  });

  return {
    monthData,
    isLoading,
    error,
    toggleAttendance: toggleAttendance.mutate,
    isTogglingAttendance: toggleAttendance.isPending,
  };
};

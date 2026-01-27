import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/context/AuthContext";
import type { PostgrestError } from "@supabase/supabase-js";

const supabase = createClient();

export interface NextClassData {
  id: string;
  courseID: string;
  batchID: string;
  courseCode: string;
  courseName: string;
  venue: string;
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
  type: "lecture" | "lab" | "tutorial";
  status: "upcoming" | "scheduled" | "cancelled";
  isPlusSlot: boolean;
  attended: boolean;
}

interface RpcNextClassRecord {
  class_id: string;
  course_id: string;
  batch_id: string;
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
  is_plus_slot: boolean;
  attended: boolean;
}

// Extract course code from courseID
const extractCourseCode = (courseID: string): string => {
  const match = courseID.match(/^([A-Z]{2}\d{4})/);
  return match?.[1] ?? courseID;
};

// Determine class type
const getClassType = (
  courseType: RpcNextClassRecord["course_type"],
): "lecture" | "lab" | "tutorial" => {
  if (courseType?.isLab) return "lab";
  return "lecture";
};

// Get class status
const getClassStatus = (
  classStatus: RpcNextClassRecord["class_status"],
): "upcoming" | "scheduled" | "cancelled" => {
  const status = classStatus?.status?.toLowerCase();
  if (status === "cancelled") return "cancelled";
  return "upcoming";
};

// Format time to HH:mm
const formatTime = (date: Date): string => {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

export const useNextClass = (strategy: "batch" | "enrolled" = "enrolled") => {
  const { user } = useAuth();

  const {
    data: nextClass,
    isLoading,
    error,
    refetch,
  } = useQuery<NextClassData | null>({
    queryKey: ["nextClass", user?.uid, strategy],
    queryFn: async () => {
      if (!user?.uid) return null;

      let data: RpcNextClassRecord[] | null = null;
      let rpcError: PostgrestError | null = null;

      if (strategy === "enrolled") {
        // Get next class from enrolled courses (more accurate)
        const result = await supabase.rpc("get_next_enrolled_class", {
          p_user_id: user.uid,
        });
        data = result.data;
        rpcError = result.error;
      } else {
        // Get next class by batch (fallback if batch info available)
        // Note: This requires batchID from user profile
        const { data: profileData } = await supabase
          .from("userCourseRecords")
          .select("batchID")
          .eq("userID", user.uid)
          .maybeSingle();

        if (!profileData?.batchID) return null;

        const result = await supabase.rpc("get_next_class", {
          p_user_id: user.uid,
          p_batch_id: profileData.batchID,
        });
        data = result.data;
        rpcError = result.error;
      }

      if (rpcError) throw rpcError;
      const record = data?.[0];
      if (!record) return null;
      const startDate = new Date(record.class_start_time);
      const endDate = new Date(record.class_end_time);

      return {
        id: record.class_id,
        courseID: record.course_id,
        batchID: record.batch_id,
        courseCode: extractCourseCode(record.course_id),
        courseName: record.course_name,
        venue: record.class_venue,
        startDate,
        endDate,
        startTime: formatTime(startDate),
        endTime: formatTime(endDate),
        type: getClassType(record.course_type),
        status: getClassStatus(record.class_status),
        isPlusSlot: record.is_plus_slot,
        attended: record.attended,
      };
    },
    enabled: !!user?.uid,
    staleTime: 2 * 60 * 1000, // 2 minutes (shorter for next class)
    refetchInterval: 5 * 60 * 1000, // Auto-refetch every 5 minutes
    refetchOnWindowFocus: true,
  });

  return {
    nextClass,
    isLoading,
    error,
    refetch,
  };
};

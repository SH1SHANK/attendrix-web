import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";

export type HistoryRange = "7d" | "14d" | "30d" | "all";

export interface ClassRecord {
  id: string;
  courseID: string;
  courseCode: string;
  courseName: string;
  venue: string;
  startTime: string;
  endTime: string;
  type: "lecture" | "lab" | "tutorial";
  attended: boolean;
  date: Date;
}

export interface GroupedHistory {
  date: Date;
  label: string;
  classes: ClassRecord[];
}

interface RpcHistoryRecord {
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
  attended: boolean;
}

// Extract course code from courseID (e.g., "ME2311EPCD1" -> "ME2311")
const extractCourseCode = (courseID: string): string => {
  const match = courseID.match(/^([A-Z]{2}\d{4})/);
  return match?.[1] ?? courseID;
};

// Determine class type from course metadata
const getClassType = (
  courseType: RpcHistoryRecord["course_type"],
): "lecture" | "lab" | "tutorial" => {
  if (courseType?.isLab) return "lab";
  // You can extend this logic based on your schema
  return "lecture";
};

// Format date label (e.g., "Today", "Yesterday", or "Mon, Jan 20")
const formatDateLabel = (date: Date): string => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const isToday = date.toDateString() === today.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) return "Today";
  if (isYesterday) return "Yesterday";

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

export const useHistory = (range: HistoryRange) => {
  const { user } = useAuth();
  const queryKey = ["history", user?.uid, range];

  const {
    data: history = [],
    isLoading,
    error,
  } = useQuery<GroupedHistory[]>({
    queryKey,
    queryFn: async () => {
      if (!user?.uid) return [];

      // Build query string
      const params = new URLSearchParams();
      if (range !== "all") {
        params.append("range", range);
      }

      const res = await fetch(`/api/history?${params.toString()}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch history");
      }

      const data = await res.json();

      if (!data || data.length === 0) return [];

      // Group by date
      const groups = new Map<string, ClassRecord[]>();

      (data as RpcHistoryRecord[]).forEach((record) => {
        const startDate = new Date(record.class_start_time);
        const endDate = new Date(record.class_end_time);
        const dateKey = startDate.toDateString();

        const classRecord: ClassRecord = {
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
          type: getClassType(record.course_type),
          attended: record.attended,
          date: startDate,
        };

        if (!groups.has(dateKey)) {
          groups.set(dateKey, []);
        }
        groups.get(dateKey)!.push(classRecord);
      });

      // Convert to sorted array (most recent first)
      return Array.from(groups.entries())
        .sort(([dateStrA], [dateStrB]) => {
          return new Date(dateStrB).getTime() - new Date(dateStrA).getTime();
        })
        .map(([dateStr, classes]) => {
          const date = new Date(dateStr);
          return {
            date,
            label: formatDateLabel(date),
            classes: classes.sort((a, b) => {
              // Sort classes within a day by start time
              return a.startTime.localeCompare(b.startTime);
            }),
          };
        });
    },
    enabled: !!user?.uid,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return {
    history,
    isLoading,
    error,
    range,
  };
};

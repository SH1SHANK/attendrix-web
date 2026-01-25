import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { TimetableRecordSchema, type ClassWithAttendance } from "@/schemas/db";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/hooks/queries/useProfile";

const supabase = createClient();

export type ParsedClass = ClassWithAttendance & {
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
  type: string;
};

export const useNextClass = () => {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const batchID = profile?.batchID;

  const {
    data: nextClass,
    isLoading,
    error,
  } = useQuery<ParsedClass | null>({
    queryKey: ["nextClass", user?.uid],
    queryFn: async () => {
      if (!user?.uid || !batchID) return null;

      // DATABASE IS TIMESTAMP WITHOUT TIME ZONE (Local Time)
      // We must compare against local time string, not UTC.
      // E.g., if it is 10:00 AM Local, DB has "2026-01-25 10:00:00".
      // toISOString() gives "2026-01-25T04:30:00.000Z" (UTC).
      // If we send UTC, we might miss classes or get wrong ones if DB interprets it literally.
      // Safe bet: Send ISO string but adjusted to local timezone OR just string format.
      // Actually, standard practice for "without time zone" is it stores what you give it.
      // Assuming data ingress sent local time strings.

      const now = new Date();
      // Format to "YYYY-MM-DDTHH:mm:ss" local
      const offsetMs = now.getTimezoneOffset() * 60 * 1000;
      const localTime = new Date(now.getTime() - offsetMs);
      const nowISO = localTime.toISOString().slice(0, 19).replace("T", " ");

      const { data, error } = await supabase
        .from("timetableRecords")
        .select("*")
        .gt("classStartTime", nowISO)
        .eq("batchID", batchID)
        .order("classStartTime", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      const record = TimetableRecordSchema.parse(data);

      const startDate = new Date(record.classStartTime);
      const endDate = new Date(record.classEndTime);

      // We don't fetch attendance for this "future" class specifically as it's just for display
      // But we need to match the Shape.
      const parsed: ParsedClass = {
        ...record,
        attendance: null, // Future class
        status: "upcoming",
        startDate,
        endDate,
        startTime: startDate.toTimeString().slice(0, 5),
        endTime: endDate.toTimeString().slice(0, 5),
        type:
          typeof record.courseType === "string" ? record.courseType : "lecture",
      };

      return parsed;
    },
    enabled: !!user?.uid && !!batchID && !profileLoading,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  return { nextClass, isLoading, error };
};

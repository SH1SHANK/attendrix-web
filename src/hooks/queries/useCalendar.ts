import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMonthAttendance,
  MonthData,
  CalendarClass,
} from "@/app/actions/calendar";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

// Reuse generic mutation logic from useAttendance or keep it specific?
// Let's implement specific mutation here to handle the CalendarClass type structure mismatch if any.
// Actually, `CalendarClass` structure is surprisingly similar to `useAttendance`'s output.

const supabase = createClient();

export const useCalendar = (currentMonth: Date) => {
  const queryClient = useQueryClient();
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const queryKey = ["calendar", year, month];

  const {
    data: rawData,
    isLoading,
    error,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const result = await getMonthAttendance(year, month);
      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to fetch calendar data");
      }
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // We need to replicate the 'processedData' logic from useCalendarData here or in the component.
  // It's cleaner to return rawData and let component or a wrapper hook handle the view logic (Days Grid construction).
  // But to be a drop-in replacement, we might want to return { days, history }.
  // However, sticking to "Core Data Hooks" usually means returning the data, and UI logic stays in UI hooks.
  // The existing `useCalendarData` was a "ViewModel" hook.

  // Let's keep `useCalendarData` as the ViewModel hook but make it use `useCalendar` internally!

  const toggleAttendance = useMutation({
    mutationFn: async (classItem: CalendarClass) => {
      // Need User ID. We can get it from auth context or just trust Supabase client to know (but we need it for INSERT)
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not logged in");

      const isPresent = classItem.attended;

      if (isPresent) {
        // DELETE
        const { error } = await supabase
          .from("attendanceRecords")
          .delete()
          .eq("userID", user.id)
          .eq("classID", classItem.id);

        if (error) throw error;
        return { action: "deleted", classID: classItem.id };
      } else {
        // INSERT
        const newRecord = {
          classID: classItem.id,
          userID: user.id,
          courseID: classItem.courseID,
          classTime: classItem.date, // ISO string
          checkinTime: new Date().toISOString(),
          rowID: uuidv4(),
        };

        const { error } = await supabase
          .from("attendanceRecords")
          .insert(newRecord);
        if (error) throw error;
        return { action: "inserted", newRecord };
      }
    },
    onMutate: async (newItem) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<MonthData>(queryKey);

      queryClient.setQueryData<MonthData>(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          classes: old.classes.map((c) => {
            if (c.id === newItem.id) {
              return { ...c, attended: !c.attended };
            }
            return c;
          }),
        };
      });

      return { previous };
    },
    onError: (err, newItem, context) => {
      toast.error("Failed to update attendance");
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
      // Also invalidate 'attendance' (daily) and 'subject-ledger'
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      queryClient.invalidateQueries({ queryKey: ["subject-ledger"] });
    },
  });

  return {
    rawData,
    isLoading,
    error,
    toggleAttendance,
  };
};

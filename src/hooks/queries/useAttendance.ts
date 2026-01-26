import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  TimetableRecordSchema,
  AttendanceRecordSchema,
  type ClassWithAttendance,
  type AttendanceRecord,
  type TimetableRecord,
} from "@/schemas/db";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/hooks/queries/useProfile";
import { doc, updateDoc, increment } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

const supabase = createClient();

export type AttendanceStatus =
  | "pending"
  | "present"
  | "absent"
  | "upcoming"
  | "cancelled";

type EnrolledCourse = { courseID?: string };

type RpcCheckInResponse = {
  status: string;
  amplix_gained: number;
  attended_classes: number;
  total_classes: number;
};

type RpcMarkAbsentResponse = {
  status: string;
  amplix_lost: number;
  attended_classes_after: number;
};

export const useAttendance = (date: Date) => {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const queryClient = useQueryClient();
  // Supabase stores classDate as D/M/YYYY (no leading zeros)
  const dateKey = format(date, "d/M/yyyy");
  const batchID = profile?.batchID;

  const queryKey = useMemo(
    () => ["attendance", dateKey, user?.uid],
    [dateKey, user?.uid],
  );

  // FETCH
  const {
    data: classes,
    isLoading,
    error,
  } = useQuery<ClassWithAttendance[]>({
    queryKey,
    queryFn: async () => {
      if (!user?.uid || !batchID) return [];

      const { data: timetableData, error: timetableError } = await supabase
        .from("timetableRecords")
        .select("*")
        .eq("classDate", dateKey)
        .eq("batchID", batchID);

      if (timetableError) throw timetableError;

      const timetable: TimetableRecord[] = timetableData.map((t) =>
        TimetableRecordSchema.parse(t),
      );

      if (timetable.length === 0) return [];

      const classIDs = timetable.map((t) => t.classID);

      const { data: attendanceData, error: attendanceError } = await supabase
        .from("attendanceRecords")
        .select("*")
        .eq("userID", user.uid)
        .in("classID", classIDs);

      if (attendanceError) throw attendanceError;

      const attendanceMap = new Map<string, AttendanceRecord>();
      attendanceData.forEach((a) => {
        const parsed = AttendanceRecordSchema.parse(a);
        attendanceMap.set(parsed.classID, parsed);
      });

      return timetable.map((t): ClassWithAttendance => {
        const att = attendanceMap.get(t.classID);
        const classDateTime = new Date(t.classStartTime);
        const status = att
          ? "present"
          : classDateTime > new Date()
            ? "upcoming"
            : "absent";
        return {
          ...t,
          attendance: att || null,
          status,
        };
      });
    },
    enabled: !!user?.uid && !!batchID && !profileLoading && batchID !== "...",
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user?.uid) return;

    console.log("Setting up realtime subscription for user:", user.uid);

    const channel = supabase
      .channel(`attendance-${user.uid}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "attendanceRecords",
          filter: `userID=eq.${user.uid}`,
        },
        (payload) => {
          console.log("Realtime event received:", payload);
          // Invalidate query to refetch fresh data
          queryClient.invalidateQueries({ queryKey });
        },
      )
      .subscribe((status) => {
        console.log("Subscription status:", status);
      });

    return () => {
      console.log("Cleaning up realtime subscription");
      supabase.removeChannel(channel);
    };
  }, [user?.uid, queryClient, queryKey]);

  // MUTATION via RPC + Firestore sync
  const toggleAttendance = useMutation({
    mutationFn: async (classItem: ClassWithAttendance) => {
      if (!user?.uid) throw new Error("User not logged in");

      const targetStatus = classItem.attendance ? "ABSENT" : "PRESENT";

      let enrolledCourseIDs: string[] = [];
      const profileCourses = (
        profile as unknown as { coursesEnrolled?: EnrolledCourse[] }
      )?.coursesEnrolled;

      if (Array.isArray(profileCourses) && profileCourses.length > 0) {
        enrolledCourseIDs = profileCourses
          .map((c) => c.courseID)
          .filter((id): id is string => Boolean(id));
      }

      // Ensure the current class's courseID is included in the list
      // This is critical because mark_class_absent strictly enforces enrollment,
      // but class_check_in might allow it (or user data might be out of sync).
      if (
        classItem.courseID &&
        !enrolledCourseIDs.includes(classItem.courseID)
      ) {
        enrolledCourseIDs.push(classItem.courseID);
      }

      const paramsPresent = {
        p_user_id: user.uid,
        p_class_id: classItem.classID,
        p_class_start: classItem.classStartTime,
        p_enrolled_courses: enrolledCourseIDs,
      } as const;

      const paramsAbsent = {
        p_user_id: user.uid,
        p_class_id: classItem.classID,
        p_enrolled_courses: enrolledCourseIDs,
      } as const;

      const { data, error } =
        targetStatus === "PRESENT"
          ? await supabase.rpc("class_check_in", paramsPresent)
          : await supabase.rpc("mark_class_absent", paramsAbsent);

      if (error) throw error;
      if (!data) throw new Error("Empty RPC response");

      // Check for application-level error (RPC returns 200 but body has error status)
      // Check for application-level error (RPC returns 200 but body has error status)
      // Use unknown cast first
      const dataObj = data as unknown as Record<string, unknown>;
      if (
        dataObj &&
        typeof dataObj === "object" &&
        "status" in dataObj &&
        dataObj.status === "error"
      ) {
        throw new Error(
          (dataObj.message as string) || "RPC returned error status",
        );
      }

      const firebaseUser = auth.currentUser;
      if (!firebaseUser?.uid) {
        throw new Error("Firebase auth user not found for Firestore sync");
      }

      const userRef = doc(db, "users", firebaseUser.uid);

      // --- CHALLENGE EVALUATION ---
      const invokeChallengeEvaluation = async () => {
        try {
          // Fetch user's current progress IDs first
          const { data: progressData, error: progressFetchError } =
            await supabase
              .from("amplixChallengeProgress")
              .select("progressID")
              .eq("userID", user.uid);

          if (progressFetchError) {
            console.error(
              "Failed to fetch challenge progress:",
              progressFetchError,
            );
            return;
          }

          const progressIds =
            progressData?.map((p) => p.progressID).filter(Boolean) || [];

          if (progressIds.length === 0) {
            console.log("No active challenges found for evaluation");
            return;
          }

          const { data: challengeData, error: challengeError } =
            await supabase.rpc("evaluate_user_challenges", {
              p_user_id: user.uid,
              p_progress_ids: progressIds,
            });

          if (challengeError) {
            console.error("Challenge evaluation failed:", challengeError);
          } else {
            console.log("Challenges evaluated:", challengeData);
          }
        } catch (err) {
          console.error("Error invoking challenge evaluation:", err);
        }
      };

      let rpcResult;

      if (targetStatus === "PRESENT") {
        const resp = data as RpcCheckInResponse;
        console.log("Check-in RPC response:", resp);
        console.log("Updating Firestore with:", {
          amplix: resp.amplix_gained || 0,
          courseID: classItem.courseID,
        });

        await updateDoc(userRef, {
          amplix: increment(resp.amplix_gained || 0),
          [`enrolledClasses.${classItem.courseID}.attendedClasses`]:
            increment(1),
        });

        // Trigger challenge evaluation
        await invokeChallengeEvaluation();

        rpcResult = { action: "present", rpc: resp };
      } else {
        const resp = data as RpcMarkAbsentResponse;
        console.log("Mark-absent RPC response:", resp);
        console.log("Updating Firestore with:", {
          amplix: -(resp.amplix_lost || 0),
          courseID: classItem.courseID,
        });

        const lost = resp.amplix_lost || 0;
        await updateDoc(userRef, {
          amplix: increment(-lost),
          [`enrolledClasses.${classItem.courseID}.attendedClasses`]:
            increment(-1),
        });

        // Trigger challenge evaluation (handles rollback logic internally)
        await invokeChallengeEvaluation();

        rpcResult = { action: "absent", rpc: resp };
      }

      return rpcResult;
    },
    onMutate: async (classItem) => {
      await queryClient.cancelQueries({ queryKey });

      const previousClasses =
        queryClient.getQueryData<ClassWithAttendance[]>(queryKey);

      queryClient.setQueryData<ClassWithAttendance[]>(queryKey, (old) => {
        if (!old) return [];
        return old.map((c) => {
          if (c.classID === classItem.classID) {
            const isPresent = !!c.attendance;
            return {
              ...c,
              attendance: isPresent
                ? null
                : {
                    classID: c.classID,
                    userID: user?.uid || "",
                    courseID: c.courseID,
                    classTime: c.classStartTime,
                    checkinTime: new Date().toISOString(),
                    rowID: "optimistic-uuid",
                  },
              status: isPresent ? "absent" : "present",
            };
          }
          return c;
        });
      });

      return { previousClasses };
    },
    onError: (err, _vars, context) => {
      console.error("Toggle attendance error:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to update attendance",
      );
      if (context?.previousClasses) {
        queryClient.setQueryData(queryKey, context.previousClasses);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["subject-ledger"] });
    },
  });

  return {
    classes,
    isLoading,
    error,
    toggleAttendance,
    profile,
  };
};

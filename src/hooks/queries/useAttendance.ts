import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

  const queryKey = ["attendance", dateKey, user?.uid];

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

  // MUTATION via RPC + Firestore sync
  const toggleAttendance = useMutation({
    mutationFn: async (classItem: ClassWithAttendance) => {
      if (!user?.uid) throw new Error("User not logged in");

      const targetStatus = classItem.attendance ? "ABSENT" : "PRESENT";

      const enrolledCourseIDs: string[] = Array.isArray(
        (profile as unknown as { coursesEnrolled?: EnrolledCourse[] })
          ?.coursesEnrolled,
      )
        ? (
            (profile as unknown as { coursesEnrolled?: EnrolledCourse[] })
              .coursesEnrolled || []
          )
            .map((c) => c.courseID)
            .filter((id): id is string => Boolean(id))
        : [classItem.courseID];

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

      const firebaseUser = auth.currentUser;
      if (!firebaseUser?.uid) {
        throw new Error("Firebase auth user not found for Firestore sync");
      }

      const userRef = doc(db, "users", firebaseUser.uid);

      // --- CHALLENGE EVALUATION ---
      const invokeChallengeEvaluation = async () => {
        try {
          const { data: challengeData, error: challengeError } =
            await supabase.rpc("evaluate_user_challenges", {
              p_user_id: user.uid,
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
    onError: (_err, _vars, context) => {
      toast.error("Failed to update attendance");
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

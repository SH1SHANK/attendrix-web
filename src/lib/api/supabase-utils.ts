import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { UserCourseRecord } from "@/types/types-defination";

export function normalizeEnrolledCourses(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.filter((item): item is string => typeof item === "string");
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === "string");
      }
    } catch {
      return [];
    }
  }
  return [];
}

export async function fetchUserCourseRecord(uid: string) {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("userCourseRecords")
    .select("userID,batchID,semesterID,enrolledCourses,metadata,lastUpdated")
    .eq("userID", uid)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Failed to load user course record");
  }

  if (!data) return null;

  const record = data as UserCourseRecord;
  const normalized: UserCourseRecord = {
    ...record,
    enrolledCourses: normalizeEnrolledCourses(
      (data as Record<string, unknown> | null)?.enrolledCourses,
    ),
  };

  return normalized;
}

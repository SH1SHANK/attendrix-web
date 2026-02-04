import { useMutation } from "@tanstack/react-query";
import { fetchJson } from "@/lib/api/fetch-json";

export type ResyncResult = {
  firebaseCourseIds: string[];
  supabaseCourseIds: string[];
  missingInSupabase: string[];
  extraInSupabase: string[];
  totalsMismatched: Array<{
    courseID: string;
    firebase: { attended: number; total: number };
    supabase: { attended: number; total: number };
  }>;
  updated: boolean;
};

export function useResyncUserRecords() {
  return useMutation({
    mutationFn: () =>
      fetchJson<ResyncResult>("/api/profile/resync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
  });
}

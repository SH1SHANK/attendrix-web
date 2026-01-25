"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getUserDashboardData } from "@/app/actions/profile";
import { ProfileDashboard } from "@/components/profile/ProfileDashboard";
import { DashboardData } from "@/types/dashboard";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const result = await getUserDashboardData(user.uid);

      if (result.success) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      setError("Failed to load profile data.");
    }
  }, [user]);

  useEffect(() => {
    // 1. Wait for Auth to Initialize
    if (authLoading) return;

    // 2. Redirect if No User
    if (!user) {
      router.push("/auth/signin");
      return;
    }

    // 3. Fetch Data with UID
    async function initialFetch() {
      await fetchData();
      setLoading(false);
    }

    initialFetch();
  }, [user, authLoading, router, fetchData]);

  // Refresh handler for the dashboard
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetchData();
      toast.success("Attendance data refreshed!");
    } catch {
      toast.error("Failed to refresh data");
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchData]);

  // Combined Loading State (Auth Initializing OR Data Fetching)
  if (authLoading || (loading && !error)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-100">
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {/* Custom Bento Skeleton / Loader */}
          <div className="w-16 h-16 border-4 border-black border-t-yellow-400 rounded-full animate-spin" />
          <p className="font-black uppercase text-neutral-400 tracking-widest animate-pulse">
            Syncing Profile...
          </p>
        </motion.div>
      </div>
    );
  }

  // Debug UI for Error
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-100 p-8">
        <div className="max-w-2xl w-full p-8 bg-red-100 text-red-900 border-4 border-red-900 font-mono shadow-[8px_8px_0px_0px_#7f1d1d]">
          <h2 className="font-bold text-xl mb-4 uppercase">⚠️ Debug Report</h2>
          <div className="space-y-2 break-words">
            <p>
              <strong>Message:</strong> {error}
            </p>
            <p className="text-sm">
              <strong>Timestamp:</strong> {new Date().toISOString()}
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-2 bg-red-900 text-white font-bold uppercase hover:bg-red-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <ProfileDashboard
      initialData={data}
      error={error}
      onRefresh={handleRefresh}
      isRefreshing={isRefreshing}
    />
  );
}

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Loader2,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { verifyAdminCode } from "@/app/actions/admin";

export default function RequestAdminAccessPage() {
  const { user } = useAuth();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [status, setStatus] = useState<
    "idle" | "loading" | "approved" | "pending" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  const sendRequest = async () => {
    if (!user?.email) {
      toast.error("Sign in to request admin access.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const { data, error } = await supabase.functions.invoke(
        "generate_admin_code",
        {
          body: {
            email: user.email,
            userId: user.uid,
          },
        },
      );

      if (error) {
        throw error;
      }

      if (data?.status === "approved") {
        setStatus("approved");
        setMessage("Admin code sent to your email. Enter it below to verify.");
        toast.success("Admin code sent to your email.");
      } else if (data?.status === "pending") {
        setStatus("pending");
        setMessage(
          "Your request has been submitted for review. You can keep using the app as a student.",
        );
        toast.info("Request submitted for review.");
      } else {
        const msg = data?.message || "Invalid admin request.";
        setStatus("error");
        setMessage(msg);
        toast.error(msg);
      }
    } catch (error) {
      console.error("[Request Admin] Failed", error);
      setStatus("error");
      setMessage("Unable to process your request right now.");
      toast.error("Could not process your request. Please try again.");
    }
  };

  const handleVerify = async () => {
    if (!code) {
      toast.error("Enter the code sent to your email.");
      return;
    }

    try {
      setVerifying(true);
      const result = await verifyAdminCode(code.trim());
      if (result.success) {
        toast.success("Admin verified. Redirecting to the Admin Dashboard...");
        setMessage("Verification complete. Redirecting...");
        router.replace("/app");
      } else {
        toast.error(result.message || "Invalid verification code.");
      }
    } catch (error) {
      console.error("[Request Admin] Verification failed", error);
      toast.error("Could not verify the code. Try again.");
    } finally {
      setVerifying(false);
    }
  };

  const disabled = status === "loading";

  return (
    <div className="min-h-screen bg-neutral-100 text-black">
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
        <div className="flex items-center justify-between">
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 px-3 py-2 border-2 border-black bg-white hover:bg-yellow-100 font-black uppercase text-xs shadow-[4px_4px_0_0_#000] active:translate-y-1 active:shadow-none"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Settings
          </Link>
          <div className="flex items-center gap-2 font-black uppercase text-sm">
            <ShieldCheck className="w-4 h-4" /> Request Admin Access
          </div>
        </div>

        <div className="bg-white border-2 border-black shadow-[8px_8px_0_0_#000] p-6 md:p-8 space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-black uppercase tracking-tight">
              Elevate to Admin
            </h1>
            <p className="text-sm font-bold text-neutral-600">
              Submit your admin request. We will validate your email against the
              pre-approved list or queue it for manual review.
            </p>
          </div>

          <div className="space-y-4">
            <label className="font-black uppercase text-xs text-neutral-500">
              Your email
            </label>
            <div className="flex items-center gap-3 border-2 border-black px-4 py-3 bg-neutral-50">
              <Mail className="w-4 h-4 text-neutral-500" />
              <span className="font-mono text-sm font-bold">
                {user?.email || "Not signed in"}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={sendRequest}
              disabled={disabled}
              className="inline-flex items-center gap-2 bg-black text-white px-5 py-3 border-2 border-black font-black uppercase text-sm tracking-wide shadow-[5px_5px_0_0_#000] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {status === "loading" ? (
                <>
                  Sending Request
                  <Loader2 className="w-4 h-4 animate-spin" />
                </>
              ) : (
                "Send Request"
              )}
            </button>

            {message && (
              <div className="flex items-start gap-2 text-sm font-bold text-neutral-700">
                <AlertCircle className="w-4 h-4 text-neutral-500" />
                <span>{message}</span>
              </div>
            )}
          </div>

          {status === "approved" && (
            <div className="space-y-3 border-2 border-yellow-300 bg-yellow-50 p-4">
              <div className="flex items-center gap-2 font-black text-sm uppercase text-yellow-800">
                <ShieldCheck className="w-4 h-4" /> Admin code sent to your
                email
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  className="w-full sm:w-48 border-2 border-black px-3 py-2 font-mono text-lg tracking-widest uppercase placeholder:text-neutral-300 focus:bg-white focus:shadow-[3px_3px_0_0_#000] outline-none"
                  placeholder="000000"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={verifying}
                  className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 border-2 border-black font-black uppercase text-xs tracking-wide shadow-[3px_3px_0_0_#000] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {verifying ? (
                    <>
                      Verifying
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </>
                  ) : (
                    "Verify Code"
                  )}
                </button>
              </div>
              <p className="text-xs font-bold text-neutral-700">
                Enter the 6-digit code to confirm your admin access.
              </p>
            </div>
          )}

          {status === "pending" && (
            <div className="flex items-center gap-2 text-sm font-bold text-blue-800 bg-blue-50 border-2 border-blue-200 px-3 py-2">
              <Check className="w-4 h-4" />
              Request recorded. We will notify you once approved.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

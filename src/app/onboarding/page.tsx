"use client";

import React, { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowRight,
  AlertCircle,
  Check,
  Loader2,
  Lock,
  Plus,
  ChevronRight,
  BookOpen,
  Dices,
  X,
  ArrowLeft,
  LogOut,
  HelpCircle,
  ShieldCheck,
} from "lucide-react";
import {
  getAvailableBatches,
  getBatchCurriculum,
} from "@/app/actions/onboarding";
import {
  checkUsernameAvailability,
  generateRandomUsername,
} from "@/app/actions/username";
import {
  BatchRecord,
  CourseRecord,
  CurriculumState,
} from "@/types/supabase-academic";
import { cn } from "@/lib/utils";
import { Drawer } from "@/components/ui/Drawer";
import { useAuth } from "@/context/AuthContext";
import { EVENTS, trackEvent } from "@/lib/analytics";
import { Switch } from "@/components/ui/Switch";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { verifyAdminCode } from "@/app/actions/admin";

import ProtectedRoute from "@/components/auth/ProtectedRoute";

const SKIPPED_COURSE: CourseRecord = {
  courseID: "SKIPPED",
  semesterID: 0,
  courseName: "Skipped",
  isElective: true,
  enrolledStudents: 0,
};

// ============================================
// MAIN PAGE WRAPPER
// ============================================

export default function OnboardingPage() {
  return (
    <ProtectedRoute>
      <OnboardingContent />
    </ProtectedRoute>
  );
}

// ============================================
// WIZARD CONTENT
// ============================================

function OnboardingContent() {
  const [step, setStep] = useState(1);
  const [isLoading, startTransition] = useTransition();
  const [initLoading, setInitLoading] = useState(true);

  const { user, logout } = useAuth(); // User is guaranteed here
  const supabase = useMemo(() => createClient(), []);

  // Data State
  const [batches, setBatches] = useState<Partial<BatchRecord>[]>([]);
  const [curriculum, setCurriculum] = useState<CurriculumState | null>(null);

  // User Selection State
  const [formData, setFormData] = useState({
    username: "",
    bio: "",
    batchID: "",
    selectedElectives: {} as Record<string, CourseRecord>, // Key: Category, Value: Course
  });

  // Drawer State
  const [activeSlotCategory, setActiveSlotCategory] = useState<string | null>(
    null,
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Username Verification State
  const [usernameStatus, setUsernameStatus] = useState<
    "IDLE" | "CHECKING" | "AVAILABLE" | "TAKEN"
  >("IDLE");
  const [usernameMessage, setUsernameMessage] = useState("");

  // Admin Request State
  const [wantsAdmin, setWantsAdmin] = useState(false);
  const [adminStatus, setAdminStatus] = useState<
    "idle" | "loading" | "approved" | "pending" | "error"
  >("idle");
  const [adminMessage, setAdminMessage] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [adminVerified, setAdminVerified] = useState(false);
  const [verifyingAdmin, setVerifyingAdmin] = useState(false);

  // Debounce Logic
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (formData.username.length > 2) {
        setUsernameStatus("CHECKING");
        const isAvailable = await checkUsernameAvailability(formData.username);
        setUsernameStatus(isAvailable ? "AVAILABLE" : "TAKEN");
        setUsernameMessage(
          isAvailable ? "Username is available" : "Username is taken",
        );
      } else {
        setUsernameStatus("IDLE");
        setUsernameMessage("");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.username]);

  const handleRandomize = async () => {
    setUsernameStatus("CHECKING");
    try {
      const newName = await generateRandomUsername();
      setFormData((prev) => ({ ...prev, username: newName }));
      // Username is pre-validated by generateRandomUsername, so mark as available
      setUsernameStatus("AVAILABLE");
      setUsernameMessage("Username is available");
    } catch (error) {
      console.error("Failed to generate username:", error);
      setUsernameStatus("IDLE");
      setUsernameMessage("Failed to generate username");
    }
  };

  const handleAdminToggle = async (checked: boolean) => {
    if (!user?.email) {
      toast.error("Sign in to request admin access.");
      return;
    }

    setAdminMessage("");
    setAdminCode("");
    setAdminVerified(false);

    if (!checked) {
      setWantsAdmin(false);
      setAdminStatus("idle");
      return;
    }

    setWantsAdmin(true);
    setAdminStatus("loading");
    setAdminMessage("Checking eligibility...");

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
        setAdminStatus("approved");
        setAdminMessage("Admin code sent to your email. Enter it below.");
        toast.success("Admin code sent to your email.");
      } else if (data?.status === "pending") {
        setAdminStatus("pending");
        setWantsAdmin(false);
        setAdminMessage(
          "Request submitted. You can continue as a student while we review.",
        );
        toast.info(
          "Your request has been submitted for review. You can continue as a Student for now.",
        );
      } else {
        const message = data?.message || "Invalid admin request.";
        setAdminStatus("error");
        setWantsAdmin(false);
        setAdminMessage(message);
        toast.error(message);
      }
    } catch (error) {
      console.error("[Admin Toggle] Failed to request admin code", error);
      setAdminStatus("error");
      setWantsAdmin(false);
      setAdminMessage("Unable to process admin request right now.");
      toast.error("Could not process admin request. Please try again.");
    }
  };

  const handleVerifyAdminCode = async () => {
    if (!adminCode) {
      toast.error("Enter the code sent to your email.");
      return;
    }

    try {
      setVerifyingAdmin(true);
      const result = await verifyAdminCode(adminCode.trim());
      if (result.success) {
        setAdminVerified(true);
        toast.success("Admin verified. Welcome aboard.");
      } else {
        setAdminVerified(false);
        toast.error(result.message || "Invalid verification code.");
      }
    } catch (error) {
      console.error("[Admin Verification] Failed", error);
      setAdminVerified(false);
      toast.error("Could not verify the admin code. Try again.");
    } finally {
      setVerifyingAdmin(false);
    }
  };

  // Fetch batches on mount
  useEffect(() => {
    async function init() {
      if (user) {
        try {
          const data = await getAvailableBatches();
          setBatches(data);
        } catch (error) {
          console.error("Batch fetch failed", error);
        }
        setInitLoading(false);
      }
    }
    init();
  }, [user]);

  const handleNext = async () => {
    if (step === 2 && formData.batchID) {
      // Transition from Batch Select -> Course Select
      startTransition(async () => {
        if (!user) return;
        const result = await getBatchCurriculum(formData.batchID);
        if (result) {
          setCurriculum(result);
          setStep(3);
        } else {
          alert("Failed to load curriculum. Please try again.");
        }
      });
    } else if (step === 3) {
      alert("Onboarding Complete! Saving data...");
      console.log("Final Data:", formData);

      // Calculate elective count
      const electiveCount = Object.keys(formData.selectedElectives).length;
      trackEvent(EVENTS.ONBOARDING_COMPLETE, {
        department: "Unknown", // Ideally fetch from batch, but batchID is available
        batchID: formData.batchID,
        electives_count: electiveCount,
      });
    } else {
      if (step === 1) trackEvent("onboarding_step_1_complete");
      if (step === 2)
        trackEvent("onboarding_batch_selected", { batchID: formData.batchID });
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      logout();
    }
  };

  // Helper to check validity
  const isStepValid = () => {
    if (step === 1) {
      const baseValid =
        formData.username.length > 2 && usernameStatus === "AVAILABLE";
      const requiresAdminOtp =
        wantsAdmin && adminStatus === "approved" && !adminVerified;

      if (adminStatus === "loading") return false;

      return baseValid && !requiresAdminOtp;
    }
    if (step === 2) return !!formData.batchID;
    if (step === 3 && curriculum) {
      // Must select a course for EVERY slot
      return curriculum.electiveSlots.every(
        (slot) => !!formData.selectedElectives[slot.category],
      );
    }
    return true;
  };

  const handleSelectElective = (category: string, course: CourseRecord) => {
    setFormData((prev) => ({
      ...prev,
      selectedElectives: {
        ...prev.selectedElectives,
        [category]: course,
      },
    }));
    setIsDrawerOpen(false);
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center relative font-sans">
      {/* BACKGROUND PATTERN */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(#00000026_1px,transparent_1px)] bg-size-[20px_20px] pointer-events-none opacity-50" />

      {/* 1. HEADER (Top Bar) */}
      <header className="sticky top-0 w-full h-16 border-b-2 border-black bg-white/95 backdrop-blur z-50 px-6 md:px-12 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2 text-black">
          <ShieldCheck className="w-6 h-6 stroke-[3px]" />
          <span className="font-black text-2xl uppercase tracking-tighter">
            Attendrix
          </span>
        </div>

        {/* Help Actions */}
        <div className="flex items-center gap-6">
          <span className="hidden md:inline font-bold text-sm text-neutral-500">
            Having Trouble?
          </span>

          <a
            href="mailto:support@attendrix.app"
            className="font-bold text-sm hover:text-neutral-600 flex items-center gap-2"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Support</span>
          </a>
        </div>
      </header>

      {/* MAIN CONTENT WRAPPER */}
      <main className="flex-1 w-full max-w-2xl px-4 py-12 flex flex-col items-center justify-center relative z-10">
        {/* 2. NAVIGATION TOOLBAR */}
        <div className="w-full flex items-center justify-between mb-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 font-bold uppercase text-xs md:text-sm hover:bg-[#FFD02F] px-3 py-1.5 border-2 border-transparent hover:border-black transition-all bg-white/80 backdrop-blur-sm"
          >
            {step === 1 ? (
              <>
                <LogOut className="w-4 h-4" /> Log Out
              </>
            ) : (
              <>
                <ArrowLeft className="w-4 h-4" /> Previous Step
              </>
            )}
          </button>
          <div className="font-mono font-bold bg-black text-white px-3 py-1 text-xs">
            STEP {step} OF 3
          </div>
        </div>

        {/* 1.5. PROGRESS BAR (Original) */}
        <div className="w-full mb-8">
          <div className="h-4 border-2 border-black bg-white p-0.5 shadow-[4px_4px_0px_0px_#000]">
            <div
              className="h-full bg-[#FFD02F] transition-all duration-500 ease-out border-r-2 border-black"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* 3. CARD CONTAINER (Existing) */}
        <div className="w-full bg-white border-2 border-black shadow-[8px_8px_0px_0px_#000] overflow-hidden min-h-[400px] flex flex-col">
          {/* Header */}
          <div className="bg-black text-white p-6 border-b-2 border-black flex items-center gap-4">
            <div className="w-10 h-10 bg-[#FFD02F] text-black flex items-center justify-center font-black border-2 border-white shadow-[4px_4px_0px_0px_#fff]">
              {step}
            </div>
            <div>
              <h1 className="font-black uppercase text-2xl tracking-tight leading-none">
                {step === 1 && "Who are you?"}
                {step === 2 && "Academic Context"}
                {step === 3 && "Course Selection"}
              </h1>
              <p className="text-neutral-400 text-sm font-bold mt-1">
                {step === 1 && "Set up your public profile"}
                {step === 2 && "Select your current batch"}
                {step === 3 && "Review subjects & pick electives"}
              </p>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-6 md:p-12 flex-1 relative">
            {initLoading && step === 1 ? (
              <div className="flex justify-center items-center h-48">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : (
              <>
                {/* STEP 1: IDENTITY */}
                {step === 1 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="space-y-2">
                      <label className="font-black uppercase text-sm">
                        CHOOSE YOUR ALIAS
                      </label>
                      <div className="relative flex gap-2">
                        <div className="relative w-full">
                          <input
                            type="text"
                            className={cn(
                              "w-full h-14 border-2 p-4 font-bold text-lg focus:shadow-[4px_4px_0px_0px_#000] outline-none transition-all placeholder:text-neutral-300 pr-12",
                              usernameStatus === "TAKEN"
                                ? "border-red-500 bg-red-50 focus:bg-white"
                                : usernameStatus === "AVAILABLE"
                                  ? "border-green-500 bg-green-50 focus:bg-white"
                                  : "border-black focus:bg-yellow-50",
                            )}
                            placeholder="e.g. NeoDev"
                            value={formData.username}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                username: e.target.value,
                              })
                            }
                          />
                          {/* Status Icon Indicator */}
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                            {usernameStatus === "CHECKING" && (
                              <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
                            )}
                            {usernameStatus === "AVAILABLE" && (
                              <Check className="w-6 h-6 text-green-600 stroke-[3px]" />
                            )}
                            {usernameStatus === "TAKEN" && (
                              <X className="w-6 h-6 text-red-600 stroke-[3px]" />
                            )}
                          </div>
                        </div>

                        <button
                          onClick={handleRandomize}
                          className="h-14 w-14 bg-black text-white border-2 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_#000] hover:bg-neutral-800 active:translate-y-1 active:shadow-none transition-all"
                          title="Generate Random Username"
                        >
                          <Dices className="w-6 h-6" />
                        </button>
                      </div>

                      {/* Status Text */}
                      <div className="min-h-[18px]">
                        {usernameMessage && (
                          <p
                            className={`text-xs font-bold uppercase tracking-wide ${
                              usernameStatus === "AVAILABLE"
                                ? "text-green-600"
                                : usernameStatus === "TAKEN"
                                  ? "text-red-600"
                                  : "text-neutral-600"
                            }`}
                          >
                            {usernameMessage}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="font-black uppercase text-sm">
                        Bio (Optional)
                      </label>
                      <textarea
                        className="w-full h-32 border-2 border-black p-4 font-bold text-lg focus:shadow-[4px_4px_0px_0px_#000] focus:bg-yellow-50 outline-none transition-all placeholder:text-neutral-300 resize-none"
                        placeholder="I code stuff..."
                        value={formData.bio}
                        onChange={(e) =>
                          setFormData({ ...formData, bio: e.target.value })
                        }
                      />
                    </div>

                    <div className="border-2 border-dashed border-black/20 bg-neutral-50 p-4 md:p-5 space-y-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1">
                          <p className="font-black uppercase text-sm flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4" /> Admin / Batch
                            Representative
                          </p>
                          <p className="text-xs font-bold text-neutral-600">
                            Toggle if you manage attendance for your batch.
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={wantsAdmin}
                            onCheckedChange={handleAdminToggle}
                            disabled={adminStatus === "loading"}
                            aria-label="I am a Batch Representative / Admin"
                          />
                          <span className="text-xs font-black uppercase tracking-wide text-neutral-700">
                            I am a Batch Representative / Admin
                          </span>
                        </div>
                      </div>

                      {adminStatus === "loading" && (
                        <div className="flex items-center gap-2 text-sm font-bold text-neutral-600">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Checking eligibility...
                        </div>
                      )}

                      {adminStatus === "pending" && (
                        <div className="flex items-center gap-2 text-sm font-bold text-blue-800 bg-blue-50 border-2 border-blue-200 px-3 py-2">
                          <AlertCircle className="w-4 h-4" />
                          Your request has been submitted for review. Continue
                          as a student for now.
                        </div>
                      )}

                      {adminStatus === "approved" && (
                        <div className="space-y-2 bg-yellow-50 border-2 border-yellow-300 p-3">
                          <div className="flex items-center gap-2 font-black text-sm uppercase text-yellow-800">
                            <ShieldCheck className="w-4 h-4" />
                            Admin code sent to your email
                          </div>
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <input
                              className="w-full sm:w-48 border-2 border-black px-3 py-2 font-mono text-lg tracking-widest uppercase placeholder:text-neutral-300 focus:bg-white focus:shadow-[3px_3px_0_0_#000] outline-none"
                              placeholder="000000"
                              maxLength={6}
                              value={adminCode}
                              onChange={(e) => setAdminCode(e.target.value)}
                            />
                            <button
                              type="button"
                              onClick={handleVerifyAdminCode}
                              disabled={verifyingAdmin}
                              className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 border-2 border-black font-black uppercase text-xs tracking-wide shadow-[3px_3px_0_0_#000] disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {verifyingAdmin ? (
                                <>
                                  Verifying
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                </>
                              ) : (
                                "Verify Code"
                              )}
                            </button>
                          </div>
                          {adminVerified ? (
                            <p className="text-green-700 text-xs font-bold flex items-center gap-2">
                              <Check className="w-4 h-4" /> Verified. You can
                              proceed as admin.
                            </p>
                          ) : (
                            <p className="text-xs font-bold text-neutral-700">
                              Enter the 6-digit code to continue as admin.
                            </p>
                          )}
                        </div>
                      )}

                      {adminMessage && adminStatus !== "approved" && (
                        <div className="text-xs font-bold text-neutral-600">
                          {adminMessage}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* STEP 2: ACADEMIC CONTEXT */}
                {step === 2 && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="space-y-4">
                      <label className="font-black uppercase text-sm">
                        Select Your Batch
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {batches.map((batch) => (
                          <button
                            key={batch.batchID}
                            onClick={() =>
                              setFormData({
                                ...formData,
                                batchID: batch.batchID!,
                                selectedElectives: {},
                              })
                            }
                            className={cn(
                              "border-2 border-black p-4 text-left hover:shadow-[4px_4px_0px_0px_#000] transition-all flex flex-col gap-1 active:translate-y-1 active:shadow-none",
                              formData.batchID === batch.batchID
                                ? "bg-[#FFD02F] shadow-[4px_4px_0px_0px_#000]"
                                : "bg-white",
                            )}
                          >
                            <span className="font-black uppercase text-xl">
                              {batch.semester_name}
                            </span>
                            <span className="font-bold text-sm text-neutral-600 font-mono">
                              Code: {batch.batchCode}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: COURSE SELECTION (SLOTS) */}
                {step === 3 && curriculum && (
                  <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Core Subjects */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 border-b-2 border-black pb-2">
                        <Lock className="w-5 h-5" />
                        <h3 className="font-black uppercase text-lg">
                          Core Subjects (Locked)
                        </h3>
                      </div>
                      <div className="grid gap-3">
                        {curriculum.core.map((course) => (
                          <div
                            key={course.courseID}
                            className="border-2 border-black bg-neutral-100 p-4 flex justify-between items-center opacity-80"
                          >
                            <div>
                              <h4 className="font-bold uppercase leading-tight">
                                {course.courseName}
                              </h4>
                              <p className="font-mono text-xs text-neutral-500 mt-1">
                                {course.courseID}
                              </p>
                            </div>
                            <Lock className="w-4 h-4 text-neutral-400" />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Elective Slots */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 border-b-2 border-black pb-2">
                        <BookOpen className="w-5 h-5" />
                        <h3 className="font-black uppercase text-lg">
                          Elective Choices
                        </h3>
                      </div>

                      {curriculum.electiveSlots.length > 0 ? (
                        <div className="grid gap-4">
                          {curriculum.electiveSlots.map((slot) => {
                            const selectedCourse =
                              formData.selectedElectives[slot.category];
                            return (
                              <div key={slot.category}>
                                {/* Slot Trigger */}
                                <button
                                  onClick={() => {
                                    setActiveSlotCategory(slot.category);
                                    setIsDrawerOpen(true);
                                  }}
                                  className={cn(
                                    "w-full border-2 p-5 text-left flex justify-between items-center transition-all group active:translate-y-1",
                                    selectedCourse
                                      ? "bg-[#FFD02F] border-black shadow-[4px_4px_0px_0px_#000] active:shadow-none"
                                      : "bg-white border-dashed border-neutral-400 hover:border-black hover:bg-neutral-50",
                                  )}
                                >
                                  <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-neutral-500 mb-1">
                                      Elective Category: {slot.category}
                                    </p>
                                    <h4
                                      className={cn(
                                        "font-bold uppercase text-lg",
                                        selectedCourse
                                          ? "text-black"
                                          : "text-neutral-400",
                                      )}
                                    >
                                      {selectedCourse
                                        ? selectedCourse.courseID === "SKIPPED"
                                          ? "Skipped"
                                          : selectedCourse.courseName
                                        : "Select Course..."}
                                    </h4>
                                  </div>
                                  <div
                                    className={cn(
                                      "w-8 h-8 flex items-center justify-center border-2 border-transparent rounded-full transition-colors",
                                      selectedCourse
                                        ? selectedCourse.courseID === "SKIPPED"
                                          ? "bg-neutral-200 text-neutral-500 border-neutral-300"
                                          : "bg-black text-white border-black"
                                        : "bg-neutral-200 text-neutral-400 group-hover:bg-white group-hover:border-black group-hover:text-black",
                                    )}
                                  >
                                    {selectedCourse ? (
                                      selectedCourse.courseID === "SKIPPED" ? (
                                        <X className="w-5 h-5" />
                                      ) : (
                                        <Check className="w-5 h-5" />
                                      )
                                    ) : (
                                      <Plus className="w-5 h-5" />
                                    )}
                                  </div>
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-6 bg-neutral-100 text-center font-bold text-neutral-500">
                          No electives required for this batch.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Actions (In Card) */}
          <div className="p-6 border-t-2 border-black bg-neutral-50 flex justify-end items-center">
            {/* Note: Previous Removed as it's now in top toolbar */}

            <button
              onClick={handleNext}
              disabled={!isStepValid() || isLoading}
              className="bg-black text-white border-2 border-black px-8 py-3 font-black uppercase tracking-wide shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] active:translate-y-1 active:shadow-none hover:bg-neutral-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  Loading <Loader2 className="w-4 h-4 animate-spin" />
                </>
              ) : (
                <>
                  {step === 3 ? "Complete Setup" : "Next Step"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* 4. FOOTER */}
        <footer className="mt-12 text-center text-xs font-bold text-neutral-500 uppercase tracking-widest">
          <p>© {new Date().getFullYear()} Attendrix. Your data is secure.</p>
          <div className="flex justify-center gap-4 mt-2">
            <Link
              href="/legal/terms"
              className="hover:text-black transition-colors"
            >
              Terms
            </Link>
            <span>•</span>
            <Link
              href="/legal/privacy"
              className="hover:text-black transition-colors"
            >
              Privacy Policy
            </Link>
          </div>
        </footer>
      </main>

      {/* DRAWER FOR SELECTION */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <Drawer.Content className="bg-white border-t-4 border-black">
          <div className="max-w-2xl mx-auto w-full">
            <Drawer.Header>
              <Drawer.Title className="font-black uppercase text-2xl">
                Select {activeSlotCategory} Elective
              </Drawer.Title>
              <Drawer.Description className="font-bold text-neutral-500">
                Choose one course to fill this slot.
              </Drawer.Description>
            </Drawer.Header>
            <div className="p-4 pb-12 space-y-2 max-h-[60vh] overflow-y-auto">
              <button
                onClick={() =>
                  handleSelectElective(activeSlotCategory!, SKIPPED_COURSE)
                }
                className="w-full text-left p-4 border-2 border-dashed border-neutral-300 bg-neutral-50 hover:bg-neutral-100 hover:border-neutral-400 flex justify-between items-center group transition-colors mb-4"
              >
                <div>
                  <h4 className="font-bold uppercase text-lg text-neutral-500 group-hover:text-neutral-700">
                    Skip Selection
                  </h4>
                  <p className="font-mono text-xs text-neutral-400">
                    Don&apos;t choose an elective for this slot
                  </p>
                </div>
                <X className="w-5 h-5 text-neutral-300 group-hover:text-neutral-500" />
              </button>

              <div className="w-full h-px bg-neutral-200 my-4" />

              {activeSlotCategory &&
                curriculum?.electiveSlots
                  .find((s) => s.category === activeSlotCategory)
                  ?.availableCourses.map((course) => (
                    <button
                      key={course.courseID}
                      onClick={() =>
                        handleSelectElective(activeSlotCategory, course)
                      }
                      className="w-full text-left p-4 border-b-2 border-neutral-100 hover:bg-yellow-50 flex justify-between items-center group transition-colors"
                    >
                      <div>
                        <h4 className="font-bold uppercase text-lg group-hover:text-black text-neutral-800">
                          {course.courseName}
                        </h4>
                        <p className="font-mono text-xs text-neutral-500">
                          {course.courseID} • {course.credits} Credits
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-neutral-300 group-hover:text-black" />
                    </button>
                  ))}
              {activeSlotCategory &&
                curriculum?.electiveSlots.find(
                  (s) => s.category === activeSlotCategory,
                )?.availableCourses.length === 0 && (
                  <div className="p-8 text-center text-neutral-400 font-bold">
                    No courses available for this category yet.
                  </div>
                )}
            </div>
          </div>
        </Drawer.Content>
      </Drawer>
    </div>
  );
}

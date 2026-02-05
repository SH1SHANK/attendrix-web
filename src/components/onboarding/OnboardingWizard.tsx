"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useOnboarding } from "@/context/OnboardingContext";
import {
  useAvailableBatches,
  useBatchOnboardingData,
} from "@/hooks/useOnboardingData";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { checkUsernameAvailability, setUsername } from "@/app/actions/username";
import { finalizeOnboarding } from "@/app/actions/onboarding";
import { getUsernameError } from "@/lib/onboarding/username";
import { formatBatchLabel } from "@/lib/onboarding/batch";
import { getCourseCategory, isLabCourse } from "@/lib/onboarding/course-utils";
import * as authUtils from "@/lib/auth-utils";
import { Progress } from "@/components/ui/Progress";
import { toast } from "sonner";
import type { CourseRecord } from "@/types/supabase-academic";
import OnboardingStepUsername from "@/components/onboarding/OnboardingStepUsername";
import OnboardingStepIdentity from "@/components/onboarding/OnboardingStepIdentity";
import OnboardingStepCourses from "@/components/onboarding/OnboardingStepCourses";
import OnboardingStepComplete from "@/components/onboarding/OnboardingStepComplete";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const steps = [
  { id: "username", label: "Username" },
  { id: "identity", label: "Academic" },
  { id: "courses", label: "Courses" },
  { id: "complete", label: "Complete" },
] as const;

interface Props {
  nextPath?: string;
}

export default function OnboardingWizard({ nextPath }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const { state, dispatch } = useOnboarding();
  const [usernameSaving, startUsernameTransition] = useTransition();
  const [finalizing, startFinalizing] = useTransition();
  const [completionSummary, setCompletionSummary] = useState({
    batchLabel: "",
    semesterLabel: "",
    coursesCount: 0,
  });

  const debouncedUsername = useDebouncedValue(state.username, 400);
  const usernameError = getUsernameError(state.username);

  const usernameCheck = useMemo(() => {
    return !usernameError && debouncedUsername.length >= 3;
  }, [usernameError, debouncedUsername]);

  const availabilityQuery = useMemo(() => {
    return {
      enabled: Boolean(usernameCheck),
      queryKey: ["onboarding", "username", debouncedUsername.toLowerCase()],
    };
  }, [usernameCheck, debouncedUsername]);

  const { data: isAvailable, isFetching: isChecking } = useQuery({
    queryKey: availabilityQuery.queryKey,
    queryFn: async () => {
      const [, , username] = availabilityQuery.queryKey as [
        string,
        string,
        string,
      ];
      return checkUsernameAvailability(username);
    },
    enabled: availabilityQuery.enabled,
    staleTime: 60 * 1000,
  });

  const {
    data: batches,
    isLoading: batchesLoading,
    isError: batchesError,
    refetch: refetchBatches,
  } = useAvailableBatches();

  const {
    data: batchData,
    isLoading: batchLoading,
    isError: batchError,
    refetch: refetchBatch,
  } = useBatchOnboardingData(state.batchID);

  const batchUnavailable = !batchLoading && !batchError && !batchData;

  const currentStepIndex = steps.findIndex((step) => step.id === state.step);
  const progressValue =
    currentStepIndex <= 0
      ? 0
      : Math.round((currentStepIndex / (steps.length - 1)) * 100);

  useEffect(() => {
    if (!state.username) {
      dispatch({ type: "SET_USERNAME_STATUS", value: "idle" });
      return;
    }

    if (usernameError) {
      dispatch({
        type: "SET_USERNAME_STATUS",
        value: usernameError.includes("reserved") ? "reserved" : "invalid",
      });
      return;
    }

    if (isChecking) {
      dispatch({ type: "SET_USERNAME_STATUS", value: "checking" });
      return;
    }

    if (typeof isAvailable === "boolean") {
      dispatch({
        type: "SET_USERNAME_STATUS",
        value: isAvailable ? "available" : "taken",
      });
    }
  }, [state.username, usernameError, isChecking, isAvailable, dispatch]);

  const labCategories = useMemo(() => {
    return (batchData?.batch.electiveCatalog || []).filter((category) =>
      category.toUpperCase().startsWith("LAB"),
    );
  }, [batchData]);

  const electiveCategories = useMemo(() => {
    return (batchData?.batch.electiveCatalog || []).filter(
      (category) => !category.toUpperCase().startsWith("LAB"),
    );
  }, [batchData]);

  const labGroups = useMemo(() => {
    if (!batchData)
      return [] as { category: string; courses: CourseRecord[] }[];
    return labCategories.map((category) => {
      const target = category.toUpperCase();
      const courses = batchData.electiveCourses.filter((course) => {
        if (!isLabCourse(course)) return false;
        const courseCategory = getCourseCategory(course).toUpperCase();
        const scope = Array.isArray(course.electiveScope)
          ? course.electiveScope.map((item) => item.toUpperCase())
          : [];
        return courseCategory === target || scope.includes(target);
      });
      return { category, courses };
    });
  }, [batchData, labCategories]);

  const electiveGroups = useMemo(() => {
    if (!batchData)
      return [] as { category: string; courses: CourseRecord[] }[];
    return electiveCategories.map((category) => {
      const target = category.toUpperCase();
      const courses = batchData.electiveCourses.filter((course) => {
        if (isLabCourse(course)) return false;
        const courseCategory = getCourseCategory(course).toUpperCase();
        const scope = Array.isArray(course.electiveScope)
          ? course.electiveScope.map((item) => item.toUpperCase())
          : [];
        return courseCategory === target || scope.includes(target);
      });
      return { category, courses };
    });
  }, [batchData, electiveCategories]);

  const requiredLabsSelected = labCategories.every((category) =>
    Boolean(state.labSelections[category]),
  );
  const hasCoreCourses = (batchData?.coreCourses?.length || 0) > 0;

  const canComplete =
    !batchLoading &&
    !batchError &&
    !batchUnavailable &&
    hasCoreCourses &&
    requiredLabsSelected &&
    !finalizing;

  const onContinueUsername = () => {
    if (state.usernameStatus !== "available") return;
    startUsernameTransition(async () => {
      const result = await setUsername(state.username);
      if (!result.success) {
        toast.error(result.message || "Failed to save username");
        return;
      }
      dispatch({ type: "NEXT_STEP" });
    });
  };

  const onContinueIdentity = () => {
    dispatch({ type: "NEXT_STEP" });
  };

  const onFinalize = () => {
    if (!batchData) {
      toast.error("Select a batch to continue");
      return;
    }

    if (!state.consentTerms) {
      toast.error("Accept the Terms to continue");
      return;
    }

    if (!hasCoreCourses) {
      toast.error("Core courses are missing for this batch");
      return;
    }

    if (!requiredLabsSelected) {
      toast.error("Select a lab slot for each required lab category");
      return;
    }

    const coreCourseIDs = batchData.coreCourses.map(
      (course) => course.courseID,
    );
    const labCourseIDs = Object.values(state.labSelections).filter(Boolean);
    const electiveCourseIDs = state.skipElectives
      ? []
      : Object.values(state.electiveSelections).filter(Boolean);

    startFinalizing(async () => {
      const result = await finalizeOnboarding({
        username: state.username,
        batchID: batchData.batch.batchID,
        semesterID:
          state.semesterID ||
          (batchData.batch.semester ? String(batchData.batch.semester) : ""),
        coreCourseIDs,
        labCourseIDs,
        electiveCourseIDs,
        consentTerms: state.consentTerms,
        consentPromotions: state.consentPromotions,
      });

      if (!result.success) {
        toast.error(result.message || "Onboarding failed");
        return;
      }

      const batchLabel = formatBatchLabel({
        batchID: batchData.batch.batchID,
        semester: batchData.batch.semester,
      });

      setCompletionSummary({
        batchLabel,
        semesterLabel: batchData.batch.semester
          ? `Semester ${batchData.batch.semester}`
          : state.semesterID
            ? `Semester ${state.semesterID}`
            : "Semester —",
        coursesCount: result.data?.coursesCount || coreCourseIDs.length,
      });

      if (user?.uid) {
        authUtils.setOnboardingCache?.(user.uid, true);
      }

      dispatch({ type: "SET_STEP", step: "complete" });
    });
  };

  const onFinish = () => {
    dispatch({ type: "RESET" });
    router.push(nextPath ?? "/dashboard");
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-yellow-50 via-orange-50 to-pink-50 relative overflow-hidden">
      {/* Decorative Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#00000008_1px,transparent_1px)] bg-size-[32px_32px] pointer-events-none opacity-50" />

      {/* Decorative Shapes - Hidden on mobile for cleaner look */}
      <motion.div
        className="hidden md:block absolute top-20 right-20 w-20 h-20 md:w-32 md:h-32 bg-cyan-400 border-4 border-black"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="hidden md:block absolute bottom-40 left-10 w-16 h-16 md:w-24 md:h-24 bg-pink-400 border-4 border-black rounded-full"
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Main Container */}
      <div className="relative z-10 w-full min-h-screen flex flex-col">
        {/* HEADER - Fixed at top with proper back navigation */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white border-b-4 border-black shadow-[0_4px_0_#0a0a0a] px-4 sm:px-6 py-4"
        >
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between gap-4 mb-3">
              {/* Back Button & Title */}
              <div className="flex items-center gap-3">
                {currentStepIndex > 0 && (
                  <button
                    onClick={() => dispatch({ type: "PREV_STEP" })}
                    className="p-2 border-2 border-black bg-white hover:bg-yellow-400 transition-colors shadow-[3px_3px_0_#0a0a0a] hover:shadow-[4px_4px_0_#0a0a0a] hover:-translate-x-0.5 hover:-translate-y-0.5 active:shadow-[2px_2px_0_#0a0a0a] active:translate-x-0.5 active:translate-y-0.5"
                    aria-label="Go back"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                )}
                <div>
                  <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black">
                    {steps[currentStepIndex]?.label || "Onboarding"}
                  </h1>
                  <p className="text-xs sm:text-sm font-bold text-neutral-600">
                    Step {currentStepIndex + 1} of {steps.length}
                  </p>
                </div>
              </div>

              {/* Horizontal Stepper - Visible on all screen sizes */}
              <div className="flex gap-2 shrink-0">
                {steps.map((step, index) => (
                  <motion.div
                    key={step.id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      "w-8 h-8 sm:w-10 sm:h-10 border-2 sm:border-3 border-black flex items-center justify-center font-black text-xs sm:text-sm transition-all duration-300",
                      index < currentStepIndex
                        ? "bg-black text-white shadow-[2px_2px_0_#0a0a0a]"
                        : index === currentStepIndex
                          ? "bg-yellow-400 text-black shadow-[3px_3px_0_#0a0a0a]"
                          : "bg-white text-neutral-400 shadow-[2px_2px_0_#0a0a0a]",
                    )}
                    title={step.label}
                    aria-label={`${step.label} - ${index < currentStepIndex ? "Complete" : index === currentStepIndex ? "Current" : "Upcoming"}`}
                  >
                    {index < currentStepIndex ? "✓" : index + 1}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Progress Bar */}
            <Progress value={progressValue} className="h-2 bg-neutral-200" />
          </div>
        </motion.header>

        {/* MAIN CONTENT - Centered and scrollable */}
        <main className="flex-1 flex items-start justify-center px-4 py-6 sm:py-8 overflow-y-auto">
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="w-full max-w-4xl mb-6"
          >
            <div className="border-3 sm:border-4 border-black bg-white shadow-[8px_8px_0_#0a0a0a] sm:shadow-[12px_12px_0_#0a0a0a] p-4 sm:p-6">
              <AnimatePresence mode="wait">
                {state.step === "username" && (
                  <motion.div
                    key="username"
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    <OnboardingStepUsername
                      username={state.username}
                      status={state.usernameStatus}
                      errorMessage={usernameError}
                      onUsernameChange={(value) =>
                        dispatch({ type: "SET_USERNAME", value })
                      }
                      onContinue={onContinueUsername}
                      isSaving={usernameSaving}
                    />
                  </motion.div>
                )}

                {state.step === "identity" && (
                  <motion.div
                    key="identity"
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    <OnboardingStepIdentity
                      batches={batches || []}
                      selectedBatchID={state.batchID}
                      consentTerms={state.consentTerms}
                      consentPromotions={state.consentPromotions}
                      isLoading={batchesLoading}
                      isError={batchesError}
                      onRetry={() => refetchBatches()}
                      onSelectBatch={(batchID, semesterID) =>
                        dispatch({ type: "SET_BATCH", batchID, semesterID })
                      }
                      onToggleTerms={(value) =>
                        dispatch({ type: "SET_CONSENT_TERMS", value })
                      }
                      onTogglePromotions={(value) =>
                        dispatch({ type: "SET_CONSENT_PROMOS", value })
                      }
                      onContinue={onContinueIdentity}
                      onBack={() => dispatch({ type: "PREV_STEP" })}
                    />
                  </motion.div>
                )}

                {state.step === "courses" && (
                  <motion.div
                    key="courses"
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    <OnboardingStepCourses
                      coreCourses={batchData?.coreCourses || []}
                      labGroups={labGroups}
                      electiveGroups={electiveGroups}
                      labSelections={state.labSelections}
                      electiveSelections={state.electiveSelections}
                      skipElectives={state.skipElectives}
                      isLoading={batchLoading}
                      isError={batchError || batchUnavailable}
                      onRetry={() => refetchBatch()}
                      onSelectLab={(category, courseID) =>
                        dispatch({
                          type: "SET_LAB_SELECTION",
                          category,
                          courseID,
                        })
                      }
                      onSelectElective={(category, courseID) =>
                        dispatch({
                          type: "SET_ELECTIVE_SELECTION",
                          category,
                          courseID,
                        })
                      }
                      onToggleSkipElectives={(value) =>
                        dispatch({ type: "SET_SKIP_ELECTIVES", value })
                      }
                      onBack={() => dispatch({ type: "PREV_STEP" })}
                      onComplete={onFinalize}
                      isSubmitting={finalizing}
                      canComplete={canComplete}
                    />
                  </motion.div>
                )}

                {state.step === "complete" && (
                  <motion.div
                    key="complete"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  >
                    <OnboardingStepComplete
                      batchLabel={completionSummary.batchLabel}
                      semesterLabel={completionSummary.semesterLabel}
                      coursesCount={completionSummary.coursesCount}
                      onFinish={onFinish}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { NeoBrutalButton } from "@/components/ui/NeoBrutalButton";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { formatBatchLabel } from "@/lib/onboarding/batch";
import type { BatchRecord } from "@/types/supabase-academic";
import { motion, MotionConfig } from "framer-motion";
import { Shield, Mail } from "lucide-react";

interface Props {
  batches: Partial<BatchRecord>[];
  selectedBatchID: string | null;
  consentTerms: boolean;
  consentPromotions: boolean;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onSelectBatch: (batchID: string, semesterID: string | null) => void;
  onToggleTerms: (value: boolean) => void;
  onTogglePromotions: (value: boolean) => void;
  onContinue: () => void;
  onBack: () => void;
}

export default function OnboardingStepIdentity({
  batches,
  selectedBatchID,
  consentTerms,
  consentPromotions,
  isLoading,
  isError,
  onRetry,
  onSelectBatch,
  onToggleTerms,
  onTogglePromotions,
  onContinue,
  onBack,
}: Props) {
  const selectableBatches = batches.filter((batch) => batch.batchID);
  const selectedBatch = selectableBatches.find(
    (batch) => batch.batchID === selectedBatchID,
  );
  const selectedLabel = selectedBatch
    ? formatBatchLabel({
        batchID: selectedBatch.batchID || "",
        semester: selectedBatch.semester,
      })
    : null;

  const handleBatchChange = (value: string) => {
    const target = selectableBatches.find((batch) => batch.batchID === value);
    onSelectBatch(value, target?.semester ? String(target.semester) : null);
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="space-y-2 sm:space-y-3 md:space-y-4">
        {/* Header */}
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="space-y-1 sm:space-y-2"
        >
          <h2 className="font-display text-lg sm:text-xl font-black uppercase tracking-tight text-black text-balance">
            Academic Information
          </h2>
          <p className="text-xs sm:text-sm font-semibold text-neutral-600 bg-neutral-50 border-2 border-black p-2 sm:p-3">
            Select your batch to access your academic profile
          </p>
        </motion.div>

        {/* Batch Selection */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="space-y-2"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-black uppercase tracking-tight text-black text-balance">
              Select your batch
            </h3>
            {isError && (
              <button
                onClick={onRetry}
                className="text-xs font-bold uppercase tracking-wide text-red-600 underline hover:text-red-700 touch-manipulation"
              >
                Retry
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="h-12 sm:h-14 bg-gradient-to-r from-neutral-100 to-neutral-200 border-2 sm:border-3 border-black animate-pulse shadow-[3px_3px_0_#0a0a0a] sm:shadow-[4px_4px_0_#0a0a0a]" />
          ) : (
            <div className="space-y-2">
              {selectableBatches.length === 0 ? (
                <div className="border-2 sm:border-3 border-black bg-red-50 p-3 sm:p-4 text-center shadow-[3px_3px_0_#0a0a0a] sm:shadow-[4px_4px_0_#0a0a0a]">
                  <p className="text-xs sm:text-sm font-bold text-red-600 uppercase">
                    ⚠️ No batches available
                  </p>
                </div>
              ) : (
                <>
                  <Select
                    value={selectedBatchID || undefined}
                    onValueChange={handleBatchChange}
                  >
                    <Select.Trigger
                      aria-label="Select batch"
                      className="w-full h-12 sm:h-14 rounded-none border-2 sm:border-3 border-black bg-white px-3 sm:px-4 font-black uppercase text-xs sm:text-sm tracking-wide shadow-[3px_3px_0_#0a0a0a] cursor-pointer touch-manipulation hover:bg-neutral-50 hover:shadow-[4px_4px_0_#0a0a0a] focus-visible:bg-neutral-50 focus-visible:shadow-[6px_6px_0_#0a0a0a]"
                    >
                      <Select.Value placeholder="Select batch (e.g. ME02 · Semester 4)…" />
                    </Select.Trigger>
                    <Select.Content className="rounded-none border-2 sm:border-3 border-black bg-white shadow-[4px_4px_0_#0a0a0a]">
                      {selectableBatches.map((batch) => {
                        const label = formatBatchLabel({
                          batchID: batch.batchID || "",
                          semester: batch.semester,
                        });
                        return (
                          <Select.Item
                            key={batch.batchID}
                            value={batch.batchID || ""}
                            textValue={label}
                            className="cursor-pointer border-b-2 border-black last:border-b-0 py-2 px-3 text-xs sm:text-sm font-black uppercase data-[highlighted]:bg-yellow-100 data-[highlighted]:text-black"
                          >
                            <span className="flex flex-col gap-1">
                              <span>{label}</span>
                              <span className="text-[10px] sm:text-xs font-bold text-neutral-600">
                                {batch.batchCode || batch.batchID}
                              </span>
                            </span>
                          </Select.Item>
                        );
                      })}
                    </Select.Content>
                  </Select>

                  <div className="flex items-center justify-between border-2 border-black bg-neutral-50 px-3 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-wide">
                    <span className="text-neutral-600">
                      {selectedLabel || "Choose a batch to continue"}
                    </span>
                    {selectedBatch && (
                      <Badge
                        variant="dark"
                        size="default"
                        className="text-[10px]"
                      >
                        Selected
                      </Badge>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </motion.div>

        {/* Consent Section */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="border-2 sm:border-3 border-black bg-gradient-to-br from-orange-50 to-yellow-100 shadow-[4px_4px_0_#0a0a0a] p-3 sm:p-4 space-y-3"
        >
          <div className="flex items-center gap-3 mb-2 sm:mb-3">
            <Shield className="w-5 h-5 text-orange-600" aria-hidden="true" />
            <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-black text-balance">
              Privacy & Consent
            </h3>
          </div>

          <motion.label
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-start gap-3 p-3 border-2 border-black bg-white hover:bg-yellow-50 transition-colors cursor-pointer shadow-[3px_3px_0_#0a0a0a]"
            htmlFor="terms"
          >
            <input
              id="terms"
              type="checkbox"
              checked={consentTerms}
              onChange={(event) => onToggleTerms(event.target.checked)}
              className="mt-1 w-5 h-5 border-2 border-black accent-yellow-400 cursor-pointer"
            />
            <div className="flex-1">
              <p className="text-xs sm:text-sm font-bold text-black">
                Agree to the{" "}
                <Link
                  href="/legal/terms"
                  className="underline text-blue-600 hover:text-blue-700"
                  target="_blank"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="/legal/privacy"
                  className="underline text-blue-600 hover:text-blue-700"
                  target="_blank"
                >
                  Privacy Policy
                </Link>
              </p>
              <p className="text-[10px] sm:text-xs font-bold text-neutral-600 mt-1">
                Required to continue
              </p>
            </div>
            <Badge
              variant={consentTerms ? "main" : "outline"}
              size="default"
              className="text-[10px]"
            >
              {consentTerms ? "✓" : "Required"}
            </Badge>
          </motion.label>

          <motion.label
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-start gap-3 p-3 border-2 border-black bg-white hover:bg-yellow-50 transition-colors cursor-pointer shadow-[3px_3px_0_#0a0a0a]"
            htmlFor="promotions"
          >
            <input
              id="promotions"
              type="checkbox"
              checked={consentPromotions}
              onChange={(event) => onTogglePromotions(event.target.checked)}
              className="mt-1 w-5 h-5 border-2 border-black accent-yellow-400 cursor-pointer"
            />
            <div className="flex-1">
              <p className="text-xs sm:text-sm font-bold text-black flex items-center gap-2">
                <Mail className="w-3.5 h-3.5" aria-hidden="true" />
                Receive promotional updates and announcements
              </p>
              <p className="text-[10px] sm:text-xs font-bold text-neutral-600 mt-1">
                Optional - You can change this later
              </p>
            </div>
            <Badge
              variant={consentPromotions ? "main" : "outline"}
              size="default"
              className="text-[10px]"
            >
              {consentPromotions ? "✓" : "Optional"}
            </Badge>
          </motion.label>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-6 border-t-3 border-black mt-6"
        >
          <NeoBrutalButton
            variant="outline"
            onClick={onBack}
            size="md"
            className="w-full sm:w-auto min-w-35 touch-manipulation"
          >
            ← Back
          </NeoBrutalButton>
          <NeoBrutalButton
            variant="primary"
            onClick={onContinue}
            disabled={!selectedBatchID || !consentTerms}
            size="md"
            className="w-full sm:w-auto min-w-50 touch-manipulation"
          >
            Continue to Courses →
          </NeoBrutalButton>
        </motion.div>
      </div>
    </MotionConfig>
  );
}

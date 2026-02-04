import { useMutation } from "@tanstack/react-query";
import { fetchJson } from "@/lib/api/fetch-json";

type IssueFilesPayload = {
  files?: File[];
};

export type BugIssuePayload = IssueFilesPayload & {
  title: string;
  summary: string;
  steps?: string;
  expected?: string;
  actual?: string;
  pageUrl?: string;
  email?: string;
};

export type FeatureIssuePayload = IssueFilesPayload & {
  title: string;
  summary: string;
  impact?: string;
  useCase?: string;
  pageUrl?: string;
  email?: string;
};

export type ModerationIssuePayload = IssueFilesPayload & {
  name: string;
  email: string;
  experience?: string;
  availability?: string;
  notes?: string;
};

export type BatchAccessIssuePayload = IssueFilesPayload & {
  name: string;
  email: string;
  batchId: string;
  department?: string;
  semester?: string;
  notes?: string;
};

export type IssueResponse = {
  status: "created";
  issueUrl: string;
};

function appendField(
  formData: FormData,
  key: string,
  value: string | undefined,
) {
  if (!value) return;
  const trimmed = value.trim();
  if (!trimmed) return;
  formData.append(key, trimmed);
}

function buildFormData(
  payload: Record<string, unknown> & IssueFilesPayload,
): FormData {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (key === "files") {
      const files = Array.isArray(value) ? value : [];
      files.forEach((file) => formData.append("attachments", file));
      return;
    }
    appendField(formData, key, typeof value === "string" ? value : undefined);
  });
  return formData;
}

export function useSubmitBug() {
  return useMutation({
    mutationFn: (payload: BugIssuePayload) =>
      fetchJson<IssueResponse>(
        "/api/issues/bug",
        {
          method: "POST",
          body: buildFormData(payload),
        },
        { metricName: "issues.bug" },
      ),
  });
}

export function useSubmitFeature() {
  return useMutation({
    mutationFn: (payload: FeatureIssuePayload) =>
      fetchJson<IssueResponse>(
        "/api/issues/feature",
        {
          method: "POST",
          body: buildFormData(payload),
        },
        { metricName: "issues.feature" },
      ),
  });
}

export function useSubmitModeration() {
  return useMutation({
    mutationFn: (payload: ModerationIssuePayload) =>
      fetchJson<IssueResponse>(
        "/api/issues/moderation",
        {
          method: "POST",
          body: buildFormData(payload),
        },
        { metricName: "issues.moderation" },
      ),
  });
}

export function useSubmitBatchAccess() {
  return useMutation({
    mutationFn: (payload: BatchAccessIssuePayload) =>
      fetchJson<IssueResponse>(
        "/api/issues/batch-access",
        {
          method: "POST",
          body: buildFormData(payload),
        },
        { metricName: "issues.batch_access" },
      ),
  });
}

"use client";

import { useState, type FormEvent } from "react";
import SupportFormLayout from "@/components/support/SupportFormLayout";
import { FileUploader, Input, Textarea } from "@/components/support/FormFields";
import { useSubmitBug } from "@/hooks/useSubmitIssue";
import { toast } from "sonner";

export default function ReportBugPage() {
  const mutation = useSubmitBug();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [steps, setSteps] = useState("");
  const [expected, setExpected] = useState("");
  const [actual, setActual] = useState("");
  const [pageUrl, setPageUrl] = useState("");
  const [email, setEmail] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [issueUrl, setIssueUrl] = useState<string | null>(null);

  const handleFilesChange = (selected: File[]) => {
    const valid = selected.filter(
      (file) => file.type.startsWith("image/") && file.size <= 5 * 1024 * 1024,
    );
    if (valid.length !== selected.length) {
      toast.error("Only image files under 5MB are allowed.");
    }
    setFiles(valid);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIssueUrl(null);
    try {
      const result = await mutation.mutateAsync({
        title,
        summary,
        steps,
        expected,
        actual,
        pageUrl: pageUrl || undefined,
        email: email || undefined,
        files,
      });
      setIssueUrl(result.issueUrl);
      toast.success("Bug report submitted!");
      setTitle("");
      setSummary("");
      setSteps("");
      setExpected("");
      setActual("");
      setPageUrl("");
      setEmail("");
      setFiles([]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Submission failed";
      toast.error(message);
    }
  };

  return (
    <SupportFormLayout
      title="Report a Bug"
      subtitle="Found something broken? Send us the details and we will investigate."
      tips={[
        "Steps to reproduce the issue.",
        "Expected vs actual behavior.",
        "Screenshots or screen recording if available.",
      ]}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Bug Title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Short summary"
          required
        />
        <Input
          label="Your Email (optional)"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="name@example.com"
        />
        <Input
          label="Affected Page (optional)"
          value={pageUrl}
          onChange={(event) => setPageUrl(event.target.value)}
          placeholder="https://attendrix.app/dashboard"
        />
        <Textarea
          label="What happened?"
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          placeholder="Describe the issue"
          required
        />
        <Textarea
          label="Steps to reproduce (optional)"
          value={steps}
          onChange={(event) => setSteps(event.target.value)}
          placeholder="1) ... 2) ..."
        />
        <div className="grid gap-4 md:grid-cols-2">
          <Textarea
            label="Expected behavior (optional)"
            value={expected}
            onChange={(event) => setExpected(event.target.value)}
            placeholder="What should happen"
          />
          <Textarea
            label="Actual behavior (optional)"
            value={actual}
            onChange={(event) => setActual(event.target.value)}
            placeholder="What happens instead"
          />
        </div>
        <FileUploader
          label="Screenshots or files (optional)"
          files={files}
          onFilesChange={handleFilesChange}
          hint="Images only (PNG/JPG/GIF/WebP). Max 5MB each."
          accept="image/*"
        />

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="inline-flex items-center gap-2 border-[3px] border-black bg-black px-5 py-3 text-sm font-black uppercase text-white shadow-[5px_5px_0px_0px_#000] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#000] disabled:opacity-60"
          >
            {mutation.isPending ? "Submitting..." : "Submit Bug"}
          </button>
          <span className="text-xs font-black uppercase text-neutral-500">
            We will follow up via email if provided.
          </span>
        </div>
      </form>

      {issueUrl && (
        <div className="mt-6 border-[3px] border-black bg-white px-4 py-3 shadow-[4px_4px_0px_0px_#000]">
          <p className="text-sm font-bold text-neutral-700">
            Issue created successfully.
          </p>
          <a
            href={issueUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-black uppercase text-black underline underline-offset-4"
          >
            View on GitHub
          </a>
        </div>
      )}
    </SupportFormLayout>
  );
}

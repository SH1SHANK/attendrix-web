"use client";

import { useState, type FormEvent } from "react";
import SupportFormLayout from "@/components/support/SupportFormLayout";
import { FileUploader, Input, Textarea } from "@/components/support/FormFields";
import { useSubmitBatchAccess } from "@/hooks/useSubmitIssue";
import { toast } from "sonner";

export default function BatchAccessPage() {
  const mutation = useSubmitBatchAccess();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [batchId, setBatchId] = useState("");
  const [department, setDepartment] = useState("");
  const [semester, setSemester] = useState("");
  const [notes, setNotes] = useState("");
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
        name,
        email,
        batchId,
        department,
        semester,
        notes,
        files,
      });
      setIssueUrl(result.issueUrl);
      toast.success("Batch access request submitted!");
      setName("");
      setEmail("");
      setBatchId("");
      setDepartment("");
      setSemester("");
      setNotes("");
      setFiles([]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Submission failed";
      toast.error(message);
    }
  };

  return (
    <SupportFormLayout
      title="Request Batch Access"
      subtitle="Need access to a batch that is not listed? Send the details."
      tips={[
        "Batch ID and department.",
        "Semester or academic year.",
        "Any official confirmation or point of contact.",
      ]}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Your name"
          required
        />
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="name@example.com"
          required
        />
        <Input
          label="Batch ID"
          value={batchId}
          onChange={(event) => setBatchId(event.target.value)}
          placeholder="ME0204"
          required
        />
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Department (optional)"
            value={department}
            onChange={(event) => setDepartment(event.target.value)}
            placeholder="Mechanical Engineering"
          />
          <Input
            label="Semester / Year (optional)"
            value={semester}
            onChange={(event) => setSemester(event.target.value)}
            placeholder="Semester 5"
          />
        </div>
        <Textarea
          label="Additional notes (optional)"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Any extra context"
        />
        <FileUploader
          label="Supporting files (optional)"
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
            {mutation.isPending ? "Submitting..." : "Submit Request"}
          </button>
        </div>
      </form>

      {issueUrl && (
        <div className="mt-6 border-[3px] border-black bg-white px-4 py-3 shadow-[4px_4px_0px_0px_#000]">
          <p className="text-sm font-bold text-neutral-700">
            Batch access request logged.
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

"use client";

import { useState, type FormEvent } from "react";
import SupportFormLayout from "@/components/support/SupportFormLayout";
import { FileUploader, Input, Textarea } from "@/components/support/FormFields";
import { useSubmitModeration } from "@/hooks/useSubmitIssue";
import { toast } from "sonner";

export default function ModerationPage() {
  const mutation = useSubmitModeration();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [experience, setExperience] = useState("");
  const [availability, setAvailability] = useState("");
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
        experience,
        availability,
        notes,
        files,
      });
      setIssueUrl(result.issueUrl);
      toast.success("Moderation request submitted!");
      setName("");
      setEmail("");
      setExperience("");
      setAvailability("");
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
      title="Join Attendrix Moderation"
      subtitle="Help keep Attendrix data accurate and students supported."
      tips={[
        "Why you want to join the moderation team.",
        "Any relevant community or leadership experience.",
        "Your availability each week.",
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
        <Textarea
          label="Experience (optional)"
          value={experience}
          onChange={(event) => setExperience(event.target.value)}
          placeholder="Tell us about relevant experience"
        />
        <Textarea
          label="Weekly availability (optional)"
          value={availability}
          onChange={(event) => setAvailability(event.target.value)}
          placeholder="Hours per week"
        />
        <Textarea
          label="Why do you want to help?"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Your motivation"
          required
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
            Moderation request logged.
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

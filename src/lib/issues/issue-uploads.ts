import { getSupabaseAdmin } from "@/lib/supabase/admin";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_FILES = 5;
const BUCKET_NAME = "issues";

export type IssueUpload = {
  name: string;
  size: number;
  type: string;
  url: string;
};

function sanitizeFileName(fileName: string) {
  const normalized = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return normalized.slice(0, 80) || "attachment";
}

export async function uploadIssueImages(
  files: File[],
  options: { uid: string; prefix: string },
): Promise<IssueUpload[]> {
  if (files.length === 0) return [];
  if (files.length > MAX_FILES) {
    throw new Error(`Only ${MAX_FILES} attachments are allowed.`);
  }

  const supabaseAdmin = getSupabaseAdmin();
  const uploads: IssueUpload[] = [];

  for (const file of files) {
    if (!file.type || !file.type.startsWith("image/")) {
      throw new Error("Only image attachments are supported.");
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new Error("Each image must be under 5MB.");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const extension = sanitizeFileName(file.name);
    const path = `${options.prefix}/${options.uid}/${crypto.randomUUID()}-${extension}`;

    const { error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(path, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      throw new Error(error.message || "Upload failed");
    }

    const { data } = supabaseAdmin.storage.from(BUCKET_NAME).getPublicUrl(path);
    if (!data?.publicUrl) {
      throw new Error("Unable to generate attachment link.");
    }

    uploads.push({
      name: file.name,
      size: file.size,
      type: file.type,
      url: data.publicUrl,
    });
  }

  return uploads;
}

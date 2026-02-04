import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { verifySession } from "@/lib/auth-guard";
import { SESSION_COOKIE_NAME } from "@/lib/auth-config";
import { buildApiError, buildApiSuccess } from "@/lib/api/errors";
import { createGithubIssue } from "@/lib/github/issues";
import { uploadIssueImages } from "@/lib/issues/issue-uploads";

export const runtime = "nodejs";

const bodySchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(200),
  batchId: z.string().min(2).max(40),
  department: z.string().max(120).optional(),
  semester: z.string().max(120).optional(),
  notes: z.string().max(3000).optional(),
});

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const decoded = await verifySession(sessionCookie);
    const formData = await request.formData();
    const getString = (value: FormDataEntryValue | null) =>
      typeof value === "string" ? value.trim() : undefined;

    const data = {
      name: getString(formData.get("name")),
      email: getString(formData.get("email")),
      batchId: getString(formData.get("batchId")),
      department: getString(formData.get("department")),
      semester: getString(formData.get("semester")),
      notes: getString(formData.get("notes")),
    };
    const parsed = bodySchema.safeParse(data);

    if (!parsed.success) {
      const response = NextResponse.json(
        buildApiError("VALIDATION_ERROR", "Invalid request body", parsed.error.format()),
        { status: 400 },
      );
      response.headers.set("Cache-Control", "private, no-store");
      return response;
    }

    const parsedData = parsed.data;
    const files = formData
      .getAll("attachments")
      .filter((entry): entry is File => entry instanceof File && entry.size > 0);
    const uploads = await uploadIssueImages(files, {
      uid: decoded.uid,
      prefix: "batch-access",
    });
    const attachments =
      uploads.length > 0
        ? uploads
            .map(
              (file) =>
                `- [${file.name}](${file.url}) (${Math.round(
                  file.size / 1024,
                )} KB)`,
            )
            .join("\n")
        : "None";

    const bodyText = [
      "## Batch Access Request",
      `Name: ${parsedData.name}`,
      `Email: ${parsedData.email}`,
      `Batch ID: ${parsedData.batchId}`,
      `Department: ${parsedData.department || "Not provided"}`,
      `Semester: ${parsedData.semester || "Not provided"}`,
      "",
      "## Additional Notes",
      parsedData.notes || "Not provided",
      "",
      "## Reporter",
      `- UID: ${decoded.uid}`,
      "",
      "## Attachments",
      attachments,
      "",
      `Submitted from Attendrix Web on ${new Date().toLocaleString()}.`,
    ].join("\n");

    const issue = await createGithubIssue({
      title: `[Batch Access] ${parsedData.batchId}`,
      body: bodyText,
      labels: ["batch-access", "from-app"],
    });

    const response = NextResponse.json(
      buildApiSuccess({ status: "created", issueUrl: issue.html_url }),
    );
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.startsWith("Unauthorized") ? 401 : 500;
    const response = NextResponse.json(
      buildApiError(
        status === 401 ? "UNAUTHORIZED" : "INTERNAL_ERROR",
        status === 401 ? "Unauthorized" : message,
      ),
      { status },
    );
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }
}

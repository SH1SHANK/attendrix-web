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
  title: z.string().min(3).max(120),
  summary: z.string().min(10).max(3000),
  impact: z.string().max(3000).optional(),
  useCase: z.string().max(3000).optional(),
  pageUrl: z.string().max(500).optional(),
  email: z.string().email().max(200).optional(),
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
      title: getString(formData.get("title")),
      summary: getString(formData.get("summary")),
      impact: getString(formData.get("impact")),
      useCase: getString(formData.get("useCase")),
      pageUrl: getString(formData.get("pageUrl")),
      email: getString(formData.get("email")),
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
      prefix: "feature",
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
      "## Summary",
      parsedData.summary,
      "",
      "## Use Case",
      parsedData.useCase || "Not provided",
      "",
      "## Impact",
      parsedData.impact || "Not provided",
      "",
      "## Affected Page",
      parsedData.pageUrl || "Not provided",
      "",
      "## Requester",
      `- UID: ${decoded.uid}`,
      `- Email: ${parsedData.email || "Not provided"}`,
      "",
      "## Attachments",
      attachments,
      "",
      `Submitted from Attendrix Web on ${new Date().toLocaleString()}.`,
    ].join("\n");

    const issue = await createGithubIssue({
      title: `[Feature] ${parsedData.title}`,
      body: bodyText,
      labels: ["feature", "from-app"],
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

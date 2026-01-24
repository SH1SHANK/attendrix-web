import { redirect } from "next/navigation";

// Redirect /docs to /docs/introduction
export default function DocsIndexPage() {
  redirect("/docs/introduction");
}

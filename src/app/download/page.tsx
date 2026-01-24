import { getReleases } from "@/lib/github";
import DownloadsClient from "./DownloadsClient";

export const metadata = {
  title: "Download Attendrix - Latest APK",
  description: "Get the latest stable build for Android directly from GitHub.",
};

export default async function DownloadsPage() {
  const releases = await getReleases();

  return <DownloadsClient releases={releases} />;
}

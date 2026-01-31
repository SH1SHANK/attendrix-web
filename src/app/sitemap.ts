import { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/utils";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = absoluteUrl("");

  // 1. Static Routes
  const routes = [
    "",
    "/download",
    "/legal/privacy",
    "/legal/terms",
    "/legal/cookies",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1 : 0.8,
  }));

  return [...routes];
}

import { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/utils";
import { getAllDocSlugs } from "@/lib/docs";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = absoluteUrl("");

  // 1. Static Routes
  const routes = [
    "",
    "/download",
    "/docs",
    "/legal/privacy",
    "/legal/terms",
    "/legal/cookies",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1 : 0.8,
  }));

  // 2. Dynamic Doc Routes
  const docSlugs = await getAllDocSlugs();
  const docRoutes = docSlugs.map((slugParts) => {
    const path = `/docs/${slugParts.join("/")}`;
    return {
      url: `${baseUrl}${path}`,
      lastModified: new Date().toISOString(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    };
  });

  return [...routes, ...docRoutes];
}

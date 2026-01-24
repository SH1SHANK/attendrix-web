import { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/utils";

export default function robots(): MetadataRoute.Robots {
  const sitemapUrl = absoluteUrl("/sitemap.xml");

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/auth/", "/onboarding/", "/api/"],
    },
    sitemap: sitemapUrl,
  };
}

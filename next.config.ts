import type { NextConfig } from "next";
import withPWAInit from "next-pwa";
import withBundleAnalyzerInit from "@next/bundle-analyzer";

// 1. Configure PWA
const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

// 2. Configure Bundle Analyzer
const withBundleAnalyzer = withBundleAnalyzerInit({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Turbopack config (Next.js 16 default bundler)
  turbopack: {},

  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "gsap",
      "@supabase/supabase-js",
      "framer-motion",
      "date-fns",
      "clsx",
      "tailwind-merge",
    ],
  },

  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
    ],
  },

  logging: {
    fetches: {
      fullUrl: true,
    },
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
      {
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

// 3. Compose Plugins

export default withBundleAnalyzer(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  withPWA(nextConfig as any) as unknown as NextConfig,
);

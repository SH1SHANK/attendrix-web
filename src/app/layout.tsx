/* eslint-disable @next/next/no-page-custom-font */
import type { Metadata } from "next";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "sonner";
import GlobalOverlays from "@/components/layout/GlobalOverlays";
import { QueryProvider } from "@/providers/QueryProvider";
import { UserPreferencesProvider } from "@/context/UserPreferencesContext";
import { ClientPerformanceObserver } from "@/components/metrics/ClientPerformanceObserver";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://attendrix.app",
  ),
  title: {
    default: "Attendrix | Subject-Wise Attendance Tracking for NITC",
    template: "%s | Attendrix",
  },
  description:
    "The definitive attendance tracking system for NIT Calicut students. Subject-wise precision, policy-compliant calculations, zero guesswork.",
  applicationName: "Attendrix",
  authors: [{ name: "Attendrix Team", url: "https://attendrix.app" }],
  generator: "Next.js",
  keywords: [
    "attendance tracker",
    "NIT Calicut",
    "NITC",
    "academic management",
    "subject-wise attendance",
    "slot system",
    "B.Tech",
    "Calicut",
  ],
  referrer: "origin-when-cross-origin",
  creator: "Attendrix",
  publisher: "Attendrix",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Attendrix | Subject-Wise Attendance Tracking",
    description:
      "The definitive attendance tracking system for NIT Calicut. Subject-wise precision, policy-compliant calculations.",
    url: "https://attendrix.app",
    siteName: "Attendrix",
    locale: "en_US",
    type: "website",
    // images: [{ url: '/og.png' }], // TODO: Add OG Image
  },
  twitter: {
    card: "summary_large_image",
    title: "Attendrix | Subject-Wise Attendance Tracking",
    description:
      "The definitive attendance tracking system for NIT Calicut. Subject-wise precision, policy-compliant calculations.",
    creator: "@attendrix", // Placeholder
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.json",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=JetBrains+Mono:wght@100..800&family=Space+Grotesk:wght@500;600;700&display=swap"
        />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="mask-icon" href="/window.svg" color="#FFD700" />
        <meta name="theme-color" content="#FFD700" />
      </head>
      <body className="antialiased font-sans" suppressHydrationWarning>
        <QueryProvider>
          <UserPreferencesProvider>
            <AuthProvider>
              {children}
              <Toaster />
            </AuthProvider>
          </UserPreferencesProvider>
          <GlobalOverlays />
          <ClientPerformanceObserver />
        </QueryProvider>
      </body>
    </html>
  );
}

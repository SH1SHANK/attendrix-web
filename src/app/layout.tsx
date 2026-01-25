import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "sonner";
import CookieConsent from "@/components/legal/CookieConsent";
import ScrollToTop from "@/components/ui/ScrollToTop";
import { QueryProvider } from "@/providers/QueryProvider";
import "./globals.css";

// Display font: Space Grotesk - Bold, geometric, high visual weight
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
  weight: ["500", "600", "700"],
});

// Body font: Inter - Clean, readable, neutral
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Monospace: JetBrains Mono - For code, terminals, technical UI
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

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
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="antialiased" suppressHydrationWarning>
        <QueryProvider>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
          <CookieConsent />
          <ScrollToTop />
        </QueryProvider>
      </body>
    </html>
  );
}

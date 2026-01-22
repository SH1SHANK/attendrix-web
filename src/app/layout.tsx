import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Display font: Space Grotesk - Bold, geometric, high visual weight
const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
  weight: ['500', '600', '700'],
});

// Body font: Inter - Clean, readable, neutral
const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

// Monospace: JetBrains Mono - For code, terminals, technical UI
const jetbrainsMono = JetBrains_Mono({ 
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Attendrix | Subject-Wise Attendance Tracking for NITC",
  description: "The definitive attendance tracking system for NIT Calicut students. Subject-wise precision, policy-compliant calculations, zero guesswork.",
  keywords: ["attendance tracker", "NIT Calicut", "NITC", "academic management", "subject-wise attendance", "slot system"],
  authors: [{ name: "Attendrix" }],
  openGraph: {
    title: "Attendrix | Subject-Wise Attendance Tracking",
    description: "The definitive attendance tracking system for NIT Calicut. Subject-wise precision, policy-compliant calculations.",
    type: "website",
    locale: "en_US",
    siteName: "Attendrix",
  },
  twitter: {
    card: "summary_large_image",
    title: "Attendrix | Subject-Wise Attendance Tracking",
    description: "The definitive attendance tracking system for NIT Calicut. Subject-wise precision, policy-compliant calculations.",
  },
  robots: {
    index: true,
    follow: true,
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
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

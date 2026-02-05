"use client";

import { useRef } from "react";
import Link from "next/link";
import { Download, ExternalLink, Github, Send, Twitter } from "lucide-react";
import { useInView } from "@/hooks/useInView";

// ============================================
// FOOTER LINK DATA
// ============================================

const productLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

const legalLinks = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Cookies", href: "/cookies" },
];

const socialLinks = [
  { icon: Twitter, href: "https://twitter.com/attendrix", label: "Twitter" },
  { icon: Github, href: "https://github.com/attendrix", label: "GitHub" },
  { icon: Send, href: "https://t.me/HeyLumenBot", label: "Telegram" },
];

// ============================================
// FOOTER LINK COMPONENT
// ============================================

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group inline-flex flex-col gap-1 text-sm font-bold uppercase tracking-wider text-neutral-300 transition-colors duration-200 hover:text-white focus-visible:text-white"
    >
      <span>{children}</span>
      <span className="h-0.5 w-full origin-left scale-x-0 bg-white transition-transform duration-300 ease-smooth group-hover:scale-x-100 group-focus-visible:scale-x-100 motion-reduce:scale-x-100 motion-reduce:transition-none" />
    </Link>
  );
}

// Social Button with Border Style
function SocialButton({
  icon: Icon,
  href,
  label,
}: {
  icon: typeof Twitter;
  href: string;
  label: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="group w-11 h-11 bg-[#FFD02F] border-2 border-black text-black flex items-center justify-center shadow-[3px_3px_0_0_#000] hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_#000] active:translate-y-1 active:shadow-[1px_1px_0_0_#000] transition-all duration-150 motion-reduce:transition-none"
    >
      <Icon
        className="w-5 h-5 transition-transform duration-200 group-hover:-rotate-6 group-hover:scale-105 motion-reduce:transform-none"
        strokeWidth={2}
      />
    </a>
  );
}

// ============================================
// MAIN FOOTER COMPONENT
// ============================================

export default function Footer() {
  const footerRef = useRef<HTMLElement>(null);
  const isInView = useInView(footerRef, {
    threshold: 0.2,
    rootMargin: "0px 0px -10% 0px",
    triggerOnce: true,
  });

  const lineRevealClass = isInView ? "scale-x-100" : "scale-x-0";

  return (
    <footer
      ref={footerRef}
      className="relative bg-black text-white border-t-4 border-white overflow-hidden"
    >
      {/* Main content */}
      <div className="relative z-10">
        {/* Final CTA */}
        <div className="border-b-4 border-white">
          <div className="max-w-7xl mx-auto px-6 py-10 sm:px-8 lg:px-12">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-3">
                <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-yellow-400">
                  NITC Slot-Aware • Transparent • Student-Built
                </p>
                <h2 className="font-display text-3xl sm:text-4xl font-black uppercase tracking-tight">
                  Ready for subject-wise clarity?
                </h2>
                <p className="text-sm sm:text-base text-neutral-300 max-w-xl">
                  Every surface stays in sync. Track attendance, manage classes,
                  assignments, exams, and study materials.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-3 border-2 border-white bg-white px-6 py-3 text-sm font-bold uppercase tracking-tight text-black shadow-[4px_4px_0_#FFD02F] transition-all duration-200 hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[6px_6px_0_#FFD02F]"
                >
                  <ExternalLink className="h-4 w-4" />
                  Use Attendrix Web
                </Link>
                <Link
                  href="/download"
                  className="inline-flex items-center gap-3 border-2 border-white bg-black px-6 py-3 text-sm font-bold uppercase tracking-tight text-yellow-400 shadow-[4px_4px_0_#FFD02F] transition-all duration-200 hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[6px_6px_0_#FFD02F]"
                >
                  <Download className="h-4 w-4" />
                  Download Android App (APK)
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Unified footer surface */}
        <div className="max-w-7xl mx-auto px-6 py-10 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            {/* Brand + Identity */}
            <div className="lg:col-span-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#FFD02F] border-2 border-black flex items-center justify-center shadow-[3px_3px_0_#000] font-mono font-bold text-xl">
                  A
                </div>
                <div className="font-display text-2xl font-black uppercase tracking-tight">
                  ATTENDRIX
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <p className="font-mono text-xs font-bold text-neutral-300 uppercase tracking-[0.22em]">
                  Subject-Wise Attendance Hub
                </p>
                <p className="text-base font-bold leading-relaxed text-neutral-200">
                  The bespoke academic ecosystem for NITC. Subject-wise
                  tracking with transparent calculations.
                </p>
                <p className="font-mono text-xs font-bold uppercase tracking-widest text-neutral-400">
                  Engineered by NITC students
                </p>
              </div>
            </div>

            {/* Navigation + Legal */}
            <div className="lg:col-span-4 lg:border-l-2 lg:border-white lg:pl-6">
              <div className="flex items-center justify-between">
                <h4 className="font-display font-black uppercase text-sm tracking-widest">
                  Navigation
                </h4>
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Core
                </span>
              </div>
              <span
                className={`mt-3 block h-0.5 origin-left bg-white transition-transform duration-700 ease-smooth motion-reduce:transition-none motion-reduce:scale-x-100 ${lineRevealClass}`}
              />

              <div className="mt-5 grid grid-cols-2 gap-8">
                <div>
                  <h5 className="font-display font-black uppercase text-xs tracking-widest mb-3 text-neutral-200">
                    Product
                  </h5>
                  <ul className="space-y-2">
                    {productLinks.map((link) => (
                      <li key={link.label}>
                        <FooterLink href={link.href}>{link.label}</FooterLink>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h5 className="font-display font-black uppercase text-xs tracking-widest mb-3 text-neutral-200">
                    Legal
                  </h5>
                  <ul className="space-y-2">
                    {legalLinks.map((link) => (
                      <li key={link.label}>
                        <FooterLink href={link.href}>{link.label}</FooterLink>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Status + Social */}
            <div className="lg:col-span-4 lg:border-l-2 lg:border-white lg:pl-6">
              <div className="flex items-center justify-between">
                <h4 className="font-display font-black uppercase text-sm tracking-widest">
                  System Status
                </h4>
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Live
                </span>
              </div>
              <span
                className={`mt-3 block h-0.5 origin-left bg-white transition-transform duration-700 ease-smooth motion-reduce:transition-none motion-reduce:scale-x-100 ${lineRevealClass}`}
              />

              <div className="mt-4 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  <span className="font-mono text-xs font-bold text-neutral-300 uppercase tracking-wider">
                    Systems Normal
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {socialLinks.map((social) => (
                    <SocialButton
                      key={social.label}
                      icon={social.icon}
                      href={social.href}
                      label={social.label}
                    />
                  ))}
                </div>
              </div>
              <p className="mt-4 font-mono text-xs font-bold uppercase tracking-wider text-neutral-400">
                © 2026 Attendrix. Built by students.
              </p>
            </div>
          </div>

          {/* Signature / Authorship */}
          <div className="border-t-4 border-white mt-6 pt-6">
            <div className="border-2 border-black bg-[#FFD02F] text-black p-6 shadow-[4px_4px_0_#000]">
              <div className="flex flex-col items-start">
                <p className="font-display text-2xl sm:text-3xl font-black leading-tight tracking-tight uppercase">
                  Dreamt, designed, and built by Shashank
                </p>
                <p className="mt-2 font-mono text-xs font-bold uppercase tracking-wider text-black/70">
                  Managed by the Attendrix team
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom accent bar */}
        <div className="h-2 bg-white" />
      </div>
    </footer>
  );
}

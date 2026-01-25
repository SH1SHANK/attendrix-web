"use client";

import React, { useRef, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Printer,
  Link as LinkIcon,
  Share2,
  Twitter,
  Linkedin,
  MessageCircle,
  Check,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { cn } from "@/lib/utils";

interface LegalLayoutProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

// Hydration-safe hook for window.location.href
function useCurrentUrl() {
  return useSyncExternalStore(
    () => () => {},
    () => window.location.href,
    () => "",
  );
}

const LegalLayout = ({ title, lastUpdated, children }: LegalLayoutProps) => {
  const router = useRouter();
  const contentRef = useRef<HTMLDivElement>(null);
  const currentUrl = useCurrentUrl();

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!", {
        className:
          "border-2 border-black bg-[#FFD02F] text-black font-bold rounded-none shadow-[4px_4px_0px_0px_#000]",
        icon: <Check className="h-4 w-4" />,
        duration: 2000,
      });
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleShare = async () => {
    if (typeof window !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: `Check out the ${title} for Attendrix.`,
          url: window.location.href,
        });
      } catch (error) {
        console.log("Error sharing:", error);
      }
    } else {
      handleCopyLink();
    }
  };

  const shareUrls = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out the ${title} for Attendrix`)}&url=`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`Check out the ${title} for Attendrix: `)}`,
  };

  return (
    <>
      <div className="min-h-screen bg-paper px-4 py-8 md:py-12 font-sans print:bg-white print:p-0 print:m-0">
        <Toaster position="bottom-right" />

        {/* Global Print Styles to force background colors */}
        <style jsx global>{`
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            @page {
              margin: 1.5cm;
            }
          }
        `}</style>

        <div className="mx-auto max-w-4xl print:max-w-none">
          {/* Action Toolbar - Sticky & Hidden on Print */}
          <div className="sticky top-0 z-50 mb-8 flex flex-col gap-4 bg-paper/95 backdrop-blur-sm py-4 md:flex-row md:items-center md:justify-between border-b-2 border-transparent transition-all data-[stuck=true]:border-black print:hidden">
            <button
              onClick={() => router.back()}
              className="group flex w-fit items-center gap-2 border-2 border-transparent bg-transparent px-4 py-2 font-black uppercase transition-all hover:bg-yellow-400 hover:border-black active:translate-y-1"
            >
              <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
              <span>Back</span>
            </button>

            <div className="flex gap-3">
              <ActionButton
                onClick={handleCopyLink}
                icon={<LinkIcon className="h-5 w-5" />}
                label="Copy Link"
              />
              <ActionButton
                onClick={handlePrint}
                icon={<Printer className="h-5 w-5" />}
                label="Print Policy"
              />
              <ActionButton
                onClick={handleShare}
                icon={<Share2 className="h-5 w-5" />}
                label="Share"
              />
            </div>
          </div>

          {/* Main Content Card */}
          <div
            ref={contentRef}
            className="bg-white border-2 border-black p-8 shadow-[8px_8px_0px_0px_#000] md:p-12 print:border-0 print:shadow-none print:p-0 print:bg-white!"
          >
            {/* PRINT ONLY Header */}
            <div className="hidden print:flex items-center justify-between mb-8 border-b-2 border-black pb-4">
              <div className="flex items-center gap-4">
                {/* Simulated Logo Text */}
                <h1 className="text-2xl font-black uppercase tracking-tighter">
                  ATTENDRIX LEGAL
                </h1>
              </div>
              <div className="text-sm font-mono text-neutral-500">
                {currentUrl}
              </div>
            </div>

            {/* Document Header */}
            <div className="mb-12 border-b-4 border-black pb-8 print:mb-8 print:pb-4 text-center md:text-left">
              <span className="mb-4 inline-block bg-yellow-400 border-2 border-black px-3 py-1 text-sm font-black uppercase shadow-[2px_2px_0px_0px_#000] print:border-black">
                Last Updated: {lastUpdated}
              </span>
              <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-black wrap-break-word leading-[0.9]">
                {title}
              </h1>
            </div>

            {/* Content with Punchy Typography */}
            <article className="prose prose-neutral prose-lg max-w-none prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight prose-headings:text-black prose-h1:text-5xl prose-h1:border-b-4 prose-h1:border-black prose-h1:pb-4 prose-h1:mb-8 prose-h2:text-3xl prose-h2:border-b-2 prose-h2:border-black prose-h2:pb-2 prose-h2:mt-12 prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4 prose-p:leading-relaxed prose-p:text-neutral-800 prose-strong:bg-yellow-200 prose-strong:px-1 prose-strong:text-black prose-strong:font-black prose-a:decoration-2 prose-a:underline-offset-4 prose-a:decoration-black prose-a:text-black prose-a:font-bold prose-a:no-underline hover:prose-a:bg-yellow-400 prose-a:transition-colors prose-ul:list-square prose-ul:marker:text-black prose-ul:marker:text-xl prose-ul:pl-6 prose-ol:marker:font-black prose-ol:marker:text-black prose-blockquote:border-l-4 prose-blockquote:border-yellow-400 prose-blockquote:bg-yellow-50 prose-blockquote:p-4 prose-blockquote:font-bold prose-blockquote:not-italic print:prose-sm print:leading-normal">
              {children}
            </article>

            {/* Social Share Footer - Hidden on Print */}
            <div className="mt-16 border-t-4 border-black pt-12 print:hidden">
              <h3 className="mb-6 font-black uppercase text-2xl text-black tracking-tight">
                Share this Policy
              </h3>
              <div className="flex flex-col gap-4 sm:flex-row">
                <SocialButton
                  href={`${shareUrls.twitter}${typeof window !== "undefined" ? window.location.href : ""}`}
                  icon={<Twitter className="h-5 w-5" />}
                  label="Twitter"
                  bgColor="hover:bg-black hover:text-white"
                />
                <SocialButton
                  href={`${shareUrls.linkedin}${typeof window !== "undefined" ? window.location.href : ""}`}
                  icon={<Linkedin className="h-5 w-5" />}
                  label="LinkedIn"
                  bgColor="hover:bg-[#0077b5] hover:text-white"
                />
                <SocialButton
                  href={`${shareUrls.whatsapp}${typeof window !== "undefined" ? window.location.href : ""}`}
                  icon={<MessageCircle className="h-5 w-5" />}
                  label="WhatsApp"
                  bgColor="hover:bg-[#25D366] hover:text-white"
                />
              </div>
            </div>
          </div>

          {/* Footer Copyright for Print Only */}
          <div className="hidden print:flex flex-col mt-8 pt-8 border-t-2 border-neutral-300 text-center text-xs text-neutral-500 font-mono">
            <p>© {new Date().getFullYear()} Attendrix. All rights reserved.</p>
            <p>This document was generated from attendrix.app</p>
          </div>
        </div>
      </div>
    </>
  );
};

// Helper Components

function ActionButton({
  onClick,
  icon,
  label,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex h-10 w-10 items-center justify-center border-2 border-black bg-white transition-all hover:bg-neutral-100 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_#000] active:translate-y-0 active:shadow-none shrink-0"
      title={label}
      aria-label={label}
    >
      {icon}
    </button>
  );
}

function SocialButton({
  href,
  icon,
  label,
  bgColor,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  bgColor: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex flex-1 items-center justify-center gap-3 border-2 border-black bg-white px-6 py-4 font-black uppercase tracking-wide transition-all hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#000] active:translate-y-0 active:shadow-none",
        bgColor,
      )}
    >
      {icon}
      <span>{label}</span>
    </a>
  );
}

export default LegalLayout;

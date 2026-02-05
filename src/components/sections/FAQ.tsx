"use client";

import { useState } from "react";
import { Plus, Mail } from "lucide-react";
import DotPatternBackground from "../ui/DotPatternBackground";
import { motion, AnimatePresence } from "framer-motion";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    id: "F01",
    question: "Is this official NITC software?",
    answer:
      "No. Attendrix is a student-built project and not affiliated with NITC. It is designed specifically for the NITC slot system and subject-wise tracking.",
  },
  {
    id: "F02",
    question: "Why subject-wise instead of overall attendance?",
    answer:
      "Attendrix keeps a subject-wise view so one risky course never hides behind a healthy overall. It’s built for NITC’s slot system and daily attendance reality.",
  },
  {
    id: "F03",
    question: "How do Web, APK, and Lumen stay in sync?",
    answer:
      "They share the same Supabase backend. Any check-in or edit appears everywhere instantly.",
  },
  {
    id: "F04",
    question: "What’s the difference between Web and Android APK?",
    answer:
      "Most features are on both, including the attendance calculator. Android APK is built for instant check-ins, push nudges, and quick actions (online-first). Attendrix Web is mobile-first and installable as a PWA, expanding the ecosystem with iOS-friendly access, deeper analysis, richer study materials, and exports. The overall attendance target is currently Web-only.",
  },
  {
    id: "F05",
    question: "Does Lumen AI see my personal data?",
    answer:
      "Lumen only accesses your attendance data and the course materials you upload. Responses are grounded in your files and do not use other students’ data.",
  },
  {
    id: "F06",
    question: "Why APK distribution during beta?",
    answer:
      "We’re invite-only right now and ship APKs to move faster and coordinate batch rollouts. Store release is planned once the beta stabilizes.",
  },
  {
    id: "F07",
    question: "How do we onboard our batch?",
    answer:
      "Email onboarding@attendrix.app with batch ID, semester, and core courses. We coordinate rollout with class reps.",
  },
];

export default function FAQ() {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <section
      id="faq"
      className="w-full relative pt-8 md:pt-12 pb-16 md:pb-20 px-4"
    >
      <DotPatternBackground />
      <div className="max-w-3xl mx-auto">
        {/* Section Header */}
        <h2 className="text-4xl md:text-5xl font-black text-center mb-8 md:mb-10 tracking-tight text-black">
          Frequently Asked Questions
        </h2>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqs.map((faq) => {
            const isOpen = openId === faq.id;

            return (
              <div
                key={faq.id}
                className={`border-2 border-black shadow-[4px_4px_0px_0px_#000] transition-colors duration-200 overflow-hidden ${
                  isOpen ? "bg-[#FFF1D6]" : "bg-white"
                }`}
              >
                {/* Question Header */}
                <button
                  onClick={() => setOpenId(isOpen ? null : faq.id)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-${faq.id}`}
                  className={`w-full flex items-center justify-between p-6 cursor-pointer text-left transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] ${
                    !isOpen
                      ? "hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#000] active:translate-y-0 active:shadow-[2px_2px_0px_0px_#000]"
                      : ""
                  }`}
                >
                  <h3
                    id={`faq-${faq.id}-label`}
                    className="text-lg font-bold text-black pr-4"
                  >
                    {faq.question}
                  </h3>
                  <span
                    className={`shrink-0 transition-transform duration-300 ${
                      isOpen ? "rotate-45" : "rotate-0"
                    }`}
                  >
                    <Plus className="w-6 h-6 text-black" strokeWidth={3} />
                  </span>
                </button>

                {/* Answer Content - Animated with Framer Motion */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`faq-${faq.id}`}
                      role="region"
                      aria-labelledby={`faq-${faq.id}-label`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{
                        duration: 0.3,
                        ease: "easeOut" as const,
                      }}
                    >
                      <div className="px-6 pb-6 pt-0">
                        <p className="text-base text-black/80 leading-relaxed font-medium">
                          {faq.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Help Console Card */}
        <div className="mt-16 max-w-2xl mx-auto">
          <div className="bg-neutral-900 text-white border-2 border-black shadow-[8px_8px_0px_0px_#FFD02F] p-8">
            <h3 className="text-2xl font-bold uppercase text-yellow-400 mb-2">
              STILL CONFUSED?
            </h3>
            <p className="text-neutral-400 mb-6">
              Need onboarding or support? Ping us directly.
            </p>
            <div className="flex flex-wrap gap-4">
              {/* Support Button */}
              <a
                href="mailto:support@attendrix.app"
                className="inline-flex items-center gap-2 bg-transparent text-white px-6 py-3 border-2 border-white font-bold uppercase text-sm transition-all duration-200 hover:bg-white hover:text-black"
              >
                <Mail className="w-5 h-5" strokeWidth={2.5} />
                Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

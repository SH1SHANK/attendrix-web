"use client";

import { useState } from "react";
import { Plus, Mail } from "lucide-react";
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
      "No. Attendrix is an independent student project. However, we've reverse-engineered NITC's Slot System and attendance policies to ensure 100% compliance with how the Academic Section calculates eligibility.",
  },
  {
    id: "F02",
    question: "How does the Safe Cut calculator work?",
    answer:
      "Safe Cuts = ((Current% × Classes Held) - (80% × Total Expected)) / 20%. Attendrix calculates this in real-time for every subject.",
  },
  {
    id: "F03",
    question: "What happens if I delete an attendance record?",
    answer:
      "The attendance recalculates correctly. If you're using gamification features, any XP earned from that check-in is revoked and streaks reset.",
  },
  {
    id: "F04",
    question: "Does Lumen AI access my personal data?",
    answer:
      "No. Lumen only reads: your timetable, uploaded syllabi, and attendance records. All AI interactions are logged locally.",
  },
  {
    id: "F05",
    question: "Why APK and not Play Store?",
    answer:
      "Attendrix is in Public Beta. APK distribution lets us iterate fast. Once we hit v2.0 stable, we'll launch on Google Play and App Store.",
  },
  {
    id: "F06",
    question: "How do I get my batch onboarded?",
    answer:
      "Email onboarding@attendrix.app with Batch ID, Semester, and Core Courses. Setup takes 48-72 hours.",
  },
];

export default function FAQ() {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <section
      id="faq"
      className="w-full bg-paper pt-8 md:pt-12 pb-16 md:pb-20 px-4"
    >
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
                  isOpen ? "bg-[#ffc2d1]" : "bg-white"
                }`}
              >
                {/* Question Header */}
                <button
                  onClick={() => setOpenId(isOpen ? null : faq.id)}
                  className={`w-full flex items-center justify-between p-6 cursor-pointer text-left transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] ${
                    !isOpen
                      ? "hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#000] active:translate-y-0 active:shadow-[2px_2px_0px_0px_#000]"
                      : ""
                  }`}
                >
                  <h3 className="text-lg font-bold text-black pr-4">
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
            <p className="text-neutral-400 mb-6">Ping us directly.</p>
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

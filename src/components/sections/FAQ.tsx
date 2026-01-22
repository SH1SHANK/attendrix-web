"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { Card } from "@/components/ui/Card";

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
  const [openId, setOpenId] = useState<string | null>("F01");

  return (
    <section id="faq" className="section bg-surface border-b border-black">
      <div className="container-tight">
        {/* Section Header - Left Aligned */}
        <div className="mb-10 grid md:grid-cols-3 gap-8 items-start">
          <div className="md:col-span-1">
            <p className="label text-muted-foreground mb-3">FAQ</p>
            <h2 className="heading-2 mb-3">
              COMMON
              <br />
              QUESTIONS
            </h2>
            <p className="body-sm text-text-secondary">
              Straight answers. No fluff.
            </p>
          </div>

          <div className="md:col-span-2">
            <Card className="p-0 border-2 border-black bg-white shadow-[4px_4px_0_rgba(0,0,0,0.1)]">
              {faqs.map((faq, index) => (
                <div
                  key={faq.id}
                  className={`${index > 0 ? "border-t border-black" : ""}`}
                >
                  <button
                    onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                    className="w-full flex items-start justify-between p-4 text-left hover:bg-paper transition-colors group"
                  >
                    <div className="flex gap-4 pr-4">
                      <span
                        className={`font-mono text-xs font-bold pt-1 transition-colors ${
                          openId === faq.id
                            ? "text-accent-dark"
                            : "text-muted-foreground"
                        }`}
                      >
                        {faq.id}
                      </span>
                      <span
                        className={`text-sm font-medium transition-colors ${
                          openId === faq.id
                            ? "text-black"
                            : "text-text-secondary group-hover:text-black"
                        }`}
                      >
                        {faq.question}
                      </span>
                    </div>
                    <span
                      className={`flex items-center justify-center transition-transform shrink-0`}
                    >
                      {openId === faq.id ? (
                        <Minus className="w-5 h-5" />
                      ) : (
                        <Plus className="w-5 h-5" />
                      )}
                    </span>
                  </button>

                  {openId === faq.id && (
                    <div className="px-4 pb-4 pl-12">
                      <p className="text-sm text-text-secondary leading-relaxed border-l-2 border-accent pl-3">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </Card>

            <div className="mt-6 flex items-center gap-3">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                Still have questions?
              </span>
              <a
                href="mailto:support@attendrix.app"
                className="text-xs font-mono font-bold hover:bg-black hover:text-white px-2 py-1 transition-all"
              >
                support@attendrix.app
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

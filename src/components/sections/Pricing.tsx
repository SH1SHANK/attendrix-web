"use client";

import Link from "next/link";
import { useState } from "react";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import DotPatternBackground from "../ui/DotPatternBackground";

// Helper for checklist items
const CheckList = ({
  items,
  checkColor = "text-black",
}: {
  items: string[];
  checkColor?: string;
}) => {
  return (
    <ul className="space-y-4">
      {items.map((item, index) => (
        <li key={index} className="flex items-start gap-3">
          <Check
            className={`w-5 h-5 mt-0.5 shrink-0 ${checkColor}`}
            strokeWidth={3}
          />
          <span className="text-base font-medium leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  );
};

const AttendrixPricing = () => {
  const [billingPeriod, setBillingPeriod] = useState<"semester" | "yearly">(
    "semester",
  );

  return (
    <section
      id="pricing"
      className="min-h-screen relative py-24 px-4 overflow-hidden"
    >
      <DotPatternBackground />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-black mb-6 tracking-tight text-black">
            Transparent, Student-First Pricing.
          </h1>

          {/* Billing Toggle - Gliding Pill Animation */}
          <div
            className="inline-grid grid-cols-2 p-1 relative"
            style={{
              backgroundColor: "#ffffff",
              border: "2px solid black",
              boxShadow: "4px 4px 0px 0px #000000",
            }}
          >
            {/* Gliding Black Pill Background */}
            <div
              className="absolute inset-y-1 bg-black transition-all duration-300 ease-out"
              style={{
                width: "calc(50% - 0.125rem)",
                left:
                  billingPeriod === "semester"
                    ? "0.25rem"
                    : "calc(50% + 0.125rem)",
              }}
            />

            {/* Semester Button */}
            <button
              onClick={() => setBillingPeriod("semester")}
              className="relative z-10 px-6 py-3 font-bold text-sm uppercase tracking-wider transition-colors duration-300 text-center"
              style={{
                color: billingPeriod === "semester" ? "#ffffff" : "#000000",
              }}
            >
              Semester
            </button>

            {/* Yearly Button */}
            <button
              onClick={() => setBillingPeriod("yearly")}
              className="relative z-10 px-6 py-3 font-bold text-sm uppercase tracking-wider transition-colors duration-300 text-center"
              style={{
                color: billingPeriod === "yearly" ? "#ffffff" : "#000000",
              }}
            >
              Yearly (Planned)
            </button>
          </div>
          <p className="mt-4 text-sm text-neutral-500 font-medium">
            Premium pricing will be published after the beta stabilizes.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          {/* Card 1: NOVICE */}
          <div
            className="p-10 min-h-105 shadow-[6px_6px_0px_0px_#000] transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[10px_10px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            style={{
              backgroundColor: "#ffffff",
              color: "#000000",
              border: "2px solid black",
            }}
          >
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-black uppercase mb-3 tracking-tight">
                  Attendrix Free (Beta)
                </h2>
                <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 border-2 border-black px-3 py-1 text-xs font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] mb-3">
                  Recommended for beta
                </div>
                <p className="text-neutral-600 font-medium">
                  Full attendance tracking across Web + Android.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-7xl font-black">₹0</span>
                  <span className="text-xl text-neutral-600 font-medium">
                    /{billingPeriod === "semester" ? "semester" : "year"}
                  </span>
                </div>
              </div>

              <div className="space-y-6">
                <CheckList
                  items={[
                    "Subject-wise attendance tracking",
                    "Attendrix Web + Android APK access",
                    "Attendance simulator (Web + APK)",
                    "Study materials (full on Web, lighter on APK)",
                    "Lumen AI (standard tier)",
                    "Calendar sync + exports",
                  ]}
                  checkColor="text-green-600"
                />
              </div>

              <Link
                href="/dashboard"
                className="w-full inline-flex items-center justify-center font-bold uppercase tracking-wide h-12 px-6 text-sm bg-white text-black border-2 border-black shadow-[4px_4px_0px_0px_#000] transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[8px_8px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              >
                Use Attendrix Web
              </Link>
            </div>
          </div>

          {/* Card 2: MASTER MAGE (Center - Premium) - DARK */}
          <div className="relative">
            {/* Most Value Badge */}
            <div className="absolute -top-4 -right-4 z-20 rotate-3">
              <Badge
                variant="rose"
                size="lg"
                style={{
                  border: "2px solid black",
                  boxShadow: "3px 3px 0px 0px #000000",
                }}
              >
                Planned
              </Badge>
            </div>

            <div
              className="scale-105 z-10 py-16 p-10 min-h-125 shadow-[8px_8px_0px_0px_#000] transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[12px_12px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              style={{
                backgroundColor: "#09090b",
                color: "#ffffff",
                border: "2px solid black",
              }}
            >
              <div className="space-y-8">
                <div>
                  <h2
                    className="text-2xl font-black uppercase mb-3 tracking-tight"
                    style={{ color: "#facc15" }}
                  >
                    Attendrix Premium
                  </h2>
                  <p className="text-neutral-300 font-medium">
                    Planned upgrades for power users and advanced AI workflows.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-6xl font-black text-white">TBD</span>
                    <span className="text-sm text-neutral-400 font-medium uppercase">
                      Pricing announced post-beta
                    </span>
                  </div>
                </div>

                <div className="space-y-6">
                <CheckList
                  items={[
                    "Everything in Free",
                    "Advanced Lumen models (planned)",
                    "Deeper syllabus analysis & RAG (planned)",
                    "Higher file upload limits (planned)",
                    "Advanced analytics views (planned)",
                    "Priority support (planned)",
                  ]}
                  checkColor="text-yellow-400"
                />
              </div>

              {/* Go Premium Button - YELLOW */}
              <a
                href="mailto:support@attendrix.app?subject=Attendrix%20Premium%20Waitlist"
                className="w-full inline-flex items-center justify-center font-bold uppercase tracking-wide h-12 px-6 text-sm bg-[#FFD02F] text-black border-2 border-black shadow-[4px_4px_0px_0px_#000] transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[8px_8px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              >
                Join Premium Waitlist
              </a>
            </div>
          </div>
        </div>

          {/* Card 3: CLASS REP */}
          <div
            className="p-10 min-h-105 shadow-[6px_6px_0px_0px_#000] transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[10px_10px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            style={{
              backgroundColor: "#ffffff",
              color: "#000000",
              border: "2px solid black",
            }}
          >
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-black uppercase mb-3 tracking-tight">
                  Batch Access
                </h2>
                <p className="text-neutral-600 font-medium">
                  Invite-only rollout coordinated with class reps.
                </p>
              </div>

              <div className="space-y-2">
                <div className="text-5xl font-black leading-tight">
                  Invite Only
                </div>
              </div>

              <div className="space-y-6">
                <CheckList
                  items={[
                    "Batch rollout coordination",
                    "Slot timetable setup",
                    "Course mapping support",
                    "Onboarding guidance",
                  ]}
                  checkColor="text-green-600"
                />
              </div>

              <a
                href="mailto:onboarding@attendrix.app"
                className="w-full inline-flex items-center justify-center font-bold uppercase tracking-wide h-12 px-6 text-sm bg-white text-black border-2 border-black shadow-[4px_4px_0px_0px_#000] transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[8px_8px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              >
                Request Batch Access
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AttendrixPricing;

"use client";

import React, { useState } from "react";
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
            Simple, Transparent Pricing.
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
              Yearly (Save 10%)
            </button>
          </div>
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
                  Novice Mage
                </h2>
                <p className="text-neutral-600 font-medium">
                  Full platform access. Start your journey.
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
                    "Subject-Wise Attendance Tracking",
                    "Mobile App + Web Access",
                    "Lumen AI (Gemini 2.5 Flash Lite)",
                    "Google Calendar Sync",
                    "Amplix Gamification (XP, Streaks, Ranks)",
                  ]}
                  checkColor="text-green-600"
                />
              </div>

              <button className="w-full font-bold uppercase tracking-wide h-12 px-6 text-sm bg-white text-black border-2 border-black shadow-[4px_4px_0px_0px_#000] transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[8px_8px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none">
                Get Started
              </button>
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
                Most Value
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
                    Master Mage
                  </h2>
                  <p className="text-neutral-300 font-medium">
                    Advanced intelligence. Deep syllabus assistance.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-7xl font-black text-white">
                      ₹{billingPeriod === "semester" ? "49" : "89"}
                    </span>
                    <span className="text-xl text-neutral-400 font-medium">
                      /{billingPeriod === "semester" ? "semester" : "year"}
                    </span>
                  </div>
                </div>

                <div className="space-y-6">
                  <CheckList
                    items={[
                      "Everything in Novice",
                      "Lumen AI (OpenRouter Pro Models)",
                      "Deep Syllabus Analysis & RAG",
                      "Higher File Upload Limits",
                      "Advanced Analytics Dashboard",
                      "Priority Support",
                    ]}
                    checkColor="text-yellow-400"
                  />
                </div>

                {/* Go Premium Button - YELLOW */}
                <button className="w-full font-bold uppercase tracking-wide h-12 px-6 text-sm bg-[#FFD02F] text-black border-2 border-black shadow-[4px_4px_0px_0px_#000] transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[8px_8px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none">
                  Go Premium
                </button>
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
                  Class Rep
                </h2>
                <p className="text-neutral-600 font-medium">
                  For batch onboarding.
                </p>
              </div>

              <div className="space-y-2">
                <div className="text-6xl font-black leading-tight">
                  Let&apos;s Talk
                </div>
              </div>

              <div className="space-y-6">
                <CheckList
                  items={[
                    "Bulk Onboarding",
                    "Custom Timetable Integration",
                    "Admin Dashboard",
                    "Dedicated Support",
                  ]}
                  checkColor="text-green-600"
                />
              </div>

              <button className="w-full font-bold uppercase tracking-wide h-12 px-6 text-sm bg-white text-black border-2 border-black shadow-[4px_4px_0px_0px_#000] transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[8px_8px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none">
                Contact Us
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AttendrixPricing;

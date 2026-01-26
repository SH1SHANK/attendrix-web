"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import {
  Download,
  ExternalLink,
  Smartphone,
  Globe,
  Zap,
  Wifi,
  Bell,
  CloudOff,
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type CardType = "android" | "web" | null;

export default function ChooseYourWeapon() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardARef = useRef<HTMLDivElement>(null);
  const cardBRef = useRef<HTMLDivElement>(null);
  const [hoveredCard, setHoveredCard] = useState<CardType>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      // Desktop animations
      mm.add("(min-width: 768px)", () => {
        // Cards slide in from sides
        if (cardARef.current) {
          gsap.fromTo(
            cardARef.current,
            { x: -80, opacity: 0 },
            {
              x: 0,
              opacity: 1,
              duration: 0.8,
              ease: "power3.out",
              scrollTrigger: {
                trigger: sectionRef.current,
                start: "top 70%",
                toggleActions: "play none none reverse",
              },
            },
          );
        }

        if (cardBRef.current) {
          gsap.fromTo(
            cardBRef.current,
            { x: 80, opacity: 0 },
            {
              x: 0,
              opacity: 1,
              duration: 0.8,
              ease: "power3.out",
              delay: 0.1,
              scrollTrigger: {
                trigger: sectionRef.current,
                start: "top 70%",
                toggleActions: "play none none reverse",
              },
            },
          );
        }
      });

      // Mobile animations
      mm.add("(max-width: 767px)", () => {
        [cardARef.current, cardBRef.current].forEach((card, i) => {
          if (card) {
            gsap.fromTo(
              card,
              { y: 40, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                duration: 0.5,
                delay: i * 0.1,
                ease: "power2.out",
                scrollTrigger: {
                  trigger: card,
                  start: "top 90%",
                },
              },
            );
          }
        });
      });

      return () => mm.revert();
    },
    { scope: sectionRef },
  );

  const getCardClasses = (card: CardType) => {
    const isHovered = hoveredCard === card;
    const otherHovered = hoveredCard !== null && !isHovered;

    return `
      relative border-4 border-black bg-white p-6 sm:p-8 
      transition-all duration-300 ease-out
      ${isHovered ? "scale-[1.02] shadow-[16px_16px_0_#0a0a0a] -translate-x-1 -translate-y-1" : "shadow-[8px_8px_0_#0a0a0a]"}
      ${otherHovered ? "opacity-60 grayscale-[40%]" : ""}
    `;
  };

  return (
    <section
      ref={sectionRef}
      id="choose"
      className="relative py-24 px-6 sm:px-8 lg:px-12 overflow-hidden bg-stone-100"
    >
      {/* Dot grid background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        aria-hidden="true"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(15,23,42,0.4) 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 border-2 border-black bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider shadow-[4px_4px_0_#0a0a0a] mb-6">
            <Zap className="h-4 w-4" />
            Choose Your Weapon
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase leading-[0.95] tracking-tight text-stone-900">
            Two Ways to{" "}
            <span className="relative inline-block">
              <span className="relative z-10">Dominate</span>
              <span className="absolute bottom-1 left-0 right-0 h-3 bg-yellow-400 -z-10 rotate-1" />
            </span>
          </h2>
        </div>

        {/* Bento Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {/* Card A: Android APK */}
          <div
            ref={cardARef}
            className={getCardClasses("android")}
            onMouseEnter={() => setHoveredCard("android")}
            onMouseLeave={() => setHoveredCard(null)}
          >
            {/* Phone Mockup */}
            <div className="mb-6 flex justify-center">
              <div className="relative">
                <div className="w-32 h-56 sm:w-40 sm:h-72 border-4 border-black bg-stone-900 rounded-2xl overflow-hidden shadow-[6px_6px_0_#0a0a0a]">
                  {/* Phone screen content */}
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-stone-700 rounded-full" />
                  <div className="h-full pt-6 pb-4 px-2 flex flex-col">
                    <div className="flex-1 bg-yellow-400 border-2 border-black m-1 p-2">
                      <div className="w-full h-3 bg-black mb-2" />
                      <div className="w-3/4 h-2 bg-black/60 mb-3" />
                      <div className="grid grid-cols-2 gap-1">
                        <div className="h-6 bg-white border border-black" />
                        <div className="h-6 bg-green-400 border border-black" />
                      </div>
                    </div>
                  </div>
                </div>
                {/* Notification badge */}
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 border-2 border-black rounded-full flex items-center justify-center">
                  <Bell className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 bg-stone-900 text-white px-3 py-1 text-xs font-bold uppercase">
                <Smartphone className="h-3.5 w-3.5" />
                Android
              </div>
              <h3 className="text-2xl sm:text-3xl font-black uppercase">
                The Power User
              </h3>
              <p className="text-stone-600 leading-relaxed">
                Background sync, notifications, and offline access. The full
                native experience.
              </p>

              {/* Features */}
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                <span className="inline-flex items-center gap-1 border border-black bg-green-100 px-2 py-1 text-xs font-semibold">
                  <Bell className="h-3 w-3" /> Notifications
                </span>
                <span className="inline-flex items-center gap-1 border border-black bg-blue-100 px-2 py-1 text-xs font-semibold">
                  <CloudOff className="h-3 w-3" /> Offline
                </span>
                <span className="inline-flex items-center gap-1 border border-black bg-purple-100 px-2 py-1 text-xs font-semibold">
                  <Wifi className="h-3 w-3" /> Background Sync
                </span>
              </div>

              {/* CTA */}
              <Link
                href="/download"
                className="inline-flex items-center gap-3 border-2 border-black bg-white px-6 py-3 text-sm font-bold uppercase shadow-[4px_4px_0_#0a0a0a] transition-all hover:shadow-[2px_2px_0_#0a0a0a] hover:-translate-x-[2px] hover:-translate-y-[2px] mt-4"
              >
                <Download className="h-4 w-4" />
                Download .APK
              </Link>
            </div>
          </div>

          {/* Card B: Web Experience */}
          <div
            ref={cardBRef}
            className={getCardClasses("web")}
            onMouseEnter={() => setHoveredCard("web")}
            onMouseLeave={() => setHoveredCard(null)}
          >
            {/* Browser Mockup */}
            <div className="mb-6 flex justify-center">
              <div className="relative w-full max-w-xs">
                <div className="border-4 border-black bg-white shadow-[6px_6px_0_#0a0a0a] overflow-hidden">
                  {/* Browser chrome */}
                  <div className="flex items-center gap-2 px-3 py-2 bg-stone-100 border-b-2 border-black">
                    <div className="flex gap-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400 border border-black" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 border border-black" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-400 border border-black" />
                    </div>
                    <div className="flex-1 ml-2">
                      <div className="bg-white border border-black px-2 py-0.5 text-[10px] font-mono text-stone-500 truncate">
                        attendrix.app
                      </div>
                    </div>
                  </div>
                  {/* Browser content */}
                  <div className="p-4 bg-linear-to-br from-yellow-400 to-yellow-300 h-32 sm:h-40 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-3xl sm:text-4xl font-black mb-1">
                        ⚡
                      </div>
                      <div className="text-sm font-bold uppercase">
                        Instant Access
                      </div>
                    </div>
                  </div>
                </div>
                {/* Speed indicator */}
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-yellow-400 border-2 border-black flex items-center justify-center shadow-[2px_2px_0_#0a0a0a]">
                  <Zap className="h-5 w-5" />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 bg-yellow-400 text-black border-2 border-black px-3 py-1 text-xs font-bold uppercase">
                <Globe className="h-3.5 w-3.5" />
                Web App
              </div>
              <h3 className="text-2xl sm:text-3xl font-black uppercase">
                The Speedster
              </h3>
              <p className="text-stone-600 leading-relaxed">
                No install required. Access your stats from any device,
                anywhere, instantly.
              </p>

              {/* Features */}
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                <span className="inline-flex items-center gap-1 border border-black bg-yellow-100 px-2 py-1 text-xs font-semibold">
                  <Zap className="h-3 w-3" /> Instant
                </span>
                <span className="inline-flex items-center gap-1 border border-black bg-green-100 px-2 py-1 text-xs font-semibold">
                  <Globe className="h-3 w-3" /> Any Device
                </span>
                <span className="inline-flex items-center gap-1 border border-black bg-blue-100 px-2 py-1 text-xs font-semibold">
                  <ExternalLink className="h-3 w-3" /> No Install
                </span>
              </div>

              {/* CTA */}
              <Link
                href="/app"
                className="inline-flex items-center gap-3 border-2 border-black bg-white px-6 py-3 text-sm font-bold uppercase shadow-[4px_4px_0_#0a0a0a] transition-all hover:shadow-[2px_2px_0_#0a0a0a] hover:-translate-x-[2px] hover:-translate-y-[2px] mt-4"
              >
                <ExternalLink className="h-4 w-4" />
                Launch Web
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

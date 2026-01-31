"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Github, Twitter, Send, Signal, ChevronRight } from "lucide-react";

// ============================================
// ANIMATION VARIANTS
// ============================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.4,
    },
  },
};

const mobileContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.2,
    },
  },
};

const columnVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut" as const,
    },
  },
};

const bottomBarVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.4,
      delay: 0.8,
    },
  },
};

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
  { label: "Data Processing", href: "/data-processing" },
];

const socialLinks = [
  { icon: Twitter, href: "https://twitter.com/attendrix", label: "Twitter" },
  { icon: Github, href: "https://github.com/attendrix", label: "GitHub" },
  { icon: Send, href: "https://t.me/HeyLumenBot", label: "Telegram" },
];

// ============================================
// ANIMATED COMPONENTS
// ============================================

// Animated Footer Link with Magnetic Slide + Chevron
function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      className="group relative will-change-transform"
      initial="rest"
      whileHover="hover"
      animate="rest"
    >
      <Link
        href={href}
        className="flex items-center gap-1 text-neutral-400 py-2 text-sm font-medium transition-colors duration-200 group-hover:text-[#FFD02F]"
      >
        {/* Chevron that fades in on hover */}
        <motion.span
          className="text-[#FFD02F]"
          variants={{
            rest: { opacity: 0, x: -8 },
            hover: { opacity: 1, x: 0 },
          }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <ChevronRight className="w-3 h-3" strokeWidth={3} />
        </motion.span>

        {/* Link text that slides right */}
        <motion.span
          variants={{
            rest: { x: 0 },
            hover: { x: 4 },
          }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          {children}
        </motion.span>
      </Link>
    </motion.div>
  );
}

// Social Button with Physical Press Effect
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
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="w-11 h-11 bg-white text-black flex items-center justify-center border-2 border-white will-change-transform"
      initial={{ boxShadow: "3px 3px 0px 0px rgba(255,255,255,0.3)" }}
      whileHover={{
        y: -4,
        x: -2,
        boxShadow: "5px 5px 0px 0px #333333",
      }}
      whileTap={{
        y: 0,
        x: 0,
        boxShadow: "1px 1px 0px 0px #333333",
      }}
      transition={{ type: "spring", stiffness: 400, damping: 15 }}
    >
      <Icon className="w-5 h-5" strokeWidth={2.5} />
    </motion.a>
  );
}

// Pulsing Status Dot with Breathing Animation
function PulsingDot() {
  return (
    <span className="relative flex h-2.5 w-2.5">
      {/* Outer ripple */}
      <motion.span
        className="absolute inline-flex h-full w-full rounded-full bg-green-400"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.75, 0, 0.75],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      {/* Inner breathing dot */}
      <motion.span
        className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"
        animate={{
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </span>
  );
}

// ============================================
// MAIN FOOTER COMPONENT
// ============================================

export default function Footer() {
  const prefersReducedMotion = useReducedMotion();

  // Use simpler variants on mobile or reduced motion
  const activeContainerVariants = prefersReducedMotion
    ? mobileContainerVariants
    : containerVariants;

  return (
    <footer className="bg-neutral-950 text-white overflow-hidden">
      {/* Section A: Link Grid */}
      <motion.div
        className="max-w-7xl mx-auto px-4 py-12 md:py-16"
        variants={activeContainerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="grid grid-cols-2 md:grid-cols-3 gap-10 md:gap-8">
          {/* Column 1: Brand & Status */}
          <motion.div
            className="col-span-2 md:col-span-1"
            variants={columnVariants}
          >
            {/* Logo */}
            <div className="flex items-center gap-3 mb-4">
              <motion.div
                className="w-10 h-10 bg-[#FFD02F] border-2 border-white flex items-center justify-center"
                whileHover={{ rotate: -5 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                style={{ boxShadow: "2px 2px 0 rgba(255,255,255,0.3)" }}
              >
                <span className="font-mono font-bold text-lg text-black">
                  A
                </span>
              </motion.div>
              <span className="font-bold text-xl tracking-tight">
                ATTENDRIX
              </span>
            </div>

            {/* Tagline */}
            <p className="text-sm text-neutral-400 mb-6 leading-relaxed">
              Built by NITC Students,
              <br />
              for NITC Students.
            </p>

            {/* Live Status Badge */}
            <motion.div
              className="inline-flex items-center gap-2 bg-neutral-900 border border-neutral-800 px-3 py-1.5"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <PulsingDot />
              <Signal className="w-3 h-3 text-green-500" />
              <span className="text-xs font-medium text-neutral-400">
                Systems Normal
              </span>
            </motion.div>
          </motion.div>

          {/* Column 2: Product */}
          <motion.div variants={columnVariants}>
            <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-4">
              Product
            </h4>
            <ul className="space-y-0.5">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <FooterLink href={link.href}>{link.label}</FooterLink>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Column 4: Legal */}
          <motion.div variants={columnVariants}>
            <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-4">
              Legal
            </h4>
            <ul className="space-y-0.5">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <FooterLink href={link.href}>{link.label}</FooterLink>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </motion.div>

      {/* Section C: Bottom Bar */}
      <motion.div
        className="border-t border-white/10"
        variants={bottomBarVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <p className="text-xs text-neutral-500 font-medium uppercase tracking-wide">
              © 2026 Attendrix Open Source
            </p>

            {/* Social Icons */}
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
        </div>
      </motion.div>
    </footer>
  );
}

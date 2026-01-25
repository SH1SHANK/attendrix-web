"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  User,
  Flame,
  Star,
  Calendar,
  Trophy,
  Settings,
  Trash2,
  Moon,
  Bell,
  ChevronRight,
  Sparkles,
  Zap,
  Target,
} from "lucide-react";
import { useProfile } from "@/hooks/queries/useProfile";
import { RetroSwitch } from "@/components/ui/RetroSwitch";

// ============================================================================
// Animation Variants
// ============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

// ============================================================================
// Sub-Components
// ============================================================================

function IdentityHeader({
  name,
  username,
  avatarInitials,
  batchID,
  batchLabel,
}: {
  name: string;
  username: string;
  avatarInitials: string;
  batchID: string;
  batchLabel: string;
}) {
  return (
    <motion.div
      className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-white border-2 border-black shadow-[6px_6px_0px_0px_#000]"
      variants={itemVariants}
    >
      {/* Avatar */}
      <div className="relative">
        <motion.div
          className="w-24 h-24 bg-[#FFD02F] border-4 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_#000]"
          whileHover={{ scale: 1.05, rotate: 2 }}
        >
          <span className="font-black text-3xl text-black">
            {avatarInitials}
          </span>
        </motion.div>
        {/* Status indicator */}
        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-2 border-black flex items-center justify-center">
          <Zap className="w-3 h-3 text-white" />
        </div>
      </div>

      {/* Details */}
      <div className="text-center sm:text-left flex-1">
        <h2 className="font-black text-2xl md:text-3xl uppercase tracking-tight">
          {name}
        </h2>
        <p className="font-mono text-sm text-neutral-500 mt-1">@{username}</p>
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
          <span className="px-2 py-1 bg-black text-white font-mono text-xs font-bold">
            {batchID}
          </span>
          <span className="font-medium text-sm text-neutral-600">
            {batchLabel}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function GamificationCard({
  mageRank,
  streak,
  longestStreak,
  totalClassesAttended,
  perfectDays,
}: {
  mageRank: {
    level: number;
    title: string;
    stars: number;
    xpCurrent: number;
    xpRequired: number;
  };
  streak: number;
  longestStreak: number;
  totalClassesAttended: number;
  perfectDays: number;
}) {
  const xpPercentage = (mageRank.xpCurrent / mageRank.xpRequired) * 100;

  return (
    <motion.div
      className="relative overflow-hidden bg-linear-to-br from-purple-900 to-indigo-950 border-2 border-black shadow-[8px_8px_0px_0px_#000] p-6"
      variants={itemVariants}
    >
      {/* Background Pattern */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 10px,
            rgba(255,255,255,0.1) 10px,
            rgba(255,255,255,0.1) 20px
          )`,
        }}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="w-5 h-5 text-yellow-400" />
          <span className="font-mono text-xs uppercase tracking-widest text-purple-300">
            Mage Profile
          </span>
        </div>

        {/* Rank Display */}
        <div className="text-center mb-6">
          {/* Stars */}
          <div className="flex items-center justify-center gap-1 mb-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-6 h-6 ${
                  i < mageRank.stars
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-purple-700"
                }`}
              />
            ))}
          </div>
          {/* Rank Title */}
          <motion.h3
            className="font-black text-3xl md:text-4xl text-white uppercase tracking-wide"
            style={{ textShadow: "2px 2px 0px rgba(0,0,0,0.3)" }}
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {mageRank.title}
          </motion.h3>
          <p className="font-mono text-sm text-purple-400 mt-1">
            Level {mageRank.level}
          </p>
        </div>

        {/* XP Bar */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className="font-mono text-xs text-purple-300">XP</span>
            <span className="font-mono text-xs text-purple-300">
              {mageRank.xpCurrent.toLocaleString()} /{" "}
              {mageRank.xpRequired.toLocaleString()}
            </span>
          </div>
          <div className="h-6 bg-purple-950 border-2 border-purple-600 overflow-hidden relative">
            {/* Striped fill */}
            <motion.div
              className="h-full"
              style={{
                width: `${xpPercentage}%`,
                backgroundImage: `repeating-linear-gradient(
                  -45deg,
                  #a855f7,
                  #a855f7 8px,
                  #9333ea 8px,
                  #9333ea 16px
                )`,
                backgroundSize: "20px 20px",
              }}
              initial={{ width: 0 }}
              animate={{ width: `${xpPercentage}%` }}
              transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
            />
            {/* Animated stripes */}
            <motion.div
              className="absolute inset-0"
              style={{
                backgroundImage: `repeating-linear-gradient(
                  -45deg,
                  transparent,
                  transparent 8px,
                  rgba(255,255,255,0.1) 8px,
                  rgba(255,255,255,0.1) 16px
                )`,
                backgroundSize: "20px 20px",
              }}
              animate={{ backgroundPosition: ["0px 0px", "40px 40px"] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
          </div>
          <p className="font-mono text-[10px] text-purple-400 mt-1 text-right">
            {mageRank.xpRequired - mageRank.xpCurrent} XP to next level
          </p>
        </div>

        {/* Streak */}
        <div className="flex items-center justify-center gap-3 p-4 bg-black/30 border border-purple-700">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Flame className="w-8 h-8 text-orange-500" />
          </motion.div>
          <div>
            <span className="font-mono text-xs uppercase tracking-wider text-purple-400 block">
              Current Streak
            </span>
            <span className="font-black text-2xl text-white">
              {streak} Days
            </span>
          </div>
        </div>

        {/* Mini Stats */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="text-center p-2 bg-black/20 border border-purple-800">
            <Trophy className="w-4 h-4 text-yellow-500 mx-auto mb-1" />
            <span className="font-black text-lg text-white block">
              {longestStreak}
            </span>
            <span className="font-mono text-[9px] text-purple-400 uppercase">
              Best Streak
            </span>
          </div>
          <div className="text-center p-2 bg-black/20 border border-purple-800">
            <Calendar className="w-4 h-4 text-green-500 mx-auto mb-1" />
            <span className="font-black text-lg text-white block">
              {totalClassesAttended}
            </span>
            <span className="font-mono text-[9px] text-purple-400 uppercase">
              Attended
            </span>
          </div>
          <div className="text-center p-2 bg-black/20 border border-purple-800">
            <Target className="w-4 h-4 text-blue-500 mx-auto mb-1" />
            <span className="font-black text-lg text-white block">
              {perfectDays}
            </span>
            <span className="font-mono text-[9px] text-purple-400 uppercase">
              Perfect Days
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function SettingsGroup({
  settings,
  onToggle,
  onResetData,
}: {
  settings?: {
    googleCalendarSync: boolean;
    darkMode: boolean;
    notifications: boolean;
  };
  onToggle: (key: "googleCalendarSync" | "darkMode" | "notifications") => void;
  onResetData: () => void;
}) {
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Default settings
  const safeSettings = settings || {
    googleCalendarSync: false,
    darkMode: false,
    notifications: true,
  };

  return (
    <motion.div
      className="bg-white border-2 border-black shadow-[6px_6px_0px_0px_#000]"
      variants={itemVariants}
    >
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b-2 border-black bg-neutral-100">
        <Settings className="w-5 h-5" />
        <h3 className="font-black uppercase text-lg">Settings</h3>
      </div>

      {/* Settings Items */}
      <div className="divide-y-2 divide-black">
        {/* Google Calendar Sync */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-blue-600" />
            <div>
              <span className="font-bold block">Google Calendar Sync</span>
              <span className="text-xs text-neutral-500">
                Sync classes to your calendar
              </span>
            </div>
          </div>
          <RetroSwitch
            checked={safeSettings.googleCalendarSync}
            onCheckedChange={() => onToggle("googleCalendarSync")}
          />
        </div>

        {/* Dark Mode */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Moon className="w-5 h-5 text-indigo-600" />
            <div>
              <span className="font-bold block">Dark Mode</span>
              <span className="text-xs text-neutral-500">
                Easier on the eyes
              </span>
            </div>
          </div>
          <RetroSwitch
            checked={safeSettings.darkMode}
            onCheckedChange={() => onToggle("darkMode")}
          />
        </div>

        {/* Notifications */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-yellow-600" />
            <div>
              <span className="font-bold block">Notifications</span>
              <span className="text-xs text-neutral-500">Class reminders</span>
            </div>
          </div>
          <RetroSwitch
            checked={safeSettings.notifications}
            onCheckedChange={() => onToggle("notifications")}
          />
        </div>

        {/* Danger Zone */}
        <div className="p-4 bg-red-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trash2 className="w-5 h-5 text-red-600" />
              <div>
                <span className="font-bold text-red-800 block">
                  Reset All Data
                </span>
                <span className="text-xs text-red-600">
                  This action cannot be undone
                </span>
              </div>
            </div>
            {!showResetConfirm ? (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="px-4 py-2 border-2 border-red-600 text-red-600 font-bold uppercase text-xs hover:bg-red-100 transition-colors"
              >
                Reset
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-3 py-2 border-2 border-neutral-400 text-neutral-600 font-bold uppercase text-xs hover:bg-neutral-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onResetData();
                    setShowResetConfirm(false);
                  }}
                  className="px-3 py-2 bg-red-600 border-2 border-red-800 text-white font-bold uppercase text-xs hover:bg-red-700 transition-colors shadow-[2px_2px_0px_0px_#991b1b]"
                >
                  Confirm
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function QuickLinks() {
  const links = [
    { label: "View Full Dashboard", href: "/profile", icon: User },
    { label: "Account Settings", href: "/settings", icon: Settings },
    { label: "Help & Support", href: "/docs", icon: ChevronRight },
  ];

  return (
    <motion.div variants={itemVariants} className="space-y-2">
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className="flex items-center justify-between p-4 bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
        >
          <div className="flex items-center gap-3">
            <link.icon className="w-5 h-5" />
            <span className="font-bold">{link.label}</span>
          </div>
          <ChevronRight className="w-5 h-5 text-neutral-400" />
        </a>
      ))}
    </motion.div>
  );
}

// ============================================================================
// Main Profile Page
// ============================================================================

export default function ProfilePage() {
  const { profile, updateSetting, resetData, loading } = useProfile();

  if (loading || !profile) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-black border-t-green-400 rounded-full animate-spin" />
          <p className="font-mono text-sm font-bold uppercase tracking-widest text-neutral-500 animate-pulse">
            Loading Profile...
          </p>
        </div>
      </div>
    );
  }

  const handleToggle = (
    key: "googleCalendarSync" | "darkMode" | "notifications",
  ) => {
    if (!profile.settings) return;
    updateSetting(key, !profile.settings[key]);
  };

  return (
    <motion.div
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Page Header */}
      <motion.header variants={itemVariants} className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-400 border-2 border-black flex items-center justify-center shadow-[3px_3px_0px_0px_#000]">
            <User className="w-5 h-5" />
          </div>
          <h1 className="font-black text-3xl md:text-4xl uppercase tracking-tight">
            Profile
          </h1>
        </div>
        <p className="font-medium text-neutral-600 max-w-xl">
          Your identity, achievements, and preferences.
        </p>
      </motion.header>

      {/* Two Column Layout on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-8">
          {/* Identity Header */}
          <IdentityHeader
            name={profile.name}
            username={profile.username}
            avatarInitials={profile.avatarInitials}
            batchID={profile.batchID}
            batchLabel={profile.batchLabel}
          />

          {/* Settings */}
          <SettingsGroup
            settings={profile.settings}
            onToggle={handleToggle}
            onResetData={resetData}
          />
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Gamification Card */}
          <GamificationCard
            mageRank={profile.mageRank}
            streak={profile.streak}
            longestStreak={profile.longestStreak}
            totalClassesAttended={profile.totalClassesAttended}
            perfectDays={profile.perfectDays}
          />

          {/* Quick Links */}
          <QuickLinks />

          {/* Developer Zone */}
          <div className="border-2 border-dashed border-neutral-300 p-4 bg-neutral-50">
            <h4 className="font-mono text-xs font-bold uppercase text-neutral-500 mb-3 tracking-wider">
              Developer Zone
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <a
                href="https://github.com/SH1SHANK/attendrixweb/issues/new?labels=bug,alpha&template=bug_report.md&title=[ALPHA]+Bug+Report:"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-neutral-300 text-neutral-700 font-bold uppercase text-xs hover:border-black hover:text-black transition-colors"
              >
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                Report Issue
              </a>
              <a
                href="/app/changelog"
                className="flex items-center justify-center gap-2 px-3 py-2 bg-neutral-900 text-white border border-black font-bold uppercase text-xs hover:bg-black transition-colors"
              >
                <span className="font-mono">{">_"}</span>
                Eng Log
              </a>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

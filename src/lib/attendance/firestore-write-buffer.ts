"use client";

import { applyFirestoreAttendanceUpdates } from "@/lib/attendance/attendance-service";
import type { CourseAttendanceSummary } from "@/types/types-defination";
import { recordMetric } from "@/lib/metrics/client-metrics";

export type FirestoreAttendanceUpdate = {
  uid: string;
  summary: CourseAttendanceSummary[];
  amplixDelta: number;
  streakUpdates?: {
    streakHistory?: number[];
    currentStreak?: number;
    longestStreak?: number;
  };
};

type PendingUpdate = {
  update: FirestoreAttendanceUpdate;
  hash: string;
  enqueuedAt: number;
};

const FLUSH_INTERVAL_MS = 15_000;
let flushTimer: number | null = null;
let isFlushing = false;
let flushRequested = false;
let initialized = false;

const pending = new Map<string, PendingUpdate>();
const supersededUids = new Set<string>();

function summarizeSummary(summary: CourseAttendanceSummary[]) {
  return [...summary]
    .sort((a, b) => a.courseID.localeCompare(b.courseID))
    .map((item) =>
      `${item.courseID}:${item.attendedClasses ?? 0}/${item.totalClasses ?? 0}`,
    )
    .join("|");
}

function hashUpdate(update: FirestoreAttendanceUpdate) {
  const payload = {
    summary: summarizeSummary(update.summary),
    amplixDelta: update.amplixDelta,
    streakUpdates: update.streakUpdates ?? null,
  };
  return JSON.stringify(payload);
}

function mergeUpdates(
  previous: FirestoreAttendanceUpdate,
  next: FirestoreAttendanceUpdate,
): FirestoreAttendanceUpdate {
  return {
    uid: next.uid,
    summary: next.summary.length ? next.summary : previous.summary,
    amplixDelta: (previous.amplixDelta ?? 0) + (next.amplixDelta ?? 0),
    streakUpdates: next.streakUpdates ?? previous.streakUpdates,
  };
}

function scheduleFlush(delayMs: number) {
  if (typeof window === "undefined") return;
  if (flushTimer) return;
  flushTimer = window.setTimeout(() => {
    flushTimer = null;
    void flushFirestoreAttendanceUpdates();
  }, delayMs);
}

export function enqueueFirestoreAttendanceUpdate(
  update: FirestoreAttendanceUpdate,
  options: { urgent?: boolean } = {},
) {
  if (!update.uid) return;

  const hash = hashUpdate(update);
  const existing = pending.get(update.uid);

  if (existing) {
    if (existing.hash === hash) {
      recordMetric("firestore.update.skipped", 1);
      return;
    }

    const merged = mergeUpdates(existing.update, update);
    pending.set(update.uid, {
      update: merged,
      hash: hashUpdate(merged),
      enqueuedAt: Date.now(),
    });
    supersededUids.add(update.uid);
  } else {
    pending.set(update.uid, {
      update,
      hash,
      enqueuedAt: Date.now(),
    });
  }

  recordMetric("firestore.update.enqueued", 1);

  if (options.urgent) {
    queueMicrotask(() => {
      void flushFirestoreAttendanceUpdates();
    });
    return;
  }

  scheduleFlush(FLUSH_INTERVAL_MS);
}

export async function flushFirestoreAttendanceUpdates() {
  if (isFlushing) {
    flushRequested = true;
    return;
  }

  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  if (pending.size === 0) return;

  isFlushing = true;
  flushRequested = false;

  const updates = Array.from(pending.values());
  pending.clear();

  for (const entry of updates) {
    try {
      await applyFirestoreAttendanceUpdates(entry.update);
      recordMetric("firestore.update.flushed", 1);
    } catch (error) {
      console.error("[FirestoreBuffer] Flush failed", error);
    }
  }

  if (supersededUids.size > 0) {
    console.warn(
      "[FirestoreBuffer] Superseded updates detected; latest payloads will flush next.",
      Array.from(supersededUids),
    );
    supersededUids.clear();
  }

  isFlushing = false;

  if (flushRequested || pending.size > 0) {
    await flushFirestoreAttendanceUpdates();
  }
}

export async function flushNow() {
  return flushFirestoreAttendanceUpdates();
}

export function initFirestoreWriteBuffer() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  const flush = () => {
    void flushFirestoreAttendanceUpdates();
  };

  window.addEventListener("online", flush);
  window.addEventListener("pagehide", flush);
  window.addEventListener("beforeunload", flush);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
  });

  if (process.env.NODE_ENV !== "production") {
    (window as Window & { __attendrixBuffer?: unknown }).__attendrixBuffer = {
      enqueueFirestoreAttendanceUpdate,
      flushFirestoreAttendanceUpdates,
      getPendingCount: () => pending.size,
    };
  }
}

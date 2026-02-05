"use client";

import { useCallback, useMemo, useState } from "react";
import {
  readResourceActivity,
  writeResourceActivity,
  type ResourceActivityState,
} from "@/lib/resources/storage";

const DEFAULT_STATE: ResourceActivityState = {
  favorites: [],
  lastOpened: {},
};

const RECENT_OPEN_THRESHOLD_MS = 30 * 1000;

function areStatesEqual(
  a: ResourceActivityState,
  b: ResourceActivityState,
) {
  if (a === b) return true;
  if (a.favorites.length !== b.favorites.length) return false;
  for (let i = 0; i < a.favorites.length; i += 1) {
    if (a.favorites[i] !== b.favorites[i]) return false;
  }

  const aKeys = Object.keys(a.lastOpened);
  const bKeys = Object.keys(b.lastOpened);
  if (aKeys.length !== bKeys.length) return false;
  for (const key of aKeys) {
    if (a.lastOpened[key] !== b.lastOpened[key]) return false;
  }

  return true;
}

export function useResourcePreferences(userId: string | null) {
  const [version, setVersion] = useState(0);

  const state = useMemo(() => {
    if (!userId) return DEFAULT_STATE;
    void version;
    return readResourceActivity(userId);
  }, [userId, version]);

  const updateState = useCallback(
    (updater: (current: ResourceActivityState) => ResourceActivityState) => {
      if (!userId) return;
      const next = updater(state);
      if (areStatesEqual(state, next)) return;
      writeResourceActivity(userId, next);
      setVersion((current) => current + 1);
    },
    [state, userId],
  );

  const toggleFavorite = useCallback(
    (courseId: string) => {
      updateState((current) => {
        const exists = current.favorites.includes(courseId);
        const favorites = exists
          ? current.favorites.filter((id) => id !== courseId)
          : [...current.favorites, courseId];
        return { ...current, favorites };
      });
    },
    [updateState],
  );

  const markOpened = useCallback(
    (courseId: string) => {
      updateState((current) => ({
        ...current,
        lastOpened: (() => {
          const existing = current.lastOpened[courseId];
          if (existing) {
            const lastOpenedMs = new Date(existing).getTime();
            if (
              Number.isFinite(lastOpenedMs) &&
              Date.now() - lastOpenedMs < RECENT_OPEN_THRESHOLD_MS
            ) {
              return current.lastOpened;
            }
          }
          return {
            ...current.lastOpened,
            [courseId]: new Date().toISOString(),
          };
        })(),
      }));
    },
    [updateState],
  );

  const favoritesSet = useMemo(() => new Set(state.favorites), [state.favorites]);

  return {
    favorites: state.favorites,
    favoritesSet,
    lastOpened: state.lastOpened,
    toggleFavorite,
    markOpened,
  };
}

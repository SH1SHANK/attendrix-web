"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { doc, getDoc, updateDoc, deleteField } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type OfflineFileMeta = {
  fileId: string;
  size: number;
  cachedAt: string;
  name?: string;
  courseId?: string;
  path?: string;
  mimeType?: string;
  storageMode?: "web" | "folder";
};

export type StudyMaterialsPreferences = {
  favorites?: Record<string, true>;
  tags?: Record<string, string[]>;
  lastOpened?: Record<string, string>;
  sectionOrder?: string[];
  offlineFiles?: Record<string, OfflineFileMeta>;
  cacheConfig?: {
    limitMb?: number | null;
  };
  offlineStorageMode?: "web" | "folder";
};

type CacheState = {
  uid: string | null;
  loaded: boolean;
  hasField: boolean;
  data: StudyMaterialsPreferences;
  loadPromise: Promise<StudyMaterialsPreferences> | null;
};

const DEFAULT_SECTION_ORDER = [
  "favorites",
  "recent",
  "offline",
  "tagged",
  "all",
];
const OPENED_THRESHOLD_MS = 30 * 1000;
const WRITE_DEBOUNCE_MS = 6000;

const cacheState: CacheState = {
  uid: null,
  loaded: false,
  hasField: false,
  data: {},
  loadPromise: null,
};

const subscribers = new Set<(data: StudyMaterialsPreferences) => void>();
let pendingPatch: Record<string, unknown> = {};
let pendingUid: string | null = null;
let writeTimer: ReturnType<typeof setTimeout> | null = null;

const notify = (data: StudyMaterialsPreferences) => {
  subscribers.forEach((callback) => callback(data));
};

const normalizePrefs = (raw: unknown): StudyMaterialsPreferences => {
  if (!raw || typeof raw !== "object") return {};
  return raw as StudyMaterialsPreferences;
};

const mergePreferences = (
  server: StudyMaterialsPreferences,
  local: StudyMaterialsPreferences,
): StudyMaterialsPreferences => {
  return {
    ...server,
    ...local,
    favorites: { ...server.favorites, ...local.favorites },
    tags: { ...server.tags, ...local.tags },
    lastOpened: { ...server.lastOpened, ...local.lastOpened },
    offlineFiles: { ...server.offlineFiles, ...local.offlineFiles },
    sectionOrder: local.sectionOrder ?? server.sectionOrder,
  };
};

const isSameArray = (a: string[] | undefined, b: string[]) => {
  if (!a) return b.length === 0;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};

const getDefaultOrder = () => DEFAULT_SECTION_ORDER.slice();

async function loadPreferences(uid: string) {
  if (cacheState.uid === uid && cacheState.loaded) {
    return cacheState.data;
  }

  if (cacheState.loadPromise) {
    return cacheState.loadPromise;
  }

  cacheState.uid = uid;
  cacheState.loaded = false;
  cacheState.hasField = false;
  cacheState.data = {};
  notify(cacheState.data);

  cacheState.loadPromise = (async () => {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);
    const raw = snap.exists()
      ? (snap.data()?.studyMaterialsPreferences as unknown)
      : null;
    const data = normalizePrefs(raw);
    const merged = mergePreferences(data, cacheState.data);

    cacheState.data = merged;
    cacheState.loaded = true;
    cacheState.hasField = Boolean(raw);
    cacheState.loadPromise = null;
    notify(cacheState.data);
    return cacheState.data;
  })();

  return cacheState.loadPromise;
}

const scheduleFlush = () => {
  if (writeTimer) return;
  writeTimer = setTimeout(async () => {
    if (!pendingUid || Object.keys(pendingPatch).length === 0) {
      writeTimer = null;
      return;
    }

    const patch = pendingPatch;
    pendingPatch = {};
    const uid = pendingUid;
    writeTimer = null;

    try {
      await updateDoc(doc(db, "users", uid), patch);
    } catch (error) {
      console.error("Study materials preference update failed", error);
    }
  }, WRITE_DEBOUNCE_MS);
};

const enqueuePatch = (uid: string, patch: Record<string, unknown>) => {
  pendingUid = uid;
  pendingPatch = { ...pendingPatch, ...patch };
  scheduleFlush();
};

export function useStudyMaterialsPreferences(uid: string | null) {
  const [prefs, setPrefs] = useState<StudyMaterialsPreferences>(() => {
    if (cacheState.uid === uid && cacheState.loaded) {
      return cacheState.data;
    }
    return {};
  });

  useEffect(() => {
    if (!uid) return;
    let active = true;

    const unsubscribe = () => {
      subscribers.delete(handleUpdate);
    };

    const handleUpdate = (data: StudyMaterialsPreferences) => {
      if (!active) return;
      setPrefs(data);
    };

    subscribers.add(handleUpdate);

    void loadPreferences(uid).then((data) => {
      if (active) setPrefs(data);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [uid]);

  useEffect(() => {
    const flush = () => {
      if (!pendingUid || Object.keys(pendingPatch).length === 0) return;
      void updateDoc(doc(db, "users", pendingUid), pendingPatch);
      pendingPatch = {};
    };

    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", flush);
      return () => window.removeEventListener("beforeunload", flush);
    }
    return undefined;
  }, []);

  const updateLocal = useCallback(
    (next: StudyMaterialsPreferences) => {
      cacheState.data = next;
      notify(next);
    },
    [],
  );

  const favorites = useMemo(() => prefs.favorites ?? {}, [prefs.favorites]);
  const tags = useMemo(() => prefs.tags ?? {}, [prefs.tags]);
  const lastOpened = useMemo(
    () => prefs.lastOpened ?? {},
    [prefs.lastOpened],
  );
  const offlineFiles = useMemo(
    () => prefs.offlineFiles ?? {},
    [prefs.offlineFiles],
  );
  const sectionOrder = useMemo(
    () => prefs.sectionOrder ?? getDefaultOrder(),
    [prefs.sectionOrder],
  );
  const cacheConfig = useMemo(
    () => prefs.cacheConfig ?? {},
    [prefs.cacheConfig],
  );
  const offlineStorageMode = useMemo(
    () => prefs.offlineStorageMode ?? "web",
    [prefs.offlineStorageMode],
  );

  const toggleFavorite = useCallback(
    (resourceId: string) => {
      if (!uid) return;
      const current = Boolean(favorites[resourceId]);
      const nextFavorites = { ...favorites };
      if (current) {
        delete nextFavorites[resourceId];
      } else {
        nextFavorites[resourceId] = true;
      }

      updateLocal({ ...prefs, favorites: nextFavorites });

      const key = `studyMaterialsPreferences.favorites.${resourceId}`;
      enqueuePatch(uid, {
        [key]: current ? deleteField() : true,
      });
    },
    [favorites, prefs, uid, updateLocal],
  );

  const setTags = useCallback(
    (resourceId: string, nextTags: string[]) => {
      if (!uid) return;
      const normalized = Array.from(
        new Set(
          nextTags
            .map((tag) => tag.trim())
            .filter((tag) => tag.length > 0),
        ),
      );

      const current = tags[resourceId] ?? [];
      if (isSameArray(current, normalized)) return;

      const nextMap = { ...tags };
      if (normalized.length === 0) {
        delete nextMap[resourceId];
      } else {
        nextMap[resourceId] = normalized;
      }

      updateLocal({ ...prefs, tags: nextMap });

      const key = `studyMaterialsPreferences.tags.${resourceId}`;
      enqueuePatch(uid, {
        [key]: normalized.length === 0 ? deleteField() : normalized,
      });
    },
    [prefs, tags, uid, updateLocal],
  );

  const markOpened = useCallback(
    (resourceId: string) => {
      if (!uid) return;
      const now = new Date();
      const current = lastOpened[resourceId];
      if (current) {
        const last = new Date(current).getTime();
        if (Number.isFinite(last) && now.getTime() - last < OPENED_THRESHOLD_MS) {
          return;
        }
      }

      const nextMap = {
        ...lastOpened,
        [resourceId]: now.toISOString(),
      };

      updateLocal({ ...prefs, lastOpened: nextMap });

      const key = `studyMaterialsPreferences.lastOpened.${resourceId}`;
      enqueuePatch(uid, {
        [key]: now.toISOString(),
      });
    },
    [lastOpened, prefs, uid, updateLocal],
  );

  const updateSectionOrder = useCallback(
    (nextOrder: string[]) => {
      if (!uid) return;
      if (isSameArray(sectionOrder, nextOrder)) return;
      updateLocal({ ...prefs, sectionOrder: nextOrder });
      enqueuePatch(uid, {
        "studyMaterialsPreferences.sectionOrder": nextOrder,
      });
    },
    [prefs, sectionOrder, uid, updateLocal],
  );

  const updateCacheConfig = useCallback(
    (nextLimitMb: number | null) => {
      if (!uid) return;
      const current = cacheConfig.limitMb ?? null;
      if (current === nextLimitMb) return;
      updateLocal({
        ...prefs,
        cacheConfig: { ...cacheConfig, limitMb: nextLimitMb },
      });
      enqueuePatch(uid, {
        "studyMaterialsPreferences.cacheConfig.limitMb": nextLimitMb,
      });
    },
    [cacheConfig, prefs, uid, updateLocal],
  );

  const updateOfflineStorageMode = useCallback(
    (nextMode: "web" | "folder") => {
      if (!uid) return;
      if (offlineStorageMode === nextMode) return;
      updateLocal({ ...prefs, offlineStorageMode: nextMode });
      enqueuePatch(uid, {
        "studyMaterialsPreferences.offlineStorageMode": nextMode,
      });
    },
    [offlineStorageMode, prefs, uid, updateLocal],
  );

  const setOfflineFile = useCallback(
    (resourceId: string, meta: OfflineFileMeta | null) => {
      if (!uid) return;
      const nextMap = { ...offlineFiles };
      if (!meta) {
        if (!nextMap[resourceId]) return;
        delete nextMap[resourceId];
      } else {
        nextMap[resourceId] = meta;
      }

      updateLocal({ ...prefs, offlineFiles: nextMap });

      const key = `studyMaterialsPreferences.offlineFiles.${resourceId}`;
      enqueuePatch(uid, {
        [key]: meta ? meta : deleteField(),
      });
    },
    [offlineFiles, prefs, uid, updateLocal],
  );

  const removeOfflineFiles = useCallback(
    (resourceIds: string[]) => {
      if (!uid) return;
      if (resourceIds.length === 0) return;
      const nextMap = { ...offlineFiles };
      let changed = false;
      resourceIds.forEach((resourceId) => {
        if (nextMap[resourceId]) {
          delete nextMap[resourceId];
          changed = true;
        }
      });
      if (!changed) return;

      updateLocal({ ...prefs, offlineFiles: nextMap });

      const patch: Record<string, unknown> = {};
      resourceIds.forEach((resourceId) => {
        const key = `studyMaterialsPreferences.offlineFiles.${resourceId}`;
        patch[key] = deleteField();
      });
      enqueuePatch(uid, patch);
    },
    [offlineFiles, prefs, uid, updateLocal],
  );

  return useMemo(
    () => ({
      loaded: cacheState.loaded && cacheState.uid === uid,
      favorites,
      tags,
      lastOpened,
      offlineFiles,
      sectionOrder,
      cacheConfig,
      offlineStorageMode,
      toggleFavorite,
      setTags,
      markOpened,
      updateSectionOrder,
      setOfflineFile,
      removeOfflineFiles,
      updateCacheConfig,
      updateOfflineStorageMode,
    }),
    [
      favorites,
      lastOpened,
      offlineFiles,
      sectionOrder,
      cacheConfig,
      offlineStorageMode,
      tags,
      toggleFavorite,
      setTags,
      markOpened,
      updateSectionOrder,
      setOfflineFile,
      removeOfflineFiles,
      updateCacheConfig,
      updateOfflineStorageMode,
      uid,
    ],
  );
}

export type ResourceActivityState = {
  favorites: string[];
  lastOpened: Record<string, string>;
};

const STORAGE_PREFIX = "attendrix.resources";

function getStorageKey(userId: string) {
  return `${STORAGE_PREFIX}.${userId}`;
}

export function readResourceActivity(userId: string): ResourceActivityState {
  if (typeof window === "undefined") {
    return { favorites: [], lastOpened: {} };
  }

  try {
    const raw = window.localStorage.getItem(getStorageKey(userId));
    if (!raw) return { favorites: [], lastOpened: {} };
    const parsed = JSON.parse(raw) as ResourceActivityState;

    return {
      favorites: Array.isArray(parsed.favorites)
        ? parsed.favorites.filter((item) => typeof item === "string")
        : [],
      lastOpened:
        parsed.lastOpened && typeof parsed.lastOpened === "object"
          ? parsed.lastOpened
          : {},
    };
  } catch {
    return { favorites: [], lastOpened: {} };
  }
}

export function writeResourceActivity(
  userId: string,
  state: ResourceActivityState,
) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(getStorageKey(userId), JSON.stringify(state));
  } catch {
    // Ignore storage write errors
  }
}

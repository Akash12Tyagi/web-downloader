export function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage unavailable (private mode / quota) — fail silently, in-memory state still works.
  }
}

export const STORAGE_KEYS = {
  history: 'mediahub.history',
  settings: 'mediahub.settings',
  recentSearches: 'mediahub.recentSearches',
  favorites: 'mediahub.favorites',
} as const;

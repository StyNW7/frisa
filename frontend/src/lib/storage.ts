/**
 * Thin localStorage wrapper.
 * Every access is guarded: private windows and blocked site data must not break the app.
 */

const PREFIX = 'frisa:'

export function readStore<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(PREFIX + key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeStore<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    /* storage unavailable - the prototype still works, it just will not remember */
  }
}

export function clearStore(): void {
  try {
    const doomed: string[] = []
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i)
      if (key?.startsWith(PREFIX)) doomed.push(key)
    }
    doomed.forEach((key) => window.localStorage.removeItem(key))
  } catch {
    /* nothing to clear */
  }
}

export const STORAGE_KEYS = {
  onboarded: 'onboarded',
  setupDone: 'setup-done',
  activeFridge: 'active-fridge',
  preferences: 'preferences',
  favorites: 'favorite-recipes',
  fridgeNames: 'fridge-names',
} as const

import { browserStorage } from './persistence.ts'

/** Device preferences, separate from the saved game (design 6.4 settings). */
export interface Prefs {
  /** Keep the screen awake during a game. */
  readonly wakeLock: boolean
  /** The iOS "Add to Home Screen" sheet was shown or dismissed. */
  readonly installHintSeen: boolean
}

export const DEFAULT_PREFS: Prefs = { wakeLock: true, installHintSeen: false }
export const PREFS_KEY = 'thanos-automa:v1:prefs'

export function loadPrefs(storage = browserStorage()): Prefs {
  try {
    const raw = storage?.getItem(PREFS_KEY)
    if (!raw) return DEFAULT_PREFS
    const value: unknown = JSON.parse(raw)
    if (typeof value !== 'object' || value === null) return DEFAULT_PREFS
    const v = value as Partial<Record<keyof Prefs, unknown>>
    return {
      wakeLock: typeof v.wakeLock === 'boolean' ? v.wakeLock : DEFAULT_PREFS.wakeLock,
      installHintSeen:
        typeof v.installHintSeen === 'boolean' ? v.installHintSeen : DEFAULT_PREFS.installHintSeen,
    }
  } catch {
    return DEFAULT_PREFS
  }
}

export function savePrefs(prefs: Prefs, storage = browserStorage()): void {
  try {
    storage?.setItem(PREFS_KEY, JSON.stringify(prefs))
  } catch {
    // Not critical.
  }
}

import { isLang, type Lang } from '../i18n/index.ts'
import { browserStorage } from './persistence.ts'

/** Device preferences, separate from the saved game (design 6.4 settings). */
export interface Prefs {
  /** Keep the screen awake during a game. */
  readonly wakeLock: boolean
  /** The iOS "Add to Home Screen" sheet was shown or dismissed. */
  readonly installHintSeen: boolean
  /** A game was started or ended on this device, so Home no longer shows the first-launch intro. */
  readonly played: boolean
  /** The language picked on this device; null follows the browser's language (#54). */
  readonly language: Lang | null
}

export const DEFAULT_PREFS: Prefs = {
  wakeLock: true,
  installHintSeen: false,
  played: false,
  language: null,
}
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
      played: typeof v.played === 'boolean' ? v.played : DEFAULT_PREFS.played,
      language: isLang(v.language) ? v.language : DEFAULT_PREFS.language,
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

/**
 * A link can carry a language, `?lang=ru`: the landing page's "Open the app" does (#85). A
 * supported one becomes the saved choice, as if picked in the app; anything else is ignored.
 * Returns the address without the parameter, to show instead, or null if there was none.
 */
export function takeLanguageFromUrl(href: string, storage = browserStorage()): string | null {
  const url = new URL(href)
  const lang = url.searchParams.get('lang')
  if (lang === null) return null
  if (isLang(lang)) savePrefs({ ...loadPrefs(storage), language: lang }, storage)
  url.searchParams.delete('lang')
  return `${url.pathname}${url.search}${url.hash}`
}

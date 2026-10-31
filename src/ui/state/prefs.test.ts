import { describe, expect, it } from 'vitest'
import { DEFAULT_PREFS, loadPrefs, savePrefs, takeLanguageFromUrl } from './prefs.ts'

/** An in-memory stand-in for localStorage. */
function memoryStorage(): Storage {
  const items = new Map<string, string>()
  return {
    get length() {
      return items.size
    },
    clear: () => items.clear(),
    getItem: (key) => items.get(key) ?? null,
    key: (index) => [...items.keys()][index] ?? null,
    removeItem: (key) => void items.delete(key),
    setItem: (key, value) => void items.set(key, value),
  }
}

describe('a language in the link (#85)', () => {
  it('becomes the saved language, as if picked in the app', () => {
    const storage = memoryStorage()
    savePrefs({ ...DEFAULT_PREFS, played: true, language: 'es' }, storage)
    expect(takeLanguageFromUrl('https://app.example/?lang=ru', storage)).toBe('/')
    expect(loadPrefs(storage)).toEqual({ ...DEFAULT_PREFS, played: true, language: 'ru' })
  })

  it('leaves the rest of the address as it was', () => {
    const storage = memoryStorage()
    expect(takeLanguageFromUrl('https://app.example/play?x=1&lang=de#top', storage)).toBe(
      '/play?x=1#top',
    )
    expect(loadPrefs(storage).language).toBe('de')
  })

  it('ignores a language the app doesn’t speak, but still tidies the address', () => {
    const storage = memoryStorage()
    expect(takeLanguageFromUrl('https://app.example/?lang=fr', storage)).toBe('/')
    expect(loadPrefs(storage).language).toBeNull()
  })

  it('changes nothing when the link has no language', () => {
    const storage = memoryStorage()
    expect(takeLanguageFromUrl('https://app.example/?x=1', storage)).toBeNull()
    expect(loadPrefs(storage)).toEqual(DEFAULT_PREFS)
  })
})

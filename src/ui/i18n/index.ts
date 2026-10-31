import { createContext, useContext } from 'react'
import { de } from './de.ts'
import { en, type Messages } from './en.ts'
import { es } from './es.ts'
import { ru } from './ru.ts'
import { sr } from './sr.ts'

export type { Messages } from './en.ts'

/** The app's languages (#54). Serbian is written in Latin script. */
export type Lang = 'en' | 'ru' | 'sr' | 'es' | 'de'

export const LANGS: readonly {
  readonly code: Lang
  /** The language's own name, for the picker. */
  readonly name: string
  /** BCP 47 tag for `<html lang>` (hyphenation, screen readers). */
  readonly tag: string
}[] = [
  { code: 'en', name: 'English', tag: 'en' },
  { code: 'ru', name: 'Русский', tag: 'ru' },
  { code: 'sr', name: 'Srpski', tag: 'sr-Latn' },
  { code: 'es', name: 'Español', tag: 'es' },
  { code: 'de', name: 'Deutsch', tag: 'de' },
]

export const CATALOGS: Readonly<Record<Lang, Messages>> = { en, ru, sr, es, de }

export const isLang = (value: unknown): value is Lang =>
  typeof value === 'string' && LANGS.some((l) => l.code === value)

/** The first of the browser's preferred languages that the app speaks; English otherwise. */
export function detectLang(preferred: readonly string[]): Lang {
  for (const tag of preferred) {
    const base = tag.toLowerCase().split('-')[0]
    if (isLang(base)) return base
  }
  return 'en'
}

export const browserLanguages = (): readonly string[] =>
  typeof navigator === 'undefined' ? [] : (navigator.languages ?? [navigator.language])

export interface I18n {
  readonly lang: Lang
  readonly t: Messages
  setLang(lang: Lang): void
}

export const I18nContext = createContext<I18n>({ lang: 'en', t: en, setLang: () => {} })

export const useI18n = (): I18n => useContext(I18nContext)

/** The current language's messages. */
export const useT = (): Messages => useContext(I18nContext).t

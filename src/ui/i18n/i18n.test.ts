import { describe, expect, it } from 'vitest'
import type { RecruitedCard } from '../../engine/index.ts'
import { cardLabel, describeResult, recruitSpeech, takeSpeech } from '../format.ts'
import { formatMessage, parseMessage, variablesOf } from './icu.ts'
import {
  createTranslator,
  detectLang,
  LANGS,
  loadCatalog,
  type Catalog,
  type Lang,
} from './index.ts'
import de from './locales/de.json'
import en from './locales/en.json'
import es from './locales/es.json'
import ru from './locales/ru.json'
import sr from './locales/sr.json'

/** The language files, typed as English: a missing key fails the typecheck here too. */
const FILES: Record<Lang, Catalog> = { en, ru, sr, es, de }
const T = Object.fromEntries(
  (Object.keys(FILES) as Lang[]).map((l) => [l, createTranslator(l, FILES[l])]),
) as Record<Lang, ReturnType<typeof createTranslator>>

/** Every string in a file, by dotted path. */
function strings(value: unknown, path = ''): [string, string][] {
  if (typeof value === 'string') return [[path, value]]
  if (Array.isArray(value)) return value.flatMap((v, i) => strings(v, `${path}.${i}`))
  if (typeof value === 'object' && value !== null)
    return Object.entries(value).flatMap(([k, v]) => strings(v, path ? `${path}.${k}` : k))
  return []
}
const english = new Map(strings(en))
const plural = (lang: string) => {
  const rules = new Intl.PluralRules(lang)
  return (n: number) => rules.select(n)
}

describe('message format (#58)', () => {
  it('fills values, picks branches and counts with #', () => {
    const f = (msg: string, vars = {}) => formatMessage(parseMessage(msg), vars, plural('ru'))
    expect(f('ROUND {n}', { n: 7 })).toBe('ROUND 7')
    expect(f('{you, select, true {You} other {Thanos}} won', { you: false })).toBe('Thanos won')
    expect(
      f('{n, plural, =0 {none} one {# очко} few {# очка} many {# очков} other {# очка}}', { n: 0 }),
    ).toBe('none')
    expect(
      f('{n, plural, one {# очко} few {# очка} many {# очков} other {# очка}}', { n: 22 }),
    ).toBe('22 очка')
    expect(
      f('{a, select, x {{n, plural, one {# one} other {# more}}} other {-}}', { a: 'x', n: 3 }),
    ).toBe('3 more')
    expect(() => parseMessage('{n, plural, one {x}}')).toThrow(/other/)
  })
})

describe('language files (#54, #58)', () => {
  it('detects the first supported browser language, English otherwise', () => {
    expect(detectLang(['ru-RU', 'en'])).toBe('ru')
    expect(detectLang(['sr-Latn-RS'])).toBe('sr')
    expect(detectLang(['fr-FR', 'es-419'])).toBe('es')
    expect(detectLang(['de-AT'])).toBe('de')
    expect(detectLang(['fr', 'it'])).toBe('en')
  })

  it('names every language in itself', () => {
    expect(LANGS.map((l) => l.name)).toEqual(['English', 'Русский', 'Српски', 'Español', 'Deutsch'])
    expect(LANGS.find((l) => l.code === 'sr')?.tag).toBe('sr-Cyrl')
  })

  it('has exactly English’s keys in every file', () => {
    const keys = [...english.keys()].sort()
    for (const lang of Object.keys(FILES) as Lang[]) {
      expect(
        strings(FILES[lang])
          .map(([k]) => k)
          .sort(),
        lang,
      ).toEqual(keys)
    }
  })

  it('parses every message and uses only English’s placeholders', () => {
    for (const lang of Object.keys(FILES) as Lang[]) {
      for (const [key, message] of strings(FILES[lang])) {
        const used = variablesOf(parseMessage(message))
        const allowed = variablesOf(parseMessage(english.get(key) ?? ''))
        expect(
          [...used].filter((v) => !allowed.has(v)),
          `${lang} ${key}`,
        ).toEqual([])
      }
    }
  })

  it('has no empty texts', () => {
    for (const lang of Object.keys(FILES) as Lang[]) {
      const empty = strings(FILES[lang]).filter(([k, s]) => !s.trim() && !k.endsWith('.hint'))
      expect(
        empty.map(([k]) => k),
        lang,
      ).toEqual([])
    }
  })

  it('connects a language’s file on demand', async () => {
    expect((await loadCatalog('de')).home.newGame).toBe('NEUES SPIEL')
  })

  it('uses each language’s plural rules', () => {
    // Russian numbers keep their word on the same line (#65).
    expect([1, 2, 5, 11, 21, 22].map((n) => T.ru('common.points', { n }))).toEqual([
      '1\u00a0очко',
      '2\u00a0очка',
      '5\u00a0очков',
      '11\u00a0очков',
      '21\u00a0очко',
      '22\u00a0очка',
    ])
    expect(T.sr('common.points', { n: 3 })).toBe('3 поена')
    expect(T.en('common.points', { n: 1 })).toBe('1 pt')
    expect(T.en('take.cta', { n: 0 })).toBe('DONE · NOTHING TO TAKE')
  })

  it('builds Thanos’s lines in each language', () => {
    const card: RecruitedCard = { level: 2, colour: 'reality', points: 2, tags: 1 }
    expect(cardLabel(T.en, card)).toBe('L2 Reality (2 pts, 1 Avengers tag)')
    expect(cardLabel(T.ru, card)).toBe(
      'Реальность, ур.\u00a02 (2\u00a0очка, 1\u00a0символ Мстителей)',
    )
    expect(takeSpeech(T.de, ['mind', 'soul'])).toBe('GEDANKEN. SEELE. MEINS.')
    const gain = { kind: 'gain', row: 'C', column: 3, discard: 2 } as const
    expect(recruitSpeech(T.en, gain)).toBe('THE 3RD CARD OF THE BOTTOM ROW IS MINE.')
    expect(recruitSpeech(T.ru, gain)).toBe('3-Я КАРТА НИЖНЕГО РЯДА\u00a0— МОЯ.')
    expect(recruitSpeech(T.es, gain)).toBe('LA 3.ª CARTA DE LA FILA DE ABAJO ES MÍA.')
    expect(recruitSpeech(T.de, gain)).toBe('DIE 3. KARTE DER UNTEREN REIHE GEHÖRT MIR.')
    expect(recruitSpeech(T.sr, gain)).toBe('3. КАРТА ДОЊЕГ РЕДА ЈЕ МОЈА.')
  })

  it('describes results in every language', () => {
    const result = { winner: 'thanos', reason: 'roundLimit', round: 30 } as const
    for (const lang of Object.keys(FILES) as Lang[]) {
      const { title, text } = describeResult(T[lang], result)
      expect(title.length, lang).toBeGreaterThan(3)
      expect(text, lang).toContain('30')
    }
  })
})

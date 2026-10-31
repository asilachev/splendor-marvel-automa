import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, newGame, type RecruitedCard } from '../../engine/index.ts'
import { cardLabel, describeResult, recruitSpeech, takeSpeech } from '../format.ts'
import { CATALOGS, detectLang, LANGS, type Lang } from './index.ts'
import { pluralizer } from './plural.ts'

/** Every string in a catalog, functions called with sample arguments. */
function strings(value: unknown, path = ''): [string, string][] {
  if (typeof value === 'string') return [[path, value]]
  if (Array.isArray(value)) return value.flatMap((v, i) => strings(v, `${path}[${i}]`))
  if (typeof value === 'object' && value !== null)
    return Object.entries(value).flatMap(([k, v]) => strings(v, path ? `${path}.${k}` : k))
  return []
}

describe('languages (#54)', () => {
  it('detects the first supported browser language, English otherwise', () => {
    expect(detectLang(['ru-RU', 'en'])).toBe('ru')
    expect(detectLang(['sr-Latn-RS'])).toBe('sr')
    expect(detectLang(['sr'])).toBe('sr')
    expect(detectLang(['fr-FR', 'es-419'])).toBe('es')
    expect(detectLang(['de-AT'])).toBe('de')
    expect(detectLang(['fr', 'it'])).toBe('en')
    expect(detectLang([])).toBe('en')
  })

  it('names every language in itself', () => {
    expect(LANGS.map((l) => l.name)).toEqual(['English', 'Русский', 'Srpski', 'Español', 'Deutsch'])
    expect(LANGS.find((l) => l.code === 'sr')?.tag).toBe('sr-Latn')
  })

  it('has no empty strings in any language', () => {
    for (const lang of Object.keys(CATALOGS) as Lang[]) {
      const empty = strings(CATALOGS[lang])
        .filter(([path, s]) => s.trim() === '' && !path.endsWith('.hint'))
        .map(([path]) => path)
      expect(empty, lang).toEqual([])
    }
  })

  it('picks Russian and Serbian plural forms (one, few, many)', () => {
    const ru = pluralizer('ru')
    const forms = { one: '# очко', few: '# очка', many: '# очков', other: '# очка' }
    expect([1, 2, 5, 11, 21, 22].map((n) => ru(n, forms))).toEqual([
      '1 очко',
      '2 очка',
      '5 очков',
      '11 очков',
      '21 очко',
      '22 очка',
    ])
    expect(CATALOGS.sr.common.points(1)).toBe('1 poen')
    expect(CATALOGS.sr.common.points(3)).toBe('3 poena')
    expect(CATALOGS.en.common.points(1)).toBe('1 pt')
    expect(CATALOGS.en.common.points(2)).toBe('2 pts')
  })

  it('builds Thanos’s lines in each language', () => {
    const card: RecruitedCard = { level: 2, colour: 'reality', points: 2, tags: 1 }
    expect(cardLabel(CATALOGS.en, card)).toBe('L2 Reality (2 pts, 1 Avengers tag)')
    expect(cardLabel(CATALOGS.ru, card)).toBe('У2 Реальность (2 очка, 1 символ Мстителей)')
    expect(takeSpeech(CATALOGS.de, ['mind', 'soul'])).toBe('GEDANKEN. SEELE. MEINS.')
    expect(takeSpeech(CATALOGS.sr, ['power'])).toBe('MOĆ. MOJE.')
    const gain = { kind: 'gain', row: 'C', column: 3, discard: 2 } as const
    expect(recruitSpeech(CATALOGS.en, gain)).toBe('THE 3RD CARD OF THE BOTTOM ROW IS MINE.')
    expect(recruitSpeech(CATALOGS.ru, gain)).toBe('3-Я КАРТА НИЖНЕГО РЯДА — МОЯ.')
    expect(recruitSpeech(CATALOGS.es, gain)).toBe('LA 3.ª CARTA DE LA FILA DE ABAJO ES MÍA.')
    expect(recruitSpeech(CATALOGS.de, gain)).toBe('DIE 3. KARTE DER UNTEREN REIHE GEHÖRT MIR.')
    expect(recruitSpeech(CATALOGS.sr, gain)).toBe('3. KARTA DONJEG REDA JE MOJA.')
  })

  it('describes results in every language', () => {
    const result = { winner: 'thanos', reason: 'roundLimit', round: 30 } as const
    for (const lang of Object.keys(CATALOGS) as Lang[]) {
      const { title, text } = describeResult(CATALOGS[lang], result)
      expect(title.length, lang).toBeGreaterThan(3)
      expect(text, lang).toContain('30')
    }
    expect(newGame(1, DEFAULT_SETTINGS).round).toBe(1)
  })
})

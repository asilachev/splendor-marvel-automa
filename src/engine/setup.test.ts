import { describe, expect, it } from 'vitest'
import { NON_STAR_CARD_IDS, STAR_CARD_IDS } from './cards.ts'
import { DEFAULT_SETTINGS, PHASE_LENGTH_PRESETS, type Settings } from './settings.ts'
import {
  cardForRound,
  createSetup,
  isPhaseStart,
  phaseOfRound,
  phaseStarts,
  roundLimit,
} from './setup.ts'

const withLengths = (phaseLengths: Settings['phaseLengths']): Settings => ({
  ...DEFAULT_SETTINGS,
  phaseLengths,
})

describe('createSetup (docs/automa.md → Setup)', () => {
  it('builds a 10-card deck: the 8 non-star cards plus 2 random star cards', () => {
    const setup = createSetup(123, DEFAULT_SETTINGS)
    expect(setup.deck).toHaveLength(10)
    for (const id of NON_STAR_CARD_IDS) expect(setup.deck).toContain(id)
    const starsInDeck = setup.deck.filter((id) => STAR_CARD_IDS.includes(id))
    expect(starsInDeck).toHaveLength(2)
    expect([...starsInDeck, ...setup.boxedStars].sort((a, b) => a - b)).toEqual(STAR_CARD_IDS)
  })

  it('draws a shuffled order of the whole deck for each phase', () => {
    const setup = createSetup(5, DEFAULT_SETTINGS)
    for (const order of setup.phaseOrders) {
      expect([...order].sort((a, b) => a - b)).toEqual(setup.deck)
    }
  })

  it('is deterministic for a seed and varies across seeds', () => {
    expect(createSetup(77, DEFAULT_SETTINGS)).toEqual(createSetup(77, DEFAULT_SETTINGS))
    const orders = new Set(
      Array.from({ length: 50 }, (_, seed) =>
        createSetup(seed, DEFAULT_SETTINGS).phaseOrders[0].join(),
      ),
    )
    expect(orders.size).toBeGreaterThan(40)
  })

  it('can produce every pair of star cards', () => {
    const pairs = new Set(
      Array.from({ length: 300 }, (_, seed) =>
        createSetup(seed, DEFAULT_SETTINGS)
          .deck.filter((id) => STAR_CARD_IDS.includes(id))
          .join('+'),
      ),
    )
    expect(pairs.size).toBe(6)
  })

  it('rejects invalid settings', () => {
    expect(() => createSetup(1, withLengths([0, 10, 10]))).toThrow()
    expect(() => createSetup(1, withLengths([11, 10, 10]))).toThrow()
    expect(() => createSetup(1, withLengths([9.5, 10, 10]))).toThrow()
    expect(() => createSetup(1, { ...DEFAULT_SETTINGS, unprintedDiscard: -1 })).toThrow()
    expect(() => createSetup(1, { ...DEFAULT_SETTINGS, stackCap: 0 })).toThrow()
  })
})

describe('rounds and phases', () => {
  it('uses phases 1–10, 11–20, 21–30 by default', () => {
    const s = DEFAULT_SETTINGS
    expect(roundLimit(s)).toBe(30)
    expect(phaseStarts(s)).toEqual([1, 11, 21])
    expect([1, 10, 11, 20, 21, 30].map((r) => phaseOfRound(r, s))).toEqual([1, 1, 2, 2, 3, 3])
    expect(() => phaseOfRound(0, s)).toThrow()
    expect(() => phaseOfRound(31, s)).toThrow()
  })

  it('supports the 10/9/8 and 8/8/8 community variants', () => {
    const shorter = withLengths(PHASE_LENGTH_PRESETS.shorter)
    expect(roundLimit(shorter)).toBe(27)
    expect([10, 11, 19, 20, 27].map((r) => phaseOfRound(r, shorter))).toEqual([1, 2, 2, 3, 3])
    expect(() => phaseOfRound(28, shorter)).toThrow()

    const shortest = withLengths(PHASE_LENGTH_PRESETS.shortest)
    expect(roundLimit(shortest)).toBe(24)
    expect([8, 9, 16, 17, 24].map((r) => phaseOfRound(r, shortest))).toEqual([1, 2, 2, 3, 3])
  })

  it('flags the first round of phases 2 and 3 as a reshuffle', () => {
    const s = DEFAULT_SETTINGS
    expect([1, 10, 11, 12, 21].map((r) => isPhaseStart(r, s))).toEqual([
      false,
      false,
      true,
      false,
      true,
    ])
  })

  it('flips the next card of the phase order and reads that phase’s section', () => {
    const setup = createSetup(31337, DEFAULT_SETTINGS)
    for (let round = 1; round <= 30; round++) {
      const { phase, card, action } = cardForRound(setup, round)
      const index = round - phaseStarts(setup.settings)[phase - 1]!
      expect(card.id).toBe(setup.phaseOrders[phase - 1]![index])
      expect(action).toBe(card.actions[phase - 1])
    }
  })

  it('uses each deck card at most once per phase, also with shorter phases', () => {
    const setup = createSetup(8, withLengths(PHASE_LENGTH_PRESETS.shortest))
    const byPhase = new Map<number, number[]>()
    for (let round = 1; round <= roundLimit(setup.settings); round++) {
      const { phase, card } = cardForRound(setup, round)
      byPhase.set(phase, [...(byPhase.get(phase) ?? []), card.id])
    }
    for (const ids of byPhase.values()) {
      expect(ids).toHaveLength(8)
      expect(new Set(ids).size).toBe(8)
    }
  })
})

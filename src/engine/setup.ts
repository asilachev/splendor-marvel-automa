import { cardById, NON_STAR_CARD_IDS, STAR_CARD_IDS, STAR_CARDS_IN_DECK } from './cards.ts'
import { mulberry32, shuffle } from './rng.ts'
import { validateSettings, type Settings } from './settings.ts'
import type { AutomaAction, AutomaCard, Phase } from './types.ts'

/** Everything decided at the start of a game. A pure function of (seed, settings). */
export interface Setup {
  readonly seed: number
  readonly settings: Settings
  /** Card ids in the deck: the 8 non-star cards plus 2 random star cards, ascending. */
  readonly deck: readonly number[]
  /** The 2 star cards returned to the box. */
  readonly boxedStars: readonly number[]
  /** Shuffled deck order for each phase, drawn up front so undo never reshuffles. */
  readonly phaseOrders: readonly [readonly number[], readonly number[], readonly number[]]
}

export function createSetup(seed: number, settings: Settings): Setup {
  validateSettings(settings)
  const random = mulberry32(seed)
  const stars = shuffle(STAR_CARD_IDS, random)
  const chosen = stars.slice(0, STAR_CARDS_IN_DECK)
  const deck = [...NON_STAR_CARD_IDS, ...chosen].sort((a, b) => a - b)
  return {
    seed,
    settings,
    deck,
    boxedStars: stars.slice(STAR_CARDS_IN_DECK).sort((a, b) => a - b),
    phaseOrders: [shuffle(deck, random), shuffle(deck, random), shuffle(deck, random)],
  }
}

/** Total rounds before the player loses (30 by default). */
export function roundLimit(settings: Settings): number {
  const [a, b, c] = settings.phaseLengths
  return a + b + c
}

/** First round of each phase, e.g. [1, 11, 21] for 10/10/10. */
export function phaseStarts(settings: Settings): readonly [number, number, number] {
  const [a, b] = settings.phaseLengths
  return [1, 1 + a, 1 + a + b]
}

export function phaseOfRound(round: number, settings: Settings): Phase {
  assertRound(round, settings)
  const [, second, third] = phaseStarts(settings)
  if (round >= third) return 3
  if (round >= second) return 2
  return 1
}

/** True when `round` is the first round of phase 2 or 3 (the deck was just reshuffled). */
export function isPhaseStart(round: number, settings: Settings): boolean {
  const [, second, third] = phaseStarts(settings)
  return round === second || round === third
}

export interface RoundCard {
  readonly phase: Phase
  readonly card: AutomaCard
  readonly action: AutomaAction
}

/** The automa card Thanos flips in `round`, and the section that applies. */
export function cardForRound(setup: Setup, round: number): RoundCard {
  const phase = phaseOfRound(round, setup.settings)
  const index = round - (phaseStarts(setup.settings)[phase - 1] ?? 1)
  const id = setup.phaseOrders[phase - 1]?.[index]
  if (id === undefined) throw new Error(`No automa card for round ${round}`)
  const card = cardById(id)
  return { phase, card, action: card.actions[phase - 1] as AutomaAction }
}

function assertRound(round: number, settings: Settings): void {
  if (!Number.isInteger(round) || round < 1 || round > roundLimit(settings)) {
    throw new Error(`Round ${round} is outside 1–${roundLimit(settings)}`)
  }
}

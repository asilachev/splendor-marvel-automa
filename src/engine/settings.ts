/**
 * Game settings. Every gap in the automa PDF is a setting; defaults come from
 * docs/automa.md → Rulings this app uses. Change a default only together with that table.
 */
import { STONES, type Stone } from './stones.ts'

/** Number of automa cards drawn in phases 1, 2 and 3 (each 1–10; the deck has 10 cards). */
export type PhaseLengths = readonly [number, number, number]

/** Location tiles in a 2-player game (docs/rules.md → Setup). */
export const LOCATIONS_IN_PLAY = 2
/** The most bonuses of one colour a Location can ask for, in the setup picker. */
export const MAX_LOCATION_BONUS = 5

/** What a Location tile asks for: bonuses per colour, e.g. 3 Mind, 3 Soul and 3 Space (#11). */
export type LocationRequirement = Readonly<Partial<Record<Stone, number>>>

export interface Settings {
  /** Rounds per phase. Default 10/10/10 (30 rounds); community variants 10/9/8 and 8/8/8. */
  readonly phaseLengths: PhaseLengths
  /** Discard for a gain action that prints no number (card 12, phase 3). Default 0. */
  readonly unprintedDiscard: number
  /** Targeted slot is empty: take the first card in the row from the left, or take nothing. */
  readonly emptySlot: 'firstInRow' | 'nothing'
  /** Both sides complete the Gauntlet: official tiebreakers then Thanos, or Thanos outright. */
  readonly ties: 'tiebreakersThenThanos' | 'thanosWins'
  /** Which of Thanos's cards count: all (the BGG clarification) or only scoring/Avengers cards. */
  readonly countedCards: 'all' | 'scoringOnly'
  /** Maximum tokens in Thanos's stack; the oldest beyond it go back to the supply. */
  readonly stackCap: number | null
  /**
   * You log the cards you recruit (default), or don't (#15): then you report the Gauntlet yourself
   * at the end of a round, and the Avengers tile is yours to move.
   */
  readonly logPlayerCards: boolean
  /**
   * The automa PDF's hard variant (#11; docs/automa.md → Hard variant): Thanos also claims
   * Locations, and you don't. Default: the standard game.
   */
  readonly variant: 'standard' | 'hard'
  /** What the Locations in play ask for, in setup order. Used only by the hard variant. */
  readonly locations: readonly LocationRequirement[]
}

export const DEFAULT_SETTINGS: Settings = {
  phaseLengths: [10, 10, 10],
  unprintedDiscard: 0,
  emptySlot: 'firstInRow',
  ties: 'tiebreakersThenThanos',
  countedCards: 'all',
  stackCap: null,
  logPlayerCards: true,
  variant: 'standard',
  locations: [],
}

export const PHASE_LENGTH_PRESETS = {
  standard: [10, 10, 10],
  shorter: [10, 9, 8],
  shortest: [8, 8, 8],
} as const satisfies Record<string, PhaseLengths>

export function validateSettings(settings: Settings): void {
  for (const length of settings.phaseLengths) {
    if (!Number.isInteger(length) || length < 1 || length > 10) {
      throw new Error(`Phase length must be an integer from 1 to 10, got ${length}`)
    }
  }
  if (!Number.isInteger(settings.unprintedDiscard) || settings.unprintedDiscard < 0) {
    throw new Error(`Unprinted discard must be a non-negative integer`)
  }
  if (
    settings.stackCap !== null &&
    (!Number.isInteger(settings.stackCap) || settings.stackCap < 1)
  ) {
    throw new Error(`Stack cap must be a positive integer or null`)
  }
  if (typeof settings.logPlayerCards !== 'boolean') {
    throw new Error(`"Log my cards" must be true or false`)
  }
  if (settings.variant !== 'standard' && settings.variant !== 'hard') {
    throw new Error(`Unknown variant: ${String(settings.variant)}`)
  }
  if (!Array.isArray(settings.locations)) throw new Error('Locations must be a list')
  if (settings.variant === 'hard') {
    if (settings.locations.length !== LOCATIONS_IN_PLAY) {
      throw new Error(`The hard variant needs the ${LOCATIONS_IN_PLAY} Locations in play`)
    }
    settings.locations.forEach(validateRequirement)
  }
}

function validateRequirement(requirement: LocationRequirement): void {
  const entries = Object.entries(requirement)
  if (entries.length === 0) throw new Error('A Location asks for at least one colour')
  for (const [stone, n] of entries) {
    if (!STONES.includes(stone as Stone)) throw new Error(`Unknown colour: ${stone}`)
    if (!Number.isInteger(n) || n < 1 || n > MAX_LOCATION_BONUS) {
      throw new Error(`A Location asks for 1 to ${MAX_LOCATION_BONUS} bonuses of a colour`)
    }
  }
}

import type { Stone } from './stones.ts'

/** Card level. The automa's market rows map A → 3, B → 2, C → 1 (docs/automa.md → Components). */
export type Level = 1 | 2 | 3

/** Market row on the automa cards: A = level 3 (top), B = level 2, C = level 1 (bottom). */
export type Row = 'A' | 'B' | 'C'

/** Market column, counted left to right. */
export type Column = 1 | 2 | 3 | 4

/** Game phase. Each automa card has one section per phase. */
export type Phase = 1 | 2 | 3

export const LEVEL_OF_ROW: Readonly<Record<Row, Level>> = { A: 3, B: 2, C: 1 }

/** "Take tokens": add these stones to the top of Thanos's stack, in this order. */
export interface TakeAction {
  readonly kind: 'take'
  readonly tokens: readonly Stone[]
}

/**
 * "Gain a card": take the card at (row, column) and discard `discard` tokens from the bottom of
 * the stack. `discard` is `null` where the card prints no number (card 12, phase 3).
 */
export interface GainAction {
  readonly kind: 'gain'
  readonly row: Row
  readonly column: Column
  readonly discard: number | null
}

export type AutomaAction = TakeAction | GainAction

export interface AutomaCard {
  /** Number printed on the card (1–12). */
  readonly id: number
  /** Gold-star cards: only 2 of the 4 go into the deck. */
  readonly star: boolean
  /** Sections for phases 1, 2 and 3. */
  readonly actions: readonly [AutomaAction, AutomaAction, AutomaAction]
}

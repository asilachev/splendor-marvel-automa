import { stoneForTokenNumber, type TokenNumber } from './stones.ts'
import type { AutomaCard, Column, GainAction, Row, TakeAction } from './types.ts'

const take = (...numbers: TokenNumber[]): TakeAction => ({
  kind: 'take',
  tokens: numbers.map(stoneForTokenNumber),
})

const gain = (slot: `${Row}${Column}`, discard: number | null): GainAction => ({
  kind: 'gain',
  row: slot[0] as Row,
  column: Number(slot[1]) as Column,
  discard,
})

/**
 * The 12 automa cards of Solo Automa V1, transcribed from the PDF.
 * Source of truth: docs/automa.md → Card list (a test keeps the two in sync).
 */
export const AUTOMA_CARDS: readonly AutomaCard[] = [
  { id: 1, star: true, actions: [take(1, 2), take(5, 1, 4), gain('A4', 3)] },
  { id: 2, star: false, actions: [gain('C1', 3), gain('C3', 3), take(2, 4, 3)] },
  { id: 3, star: false, actions: [take(5, 4), gain('C4', 3), take(3, 2, 4)] },
  { id: 4, star: false, actions: [take(3, 2), gain('C2', 3), gain('B1', 2)] },
  { id: 5, star: false, actions: [take(2, 5, 1), gain('C4', 3), take(4, 3, 5)] },
  { id: 6, star: false, actions: [take(4, 3, 2), gain('C3', 3), gain('B4', 2)] },
  { id: 7, star: true, actions: [gain('C3', 3), take(3, 4), gain('A3', 3)] },
  { id: 8, star: true, actions: [gain('C4', 3), take(2, 5, 1), gain('A1', 3)] },
  { id: 9, star: false, actions: [gain('B2', 4), take(5, 2, 1), take(5, 1)] },
  { id: 10, star: false, actions: [gain('C1', 3), gain('C2', 3), take(3, 4, 1)] },
  { id: 11, star: true, actions: [gain('C2', 3), take(1, 5), gain('A2', 3)] },
  { id: 12, star: false, actions: [take(1, 3, 4), gain('B3', 3), gain('C1', null)] },
]

export const STAR_CARD_IDS: readonly number[] = AUTOMA_CARDS.filter((c) => c.star).map((c) => c.id)

export const NON_STAR_CARD_IDS: readonly number[] = AUTOMA_CARDS.filter((c) => !c.star).map(
  (c) => c.id,
)

/** How many of the four star cards go into the deck (docs/automa.md → Setup). */
export const STAR_CARDS_IN_DECK = 2

export function cardById(id: number): AutomaCard {
  const card = AUTOMA_CARDS.find((c) => c.id === id)
  if (!card) throw new Error(`Unknown automa card: ${id}`)
  return card
}

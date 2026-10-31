/**
 * The five Infinity Stone colours, in token-placement-board order (1–5).
 * See docs/automa.md → Components.
 */
export const STONES = ['power', 'mind', 'space', 'reality', 'soul'] as const

export type Stone = (typeof STONES)[number]

/** Token-placement-board number (1–5) as printed on the automa cards. */
export type TokenNumber = 1 | 2 | 3 | 4 | 5

export function stoneForTokenNumber(n: TokenNumber): Stone {
  const stone = STONES[n - 1]
  if (!stone) throw new Error(`Unknown token number: ${n}`)
  return stone
}

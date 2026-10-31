import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { AUTOMA_CARDS, cardById, NON_STAR_CARD_IDS, STAR_CARD_IDS } from './cards.ts'
import { STONES } from './stones.ts'
import type { AutomaAction, AutomaCard } from './types.ts'

/** Formats an action the way docs/automa.md → Card list writes it. */
function describeAction(action: AutomaAction): string {
  if (action.kind === 'take') {
    return `Take ${action.tokens.map((s) => STONES.indexOf(s) + 1).join(',')}`
  }
  const slot = `${action.row}${action.column}`
  return action.discard === null
    ? `Gain ${slot} *(no discard printed)*`
    : `Gain ${slot} −${action.discard}`
}

/** Rows of the "Card list" table in docs/automa.md: [card, star, phase 1, phase 2, phase 3]. */
function docsCardTable(): string[][] {
  const md = readFileSync(new URL('../../docs/automa.md', import.meta.url), 'utf8')
  const section = md.split('## Card list')[1]?.split('\n### ')[0] ?? ''
  return section
    .split('\n')
    .filter((line) => /^\| \d\d \|/.test(line))
    .map((line) =>
      line
        .split('|')
        .slice(1, -1)
        .map((cell) => cell.trim()),
    )
}

const kinds = (cards: readonly AutomaCard[], phase: 0 | 1 | 2) =>
  cards.map((c) => c.actions[phase].kind)
const count = (xs: string[], x: string) => xs.filter((y) => y === x).length

describe('automa cards', () => {
  it('match docs/automa.md → Card list exactly', () => {
    const fromCode = AUTOMA_CARDS.map((c) => [
      String(c.id).padStart(2, '0'),
      c.star ? '★' : '',
      ...c.actions.map(describeAction),
    ])
    expect(fromCode).toEqual(docsCardTable())
  })

  it('has 12 cards numbered 1–12, with stars on 01, 07, 08 and 11', () => {
    expect(AUTOMA_CARDS.map((c) => c.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
    expect(STAR_CARD_IDS).toEqual([1, 7, 8, 11])
    expect(NON_STAR_CARD_IDS).toHaveLength(8)
  })

  it('has the per-phase composition listed under "What follows from the card list"', () => {
    const nonStar = AUTOMA_CARDS.filter((c) => !c.star)
    const star = AUTOMA_CARDS.filter((c) => c.star)
    expect([count(kinds(nonStar, 0), 'take'), count(kinds(nonStar, 0), 'gain')]).toEqual([5, 3])
    expect([count(kinds(nonStar, 1), 'take'), count(kinds(nonStar, 1), 'gain')]).toEqual([1, 7])
    expect([count(kinds(nonStar, 2), 'take'), count(kinds(nonStar, 2), 'gain')]).toEqual([5, 3])
    expect(kinds(star, 0)).toEqual(['take', 'gain', 'gain', 'gain'])
    expect(kinds(star, 1)).toEqual(['take', 'take', 'take', 'take'])
    expect(kinds(star, 2)).toEqual(['gain', 'gain', 'gain', 'gain'])
  })

  it('targets row A (level 3) only in the phase-3 section of star cards', () => {
    for (const card of AUTOMA_CARDS) {
      card.actions.forEach((action, phase) => {
        const isRowA = action.kind === 'gain' && action.row === 'A'
        expect(isRowA).toBe(card.star && phase === 2)
      })
    }
  })

  it('never targets C1 in phase 2', () => {
    const phase2 = AUTOMA_CARDS.map((c) => c.actions[1])
    expect(phase2.some((a) => a.kind === 'gain' && a.row === 'C' && a.column === 1)).toBe(false)
  })

  it('only prints no discard on card 12, phase 3', () => {
    const unprinted = AUTOMA_CARDS.flatMap((c) =>
      c.actions.flatMap((a, i) => (a.kind === 'gain' && a.discard === null ? [[c.id, i + 1]] : [])),
    )
    expect(unprinted).toEqual([[12, 3]])
  })

  it('never lists the same token twice in a take action', () => {
    for (const card of AUTOMA_CARDS) {
      for (const action of card.actions) {
        if (action.kind === 'take') expect(new Set(action.tokens).size).toBe(action.tokens.length)
      }
    }
  })

  it('looks cards up by id', () => {
    expect(cardById(9).actions[0]).toEqual({ kind: 'gain', row: 'B', column: 2, discard: 4 })
    expect(() => cardById(13)).toThrow()
  })
})

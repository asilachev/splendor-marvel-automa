import type {
  GainAction,
  GameResult,
  LogEntry,
  Phase,
  RecruitedCard,
  Row,
  Side,
  Stone,
} from '../engine/index.ts'

export const STONE_LABEL: Readonly<Record<Stone, string>> = {
  power: 'Power',
  mind: 'Mind',
  space: 'Space',
  reality: 'Reality',
  soul: 'Soul',
}

export const PHASE_COLOUR: Readonly<Record<Phase, string>> = { 1: 'green', 2: 'yellow', 3: 'red' }

export const ROW_LABEL: Readonly<Record<Row, string>> = {
  A: 'level 3 (top row)',
  B: 'level 2 (middle row)',
  C: 'level 1 (bottom row)',
}

export const sideName = (side: Side): string => (side === 'thanos' ? 'Thanos' : 'You')

export const stoneList = (stones: readonly Stone[]): string =>
  stones.map((s) => STONE_LABEL[s]).join(', ')

export const slotOf = (action: GainAction): string => `${action.row}${action.column}`

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

export function cardLabel(card: RecruitedCard): string {
  const extras = [
    card.points ? plural(card.points, 'pt') : null,
    card.tags ? plural(card.tags, 'Avengers tag') : null,
  ].filter(Boolean)
  return `L${card.level} ${STONE_LABEL[card.colour]}${extras.length ? ` (${extras.join(', ')})` : ''}`
}

/** One line per log entry, for the game log. */
export function describeLog(entry: LogEntry): string {
  switch (entry.kind) {
    case 'take': {
      const parts = [
        entry.taken.length ? `Thanos took ${stoneList(entry.taken)}` : 'Thanos took nothing',
      ]
      if (entry.skipped.length) parts.push(`${stoneList(entry.skipped)} empty`)
      if (entry.capped.length) parts.push(`cap returned ${stoneList(entry.capped)}`)
      return parts.join(' · ')
    }
    case 'gain': {
      if (!entry.card) return `Thanos took nothing (${entry.slot} empty)`
      const how = entry.substituted
        ? ' instead (substitution)'
        : entry.slotEmpty
          ? ' (slot empty)'
          : ''
      const parts = [`Thanos took ${cardLabel(entry.card)} for ${entry.slot}${how}`]
      if (entry.returned.length) parts.push(`returned ${stoneList(entry.returned)}`)
      if (entry.gotTime) parts.push('Time token')
      return parts.join(' · ')
    }
    case 'avengers':
      return entry.holder === 'none'
        ? 'Avengers tile back in the middle'
        : `Avengers tile → ${sideName(entry.holder)}${entry.manual ? ' (manual)' : ''}`
    case 'playerRecruit':
      return `You recruited ${cardLabel(entry.card)}${entry.gotTime ? ' · Time token' : ''}`
    case 'playerLocation':
      return 'You took a Location (+3)'
    case 'stackFix':
      return `Stack fix: ${entry.change === 'add' ? 'added' : 'removed'} ${STONE_LABEL[entry.stone]}`
    case 'cardFix':
      return `Card fix: ${entry.change === 'add' ? 'added' : 'removed'} ${sideName(entry.side) === 'You' ? 'your' : 'Thanos’s'} ${cardLabel(entry.card)}`
    case 'phase':
      return `Phase ${entry.phase} begins: deck reshuffled`
    case 'result':
      return describeResult(entry.result).title
  }
}

export function describeResult(result: GameResult): { title: string; text: string } {
  const title = result.winner === 'player' ? 'You win!' : 'Thanos wins'
  const who = result.winner === 'player' ? 'You' : 'Thanos'
  const text = {
    gauntlet: `${who} completed the Infinity Gauntlet in round ${result.round}.`,
    morePoints: `Both of you completed the Gauntlet in round ${result.round}. ${who} had more points.`,
    avengersTile: `Both completed the Gauntlet with equal points. ${who === 'You' ? 'You hold' : 'Thanos holds'} the Avengers tile.`,
    fewerCards: `Both completed the Gauntlet with equal points and no tile decided it. ${who === 'You' ? 'You have' : 'Thanos has'} fewer cards.`,
    thanosWinsTies: `Both completed the Gauntlet in round ${result.round}, and Thanos wins ties.`,
    roundLimit: `Round ${result.round} ended without your Infinity Gauntlet.`,
  }[result.reason]
  return { title, text }
}

/** Options 0…n for the number pickers (points, tags, level). */
export const numberOptions = (from: number, to: number): { value: number; label: string }[] =>
  Array.from({ length: to - from + 1 }, (_, i) => ({ value: from + i, label: String(from + i) }))

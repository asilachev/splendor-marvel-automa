import type {
  AutomaAction,
  GainAction,
  GameState,
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

/** A stone or the Time token, for icons. */
export type Gem = Stone | 'time'

export const ROW_WORD: Readonly<Record<Row, string>> = { A: 'top', B: 'middle', C: 'bottom' }
export const ordinal = (n: number): string => ['1st', '2nd', '3rd', '4th'][n - 1] ?? `${n}th`

/** What Thanos "says" when he takes tokens (design 2.2). */
export const takeSpeech = (tokens: readonly Stone[]): string =>
  `${tokens.map((s) => STONE_LABEL[s].toUpperCase()).join('. ')}. MINE.`

/** What Thanos "says" when he recruits (design 3.1). */
export const recruitSpeech = (action: GainAction): string =>
  `THE ${ordinal(action.column).toUpperCase()} CARD OF THE ${ROW_WORD[action.row].toUpperCase()} ROW IS MINE.`

/** The printed label of a card section, e.g. "2,5,1" or "C4". */
export const sectionLabel = (action: AutomaAction): string =>
  action.kind === 'take'
    ? action.tokens
        .map((s) => ['power', 'mind', 'space', 'reality', 'soul'].indexOf(s) + 1)
        .join(',')
    : slotOf(action)

export interface ChecklistItem {
  readonly key: string
  readonly text: string
  readonly gems?: readonly Gem[]
}

/** What to do on the table after Thanos's action this round (design 2.3 / 4.1). */
export function tableChecklist(state: GameState): ChecklistItem[] {
  const out: ChecklistItem[] = []
  for (const [i, e] of state.log.entries()) {
    if (e.round !== state.round) continue
    if (e.kind === 'take') {
      out.push(
        e.taken.length
          ? { key: `${i}-take`, text: `Put ${stoneList(e.taken)} on his piles`, gems: e.taken }
          : { key: `${i}-take`, text: 'He took no tokens this time' },
      )
      if (e.skipped.length) {
        const s = e.skipped.length === 1 ? 'pile was' : 'piles were'
        out.push({ key: `${i}-skip`, text: `${stoneList(e.skipped)} ${s} empty — skipped` })
      }
      if (e.capped.length) {
        out.push({ key: `${i}-cap`, text: 'Stack cap: return to the supply', gems: e.capped })
      }
    } else if (e.kind === 'gain') {
      if (!e.card) {
        out.push({ key: `${i}-none`, text: 'Thanos took nothing this turn' })
        continue
      }
      if (e.returned.length)
        out.push({ key: `${i}-ret`, text: 'Return to the supply', gems: e.returned })
      const level = e.card.level
      out.push({
        key: `${i}-refill`,
        text: `Refill ${e.slotEmpty ? 'the market' : `slot ${e.slot}`} from the level ${level} deck`,
      })
      if (e.gotTime)
        out.push({ key: `${i}-time`, text: 'Give Thanos a green Time token', gems: ['time'] })
    } else if (e.kind === 'avengers' && !e.manual && e.holder === 'thanos') {
      out.push({ key: `${i}-tile`, text: 'Move the Avengers tile to Thanos' })
    }
  }
  return out
}

/** Big result headline for the game-over screen (design 5.2–5.4). */
export function resultHeadline(state: GameState): {
  title: string
  tone: 'win' | 'snap' | 'thanos'
  tiebreak: boolean
} {
  const r = state.result
  if (!r) return { title: '', tone: 'thanos', tiebreak: false }
  const tiebreak = ['morePoints', 'avengersTile', 'fewerCards', 'thanosWinsTies'].includes(r.reason)
  if (r.winner === 'player') return { title: 'YOU WIN!', tone: 'win', tiebreak }
  if (r.reason === 'roundLimit') return { title: 'SNAP.', tone: 'snap', tiebreak }
  return { title: 'THANOS WINS', tone: 'thanos', tiebreak }
}

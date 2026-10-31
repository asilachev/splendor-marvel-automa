import type {
  AutomaAction,
  GainAction,
  GameResult,
  GameState,
  LogEntry,
  RecruitedCard,
  Stone,
} from '../engine/index.ts'
import type { Messages } from './i18n/index.ts'

/**
 * Text built from game state. What to say is decided here; how to say it comes from the
 * current language's messages (#54).
 */

/** A stone or the Time token, for icons. */
export type Gem = Stone | 'time'

export const slotOf = (action: GainAction): string => `${action.row}${action.column}`

export const stoneList = (t: Messages, stones: readonly Stone[]): string =>
  t.common.list(stones.map((s) => t.stone[s]))

export function cardLabel(t: Messages, card: RecruitedCard): string {
  const extras = [
    card.points ? t.common.points(card.points) : null,
    card.tags ? t.common.tags(card.tags) : null,
  ].filter((x): x is string => x !== null)
  return `${t.common.level(card.level)} ${t.stone[card.colour]}${extras.length ? ` (${extras.join(', ')})` : ''}`
}

/** One line per log entry, for the game log. */
export function describeLog(t: Messages, entry: LogEntry): string {
  const l = t.log
  switch (entry.kind) {
    case 'take': {
      const parts = [entry.taken.length ? l.took(stoneList(t, entry.taken)) : l.tookNothing]
      if (entry.skipped.length) parts.push(l.empty(stoneList(t, entry.skipped)))
      if (entry.capped.length) parts.push(l.capReturned(stoneList(t, entry.capped)))
      return parts.join(' · ')
    }
    case 'gain': {
      if (!entry.card) return l.gainNothing(entry.slot)
      const how = entry.substituted ? 'substituted' : entry.slotEmpty ? 'slotEmpty' : null
      const parts = [l.gain(cardLabel(t, entry.card), entry.slot, how)]
      if (entry.returned.length) parts.push(l.returned(stoneList(t, entry.returned)))
      if (entry.gotTime) parts.push(l.timeToken)
      return parts.join(' · ')
    }
    case 'avengers':
      return entry.holder === 'none' ? l.tileMiddle : l.tileTo(entry.holder, entry.manual)
    case 'playerRecruit':
      return `${l.youRecruited(cardLabel(t, entry.card))}${entry.gotTime ? ` · ${l.timeToken}` : ''}`
    case 'playerLocation':
      return l.youLocation
    case 'stackFix':
      return l.stackFix(entry.change === 'add', t.stone[entry.stone])
    case 'cardFix':
      return l.cardFix(entry.change === 'add', entry.side === 'player', cardLabel(t, entry.card))
    case 'phase':
      return l.phase(entry.phase)
    case 'result':
      return describeResult(t, entry.result).title
  }
}

export function describeResult(t: Messages, result: GameResult): { title: string; text: string } {
  const r = t.result
  const you = result.winner === 'player'
  const text = {
    gauntlet: r.gauntlet(you, result.round),
    morePoints: r.morePoints(you, result.round),
    avengersTile: r.avengersTile(you),
    fewerCards: r.fewerCards(you),
    thanosWinsTies: r.thanosWinsTies(result.round),
    roundLimit: r.roundLimit(result.round),
  }[result.reason]
  return { title: you ? r.titleWin : r.titleThanos, text }
}

/** What Thanos "says" when he takes tokens (design 2.2). */
export const takeSpeech = (t: Messages, tokens: readonly Stone[]): string =>
  t.take.speech(tokens.map((s) => t.stone[s].toUpperCase()))

/** What Thanos "says" when he recruits (design 3.1). */
export const recruitSpeech = (t: Messages, action: GainAction): string =>
  t.recruit.speech(action.column, action.row)

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
export function tableChecklist(t: Messages, state: GameState): ChecklistItem[] {
  const c = t.checklist
  const out: ChecklistItem[] = []
  for (const [i, e] of state.log.entries()) {
    if (e.round !== state.round) continue
    if (e.kind === 'take') {
      out.push(
        e.taken.length
          ? { key: `${i}-take`, text: c.put(stoneList(t, e.taken)), gems: e.taken }
          : { key: `${i}-take`, text: c.tookNone },
      )
      if (e.skipped.length) {
        out.push({ key: `${i}-skip`, text: c.skipped(stoneList(t, e.skipped), e.skipped.length) })
      }
      if (e.capped.length) out.push({ key: `${i}-cap`, text: c.cap, gems: e.capped })
    } else if (e.kind === 'gain') {
      if (!e.card) {
        out.push({ key: `${i}-none`, text: c.nothing })
        continue
      }
      if (e.returned.length) out.push({ key: `${i}-ret`, text: c.returnTo, gems: e.returned })
      out.push({
        key: `${i}-refill`,
        text: e.slotEmpty ? c.refillMarket(e.card.level) : c.refillSlot(e.slot, e.card.level),
      })
      if (e.gotTime) out.push({ key: `${i}-time`, text: c.time, gems: ['time'] })
    } else if (e.kind === 'avengers' && !e.manual && e.holder === 'thanos') {
      out.push({ key: `${i}-tile`, text: c.tile })
    }
  }
  return out
}

/** Big result headline for the game-over screen (design 5.2–5.4). */
export function resultHeadline(
  t: Messages,
  state: GameState,
): { title: string; tone: 'win' | 'snap' | 'thanos'; tiebreak: boolean } {
  const r = state.result
  if (!r) return { title: '', tone: 'thanos', tiebreak: false }
  const tiebreak = ['morePoints', 'avengersTile', 'fewerCards', 'thanosWinsTies'].includes(r.reason)
  if (r.winner === 'player') return { title: t.result.win, tone: 'win', tiebreak }
  if (r.reason === 'roundLimit') return { title: t.result.snap, tone: 'snap', tiebreak }
  return { title: t.result.thanosWins, tone: 'thanos', tiebreak }
}

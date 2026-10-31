import type {
  AutomaAction,
  GainAction,
  GameResult,
  GameState,
  LogEntry,
  RecruitedCard,
  Stone,
} from '../engine/index.ts'
import type { Translate } from './i18n/index.ts'

/**
 * Text built from game state. What to say is decided here; how to say it comes from the
 * current language's messages (#54).
 */

/** A stone or the Time token, for icons. */
export type Gem = Stone | 'time'

export const slotOf = (action: GainAction): string => `${action.row}${action.column}`

export const stoneList = (t: Translate, stones: readonly Stone[]): string =>
  stones.map((s) => t(`stone.${s}`)).join(t('common.listSeparator'))

export function cardLabel(t: Translate, card: RecruitedCard): string {
  const extras = [
    card.points ? t('common.points', { n: card.points }) : null,
    card.tags ? t('common.tags', { n: card.tags }) : null,
  ].filter((x): x is string => x !== null)
  return `${t('common.level', { level: card.level })} ${t(`stone.${card.colour}`)}${extras.length ? ` (${extras.join(', ')})` : ''}`
}

/** One line per log entry, for the game log. */
export function describeLog(t: Translate, entry: LogEntry): string {
  switch (entry.kind) {
    case 'take': {
      const parts = [
        entry.taken.length
          ? t('log.took', { stones: stoneList(t, entry.taken) })
          : t('log.tookNothing'),
      ]
      if (entry.skipped.length) parts.push(t('log.empty', { stones: stoneList(t, entry.skipped) }))
      if (entry.capped.length)
        parts.push(t('log.capReturned', { stones: stoneList(t, entry.capped) }))
      return parts.join(' · ')
    }
    case 'gain': {
      if (!entry.card) return t('log.gainNothing', { slot: entry.slot })
      const how = entry.substituted ? 'substituted' : entry.slotEmpty ? 'slotEmpty' : null
      const parts = [
        t('log.gain', { card: cardLabel(t, entry.card), slot: entry.slot, how: how ?? 'none' }),
      ]
      if (entry.returned.length)
        parts.push(t('log.returned', { stones: stoneList(t, entry.returned) }))
      if (entry.gotTime) parts.push(t('log.timeToken'))
      return parts.join(' · ')
    }
    case 'avengers':
      return entry.holder === 'none'
        ? t('log.tileMiddle')
        : t('log.tileTo', { who: entry.holder, manual: entry.manual })
    case 'playerRecruit':
      return `${t('log.youRecruited', { card: cardLabel(t, entry.card) })}${entry.gotTime ? ` · ${t('log.timeToken')}` : ''}`
    case 'playerLocation':
      return t('log.youLocation')
    case 'stackFix':
      return t('log.stackFix', { added: entry.change === 'add', stone: t(`stone.${entry.stone}`) })
    case 'cardFix':
      return t('log.cardFix', {
        added: entry.change === 'add',
        yours: entry.side === 'player',
        card: cardLabel(t, entry.card),
      })
    case 'phase':
      return t('log.phase', { phase: entry.phase })
    case 'result':
      return describeResult(t, entry.result).title
  }
}

export function describeResult(t: Translate, result: GameResult): { title: string; text: string } {
  const you = result.winner === 'player'
  const text = {
    gauntlet: t('result.gauntlet', { you, round: result.round }),
    morePoints: t('result.morePoints', { you, round: result.round }),
    avengersTile: t('result.avengersTile', { you }),
    fewerCards: t('result.fewerCards', { you }),
    thanosWinsTies: t('result.thanosWinsTies', { round: result.round }),
    roundLimit: t('result.roundLimit', { round: result.round }),
  }[result.reason]
  return { title: you ? t('result.titleWin') : t('result.titleThanos'), text }
}

/** What Thanos "says" when he takes tokens (design 2.2). */
export const takeSpeech = (t: Translate, tokens: readonly Stone[]): string =>
  t('take.speech', { stones: tokens.map((s) => t(`stone.${s}`).toUpperCase()).join('. ') })

/** What Thanos "says" when he recruits (design 3.1). */
export const recruitSpeech = (t: Translate, action: GainAction): string =>
  t('recruit.speech', { column: action.column, row: action.row })

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
export function tableChecklist(t: Translate, state: GameState): ChecklistItem[] {
  const out: ChecklistItem[] = []
  for (const [i, e] of state.log.entries()) {
    if (e.round !== state.round) continue
    if (e.kind === 'take') {
      out.push(
        e.taken.length
          ? {
              key: `${i}-take`,
              text: t('checklist.put', { stones: stoneList(t, e.taken) }),
              gems: e.taken,
            }
          : { key: `${i}-take`, text: t('checklist.tookNone') },
      )
      if (e.skipped.length) {
        out.push({
          key: `${i}-skip`,
          text: t('checklist.skipped', { stones: stoneList(t, e.skipped), n: e.skipped.length }),
        })
      }
      if (e.capped.length) out.push({ key: `${i}-cap`, text: t('checklist.cap'), gems: e.capped })
    } else if (e.kind === 'gain') {
      if (!e.card) {
        out.push({ key: `${i}-none`, text: t('checklist.nothing') })
        continue
      }
      if (e.returned.length)
        out.push({ key: `${i}-ret`, text: t('checklist.returnTo'), gems: e.returned })
      out.push({
        key: `${i}-refill`,
        text: e.slotEmpty
          ? t('checklist.refillMarket', { level: e.card.level })
          : t('checklist.refillSlot', { slot: e.slot, level: e.card.level }),
      })
      if (e.gotTime) out.push({ key: `${i}-time`, text: t('checklist.time'), gems: ['time'] })
    } else if (e.kind === 'avengers' && !e.manual && e.holder === 'thanos') {
      out.push({ key: `${i}-tile`, text: t('checklist.tile') })
    }
  }
  return out
}

/** Big result headline for the game-over screen (design 5.2–5.4). */
export function resultHeadline(
  t: Translate,
  state: GameState,
): { title: string; tone: 'win' | 'snap' | 'thanos'; tiebreak: boolean } {
  const r = state.result
  if (!r) return { title: '', tone: 'thanos', tiebreak: false }
  const tiebreak = ['morePoints', 'avengersTile', 'fewerCards', 'thanosWinsTies'].includes(r.reason)
  if (r.winner === 'player') return { title: t('result.win'), tone: 'win', tiebreak }
  if (r.reason === 'roundLimit') return { title: t('result.snap'), tone: 'snap', tiebreak }
  return { title: t('result.thanosWins'), tone: 'thanos', tiebreak }
}

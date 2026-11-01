/**
 * Difficulty simulator (#13): Monte Carlo games of Thanos playing alone, on the real engine.
 * The model and the results: docs/automa.md → Simulation.
 *
 * - Your turns do nothing, so each round is reveal, his action, end of round.
 * - The supply is a 2-player game's 4 tokens per colour (docs/rules.md → Setup), less his stack.
 *   Tokens he returns, or loses to the cap, go back to it. A take skips a colour only when its
 *   pile is empty.
 * - Each card he gains is a placeholder: 0 points, no tags, never a substitute, never from an
 *   empty slot. No metric depends on the card, and with 0 points he never completes the
 *   Gauntlet, so every game runs to the round limit.
 *
 * Pure and deterministic: the game seeds come from mulberry32(seed), and each game's deck and
 * shuffles from the engine's seeded setup.
 */
import {
  applyEvent,
  currentRoundCard,
  discardCount,
  newGame,
  type GameEvent,
  type GameState,
  type ThanosCardInput,
} from './game.ts'
import { mulberry32, randomInt } from './rng.ts'
import { DEFAULT_SETTINGS, PHASE_LENGTH_PRESETS, type Settings } from './settings.ts'
import { phaseOfRound, roundLimit } from './setup.ts'
import { STONES, type Stone } from './stones.ts'
import type { Phase } from './types.ts'

/** Tokens per colour in a 2-player game (docs/rules.md → Setup). */
export const TOKENS_PER_COLOUR = 4

/** The community's stack cap (docs/automa.md → Clarifications from BGG, 6). */
export const COMMUNITY_STACK_CAP = 12

/** A first level-3 card from this round on is late: the last 5 rounds of a 30-round game. */
export const LATE_LEVEL_3_ROUND = 26

/** A stack of this many tokens or more counts as a hoard. */
export const BIG_STACK = 10

/**
 * The settings `npm run sim` compares: each phase length without and with the cap, then card 12
 * discarding 3, the other ruling, which changes phase 3 noticeably.
 */
export const SIM_PRESETS: readonly Settings[] = [
  ...Object.values(PHASE_LENGTH_PRESETS).flatMap((phaseLengths) =>
    [null, COMMUNITY_STACK_CAP].map((stackCap) => ({
      ...DEFAULT_SETTINGS,
      phaseLengths,
      stackCap,
    })),
  ),
  { ...DEFAULT_SETTINGS, unprintedDiscard: 3 },
]

/** A preset's name in the report, e.g. "10/9/8, cap 12". */
export function presetName(settings: Settings): string {
  const parts = [
    settings.phaseLengths.join('/'),
    settings.stackCap === null ? 'no cap' : `cap ${settings.stackCap}`,
  ]
  if (settings.unprintedDiscard !== DEFAULT_SETTINGS.unprintedDiscard) {
    parts.push(`card 12 −${settings.unprintedDiscard}`)
  }
  return parts.join(', ')
}

// ── games ────────────────────────────────────────────────────────────────────

/** Tokens left in each pile of the supply. */
export type Supply = Readonly<Record<Stone, number>>

/** What happened in one round of a simulated game. */
export interface SimRound {
  readonly round: number
  readonly phase: Phase
  readonly action: 'take' | 'gain'
  /** His stack after his turn, bottom (oldest) first. */
  readonly stack: readonly Stone[]
  /** The supply after his turn. */
  readonly supply: Supply
  /** Tokens the take skipped because their pile was empty. */
  readonly skipped: number
  /** Tokens the stack cap sent back to the supply. */
  readonly capped: number
  /** Tokens the gain's discard asked for that his stack didn't have. */
  readonly shortfall: number
  /** The gained card is level 3 (row A); his first one brings the Time token. */
  readonly level3: boolean
}

export interface SimGame {
  readonly seed: number
  readonly events: readonly GameEvent[]
  /** The final state: over, at the round limit. */
  readonly state: GameState
  readonly rounds: readonly SimRound[]
}

/** The card Thanos gains every time: it affects no metric, and 0 points keep the game going. */
const PLACEHOLDER_CARD: ThanosCardInput = { colour: 'power', points: 0, tags: 0 }

/** One game of Thanos alone, from the engine's setup for `seed`. */
export function simulateGame(seed: number, settings: Settings): SimGame {
  let state = newGame(seed, settings)
  const events: GameEvent[] = []
  const rounds: SimRound[] = []
  const supply = Object.fromEntries(STONES.map((s) => [s, TOKENS_PER_COLOUR])) as Record<
    Stone,
    number
  >
  const apply = (event: GameEvent) => {
    events.push(event)
    state = applyEvent(state, event)
  }

  while (state.step !== 'over') {
    apply({ type: 'reveal' })
    const { phase, action } = currentRoundCard(state)
    const logged = state.log.length
    let skipped = 0
    let capped = 0
    let shortfall = 0
    let level3 = false
    if (action.kind === 'take') {
      apply({ type: 'thanosTake', skipped: action.tokens.filter((s) => supply[s] === 0) })
      const entry = state.log[logged]
      if (entry?.kind !== 'take') throw new Error('The take left no log entry')
      for (const s of entry.taken) supply[s]--
      for (const s of entry.capped) supply[s]++
      skipped = entry.skipped.length
      capped = entry.capped.length
    } else {
      apply({ type: 'thanosGain', card: PLACEHOLDER_CARD, substituted: false, slotEmpty: false })
      // The gain's entry comes first; an Avengers entry would follow it.
      const entry = state.log[logged]
      if (entry?.kind !== 'gain') throw new Error('The gain left no log entry')
      for (const s of entry.returned) supply[s]++
      shortfall = discardCount(state, action) - entry.returned.length
      level3 = entry.card?.level === 3
    }
    rounds.push({
      round: state.round,
      phase,
      action: action.kind,
      stack: state.stack,
      supply: { ...supply },
      skipped,
      capped,
      shortfall,
      level3,
    })
    apply({ type: 'endRound' })
  }
  return { seed, events, state, rounds }
}

export interface SimOptions {
  /** Number of games. */
  readonly runs: number
  /** Seed for the game seeds. */
  readonly seed: number
}

/** The games' seeds. They don't depend on the settings, so every preset plays the same decks. */
export function gameSeeds({ runs, seed }: SimOptions): number[] {
  const random = mulberry32(seed)
  return Array.from({ length: runs }, () => randomInt(2 ** 32, random))
}

/** The games, played one at a time, so a big run needn't keep them all. */
export function* simulateGames(settings: Settings, options: SimOptions): Generator<SimGame> {
  for (const seed of gameSeeds(options)) yield simulateGame(seed, settings)
}

// ── metrics ──────────────────────────────────────────────────────────────────

/** A spread of whole numbers. The p90 is the nearest-rank 90th percentile. */
export interface Spread {
  readonly mean: number
  readonly p90: number
  readonly max: number
}

export interface Discards {
  readonly gainsPerGame: number
  /** Share of gains that can't return the whole discard (printed, or card 12's ruling). */
  readonly shortShare: number
  /** Tokens those discards miss, per game. */
  readonly missingPerGame: number
}

export interface TokenCount {
  readonly perGame: number
  /** Share of games where it happens at least once. */
  readonly gameShare: number
}

export interface SimSummary {
  readonly settings: Settings
  readonly games: number
  /** His stack after his turn, round by round: index 0 is round 1. */
  readonly stackByRound: readonly Spread[]
  /** The same, pooled over the rounds of each phase. */
  readonly stackByPhase: readonly [Spread, Spread, Spread]
  /** The same, pooled over the whole game. */
  readonly stack: Spread
  /** Share of games where his stack reaches BIG_STACK or more after some turn. */
  readonly bigStackShare: number
  /** The round of his first level-3 card, which brings his Time token. */
  readonly firstLevel3: {
    /** Over the games where he gets one; null if none does. */
    readonly mean: number | null
    readonly median: number | null
    /** Share of all games where it comes in round LATE_LEVEL_3_ROUND or later. */
    readonly lateShare: number
    /** Share of all games without one: possible when phase 3 is shorter than the deck. */
    readonly noneShare: number
  }
  readonly discardsByPhase: readonly [Discards, Discards, Discards]
  readonly discards: Discards
  /** Tokens a take skipped because their pile was empty. */
  readonly skipped: TokenCount
  /** Tokens the stack cap sent back to the supply. */
  readonly capped: TokenCount
}

/** Counts of whole numbers: `histogram[v]` is how often v occurred. */
type Histogram = number[]

function count(histogram: Histogram, value: number, times = 1): void {
  histogram[value] = (histogram[value] ?? 0) + times
}

function merge(histograms: readonly Histogram[]): Histogram {
  const out: Histogram = []
  for (const h of histograms) h.forEach((n, v) => count(out, v, n))
  return out
}

function total(histogram: Histogram): number {
  return histogram.reduce((sum, n) => sum + n, 0)
}

/** The smallest value with at least a share `q` of the counts at or below it (nearest rank). */
function quantile(histogram: Histogram, q: number): number | null {
  const rank = Math.max(1, Math.ceil(q * total(histogram)))
  let seen = 0
  for (let v = 0; v < histogram.length; v++) {
    seen += histogram[v] ?? 0
    if (seen >= rank) return v
  }
  return null
}

function mean(histogram: Histogram): number | null {
  const n = total(histogram)
  return n === 0 ? null : histogram.reduce((sum, c, v) => sum + c * v, 0) / n
}

function spread(histogram: Histogram): Spread {
  return {
    mean: mean(histogram) ?? 0,
    p90: quantile(histogram, 0.9) ?? 0,
    max: quantile(histogram, 1) ?? 0,
  }
}

const ratio = (n: number, of: number) => (of === 0 ? 0 : n / of)

/** Aggregates the metrics over games played with `settings`. */
export function summarise(settings: Settings, games: Iterable<SimGame>): SimSummary {
  const stack: Histogram[] = Array.from({ length: roundLimit(settings) }, () => [])
  const firstLevel3: Histogram = []
  const perPhase = (): Record<Phase, number> => ({ 1: 0, 2: 0, 3: 0 })
  const gains = perPhase()
  const shortGains = perPhase()
  const missing = perPhase()
  const tally = { games: 0, big: 0, none: 0, skipped: 0, skipGames: 0, capped: 0, capGames: 0 }
  for (const game of games) {
    tally.games++
    let first: number | null = null
    let peak = 0
    let skipped = 0
    let capped = 0
    for (const r of game.rounds) {
      const histogram = stack[r.round - 1]
      if (!histogram) throw new Error(`Round ${r.round} is past the round limit`)
      count(histogram, r.stack.length)
      peak = Math.max(peak, r.stack.length)
      if (r.action === 'gain') gains[r.phase]++
      if (r.shortfall > 0) shortGains[r.phase]++
      missing[r.phase] += r.shortfall
      skipped += r.skipped
      capped += r.capped
      if (r.level3 && first === null) first = r.round
    }
    if (peak >= BIG_STACK) tally.big++
    if (first === null) tally.none++
    else count(firstLevel3, first)
    tally.skipped += skipped
    tally.capped += capped
    if (skipped > 0) tally.skipGames++
    if (capped > 0) tally.capGames++
  }

  const perGame = (n: number) => ratio(n, tally.games)
  const sum = (byPhase: Record<Phase, number>) => byPhase[1] + byPhase[2] + byPhase[3]
  const discards = (g: number, short: number, miss: number): Discards => ({
    gainsPerGame: perGame(g),
    shortShare: ratio(short, g),
    missingPerGame: perGame(miss),
  })
  const phases = <T>(f: (phase: Phase) => T): [T, T, T] => [f(1), f(2), f(3)]
  const late = firstLevel3.reduce((n, c, round) => n + (round >= LATE_LEVEL_3_ROUND ? c : 0), 0)
  return {
    settings,
    games: tally.games,
    stackByRound: stack.map((h) => spread(h)),
    stackByPhase: phases((phase) =>
      spread(merge(stack.filter((_, i) => phaseOfRound(i + 1, settings) === phase))),
    ),
    stack: spread(merge(stack)),
    bigStackShare: perGame(tally.big),
    firstLevel3: {
      mean: mean(firstLevel3),
      median: quantile(firstLevel3, 0.5),
      lateShare: perGame(late),
      noneShare: perGame(tally.none),
    },
    discardsByPhase: phases((p) => discards(gains[p], shortGains[p], missing[p])),
    discards: discards(sum(gains), sum(shortGains), sum(missing)),
    skipped: { perGame: perGame(tally.skipped), gameShare: perGame(tally.skipGames) },
    capped: { perGame: perGame(tally.capped), gameShare: perGame(tally.capGames) },
  }
}

/** Plays `options.runs` games with `settings` and aggregates the metrics. */
export function simulate(settings: Settings, options: SimOptions): SimSummary {
  return summarise(settings, simulateGames(settings, options))
}

// ── report ───────────────────────────────────────────────────────────────────

const decimals = (digits: number) => (x: number) => x.toFixed(digits)
const one = decimals(1)
const two = decimals(2)
const percent = (x: number) => `${(100 * x).toFixed(1)}%`
const thousands = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
const spreadCell = (s: Spread) => `${one(s.mean)} · ${s.p90} · ${s.max}`
const discardsCell = (d: Discards) => `${percent(d.shortShare)} · ${one(d.missingPerGame)}`
const countCell = (c: TokenCount) => `${two(c.perGame)} · ${percent(c.gameShare)}`

/** Prose wrapped at `width` columns, so it reads in a terminal too. */
function paragraph(text: string, width = 96): string {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(' ')) {
    if (line !== '' && line.length + 1 + word.length > width) {
      lines.push(line)
      line = word
    } else {
      line = line === '' ? word : `${line} ${word}`
    }
  }
  return [...lines, line].join('\n')
}

/** A Markdown table, padded so it also reads in a terminal; columns after the first align right. */
function table(head: readonly string[], rows: readonly (readonly string[])[]): string {
  const widths = head.map((h, i) => Math.max(h.length, ...rows.map((r) => (r[i] ?? '').length)))
  const pad = (cell: string, i: number) => {
    const width = widths[i] ?? 0
    return i === 0 ? cell.padEnd(width) : cell.padStart(width)
  }
  const line = (cells: readonly string[]) =>
    `| ${head.map((_, i) => pad(cells[i] ?? '', i)).join(' | ')} |`
  const rule = widths.map((w, i) => (i === 0 ? '-'.repeat(w) : `${'-'.repeat(w - 1)}:`))
  return [line(head), `| ${rule.join(' | ')} |`, ...rows.map(line)].join('\n')
}

/** The Markdown report `npm run sim` prints: a row (or column) per preset in every table. */
export function formatReport(summaries: readonly SimSummary[], { runs, seed }: SimOptions): string {
  const rows = (cells: (s: SimSummary) => readonly string[]) =>
    summaries.map((s) => [presetName(s.settings), ...cells(s)])
  const rounds = Math.max(0, ...summaries.map((s) => s.stackByRound.length))
  const byRound = Array.from({ length: rounds }, (_, i) => [
    String(i + 1),
    ...summaries.map((s) => {
      const round = s.stackByRound[i]
      return round ? spreadCell(round) : '–'
    }),
  ])
  const orDash = (x: number | null, format: (x: number) => string) => (x === null ? '–' : format(x))
  return [
    '# Thanos alone: difficulty simulation',
    '',
    paragraph(
      `${thousands(runs)} ${runs === 1 ? 'game' : 'games'} per preset, seed ${seed}. ` +
        'Thanos plays alone on the engine: ' +
        `your turns do nothing, the supply is ${TOKENS_PER_COLOUR} tokens per colour less his ` +
        'stack, and every card he gains is worth 0 points, so each game runs to the round ' +
        'limit. Every preset plays the same decks. The model: docs/automa.md → Simulation.',
    ),
    '',
    '## His stack after his turn',
    '',
    paragraph(
      'Tokens, as mean · p90 · max over the rounds of each phase in every game; 90% of them ' +
        `are at or below the p90. "Reaches ${BIG_STACK}" is the share of games where his ` +
        `stack gets to ${BIG_STACK} or more.`,
    ),
    '',
    table(
      ['Preset', 'Phase 1', 'Phase 2', 'Phase 3', 'Whole game', `Reaches ${BIG_STACK}`],
      rows((s) => [
        ...s.stackByPhase.map(spreadCell),
        spreadCell(s.stack),
        percent(s.bigStackShare),
      ]),
    ),
    '',
    '## His stack by round',
    '',
    'Tokens after his turn, as mean · p90 · max.',
    '',
    table(['Round', ...summaries.map((s) => presetName(s.settings))], byRound),
    '',
    '## His first level-3 card',
    '',
    paragraph(
      'The round it comes in, with his Time token. Mean and median over the games where he ' +
        `gets one; "Round ${LATE_LEVEL_3_ROUND}+" and "None" are shares of all games.`,
    ),
    '',
    table(
      ['Preset', 'Mean', 'Median', `Round ${LATE_LEVEL_3_ROUND}+`, 'None'],
      rows(({ firstLevel3: f }) => [
        orDash(f.mean, one),
        orDash(f.median, String),
        percent(f.lateShare),
        percent(f.noneShare),
      ]),
    ),
    '',
    '## Discards that come up short',
    '',
    paragraph(
      'Gains per game; then the share of gains whose stack cannot pay the whole discard · the ' +
        'tokens missing per game.',
    ),
    '',
    table(
      ['Preset', 'Gains', 'Phase 1', 'Phase 2', 'Phase 3', 'Whole game'],
      rows((s) => [
        one(s.discards.gainsPerGame),
        ...s.discardsByPhase.map(discardsCell),
        discardsCell(s.discards),
      ]),
    ),
    '',
    '## Empty piles and the cap',
    '',
    'Tokens per game · share of games where it happens.',
    '',
    table(
      ['Preset', 'Skipped: pile empty', 'Sent back by the cap'],
      rows((s) => [countCell(s.skipped), countCell(s.capped)]),
    ),
    '',
  ].join('\n')
}

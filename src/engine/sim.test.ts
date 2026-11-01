import { describe, expect, it } from 'vitest'
import { replay, sideStats } from './game.ts'
import { DEFAULT_SETTINGS, PHASE_LENGTH_PRESETS, type Settings } from './settings.ts'
import { cardForRound, phaseOfRound, phaseStarts, roundLimit } from './setup.ts'
import { STONES, type Stone } from './stones.ts'
import {
  BIG_STACK,
  COMMUNITY_STACK_CAP,
  formatReport,
  gameSeeds,
  presetName,
  SIM_PRESETS,
  simulate,
  simulateGame,
  simulateGames,
  summarise,
  TOKENS_PER_COLOUR,
  type SimGame,
  type SimRound,
  type Spread,
  type Supply,
} from './sim.ts'
import type { AutomaAction, Phase } from './types.ts'

const S = DEFAULT_SETTINGS
const SHORTEST: Settings = { ...S, phaseLengths: PHASE_LENGTH_PRESETS.shortest }
const FULL_SUPPLY = Object.fromEntries(STONES.map((s) => [s, TOKENS_PER_COLOUR])) as Supply
const PHASES = [1, 2, 3] as const

/** A few hundred games of every preset, played once and shared by the tests below. */
const OPTIONS = { runs: 299, seed: 13 }
const played = SIM_PRESETS.map((settings) => ({
  settings,
  games: [...simulateGames(settings, OPTIONS)],
}))

interface Turn {
  readonly settings: Settings
  readonly game: SimGame
  readonly round: SimRound
  readonly action: AutomaAction
  /** His stack and the supply before his turn, where the round started. */
  readonly stackBefore: readonly Stone[]
  readonly supplyBefore: Supply
}

/** Every round of every game above, with the state it started from. */
const turns: readonly Turn[] = played.flatMap(({ settings, games }) =>
  games.flatMap((game) =>
    game.rounds.map((round, i) => {
      const before = game.rounds[i - 1]
      return {
        settings,
        game,
        round,
        action: cardForRound(game.state.setup, round.round).action,
        stackBefore: before?.stack ?? [],
        supplyBefore: before?.supply ?? FULL_SUPPLY,
      }
    }),
  ),
)
const turnsOf = (settings: Settings) => turns.filter((t) => t.settings === settings)
/** A short label for a failing round. */
const where = (t: Turn) => `${presetName(t.settings)}, game ${t.game.seed}, round ${t.round.round}`

/** Math.min and Math.max for arrays too long to spread into arguments. */
const minOf = (xs: readonly number[]) => xs.reduce((a, b) => Math.min(a, b), Infinity)
const maxOf = (xs: readonly number[]) => xs.reduce((a, b) => Math.max(a, b), -Infinity)

/** Mean, nearest-rank p90 and max, computed directly. */
function spreadOf(values: readonly number[]): Spread {
  const sorted = [...values].sort((a, b) => a - b)
  return {
    mean: sorted.reduce((sum, v) => sum + v, 0) / sorted.length,
    p90: sorted[Math.ceil(0.9 * sorted.length) - 1] ?? NaN,
    max: sorted.at(-1) ?? NaN,
  }
}

describe('simulator: Thanos alone (docs/automa.md → Simulation)', () => {
  it('plays the same game for a seed, and the game replays from its events', () => {
    const game = simulateGame(2026, S)
    expect(simulateGame(2026, S)).toEqual(game)
    expect(replay(2026, S, game.events)).toEqual(game.state)
  })

  it('gives the same results and report for the same runs and seed, and others for another', () => {
    const options = { runs: 100, seed: 5 }
    const run = () => SIM_PRESETS.map((settings) => simulate(settings, options))
    const summaries = run()
    expect(run()).toEqual(summaries)
    expect(formatReport(run(), options)).toBe(formatReport(summaries, options))
    expect(simulate(S, { ...options, seed: 6 })).not.toEqual(summaries[0])
  })

  it('plays the same decks with every preset', () => {
    const seeds = gameSeeds(OPTIONS)
    expect(new Set(seeds).size).toBe(OPTIONS.runs)
    for (const { games } of played) expect(games.map((g) => g.seed)).toEqual(seeds)
    const orders = SIM_PRESETS.map((s) => simulateGame(seeds[0] ?? 0, s).state.setup.phaseOrders)
    for (const order of orders) expect(order).toEqual(orders[0])
  })

  it('runs every game to the round limit, as 0-point cards never complete the Gauntlet', () => {
    for (const { settings, games } of played) {
      const limit = roundLimit(settings)
      for (const { rounds, state } of games) {
        expect(rounds.map((r) => r.round)).toEqual(Array.from({ length: limit }, (_, i) => i + 1))
        expect(state.result).toEqual({ winner: 'thanos', reason: 'roundLimit', round: limit })
        expect(sideStats(state, 'thanos').points).toBe(0)
      }
    }
  })

  it('never lets his stack go negative, or a pile go below 0 or above 4', () => {
    // Every token is in his stack or in the supply, so neither can go below 0 or above 4.
    const broken = turns.filter(({ round }) =>
      STONES.some((stone) => {
        const held = round.stack.filter((s) => s === stone).length
        const pile = round.supply[stone]
        return pile < 0 || pile > TOKENS_PER_COLOUR || held + pile !== TOKENS_PER_COLOUR
      }),
    )
    expect(broken.map(where)).toEqual([])
    expect(minOf(turns.map((t) => t.round.stack.length))).toBe(0)
    expect(minOf(turns.flatMap((t) => STONES.map((s) => t.round.supply[s])))).toBe(0)
  })

  it('never gives him a level-3 card before round 21 with 10/10/10, or before phase 3 at all', () => {
    const level3 = turns.filter((t) => t.round.level3)
    const standard = level3.filter((t) => t.settings.phaseLengths.join() === '10,10,10')
    expect(standard.length).toBeGreaterThan(0)
    expect(minOf(standard.map((t) => t.round.round))).toBe(21)
    const early = level3.filter((t) => t.round.round < phaseStarts(t.settings)[2])
    expect(early.map(where)).toEqual([])
  })
})

describe('simulator metrics (docs/automa.md → Simulation)', () => {
  it('stack size: a take adds its tokens less skips and the cap, a gain discards from the bottom', () => {
    const wrong = turns.filter(({ settings, round, action, stackBefore, supplyBefore }) => {
      if (action.kind === 'gain') {
        const discard = action.discard ?? settings.unprintedDiscard
        return round.stack.join() !== stackBefore.slice(discard).join()
      }
      // Onto the top in printed order, skipping empty piles; the cap returns the oldest.
      const all = [...stackBefore, ...action.tokens.filter((s) => supplyBefore[s] > 0)]
      const excess = settings.stackCap === null ? 0 : Math.max(0, all.length - settings.stackCap)
      return round.stack.join() !== all.slice(excess).join()
    })
    expect(wrong.map(where)).toEqual([])
  })

  it('stack size: mean, p90 and max per round and per phase, and the games reaching 10', () => {
    for (const { settings, games } of played) {
      const summary = summarise(settings, games)
      const sizes = (round: number) => games.map((g) => g.rounds[round - 1]?.stack.length ?? NaN)
      const rounds = Array.from({ length: roundLimit(settings) }, (_, i) => i + 1)
      expect(summary.stackByRound).toEqual(rounds.map((round) => spreadOf(sizes(round))))
      for (const phase of PHASES) {
        const pooled = rounds.filter((r) => phaseOfRound(r, settings) === phase).flatMap(sizes)
        expect(summary.stackByPhase[phase - 1]).toEqual(spreadOf(pooled))
      }
      expect(summary.stack).toEqual(spreadOf(rounds.flatMap(sizes)))
      const peaks = games.map((g) => maxOf(g.rounds.map((r) => r.stack.length)))
      expect(summary.bigStackShare).toBe(peaks.filter((p) => p >= BIG_STACK).length / games.length)
    }
    // Round 1 is a take of 2 or 3 tokens, or a gain with nothing to discard: 1.4 tokens on
    // average (13 tokens on the non-star takes, plus card 01's 2 in half the decks, over 10 cards).
    const round1 = simulate(S, { runs: 2000, seed: 3 }).stackByRound[0]
    expect(round1).toMatchObject({ p90: 3, max: 3 })
    expect(Math.abs((round1?.mean ?? NaN) - 1.4)).toBeLessThan(0.15)
  })

  it('first level-3 card: mean, median, round 26+ and none follow the deck odds', () => {
    // Only the 2 star cards in the deck target row A, in phase 3 (docs/automa.md → What follows
    // from the card list). The first of them is the k-th of the 10 shuffled cards with odds
    // (10 − k)/45: on average the 3.67th, and the 6th or later 10 times in 45.
    const options = { runs: 4000, seed: 3 }
    const standard = simulate(S, options).firstLevel3
    expect(Math.abs((standard.mean ?? NaN) - (20 + 165 / 45))).toBeLessThan(0.15)
    expect(standard.median).toBe(23)
    expect(Math.abs(standard.lateShare - 10 / 45)).toBeLessThan(0.03)
    expect(standard.noneShare).toBe(0)
    // 8/8/8: phase 3 is rounds 17–24, so never round 26 or later, and its 8 cards miss both star
    // cards 1 time in 45.
    const shortest = simulate(SHORTEST, options).firstLevel3
    expect(Math.abs((shortest.mean ?? NaN) - (16 + 156 / 44))).toBeLessThan(0.15)
    expect(shortest.median).toBe(19)
    expect(shortest.lateShare).toBe(0)
    expect(Math.abs(shortest.noneShare - 1 / 45)).toBeLessThan(0.01)
  })

  it('discard shortfalls: a gain misses the tokens its discard asks for beyond his stack', () => {
    for (const { settings, games } of played) {
      const count = (): Record<Phase, number> => ({ 1: 0, 2: 0, 3: 0 })
      const gains = count()
      const short = count()
      const missing = count()
      const wrong: string[] = []
      for (const t of turnsOf(settings)) {
        const { round, action, stackBefore } = t
        const discard = action.kind === 'gain' ? (action.discard ?? settings.unprintedDiscard) : 0
        if (round.shortfall !== Math.max(0, discard - stackBefore.length)) wrong.push(where(t))
        if (action.kind === 'gain') gains[round.phase]++
        if (round.shortfall > 0) short[round.phase]++
        missing[round.phase] += round.shortfall
      }
      expect(wrong).toEqual([])
      const n = games.length
      const sum = (byPhase: Record<Phase, number>) => byPhase[1] + byPhase[2] + byPhase[3]
      const summary = summarise(settings, games)
      expect(summary.discardsByPhase).toEqual(
        PHASES.map((p) => ({
          gainsPerGame: gains[p] / n,
          shortShare: short[p] / gains[p],
          missingPerGame: missing[p] / n,
        })),
      )
      expect(summary.discards).toEqual({
        gainsPerGame: sum(gains) / n,
        shortShare: sum(short) / sum(gains),
        missingPerGame: sum(missing) / n,
      })
    }
  })

  it('skipped tokens: a take skips a colour only when its pile is empty', () => {
    let all = 0
    for (const { settings, games } of played) {
      let skipped = 0
      const gamesWithSkips = new Set<SimGame>()
      const wrong: string[] = []
      for (const t of turnsOf(settings)) {
        const { action, supplyBefore, round } = t
        const empty =
          action.kind === 'take' ? action.tokens.filter((s) => supplyBefore[s] === 0) : []
        if (round.skipped !== empty.length) wrong.push(where(t))
        skipped += round.skipped
        if (round.skipped > 0) gamesWithSkips.add(t.game)
      }
      expect(wrong).toEqual([])
      expect(summarise(settings, games).skipped).toEqual({
        perGame: skipped / games.length,
        gameShare: gamesWithSkips.size / games.length,
      })
      all += skipped
    }
    expect(all).toBeGreaterThan(0)
  })

  it('capped tokens: the cap of 12 sends the oldest tokens back, and nothing goes back without it', () => {
    for (const { settings, games } of played) {
      const mine = turnsOf(settings)
      const summary = summarise(settings, games)
      if (settings.stackCap === null) {
        expect(mine.filter((t) => t.round.capped > 0).map(where)).toEqual([])
        expect(maxOf(mine.map((t) => t.round.stack.length))).toBeGreaterThan(COMMUNITY_STACK_CAP)
        expect(summary.capped).toEqual({ perGame: 0, gameShare: 0 })
        continue
      }
      expect(settings.stackCap).toBe(COMMUNITY_STACK_CAP)
      let capped = 0
      const gamesCapped = new Set<SimGame>()
      const wrong: string[] = []
      for (const t of mine) {
        const { round, action, stackBefore } = t
        const taken = action.kind === 'take' ? action.tokens.length - round.skipped : 0
        const excess = Math.max(0, stackBefore.length + taken - COMMUNITY_STACK_CAP)
        if (round.capped !== excess || round.stack.length > COMMUNITY_STACK_CAP)
          wrong.push(where(t))
        capped += round.capped
        if (round.capped > 0) gamesCapped.add(t.game)
      }
      expect(wrong).toEqual([])
      expect(capped).toBeGreaterThan(0)
      expect(summary.capped).toEqual({
        perGame: capped / games.length,
        gameShare: gamesCapped.size / games.length,
      })
    }
  })
})

describe('simulator report', () => {
  it('names each preset and prints a row for it in every table', () => {
    expect(SIM_PRESETS.map(presetName)).toEqual([
      '10/10/10, no cap',
      '10/10/10, cap 12',
      '10/9/8, no cap',
      '10/9/8, cap 12',
      '8/8/8, no cap',
      '8/8/8, cap 12',
      '10/10/10, no cap, card 12 −3',
    ])
    const options = { runs: 20, seed: 1 }
    const report = formatReport(
      SIM_PRESETS.map((settings) => simulate(settings, options)),
      options,
    )
    expect(report).toMatch(
      /^# Thanos alone: difficulty simulation\n\n20 games per preset, seed 1\./,
    )
    const lines = report.split('\n')
    for (const settings of SIM_PRESETS) {
      expect(lines.filter((l) => l.startsWith(`| ${presetName(settings)} `))).toHaveLength(4)
    }
    // The by-round table: a column per preset, a line per round of the longest game.
    const header = lines.find((l) => l.startsWith('| Round '))
    for (const settings of SIM_PRESETS) expect(header).toContain(` ${presetName(settings)} |`)
    expect(lines.filter((l) => /^\| \d+ +\|/.test(l))).toHaveLength(30)
  })
})

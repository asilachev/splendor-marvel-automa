import { beforeEach, describe, expect, it } from 'vitest'
import {
  DEFAULT_SETTINGS,
  newGame,
  type GameResult,
  type GameState,
  type Settings,
} from '../../engine/index.ts'
import {
  clearHistory,
  forgetGame,
  HISTORY_KEY,
  HISTORY_LIMIT,
  loadHistory,
  recordGame,
  statsByDifficulty,
  statsOf,
  summarizeGame,
  type GameSummary,
} from './history.ts'

beforeEach(() => localStorage.clear())

const when = new Date('2026-11-01T12:00:00Z')

const game = (
  id: number,
  result: GameResult,
  settings: Settings = DEFAULT_SETTINGS,
  points: [player: number | null, thanos: number] = [10, 12],
): GameSummary => ({
  id,
  finishedAt: when.toISOString(),
  settings,
  result,
  thanosPoints: points[1],
  playerPoints: points[0],
})
const win = (round: number): GameResult => ({ winner: 'player', reason: 'gauntlet', round })
const loss = (round: number): GameResult => ({ winner: 'thanos', reason: 'gauntlet', round })

/** A finished game: the state after the round-30 check, built directly. */
const finished = (overrides: Partial<GameState>, settings: Settings = DEFAULT_SETTINGS) => ({
  ...newGame(7, settings),
  step: 'over' as const,
  round: 30,
  result: { winner: 'thanos', reason: 'roundLimit', round: 30 } as const,
  ...overrides,
})

describe('game summaries (#12)', () => {
  it('summarises only finished games', () => {
    expect(summarizeGame(7, newGame(7, DEFAULT_SETTINGS), when)).toBeNull()
    const playerCards = [{ level: 1 as const, colour: 'mind' as const, points: 2, tags: 0 }]
    expect(summarizeGame(7, finished({ playerCards }), when)).toEqual({
      id: 7,
      finishedAt: '2026-11-01T12:00:00.000Z',
      settings: DEFAULT_SETTINGS,
      result: { winner: 'thanos', reason: 'roundLimit', round: 30 },
      thanosPoints: 0,
      playerPoints: 2,
    })
  })

  it('keeps your reported points, or none, when your cards weren’t logged (#15)', () => {
    const unlogged = { ...DEFAULT_SETTINGS, logPlayerCards: false }
    expect(summarizeGame(7, finished({}, unlogged), when)?.playerPoints).toBeNull()
    const reported = finished({ playerReport: { gauntlet: true, points: 18, cards: 9 } }, unlogged)
    expect(summarizeGame(7, reported, when)?.playerPoints).toBe(18)
  })
})

describe('the history store (#12)', () => {
  it('adds games newest first and replaces a game finished again', () => {
    recordGame(game(1, loss(30)))
    recordGame(game(2, win(25)))
    expect(loadHistory().map((g) => g.id)).toEqual([2, 1])
    recordGame(game(1, win(28)))
    expect(loadHistory().map((g) => [g.id, g.result.winner])).toEqual([
      [1, 'player'],
      [2, 'player'],
    ])
  })

  it('forgets a game an undo stepped back from, and clears everything', () => {
    recordGame(game(1, loss(30)))
    recordGame(game(2, win(25)))
    expect(forgetGame(1).map((g) => g.id)).toEqual([2])
    clearHistory()
    expect(loadHistory()).toEqual([])
  })

  it(`keeps the newest ${HISTORY_LIMIT} games`, () => {
    for (let id = 1; id <= HISTORY_LIMIT + 2; id++) recordGame(game(id, win(24)))
    const history = loadHistory()
    expect(history).toHaveLength(HISTORY_LIMIT)
    expect(history[0]?.id).toBe(HISTORY_LIMIT + 2)
  })

  it('skips unreadable entries and survives broken or missing storage', () => {
    localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify([
        game(1, win(22)),
        { id: 'x' },
        { ...game(2, win(23)), result: { winner: 'x' } },
      ]),
    )
    expect(loadHistory().map((g) => g.id)).toEqual([1])
    localStorage.setItem(HISTORY_KEY, '{oops')
    expect(loadHistory()).toEqual([])
    expect(loadHistory(null)).toEqual([])
    expect(() => recordGame(game(3, win(21)), null)).not.toThrow()
  })
})

describe('stats (#12)', () => {
  it('counts games, wins, the win rate and the average winning round', () => {
    expect(statsOf([])).toEqual({ games: 0, wins: 0, winRate: null, avgWinRound: null })
    expect(statsOf([game(1, win(24)), game(2, loss(30)), game(3, win(27))])).toEqual({
      games: 3,
      wins: 2,
      winRate: 2 / 3,
      avgWinRound: 25.5,
    })
    expect(statsOf([game(1, loss(30))]).avgWinRound).toBeNull()
  })

  it('groups by difficulty, the most played first', () => {
    const short: Settings = { ...DEFAULT_SETTINGS, phaseLengths: [8, 8, 8] }
    const capped: Settings = { ...DEFAULT_SETTINGS, stackCap: 12 }
    const groups = statsByDifficulty([
      game(1, win(20), short),
      game(2, loss(24), short),
      game(3, win(26)),
      game(4, loss(30), capped),
    ])
    expect(groups.map((g) => [g.rounds, g.cap, g.stats.games, g.stats.wins])).toEqual([
      [24, null, 2, 1],
      [30, null, 1, 1],
      [30, 12, 1, 0],
    ])
  })
})

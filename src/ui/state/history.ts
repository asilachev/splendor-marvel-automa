import {
  roundLimit,
  sideStats,
  type GameResult,
  type GameState,
  type ResultReason,
  type Settings,
} from '../../engine/index.ts'
import { browserStorage, parseSettings, SAVE_VERSION } from './persistence.ts'

/**
 * Finished games, newest first (#12). They're kept apart from the saved game, so starting or ending
 * a game never touches them, and only "Clear history" removes them.
 */
export const HISTORY_KEY = `thanos-automa:v${SAVE_VERSION}:history`
/** Years of play; the oldest games beyond it are dropped. */
export const HISTORY_LIMIT = 500

export interface GameSummary {
  /** The game's seed: one entry per game, replaced if it's finished again after an undo. */
  readonly id: number
  /** When it finished, as an ISO date and time. */
  readonly finishedAt: string
  readonly settings: Settings
  readonly result: GameResult
  readonly thanosPoints: number
  /** Your points, or null when your cards weren't logged and the game didn't ask for them (#15). */
  readonly playerPoints: number | null
}

export interface Stats {
  readonly games: number
  readonly wins: number
  /** Share of games you won, from 0 to 1; null without games. */
  readonly winRate: number | null
  /** The average round of your wins; null without wins. */
  readonly avgWinRound: number | null
}

/** The games played at one difficulty: the game length, the token cap and the variant (#11). */
export interface DifficultyStats {
  readonly key: string
  readonly rounds: number
  readonly cap: number | null
  readonly hard: boolean
  readonly stats: Stats
}

/** The summary of a finished game, or null while it's still going. */
export function summarizeGame(id: number, state: GameState, finishedAt: Date): GameSummary | null {
  if (!state.result) return null
  const { settings } = state.setup
  return {
    id,
    finishedAt: finishedAt.toISOString(),
    settings,
    result: state.result,
    thanosPoints: sideStats(state, 'thanos').points,
    playerPoints: settings.logPlayerCards
      ? sideStats(state, 'player').points
      : (state.playerReport?.points ?? null),
  }
}

export function loadHistory(storage = browserStorage()): GameSummary[] {
  try {
    const raw = storage?.getItem(HISTORY_KEY)
    if (!raw) return []
    const value: unknown = JSON.parse(raw)
    if (!Array.isArray(value)) return []
    return value.flatMap((item) => {
      const summary = readSummary(item)
      return summary ? [summary] : []
    })
  } catch {
    return []
  }
}

/** Adds a finished game, or replaces its earlier entry. Returns the new history. */
export function recordGame(summary: GameSummary, storage = browserStorage()): GameSummary[] {
  return saveHistory([summary, ...loadHistory(storage).filter((g) => g.id !== summary.id)], storage)
}

/** Removes a game that's no longer finished, because an undo stepped back from its result. */
export function forgetGame(id: number, storage = browserStorage()): GameSummary[] {
  return saveHistory(
    loadHistory(storage).filter((g) => g.id !== id),
    storage,
  )
}

export function clearHistory(storage = browserStorage()): void {
  try {
    storage?.removeItem(HISTORY_KEY)
  } catch {
    // Blocked storage: nothing was saved there either.
  }
}

export function statsOf(games: readonly GameSummary[]): Stats {
  const wins = games.filter((g) => g.result.winner === 'player')
  return {
    games: games.length,
    wins: wins.length,
    winRate: games.length ? wins.length / games.length : null,
    avgWinRound: wins.length
      ? wins.reduce((sum, g) => sum + g.result.round, 0) / wins.length
      : null,
  }
}

/** Stats per difficulty, the most played first; equal counts keep the longer game first. */
export function statsByDifficulty(games: readonly GameSummary[]): DifficultyStats[] {
  const groups = new Map<string, GameSummary[]>()
  for (const game of games) {
    const key = difficultyKey(game.settings)
    groups.set(key, [...(groups.get(key) ?? []), game])
  }
  return [...groups.entries()]
    .map(([key, group]) => {
      const { settings } = group[0]!
      return {
        key,
        rounds: roundLimit(settings),
        cap: settings.stackCap,
        hard: settings.variant === 'hard',
        stats: statsOf(group),
      }
    })
    .sort(
      (a, b) =>
        b.stats.games - a.stats.games ||
        b.rounds - a.rounds ||
        (a.cap ?? 0) - (b.cap ?? 0) ||
        Number(a.hard) - Number(b.hard),
    )
}

const difficultyKey = (s: Settings): string =>
  `${s.phaseLengths.join('/')}|${s.stackCap ?? 'none'}|${s.variant}`

const REASONS: readonly ResultReason[] = [
  'gauntlet',
  'morePoints',
  'avengersTile',
  'fewerCards',
  'thanosWinsTies',
  'roundLimit',
]

function saveHistory(games: readonly GameSummary[], storage: Storage | null): GameSummary[] {
  const kept = games.slice(0, HISTORY_LIMIT)
  try {
    storage?.setItem(HISTORY_KEY, JSON.stringify(kept))
  } catch {
    // Storage full or blocked: the history shows this session's games but won't keep them.
  }
  return kept
}

/** A stored summary, checked; anything unreadable is skipped rather than breaking the screen. */
function readSummary(value: unknown): GameSummary | null {
  if (typeof value !== 'object' || value === null) return null
  const v = value as Record<string, unknown>
  const result = v.result as Partial<GameResult> | undefined
  if (
    typeof v.id !== 'number' ||
    typeof v.finishedAt !== 'string' ||
    Number.isNaN(Date.parse(v.finishedAt)) ||
    typeof v.thanosPoints !== 'number' ||
    (v.playerPoints !== null && typeof v.playerPoints !== 'number') ||
    typeof result !== 'object' ||
    result === null ||
    (result.winner !== 'thanos' && result.winner !== 'player') ||
    result.reason === undefined ||
    !REASONS.includes(result.reason) ||
    typeof result.round !== 'number'
  ) {
    return null
  }
  try {
    return {
      id: v.id,
      finishedAt: v.finishedAt,
      settings: parseSettings(v.settings),
      result: { winner: result.winner, reason: result.reason, round: result.round },
      thanosPoints: v.thanosPoints,
      playerPoints: v.playerPoints,
    }
  } catch {
    return null
  }
}

import {
  DEFAULT_SETTINGS,
  replay,
  validateSettings,
  type GameEvent,
  type GameState,
  type Settings,
} from '../../engine/index.ts'

/** Bump when the saved shape changes incompatibly; older saves are then discarded. */
export const SAVE_VERSION = 1
export const GAME_KEY = `thanos-automa:v${SAVE_VERSION}:game`
export const SETTINGS_KEY = `thanos-automa:v${SAVE_VERSION}:settings`

/** Everything needed to rebuild a game: state = replay(seed, settings, events). */
export interface SavedGame {
  readonly version: typeof SAVE_VERSION
  readonly seed: number
  readonly settings: Settings
  readonly events: readonly GameEvent[]
}

export interface LoadedGame {
  readonly saved: SavedGame
  readonly state: GameState
}

/** localStorage, or null where it is unavailable (private mode, blocked storage, SSR). */
export function browserStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

export function saveGame(saved: SavedGame | null, storage = browserStorage()): void {
  try {
    if (saved === null) storage?.removeItem(GAME_KEY)
    else storage?.setItem(GAME_KEY, JSON.stringify(saved))
  } catch {
    // Storage full or blocked: the game still works, it just won't survive a reload.
  }
}

/**
 * Loads and validates the saved game by replaying it. A save that can't be read or replayed is
 * removed and reported as corrupt, so the app can start fresh and say so.
 */
export function loadGame(storage = browserStorage()): {
  game: LoadedGame | null
  corrupt: boolean
} {
  let raw: string | null = null
  try {
    raw = storage?.getItem(GAME_KEY) ?? null
  } catch {
    return { game: null, corrupt: false }
  }
  if (raw === null) return { game: null, corrupt: false }
  try {
    const saved = parseSavedGame(JSON.parse(raw))
    return {
      game: { saved, state: replay(saved.seed, saved.settings, saved.events) },
      corrupt: false,
    }
  } catch {
    saveGame(null, storage)
    return { game: null, corrupt: true }
  }
}

export function saveSettings(settings: Settings, storage = browserStorage()): void {
  try {
    storage?.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch {
    // Not critical: defaults are used next time.
  }
}

/** The settings used for the last new game, or the defaults. */
export function loadSettings(storage = browserStorage()): Settings {
  try {
    const raw = storage?.getItem(SETTINGS_KEY)
    if (!raw) return DEFAULT_SETTINGS
    return parseSettings(JSON.parse(raw))
  } catch {
    return DEFAULT_SETTINGS
  }
}

function parseSavedGame(value: unknown): SavedGame {
  if (!isRecord(value) || value.version !== SAVE_VERSION) throw new Error('Unknown save version')
  if (typeof value.seed !== 'number' || !Number.isInteger(value.seed)) throw new Error('Bad seed')
  if (!Array.isArray(value.events)) throw new Error('Bad events')
  return {
    version: SAVE_VERSION,
    seed: value.seed,
    settings: parseSettings(value.settings),
    // Event shapes are checked by replaying them through the engine.
    events: value.events as GameEvent[],
  }
}

function parseSettings(value: unknown): Settings {
  if (!isRecord(value)) throw new Error('Bad settings')
  // Unknown or missing keys fall back to defaults, so new settings don't break old saves.
  const merged = { ...DEFAULT_SETTINGS, ...value } as Settings
  const settings: Settings = {
    phaseLengths: merged.phaseLengths,
    unprintedDiscard: merged.unprintedDiscard,
    emptySlot: merged.emptySlot,
    ties: merged.ties,
    countedCards: merged.countedCards,
    stackCap: merged.stackCap,
    logPlayerCards: merged.logPlayerCards,
  }
  if (
    !Array.isArray(settings.phaseLengths) ||
    settings.phaseLengths.length !== 3 ||
    !['firstInRow', 'nothing'].includes(settings.emptySlot) ||
    !['tiebreakersThenThanos', 'thanosWins'].includes(settings.ties) ||
    !['all', 'scoringOnly'].includes(settings.countedCards)
  ) {
    throw new Error('Bad settings')
  }
  validateSettings(settings)
  return settings
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

import { useCallback, useState } from 'react'
import {
  applyEvent,
  newGame,
  newSeed,
  replay,
  type GameEvent,
  type GameState,
  type Settings,
} from '../../engine/index.ts'
import {
  clearHistory,
  forgetGame,
  loadHistory,
  recordGame,
  summarizeGame,
  type GameSummary,
} from './history.ts'
import { loadGame, saveGame, saveSettings, type SavedGame } from './persistence.ts'

interface Current {
  readonly saved: SavedGame
  readonly state: GameState
}

export interface GameApi {
  /** The game in progress (or finished), or null when none is saved. */
  readonly state: GameState | null
  readonly events: readonly GameEvent[]
  /** The previous save couldn't be read and was discarded. */
  readonly recoveredFromCorruptSave: boolean
  /** Applies an event. Throws GameRuleError (and changes nothing) if the rules forbid it. */
  dispatch(event: GameEvent): void
  readonly canUndo: boolean
  undo(): void
  start(settings: Settings, seed?: number): void
  abandon(): void
  /** Finished games, newest first (#12). */
  readonly history: readonly GameSummary[]
  clearHistory(): void
}

/**
 * Game state for the UI: event-sourced, saved after every change, undoable. Each finished game goes
 * into the history; an undo that steps back from the result takes it out again (#12).
 */
export function useGame(): GameApi {
  const [{ current, corrupt }, setStore] = useState(() => {
    const { game, corrupt } = loadGame()
    return { current: game as Current | null, corrupt }
  })
  const [history, setHistory] = useState<readonly GameSummary[]>(loadHistory)

  const commit = useCallback((next: Current | null) => {
    saveGame(next?.saved ?? null)
    setStore((store) => ({ ...store, current: next }))
  }, [])

  const dispatch = useCallback(
    (event: GameEvent) => {
      if (!current) throw new Error('No game in progress')
      const state = applyEvent(current.state, event)
      commit({ saved: { ...current.saved, events: [...current.saved.events, event] }, state })
      if (state.step === 'over' && current.state.step !== 'over') {
        const summary = summarizeGame(current.saved.seed, state, new Date())
        if (summary) setHistory(recordGame(summary))
      }
    },
    [current, commit],
  )

  const undo = useCallback(() => {
    if (!current || current.saved.events.length === 0) return
    const { seed, settings, events } = current.saved
    const kept = events.slice(0, -1)
    commit({ saved: { ...current.saved, events: kept }, state: replay(seed, settings, kept) })
    if (current.state.step === 'over') setHistory(forgetGame(seed))
  }, [current, commit])

  const start = useCallback(
    (settings: Settings, seed: number = newSeed()) => {
      saveSettings(settings)
      commit({
        saved: { version: 1, seed, settings, events: [] },
        state: newGame(seed, settings),
      })
    },
    [commit],
  )

  const abandon = useCallback(() => commit(null), [commit])

  const clear = useCallback(() => {
    clearHistory()
    setHistory([])
  }, [])

  return {
    state: current?.state ?? null,
    events: current?.saved.events ?? [],
    recoveredFromCorruptSave: corrupt,
    dispatch,
    canUndo: (current?.saved.events.length ?? 0) > 0,
    undo,
    start,
    abandon,
    history,
    clearHistory: clear,
  }
}

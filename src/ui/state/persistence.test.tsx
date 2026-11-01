import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  applyEvent,
  currentRoundCard,
  DEFAULT_SETTINGS,
  missingColours,
  newGame,
  replay,
  type GameEvent,
  type GameState,
} from '../../engine/index.ts'
import {
  GAME_KEY,
  loadGame,
  loadSettings,
  saveGame,
  saveSettings,
  SETTINGS_KEY,
  type SavedGame,
} from './persistence.ts'
import { useGame } from './useGame.ts'

/** Plays a full game with a trivial strategy and returns its events. */
function wholeGameEvents(seed: number): GameEvent[] {
  let state: GameState = newGame(seed, DEFAULT_SETTINGS)
  const events: GameEvent[] = []
  const apply = (e: GameEvent) => {
    events.push(e)
    state = applyEvent(state, e)
  }
  while (state.step !== 'over') {
    apply({ type: 'reveal' })
    const { action } = currentRoundCard(state)
    if (action.kind === 'take') apply({ type: 'thanosTake', skipped: [] })
    else {
      const colour = missingColours(state)[0] ?? 'soul'
      apply({
        type: 'thanosGain',
        card: { colour, points: 2, tags: 1 },
        substituted: false,
        slotEmpty: false,
      })
    }
    apply({ type: 'playerRecruit', card: { level: 1, colour: 'mind', points: 0, tags: 0 } })
    apply({ type: 'endRound' })
  }
  return events
}

beforeEach(() => localStorage.clear())

describe('undo (#5)', () => {
  it('restores exactly the previous state after any event', () => {
    const events = wholeGameEvents(99)
    let state = newGame(99, DEFAULT_SETTINGS)
    events.forEach((event, i) => {
      const before = state
      state = applyEvent(state, event)
      // Undo = drop the last event and replay.
      expect(replay(99, DEFAULT_SETTINGS, events.slice(0, i))).toEqual(before)
    })
  })
})

describe('persistence (#5)', () => {
  const saved: SavedGame = {
    version: 1,
    seed: 7,
    settings: DEFAULT_SETTINGS,
    events: [{ type: 'reveal' }],
  }

  it('round-trips a saved game and rebuilds its state', () => {
    saveGame(saved)
    const { game, corrupt } = loadGame()
    expect(corrupt).toBe(false)
    expect(game?.saved).toEqual(saved)
    expect(game?.state.step).toBe('thanos')
  })

  it('discards unreadable or unreplayable saves and reports them', () => {
    localStorage.setItem(GAME_KEY, '{not json')
    expect(loadGame()).toEqual({ game: null, corrupt: true })
    expect(localStorage.getItem(GAME_KEY)).toBeNull()

    saveGame({ ...saved, events: [{ type: 'endRound' }] })
    expect(loadGame().corrupt).toBe(true)

    localStorage.setItem(GAME_KEY, JSON.stringify({ ...saved, version: 99 }))
    expect(loadGame().corrupt).toBe(true)
  })

  it('works without storage', () => {
    const broken = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
      removeItem: () => {
        throw new Error('blocked')
      },
    } as unknown as Storage
    expect(() => saveGame(saved, broken)).not.toThrow()
    expect(loadGame(broken)).toEqual({ game: null, corrupt: false })
    expect(loadGame(null)).toEqual({ game: null, corrupt: false })
    expect(loadSettings(broken)).toEqual(DEFAULT_SETTINGS)
  })

  it('remembers settings and falls back to defaults for bad ones', () => {
    const settings = { ...DEFAULT_SETTINGS, phaseLengths: [8, 8, 8] as const, stackCap: 12 }
    saveSettings(settings)
    expect(loadSettings()).toEqual(settings)
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ phaseLengths: [0, 0, 0] }))
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
  })

  it('loads settings saved before “log my cards” existed with logging on (#15)', () => {
    const { logPlayerCards, ...older } = DEFAULT_SETTINGS
    expect(logPlayerCards).toBe(true)
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...older, stackCap: 12 }))
    expect(loadSettings()).toEqual({ ...DEFAULT_SETTINGS, stackCap: 12 })
    saveSettings({ ...DEFAULT_SETTINGS, logPlayerCards: false })
    expect(loadSettings().logPlayerCards).toBe(false)
  })
})

describe('useGame (#5)', () => {
  it('starts, applies events, undoes, and resumes after a reload', () => {
    const first = renderHook(() => useGame())
    expect(first.result.current.state).toBeNull()

    act(() => first.result.current.start(DEFAULT_SETTINGS, 42))
    act(() => first.result.current.dispatch({ type: 'reveal' }))
    expect(first.result.current.state?.step).toBe('thanos')

    act(() => first.result.current.undo())
    expect(first.result.current.state?.step).toBe('reveal')
    act(() => first.result.current.dispatch({ type: 'reveal' }))

    const reloaded = renderHook(() => useGame())
    expect(reloaded.result.current.state?.step).toBe('thanos')
    expect(reloaded.result.current.events).toEqual([{ type: 'reveal' }])
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
  })

  it('records each finished game in the history, and an undo takes it out (#12)', () => {
    const { result } = renderHook(() => useGame())
    act(() => result.current.start(DEFAULT_SETTINGS, 9))
    for (const event of wholeGameEvents(9)) act(() => result.current.dispatch(event))
    expect(result.current.state?.step).toBe('over')
    expect(result.current.history.map((g) => g.id)).toEqual([9])
    expect(renderHook(() => useGame()).result.current.history).toHaveLength(1)

    act(() => result.current.undo())
    expect(result.current.history).toEqual([])
    act(() => result.current.dispatch({ type: 'endRound' }))
    expect(result.current.history).toHaveLength(1)

    act(() => result.current.clearHistory())
    expect(result.current.history).toEqual([])
    expect(renderHook(() => useGame()).result.current.history).toEqual([])
  })

  it('rejects events the rules forbid without changing anything', () => {
    const { result } = renderHook(() => useGame())
    act(() => result.current.start(DEFAULT_SETTINGS, 1))
    expect(() => result.current.dispatch({ type: 'endRound' })).toThrow()
    expect(result.current.events).toEqual([])
  })

  it('abandons the game and clears the save', () => {
    const { result } = renderHook(() => useGame())
    act(() => result.current.start(DEFAULT_SETTINGS, 1))
    act(() => result.current.abandon())
    expect(result.current.state).toBeNull()
    expect(localStorage.getItem(GAME_KEY)).toBeNull()
  })
})

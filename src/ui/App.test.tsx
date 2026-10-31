import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  applyEvent,
  cardForRound,
  currentRoundCard,
  DEFAULT_SETTINGS,
  newGame,
  STONES,
  type AutomaAction,
  type GameEvent,
  type GameState,
  type Settings,
} from '../engine/index.ts'
import { App } from './App.tsx'
import { loadSettings, saveGame } from './state/persistence.ts'

const actionAt = (seed: number, round: number): AutomaAction =>
  cardForRound(newGame(seed, DEFAULT_SETTINGS).setup, round).action

function seedWhere(pred: (seed: number) => boolean): number {
  for (let seed = 0; seed < 10_000; seed++) if (pred(seed)) return seed
  throw new Error('no seed')
}

/** Saves a game so <App /> resumes it, like a reload at the table. */
function resume(seed: number, events: GameEvent[], settings: Settings = DEFAULT_SETTINGS) {
  saveGame({ version: 1, seed, settings, events })
  render(<App />)
}

/** Events that play Thanos's action for the current round with neutral choices. */
function thanosNeutral(state: GameState): GameEvent[] {
  const revealed = applyEvent(state, { type: 'reveal' })
  const { action } = currentRoundCard(revealed)
  return [
    { type: 'reveal' },
    action.kind === 'take'
      ? { type: 'thanosTake', skipped: [] }
      : {
          type: 'thanosGain',
          card: { colour: 'mind', points: 0, tags: 0 },
          substituted: false,
          slotEmpty: false,
        },
  ]
}

const run = (seed: number, events: GameEvent[], settings = DEFAULT_SETTINGS) =>
  events.reduce(applyEvent, newGame(seed, settings))

beforeEach(() => localStorage.clear())

describe('home and setup (#8)', () => {
  it('starts a game with the chosen settings and remembers them', async () => {
    const user = userEvent.setup()
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Thanos Automa' })).toBeInTheDocument()
    expect(screen.getByText(/Dukefanblue2005/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'New game' }))
    expect(screen.getByText(/Return 3 tokens of each colour/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^24/ }))
    await user.click(screen.getByRole('button', { name: /12 tokens/ }))
    await user.click(screen.getByRole('button', { name: 'Start game' }))

    expect(screen.getByText('/ 24')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Flip Thanos’s card/ })).toBeInTheDocument()
    expect(loadSettings()).toMatchObject({ phaseLengths: [8, 8, 8], stackCap: 12 })
  })
})

describe('Thanos’s turn (#6)', () => {
  it('takes tokens in order, skipping an empty pile', async () => {
    const seed = seedWhere((s) => actionAt(s, 1).kind === 'take')
    const action = actionAt(seed, 1) as Extract<AutomaAction, { kind: 'take' }>
    const [first, ...rest] = action.tokens
    const user = userEvent.setup()
    resume(seed, [])

    await user.click(screen.getByRole('button', { name: /Flip Thanos’s card/ }))
    const tokens = screen.getByRole('group', { name: 'Tokens to take' })
    await user.click(within(tokens).getAllByRole('button')[0]!)
    expect(within(tokens).getAllByRole('button')[0]).toHaveAttribute('aria-pressed', 'false')
    await user.click(screen.getByRole('button', { name: /^Done/ }))

    expect(screen.getByRole('heading', { name: 'Your turn' })).toBeInTheDocument()
    expect(screen.getByText(`Thanos’s tokens (${rest.length})`)).toBeInTheDocument()
    expect(first).toBeDefined()
  })

  it('recruits with colour substitution and returns the oldest tokens', async () => {
    // Round 1 takes tokens, round 2 gains a card that returns 3.
    const seed = seedWhere((s) => {
      const a1 = actionAt(s, 1)
      const a2 = actionAt(s, 2)
      return a1.kind === 'take' && a1.tokens.length === 3 && a2.kind === 'gain' && a2.discard === 3
    })
    const start = newGame(seed, DEFAULT_SETTINGS)
    const events: GameEvent[] = [...thanosNeutral(start)]
    // You recruit nothing; Thanos already owns a Mind card (via a correction) to force substitution.
    events.push({
      type: 'addCard',
      side: 'thanos',
      card: { level: 1, colour: 'mind', points: 0, tags: 0 },
    })
    events.push({ type: 'endRound' })
    const user = userEvent.setup()
    resume(seed, events)

    await user.click(screen.getByRole('button', { name: /Flip Thanos’s card/ }))
    expect(screen.getByText(/Return to the supply, oldest first/)).toBeInTheDocument()

    const picker = screen.getByRole('group', { name: /^Colour of the card in/ })
    await user.click(within(picker).getByRole('button', { name: /Mind/ }))
    expect(screen.getByText(/Thanos already has/)).toBeInTheDocument()
    const instead = screen.getByRole('group', { name: 'Colour of the card Thanos takes instead' })
    expect(within(instead).getByRole('button', { name: /Mind/ })).toBeDisabled()
    await user.click(within(instead).getByRole('button', { name: /Soul/ }))

    await user.click(
      within(screen.getByRole('group', { name: 'Infinity points on the card' })).getByRole(
        'button',
        { name: '2' },
      ),
    )
    await user.click(
      within(screen.getByRole('group', { name: 'Avengers tags on the card' })).getByRole('button', {
        name: '1',
      }),
    )
    await user.click(screen.getByRole('button', { name: 'Thanos takes it' }))

    const todo = screen.getByRole('list', { name: 'Do this on the table' })
    expect(
      within(todo).getByText(/Thanos took L1 Soul \(2 pts, 1 Avengers tag\)/),
    ).toBeInTheDocument()
    expect(within(todo).getByText(/^Return .+ to the supply\.$/)).toBeInTheDocument()
    expect(screen.getByText('Thanos’s tokens (0)')).toBeInTheDocument()
  })
})

describe('your turn and the end of the game (#7)', () => {
  it('logs your recruit and ends the round', async () => {
    const seed = seedWhere((s) => actionAt(s, 1).kind === 'take')
    const user = userEvent.setup()
    resume(seed, thanosNeutral(newGame(seed, DEFAULT_SETTINGS)))

    await user.click(screen.getByRole('button', { name: /Log a recruited card/ }))
    await user.click(
      within(screen.getByRole('group', { name: 'Level' })).getByRole('button', { name: '3' }),
    )
    await user.click(
      within(screen.getByRole('group', { name: 'Bonus colour' })).getByRole('button', {
        name: /Space/,
      }),
    )
    await user.click(
      within(screen.getByRole('group', { name: 'Infinity points' })).getByRole('button', {
        name: '4',
      }),
    )
    await user.click(screen.getByRole('button', { name: 'Add card' }))
    expect(screen.getByText('Logged: L3 Space (4 pts)')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'End round 1' }))
    expect(screen.getByRole('button', { name: /Flip Thanos’s card/ })).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('shows your win when you complete the Gauntlet', async () => {
    const seed = seedWhere((s) => actionAt(s, 1).kind === 'take')
    const events: GameEvent[] = [
      ...thanosNeutral(newGame(seed, DEFAULT_SETTINGS)),
      ...STONES.map((colour, i): GameEvent => ({
        type: 'playerRecruit',
        card: { level: i === 0 ? 3 : 1, colour, points: i === 0 ? 4 : 3, tags: 0 },
      })),
    ]
    const user = userEvent.setup()
    resume(seed, events)
    await user.click(screen.getByRole('button', { name: 'End round 1' }))
    expect(screen.getByRole('heading', { name: 'You win!' })).toBeInTheDocument()
    expect(screen.getByText('You completed the Infinity Gauntlet in round 1.')).toBeInTheDocument()
  })

  it('shows your loss when the last round ends without your Gauntlet', async () => {
    const seed = 3
    let events: GameEvent[] = []
    let state = newGame(seed, DEFAULT_SETTINGS)
    while (true) {
      const thanos = thanosNeutral(state)
      events = [...events, ...thanos]
      state = run(seed, events)
      if (state.round === 30) break
      events.push({ type: 'endRound' })
      state = run(seed, events)
    }
    const user = userEvent.setup()
    resume(seed, events)
    await user.click(screen.getByRole('button', { name: 'End round 30' }))
    expect(screen.getByRole('heading', { name: 'Thanos wins' })).toBeInTheDocument()
    expect(screen.getByText('Round 30 ended without your Infinity Gauntlet.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Undo the last step' }))
    expect(screen.getByRole('button', { name: 'End round 30' })).toBeInTheDocument()
  })
})

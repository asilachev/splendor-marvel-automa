import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import {
  applyEvent,
  DEFAULT_SETTINGS,
  newGame,
  STONES,
  type GameEvent,
  type GameState,
  type RecruitedCard,
} from '../../engine/index.ts'
import { TableStep } from './Steps.tsx'

const unlogged = { ...DEFAULT_SETTINGS, logPlayerCards: false }

/** Your turn in round 1 of a game where you don't log your cards. */
const yourTurn = (overrides: Partial<GameState> = {}): GameState => ({
  ...newGame(1, unlogged),
  step: 'player',
  ...overrides,
})

/** One card per colour, the first level 3 (Time): 16 points in 5 cards. */
const thanosDone: RecruitedCard[] = STONES.map((colour, i) => ({
  level: i === 0 ? 3 : 1,
  colour,
  points: [5, 5, 3, 2, 1][i] ?? 0,
  tags: 0,
}))

describe('your turn without your cards logged (#15)', () => {
  it('offers the Gauntlet box and the Avengers tile instead of logging', () => {
    render(<TableStep state={yourTurn()} dispatch={() => {}} dock={null} onLogCard={() => {}} />)
    expect(screen.queryByRole('button', { name: /I RECRUITED/ })).toBeNull()
    expect(screen.getByRole('checkbox', { name: /I COMPLETED THE GAUNTLET/ })).toHaveAttribute(
      'aria-checked',
      'false',
    )
    expect(screen.getByRole('group', { name: 'Avengers Assemble tile' })).toBeInTheDocument()
  })

  it('ends the round without a report unless you tick the box', async () => {
    const user = userEvent.setup()
    const dispatch = vi.fn()
    render(<TableStep state={yourTurn()} dispatch={dispatch} dock={null} onLogCard={() => {}} />)
    await user.click(screen.getByRole('button', { name: 'END ROUND 1' }))
    expect(dispatch).toHaveBeenLastCalledWith({ type: 'endRound' })
    await user.click(screen.getByRole('checkbox', { name: /I COMPLETED THE GAUNTLET/ }))
    await user.click(screen.getByRole('button', { name: 'END ROUND 1' }))
    expect(dispatch).toHaveBeenLastCalledWith({ type: 'endRound', report: { gauntlet: true } })
  })

  it('asks for your totals when Thanos completed the Gauntlet too', async () => {
    const user = userEvent.setup()
    const dispatch = vi.fn()
    render(
      <TableStep
        state={yourTurn({ thanosCards: thanosDone })}
        dispatch={dispatch}
        dock={null}
        onLogCard={() => {}}
      />,
    )
    await user.click(screen.getByRole('checkbox', { name: /I COMPLETED THE GAUNTLET/ }))
    expect(
      screen.getByText('Thanos completed the Gauntlet too, so your totals decide:'),
    ).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Increase Your points' }))
    await user.click(screen.getByRole('button', { name: 'Increase Your cards' }))
    await user.click(screen.getByRole('button', { name: 'END ROUND 1' }))
    expect(dispatch).toHaveBeenLastCalledWith({
      type: 'endRound',
      report: { gauntlet: true, points: 17, cards: 6 },
    })
  })

  it('moves the Avengers tile by hand', async () => {
    const user = userEvent.setup()
    const dispatch = vi.fn()
    render(<TableStep state={yourTurn()} dispatch={dispatch} dock={null} onLogCard={() => {}} />)
    await user.click(screen.getByRole('button', { name: 'YOU' }))
    expect(dispatch).toHaveBeenLastCalledWith({ type: 'setAvengers', holder: 'player' })
  })
})

describe('your turn in the hard variant (#11)', () => {
  const hard = {
    ...DEFAULT_SETTINGS,
    variant: 'hard' as const,
    locations: [{ mind: 1 }, { soul: 1 }],
  }

  it('has no Location tile for you, and tells you when Thanos claims one', () => {
    const state: GameState = {
      ...newGame(1, hard),
      step: 'player',
      thanosLocations: [1],
      log: [{ kind: 'thanosLocation', round: 1, index: 1 }],
    }
    render(<TableStep state={state} dispatch={() => {}} dock={null} onLogCard={() => {}} />)
    expect(screen.getByRole('button', { name: /I RECRUITED/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /I TOOK A LOCATION/ })).toBeNull()
    expect(
      screen.getByRole('checkbox', { name: 'Thanos claims Location 2: give him the tile (+3)' }),
    ).toBeInTheDocument()
  })

  it('marks the wide card tile done once you log a card', () => {
    const state = applyEvent(
      { ...newGame(1, hard), step: 'player' },
      { type: 'playerRecruit', card: { level: 1, colour: 'soul', points: 0, tags: 1 } },
    )
    render(<TableStep state={state} dispatch={() => {}} dock={null} onLogCard={() => {}} />)
    const tile = screen.getByRole('button', { name: /CARD LOGGED/ })
    expect(tile).toBeDisabled()
    expect(tile).toHaveAttribute('data-wide', 'true')
  })
})

describe('your move when you log your cards (#99)', () => {
  const card: RecruitedCard = { level: 2, colour: 'mind', points: 2, tags: 0 }
  const yourMove = (): GameState => ({ ...newGame(1, DEFAULT_SETTINGS), step: 'player' })

  it('marks the card tile done once you log a card, like the Location', async () => {
    const user = userEvent.setup()
    const onLogCard = vi.fn()
    const table = (state: GameState) => (
      <TableStep state={state} dispatch={() => {}} dock={null} onLogCard={onLogCard} />
    )
    const { rerender } = render(table(yourMove()))
    await user.click(screen.getByRole('button', { name: /I RECRUITED/ }))
    expect(onLogCard).toHaveBeenCalledOnce()

    const events: GameEvent[] = [{ type: 'playerRecruit', card }, { type: 'playerLocation' }]
    rerender(table(events.reduce(applyEvent, yourMove())))
    for (const name of [/CARD LOGGED/, /LOCATION TAKEN/]) {
      const tile = screen.getByRole('button', { name })
      expect(tile).toBeDisabled()
      expect(tile).toHaveAttribute('data-done', 'true')
    }
    expect(screen.queryByRole('button', { name: /I RECRUITED/ })).toBeNull()
    expect(screen.getByText('Logged: L2 Mind (2 pts) · Location +3')).toBeInTheDocument()
  })

  it('has the card tile ready again in the next round', () => {
    const state: GameState = {
      ...yourMove(),
      round: 2,
      log: [{ kind: 'playerRecruit', round: 1, card, gotTime: false }],
    }
    render(<TableStep state={state} dispatch={() => {}} dock={null} onLogCard={() => {}} />)
    const tile = screen.getByRole('button', { name: /I RECRUITED/ })
    expect(tile).toBeEnabled()
    expect(tile).toHaveAttribute('data-done', 'false')
  })
})

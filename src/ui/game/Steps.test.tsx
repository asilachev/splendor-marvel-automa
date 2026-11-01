import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_SETTINGS,
  newGame,
  STONES,
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
})

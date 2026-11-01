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

describe('your move and the end of the round (#101)', () => {
  /** Your turn in round 1 after Thanos took Mind and Soul: one line to tick at the table. */
  const afterTake = (settings = DEFAULT_SETTINGS): GameState => ({
    ...newGame(1, settings),
    step: 'player',
    log: [{ kind: 'take', round: 1, taken: ['mind', 'soul'], skipped: [], capped: [] }],
  })
  const table = (state: GameState, dispatch = () => {}) => (
    <TableStep state={state} dispatch={dispatch} dock={null} onLogCard={() => {}} />
  )
  const end = () => screen.getByRole('button', { name: 'END ROUND 1' })

  it('ends the round once the checklist is ticked and your move is picked', async () => {
    const user = userEvent.setup()
    const dispatch = vi.fn()
    render(table(afterTake(), dispatch))
    expect(end()).toBeDisabled()
    expect(
      screen.getByText('Pick your move and tick off the checklist to end the round.'),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('checkbox', { name: /^Put .* on his piles/ }))
    expect(end()).toBeDisabled()
    expect(screen.getByText('Pick your move to end the round.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^I TOOK TOKENS/ }))
    expect(end()).toBeEnabled()
    await user.click(end())
    expect(dispatch).toHaveBeenLastCalledWith({ type: 'endRound' })
  })

  it('picks one move at a time, and a second tap takes it back', async () => {
    const user = userEvent.setup()
    render(table(afterTake()))
    await user.click(screen.getByRole('button', { name: /^I TOOK TOKENS/ }))
    expect(screen.getByRole('button', { name: /^TOKENS TAKEN/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await user.click(screen.getByRole('button', { name: /^I RESERVED/ }))
    expect(screen.getByRole('button', { name: /^CARD RESERVED/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: /^I TOOK TOKENS/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    await user.click(screen.getByRole('button', { name: /^CARD RESERVED/ }))
    expect(screen.getByRole('button', { name: /^I RESERVED/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect(
      screen.getByText('Pick your move and tick off the checklist to end the round.'),
    ).toBeInTheDocument()
  })

  it('asks you to refill the market after you reserve', async () => {
    const user = userEvent.setup()
    render(table(afterTake()))
    expect(screen.queryByRole('checkbox', { name: /^Refill the market/ })).toBeNull()
    await user.click(screen.getByRole('button', { name: /^I RESERVED/ }))
    await user.click(screen.getByRole('checkbox', { name: /^Put .* on his piles/ }))
    expect(end()).toBeDisabled()
    expect(screen.getByText('Tick off the checklist to end the round.')).toBeInTheDocument()
    await user.click(
      screen.getByRole('checkbox', {
        name: 'Refill the market from the same level’s deck (not if you took a deck’s top card)',
      }),
    )
    expect(end()).toBeEnabled()
  })

  it('asks for the refill again when a logged card replaces a reserve', async () => {
    const user = userEvent.setup()
    const { rerender } = render(table(afterTake()))
    await user.click(screen.getByRole('button', { name: /^I RESERVED/ }))
    await user.click(screen.getByRole('checkbox', { name: /^Refill the market/ }))
    const card: RecruitedCard = { level: 3, colour: 'space', points: 4, tags: 0 }
    rerender(table(applyEvent(afterTake(), { type: 'playerRecruit', card })))
    expect(
      screen.getByRole('checkbox', { name: /^Refill the market from the level 3 deck/ }),
    ).toHaveAttribute('aria-checked', 'false')
  })

  it('takes a logged card as your move and asks to refill its level', () => {
    const card: RecruitedCard = { level: 2, colour: 'mind', points: 2, tags: 0 }
    render(table(applyEvent(afterTake(), { type: 'playerRecruit', card })))
    expect(screen.getByRole('button', { name: /^I TOOK TOKENS/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /^I RESERVED/ })).toBeDisabled()
    expect(
      screen.getByRole('checkbox', {
        name: 'Refill the market from the level 2 deck (not for a card from your reserve)',
      }),
    ).toHaveAttribute('aria-checked', 'false')
    expect(screen.getByText('Tick off the checklist to end the round.')).toBeInTheDocument()
  })

  it('needs only the checklist when you don’t log your cards (#15)', async () => {
    const user = userEvent.setup()
    render(table(afterTake(unlogged)))
    expect(screen.queryByRole('button', { name: /^I TOOK TOKENS/ })).toBeNull()
    expect(end()).toBeDisabled()
    expect(screen.getByText('Tick off the checklist to end the round.')).toBeInTheDocument()
    await user.click(screen.getByRole('checkbox', { name: /^Put .* on his piles/ }))
    expect(end()).toBeEnabled()
  })
})

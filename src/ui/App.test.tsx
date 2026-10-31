import { render, screen, within } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
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
import { loadGame, loadSettings, saveGame } from './state/persistence.ts'
import { loadPrefs } from './state/prefs.ts'

const actionAt = (seed: number, round: number): AutomaAction =>
  cardForRound(newGame(seed, DEFAULT_SETTINGS).setup, round).action

function seedWhere(pred: (seed: number) => boolean): number {
  for (let seed = 0; seed < 10_000; seed++) if (pred(seed)) return seed
  throw new Error('no seed')
}

/** Saves a game, then relaunches and taps CONTINUE on Home (design: 7.3 → 1.2). */
async function resume(
  user: UserEvent,
  seed: number,
  events: GameEvent[],
  settings: Settings = DEFAULT_SETTINGS,
) {
  saveGame({ version: 1, seed, settings, events })
  render(<App />)
  await user.click(screen.getByRole('button', { name: /^CONTINUE · ROUND/ }))
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

const run = (seed: number, events: GameEvent[]) =>
  events.reduce(applyEvent, newGame(seed, DEFAULT_SETTINGS))

/** Events up to the player step of `round`, Thanos playing neutrally, you logging nothing. */
function playTo(seed: number, round: number): GameEvent[] {
  let events: GameEvent[] = []
  for (;;) {
    events = [...events, ...thanosNeutral(run(seed, events))]
    if (run(seed, events).round === round) return events
    events.push({ type: 'endRound' })
  }
}

const takeSeed = seedWhere((s) => actionAt(s, 1).kind === 'take')

beforeEach(() => localStorage.clear())

describe('home, setup and rulings (#44)', () => {
  it('starts a first game with the chosen settings and shows the credits', async () => {
    const user = userEvent.setup()
    render(<App />)
    expect(screen.getByRole('heading', { name: 'THANOS AUTOMA' })).toBeInTheDocument()
    const credits = screen.getByRole('contentinfo', { name: 'Credits and copyright' })
    expect(within(credits).getByRole('link', { name: 'Dukefanblue2005' })).toBeVisible()
    expect(credits).toHaveTextContent('™ & © MARVEL')

    await user.click(screen.getByRole('button', { name: 'START YOUR FIRST GAME' }))
    expect(screen.getByRole('heading', { name: 'NEW GAME' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^24/ }))
    await user.click(screen.getByRole('button', { name: /12 TOKENS/ }))
    await user.click(screen.getByRole('button', { name: /Rulings for gaps/ }))
    await user.click(screen.getByRole('button', { name: 'Rule: Which cards count' }))
    expect(screen.getByRole('note')).toHaveTextContent(/Shamus clarified on BGG/)
    await user.click(screen.getByRole('button', { name: 'SAVE RULINGS' }))
    await user.click(screen.getByRole('button', { name: 'START GAME' }))

    expect(screen.getByRole('heading', { name: 'THANOS MAKES HIS MOVE' })).toBeInTheDocument()
    expect(screen.getByText('ROUND 1')).toBeInTheDocument()
    expect(screen.getByText('23 LEFT')).toBeInTheDocument()
    expect(loadSettings()).toMatchObject({ phaseLengths: [8, 8, 8], stackCap: 12 })
  })

  it('asks before a new game replaces the one in progress', async () => {
    const user = userEvent.setup()
    await resume(user, takeSeed, [{ type: 'reveal' }])
    await user.click(screen.getByRole('button', { name: 'Menu' }))
    await user.click(screen.getByRole('button', { name: /BACK TO HOME/ }))
    await user.click(screen.getByRole('button', { name: 'NEW GAME' }))
    const dialog = screen.getByRole('alertdialog', { name: 'ABANDON THIS GAME?' })
    await user.click(within(dialog).getByRole('button', { name: 'KEEP PLAYING' }))
    expect(screen.queryByRole('alertdialog')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'NEW GAME' }))
    await user.click(screen.getByRole('button', { name: 'START OVER' }))
    expect(screen.getByRole('heading', { name: 'NEW GAME' })).toBeInTheDocument()
  })
})

describe('Thanos’s turn (#41)', () => {
  it('takes tokens, skipping an empty pile, then shows the table checklist', async () => {
    const action = actionAt(takeSeed, 1) as Extract<AutomaAction, { kind: 'take' }>
    const user = userEvent.setup()
    await resume(user, takeSeed, [])

    await user.click(screen.getByRole('button', { name: 'Flip Thanos’s card' }))
    expect(
      screen.getByRole('heading', { name: /TAP A TOKEN IF ITS PILE IS EMPTY/ }),
    ).toBeInTheDocument()
    const tokens = screen.getByRole('group', { name: 'Tokens to take' })
    await user.click(within(tokens).getAllByRole('button')[0]!)
    await user.click(
      screen.getByRole('button', { name: `DONE · ADD ${action.tokens.length - 1} TO HIS PILES` }),
    )

    expect(screen.getByText('AT THE TABLE')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /pile was empty — skipped/ })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: `Hoard · ${action.tokens.length - 1}` }),
    ).toBeInTheDocument()
  })

  it('recruits with colour substitution and returns the oldest tokens', async () => {
    const seed = seedWhere((s) => {
      const a1 = actionAt(s, 1)
      const a2 = actionAt(s, 2)
      return a1.kind === 'take' && a1.tokens.length === 3 && a2.kind === 'gain' && a2.discard === 3
    })
    const events: GameEvent[] = [
      ...thanosNeutral(newGame(seed, DEFAULT_SETTINGS)),
      { type: 'addCard', side: 'thanos', card: { level: 1, colour: 'mind', points: 0, tags: 0 } },
      { type: 'endRound' },
    ]
    const user = userEvent.setup()
    await resume(user, seed, events)

    await user.click(screen.getByRole('button', { name: 'Flip Thanos’s card' }))
    expect(screen.getByText('HE RETURNS')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'HE TAKES IT' })).toBeDisabled()
    await user.click(
      within(screen.getByRole('group', { name: /^Colour of the card in/ })).getByRole('button', {
        name: /Mind/,
      }),
    )
    expect(screen.getByRole('heading', { name: 'HE ALREADY HAS MIND!' })).toBeInTheDocument()
    const instead = screen.getByRole('group', { name: 'Colour of the card Thanos takes instead' })
    expect(within(instead).getByRole('button', { name: /Mind/ })).toBeDisabled()
    await user.click(within(instead).getByRole('button', { name: /Soul/ }))
    await user.click(
      within(screen.getByRole('group', { name: 'Points' })).getByRole('button', { name: '2' }),
    )
    await user.click(
      within(screen.getByRole('group', { name: 'Avengers' })).getByRole('button', { name: '1' }),
    )
    await user.click(screen.getByRole('button', { name: 'HE TAKES IT' }))

    expect(screen.getByRole('checkbox', { name: /Return to the supply/ })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /Refill slot/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Hoard · 0' })).toBeInTheDocument()
  })
})

describe('your turn, round end and game over (#41, #42)', () => {
  it('logs your card in the sheet and ends the round', async () => {
    const user = userEvent.setup()
    await resume(user, takeSeed, thanosNeutral(newGame(takeSeed, DEFAULT_SETTINGS)))
    await user.click(screen.getByRole('button', { name: /I RECRUITED/ }))
    const sheet = screen.getByRole('dialog', { name: 'LOG YOUR CARD' })
    await user.click(
      within(within(sheet).getByRole('group', { name: 'Level' })).getByRole('button', {
        name: '3',
      }),
    )
    await user.click(
      within(within(sheet).getByRole('group', { name: 'Bonus colour' })).getByRole('button', {
        name: /Space/,
      }),
    )
    await user.click(
      within(within(sheet).getByRole('group', { name: 'Points' })).getByRole('button', {
        name: '4',
      }),
    )
    await user.click(within(sheet).getByRole('button', { name: 'ADD CARD' }))
    expect(screen.getByText('Logged: L3 Space (4 pts)')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'END ROUND 1' }))
    expect(screen.getByText('ROUND 2')).toBeInTheDocument()
  })

  it('announces the reshuffle at the start of phase 2', async () => {
    const user = userEvent.setup()
    await resume(user, 5, playTo(5, 10))
    await user.click(screen.getByRole('button', { name: 'END ROUND 10' }))
    expect(screen.getByRole('heading', { name: 'DECK RESHUFFLED!' })).toBeInTheDocument()
    expect(screen.getByText('PHASE 2 BEGINS')).toBeInTheDocument()
  })

  it('shows your win when you complete the Gauntlet', async () => {
    const events: GameEvent[] = [
      ...thanosNeutral(newGame(takeSeed, DEFAULT_SETTINGS)),
      ...STONES.map((colour, i): GameEvent => ({
        type: 'playerRecruit',
        card: { level: i === 0 ? 3 : 1, colour, points: i === 0 ? 4 : 3, tags: 0 },
      })),
    ]
    const user = userEvent.setup()
    await resume(user, takeSeed, events)
    await user.click(screen.getByRole('button', { name: 'END ROUND 1' }))
    expect(screen.getByRole('heading', { name: 'YOU WIN!' })).toBeInTheDocument()
    expect(screen.getByText('You completed the Infinity Gauntlet in round 1.')).toBeInTheDocument()
  })

  it('shows SNAP after the last round, and undo steps back with a toast', async () => {
    const user = userEvent.setup()
    await resume(user, 3, playTo(3, 30))
    await user.click(screen.getByRole('button', { name: 'END ROUND 30' }))
    expect(screen.getByRole('heading', { name: 'SNAP.' })).toBeInTheDocument()
    expect(screen.getByText('Round 30 ended without your Infinity Gauntlet.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'UNDO THE LAST STEP' }))
    expect(screen.getByRole('button', { name: 'END ROUND 30' })).toBeInTheDocument()
    expect(screen.getByText('Undone — stepped back one action.')).toBeInTheDocument()
  })
})

describe('dock sheets (#43)', () => {
  it('fixes Thanos’s piles in the hoard and toggles settings in the menu', async () => {
    const user = userEvent.setup()
    await resume(user, takeSeed, thanosNeutral(newGame(takeSeed, DEFAULT_SETTINGS)))
    const n = (actionAt(takeSeed, 1) as Extract<AutomaAction, { kind: 'take' }>).tokens.length

    await user.click(screen.getByRole('button', { name: `Hoard · ${n}` }))
    const hoard = screen.getByRole('dialog', { name: 'THANOS’S HOARD' })
    await user.click(within(hoard).getByRole('button', { name: 'FIX' }))
    await user.click(within(hoard).getByRole('button', { name: 'Add a Soul token' }))
    expect(within(hoard).getByText(`TOKENS · ${n + 1}`)).toBeInTheDocument()
    await user.click(within(hoard).getByRole('button', { name: 'Close THANOS’S HOARD' }))

    await user.click(screen.getByRole('button', { name: 'Menu' }))
    const menu = screen.getByRole('dialog', { name: 'MENU' })
    await user.click(within(menu).getByRole('button', { name: /Taking tokens/ }))
    expect(within(menu).getByText(/no 10-token limit/)).toBeInTheDocument()
    const sw = within(menu).getByRole('switch', { name: 'Keep the screen awake' })
    expect(sw).toHaveAttribute('aria-checked', 'true')
    await user.click(sw)
    expect(loadPrefs().wakeLock).toBe(false)
    expect(within(menu).getByRole('contentinfo', { name: 'Credits and copyright' })).toBeVisible()
  })

  it('explains rules with tips on the game screen', async () => {
    const user = userEvent.setup()
    await resume(user, takeSeed, [])
    await user.click(screen.getByRole('button', { name: 'Rule: Thanos’s turn' }))
    expect(screen.getByRole('note')).toHaveTextContent(/flips the next automa card/)
  })
})

describe('ending a game (#53)', () => {
  it('ends the game from the menu after confirming', async () => {
    const user = userEvent.setup()
    await resume(user, takeSeed, [{ type: 'reveal' }])
    await user.click(screen.getByRole('button', { name: 'Menu' }))
    await user.click(screen.getByRole('button', { name: 'END THIS GAME' }))
    expect(screen.queryByRole('dialog', { name: 'MENU' })).toBeNull()
    const dialog = screen.getByRole('alertdialog', { name: 'END THIS GAME?' })
    expect(dialog).toHaveTextContent('You’re in round 1.')
    await user.click(within(dialog).getByRole('button', { name: 'KEEP PLAYING' }))
    expect(screen.getByRole('heading', { name: /TAP A TOKEN|WHICH STONE/ })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Menu' }))
    await user.click(screen.getByRole('button', { name: 'END THIS GAME' }))
    await user.click(screen.getByRole('button', { name: 'END GAME' }))
    expect(screen.getByRole('heading', { name: 'THANOS AUTOMA' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^CONTINUE/ })).toBeNull()
    expect(screen.getByRole('button', { name: 'NEW GAME' })).toBeInTheDocument()
    expect(screen.getByText('Game ended.')).toBeInTheDocument()
    expect(loadGame().game).toBeNull()
  })

  it('ends the game from Home', async () => {
    const user = userEvent.setup()
    saveGame({ version: 1, seed: takeSeed, settings: DEFAULT_SETTINGS, events: [] })
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'End this game' }))
    await user.click(screen.getByRole('button', { name: 'END GAME' }))
    expect(screen.queryByRole('button', { name: /^CONTINUE/ })).toBeNull()
    expect(loadGame().game).toBeNull()
  })
})

describe('motion (#52)', () => {
  it('opens every step at its top', async () => {
    const user = userEvent.setup()
    await resume(user, takeSeed, thanosNeutral(newGame(takeSeed, DEFAULT_SETTINGS)))
    vi.mocked(window.scrollTo).mockClear()
    await user.click(screen.getByRole('button', { name: 'END ROUND 1' }))
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0)
  })

  it('finishes the flip on the small card only right after a flip', async () => {
    const user = userEvent.setup()
    await resume(user, takeSeed, [])
    await user.click(screen.getByRole('button', { name: 'Flip Thanos’s card' }))
    expect(screen.getByRole('img', { name: /^Automa card/ })).toHaveAttribute(
      'data-entering',
      'true',
    )
    // After undo and a relaunch the card is already face up: no flip again.
    await user.click(screen.getByRole('button', { name: 'Undo' }))
    await user.click(screen.getByRole('button', { name: 'Flip Thanos’s card' }))
    await user.click(screen.getByRole('button', { name: 'Menu' }))
    await user.click(screen.getByRole('button', { name: /BACK TO HOME/ }))
    await user.click(screen.getByRole('button', { name: /^CONTINUE/ }))
    expect(screen.getByRole('img', { name: /^Automa card/ })).toHaveAttribute(
      'data-entering',
      'false',
    )
  })

  it('keeps the undo toast in place when undoing more', async () => {
    const user = userEvent.setup()
    await resume(user, takeSeed, thanosNeutral(newGame(takeSeed, DEFAULT_SETTINGS)))
    await user.click(screen.getByRole('button', { name: 'Undo' }))
    const toast = screen.getByText('Undone — stepped back one action.').parentElement
    await user.click(screen.getByRole('button', { name: 'UNDO MORE' }))
    expect(screen.getByText('Undone — stepped back one action.').parentElement).toBe(toast)
    expect(screen.getByRole('button', { name: 'Flip Thanos’s card' })).toBeInTheDocument()
  })

  it('keeps the page still behind an open sheet', async () => {
    const user = userEvent.setup()
    await resume(user, takeSeed, [])
    await user.click(screen.getByRole('button', { name: 'Log' }))
    expect(document.documentElement.style.overflow).toBe('hidden')
    await user.click(screen.getByRole('button', { name: 'Close GAME LOG' }))
    expect(document.documentElement.style.overflow).toBe('')
  })

  it('collapses a rule tip again', async () => {
    const user = userEvent.setup()
    await resume(user, takeSeed, [])
    const tip = screen.getByRole('button', { name: 'Rule: Thanos’s turn' })
    await user.click(tip)
    expect(screen.getByRole('note')).toBeInTheDocument()
    await user.click(tip)
    expect(screen.queryByRole('note')).toBeNull()
  })
})

describe('languages (#54)', () => {
  it('switches the language from Home and remembers it', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<App />)
    expect(document.documentElement.lang).toBe('en')
    await user.click(screen.getByRole('button', { name: 'Language: English' }))
    const sheet = screen.getByRole('dialog', { name: 'LANGUAGE' })
    await user.click(within(sheet).getByRole('button', { name: /^DE/ }))
    expect(screen.getByRole('dialog', { name: 'SPRACHE' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'SPRACHE schließen' }))
    expect(screen.getByRole('button', { name: 'DEIN ERSTES SPIEL' })).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('de')
    expect(loadPrefs().language).toBe('de')

    unmount()
    render(<App />)
    expect(screen.getByRole('button', { name: 'DEIN ERSTES SPIEL' })).toBeInTheDocument()
  })

  it('plays in Russian, switched from the menu', async () => {
    const user = userEvent.setup()
    await resume(user, takeSeed, [])
    await user.click(screen.getByRole('button', { name: 'Menu' }))
    await user.click(screen.getByRole('button', { name: /^RU/ }))
    expect(screen.getByRole('dialog', { name: 'МЕНЮ' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Закрыть: МЕНЮ' }))
    expect(screen.getByRole('heading', { name: 'ХОД ТАНОСА' })).toBeInTheDocument()
    expect(screen.getByText('РАУНД 1')).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('ru')
  })
})

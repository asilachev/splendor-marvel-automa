import { describe, expect, it } from 'vitest'
import {
  applyEvent,
  currentRoundCard,
  discardPreview,
  GameRuleError,
  missingColours,
  newGame,
  replay,
  sideStats,
  type GameEvent,
  type GameState,
  type RecruitedCard,
  type ThanosCardInput,
} from './game.ts'
import { DEFAULT_SETTINGS, PHASE_LENGTH_PRESETS, type Settings } from './settings.ts'
import { cardForRound } from './setup.ts'
import { STONES, type Stone } from './stones.ts'
import type { AutomaAction, Level } from './types.ts'

const S = DEFAULT_SETTINGS
const card = (colour: Stone, points = 0, tags = 0, level: Level = 1): RecruitedCard => ({
  level,
  colour,
  points,
  tags,
})
/** One card of each colour; the first is level 3 (Time) unless `time` is false. */
const fullSet = (points: readonly number[], time = true): RecruitedCard[] =>
  STONES.map((colour, i) => card(colour, points[i] ?? 0, 0, i === 0 && time ? 3 : 1))

const actionAt = (seed: number, round: number, settings: Settings = S): AutomaAction =>
  cardForRound(newGame(seed, settings).setup, round).action

/** First seed for which `round` has an action matching `pred`. */
function seedWhere(round: number, pred: (a: AutomaAction) => boolean, settings: Settings = S) {
  for (let seed = 0; seed < 10_000; seed++) if (pred(actionAt(seed, round, settings))) return seed
  throw new Error('no matching seed')
}
const takeSeed = seedWhere(1, (a) => a.kind === 'take')
const gainSeed = seedWhere(1, (a) => a.kind === 'gain' && a.discard === 3)

/** A state in the given step, built directly for focused rule tests. */
const at = (seed: number, overrides: Partial<GameState>, settings: Settings = S): GameState => ({
  ...newGame(seed, settings),
  step: 'thanos',
  ...overrides,
})
const gain = (input: ThanosCardInput, substituted = false): GameEvent => ({
  type: 'thanosGain',
  card: input,
  substituted,
  slotEmpty: false,
})

describe('Thanos takes tokens (docs/automa.md → Action: take tokens)', () => {
  const tokens = () => (actionAt(takeSeed, 1) as Extract<AutomaAction, { kind: 'take' }>).tokens

  it('puts them on top of the stack in printed order', () => {
    const s = applyEvent(at(takeSeed, { stack: ['soul'] }), { type: 'thanosTake', skipped: [] })
    expect(s.stack).toEqual(['soul', ...tokens()])
    expect(s.step).toBe('player')
  })

  it('skips colours whose pile is empty', () => {
    const [first, ...rest] = tokens()
    const s = applyEvent(at(takeSeed, {}), { type: 'thanosTake', skipped: [first!] })
    expect(s.stack).toEqual(rest)
    expect(s.log.at(-1)).toMatchObject({ kind: 'take', skipped: [first] })
  })

  it('rejects skipped tokens that are not on the card', () => {
    const other = STONES.find((x) => !tokens().includes(x))!
    expect(() => applyEvent(at(takeSeed, {}), { type: 'thanosTake', skipped: [other] })).toThrow(
      GameRuleError,
    )
  })

  it('caps the stack when the setting is on, returning the oldest tokens', () => {
    const settings = { ...S, stackCap: 2 }
    const s = applyEvent(at(takeSeed, { stack: ['power', 'mind'] }, settings), {
      type: 'thanosTake',
      skipped: [],
    })
    expect(s.stack).toHaveLength(2)
    expect(s.stack).toEqual([...['power', 'mind'], ...tokens()].slice(-2))
    expect(s.log.at(-1)).toMatchObject({
      kind: 'take',
      capped: ['power', 'mind', ...tokens()].slice(0, -2),
    })
  })

  it('refuses a take when the card says gain', () => {
    expect(() => applyEvent(at(gainSeed, {}), { type: 'thanosTake', skipped: [] })).toThrow(
      GameRuleError,
    )
  })
})

describe('Thanos gains a card (docs/automa.md → Action: gain a card)', () => {
  it('discards from the bottom of the stack, oldest first', () => {
    const s0 = at(gainSeed, { stack: ['power', 'mind', 'space', 'reality'] })
    expect(discardPreview(s0)).toEqual(['power', 'mind', 'space'])
    const s = applyEvent(s0, gain({ colour: 'soul', points: 0, tags: 0 }))
    expect(s.stack).toEqual(['reality'])
    expect(s.log.at(-1)).toMatchObject({ kind: 'gain', returned: ['power', 'mind', 'space'] })
  })

  it('takes the card even when he cannot discard enough', () => {
    const s = applyEvent(
      at(gainSeed, { stack: ['soul'] }),
      gain({ colour: 'mind', points: 1, tags: 0 }),
    )
    expect(s.stack).toEqual([])
    expect(s.thanosCards).toEqual([card('mind', 1)])
  })

  it('takes the level from the row (C = level 1)', () => {
    const row = (actionAt(gainSeed, 1) as Extract<AutomaAction, { kind: 'gain' }>).row
    const s = applyEvent(at(gainSeed, {}), gain({ colour: 'mind', points: 0, tags: 0 }))
    expect(s.thanosCards[0]?.level).toBe({ A: 3, B: 2, C: 1 }[row])
  })

  it('uses the card-12 ruling where no discard is printed (default 0)', () => {
    const seed = seedWhere(21, (a) => a.kind === 'gain' && a.discard === null)
    const stack: Stone[] = ['power', 'mind', 'space']
    const byDefault = applyEvent(
      at(seed, { round: 21, stack }),
      gain({ colour: 'soul', points: 0, tags: 0 }),
    )
    expect(byDefault.stack).toEqual(stack)
    const settings = { ...S, unprintedDiscard: 3 }
    const withThree = applyEvent(
      at(seed, { round: 21, stack }, settings),
      gain({ colour: 'soul', points: 0, tags: 0 }),
    )
    expect(withThree.stack).toEqual([])
  })

  it('gets the Time token with his first level-3 card only', () => {
    const seed = seedWhere(21, (a) => a.kind === 'gain' && a.row === 'A')
    const first = applyEvent(at(seed, { round: 21 }), gain({ colour: 'soul', points: 4, tags: 0 }))
    expect(first.log.at(-1)).toMatchObject({ kind: 'gain', gotTime: true })
    expect(sideStats(first, 'thanos').hasTime).toBe(true)
    const second = applyEvent(
      at(seed, { round: 21, thanosCards: [card('mind', 3, 0, 3)] }),
      gain({ colour: 'soul', points: 4, tags: 0 }),
    )
    expect(second.log.at(-1)).toMatchObject({ kind: 'gain', gotTime: false })
  })

  it('only substitutes with a colour he lacks', () => {
    const s = at(gainSeed, { thanosCards: [card('mind')] })
    expect(missingColours(s)).toEqual(['power', 'space', 'reality', 'soul'])
    expect(() => applyEvent(s, gain({ colour: 'mind', points: 0, tags: 0 }, true))).toThrow(
      GameRuleError,
    )
    expect(
      applyEvent(s, gain({ colour: 'soul', points: 0, tags: 0 }, true)).thanosCards,
    ).toHaveLength(2)
  })

  it('counts every card by default, or only scoring/Avengers cards as printed', () => {
    const blank = { thanosCards: [card('mind', 0, 0), card('soul', 1, 0)] }
    expect(missingColours(at(gainSeed, blank))).not.toContain('mind')
    const printed = at(gainSeed, blank, { ...S, countedCards: 'scoringOnly' })
    expect(missingColours(printed)).toContain('mind')
    expect(missingColours(printed)).not.toContain('soul')
  })

  it('takes nothing from an empty slot only when the slot is empty', () => {
    const s = applyEvent(at(gainSeed, { stack: ['power'] }), {
      type: 'thanosGain',
      card: null,
      substituted: false,
      slotEmpty: true,
    })
    expect(s.thanosCards).toEqual([])
    expect(s.stack).toEqual(['power'])
    expect(() =>
      applyEvent(at(gainSeed, {}), {
        type: 'thanosGain',
        card: null,
        substituted: false,
        slotEmpty: false,
      }),
    ).toThrow(GameRuleError)
  })

  it('rejects impossible cards', () => {
    expect(() =>
      applyEvent(at(gainSeed, {}), gain({ colour: 'mind', points: 0, tags: 3 })),
    ).toThrow()
    expect(() =>
      applyEvent(at(gainSeed, {}), gain({ colour: 'mind', points: -1, tags: 0 })),
    ).toThrow()
  })
})

describe('Avengers Assemble tile (docs/rules.md → Avengers Assemble tile)', () => {
  it('goes to the first side with 3 tags and is worth 3 points', () => {
    let s = at(1, { step: 'player' })
    s = applyEvent(s, { type: 'playerRecruit', card: card('mind', 1, 2) })
    expect(s.avengers).toBe('none')
    s = applyEvent(s, { type: 'playerRecruit', card: card('soul', 0, 1) })
    expect(s.avengers).toBe('player')
    expect(sideStats(s, 'player').points).toBe(4)
  })

  it('stays with the holder on a tie and moves on more tags', () => {
    const base = {
      avengers: 'player' as const,
      playerCards: [card('mind', 0, 2), card('soul', 0, 1)],
    }
    const tie = applyEvent(
      at(gainSeed, { ...base, thanosCards: [card('power', 0, 2)] }),
      gain({ colour: 'space', points: 0, tags: 1 }),
    )
    expect(tie.avengers).toBe('player')
    const more = applyEvent(
      at(gainSeed, { ...base, thanosCards: [card('power', 0, 2)] }),
      gain({ colour: 'space', points: 0, tags: 2 }),
    )
    expect(more.avengers).toBe('thanos')
    expect(more.log.at(-1)).toMatchObject({ kind: 'avengers', holder: 'thanos', manual: false })
  })

  it('can be set manually, and corrections keep it consistent', () => {
    let s = at(1, {
      step: 'player',
      playerCards: [card('mind', 0, 2), card('soul', 0, 1)],
      avengers: 'player',
    })
    s = applyEvent(s, { type: 'setAvengers', holder: 'thanos' })
    expect(s.avengers).toBe('thanos')
    s = applyEvent(s, { type: 'setAvengers', holder: 'player' })
    s = applyEvent(s, { type: 'removeCard', side: 'player', index: 0 })
    expect(s.avengers).toBe('none')
  })
})

describe('your turn and corrections', () => {
  it('awards your Time token with your first level-3 card', () => {
    const s = applyEvent(at(1, { step: 'player' }), {
      type: 'playerRecruit',
      card: card('mind', 3, 0, 3),
    })
    expect(s.log.at(-1)).toMatchObject({ kind: 'playerRecruit', gotTime: true })
  })

  it('allows one Location per turn and two in total', () => {
    let s = applyEvent(at(1, { step: 'player' }), { type: 'playerLocation' })
    expect(sideStats(s, 'player').points).toBe(3)
    expect(() => applyEvent(s, { type: 'playerLocation' })).toThrow(GameRuleError)
    s = applyEvent({ ...s, round: 2 }, { type: 'playerLocation' })
    expect(() => applyEvent({ ...s, round: 3 }, { type: 'playerLocation' })).toThrow(GameRuleError)
  })

  it('fixes the stack by index and on top', () => {
    let s = at(1, { stack: ['power', 'mind', 'space'] })
    s = applyEvent(s, { type: 'stackRemove', index: 1 })
    s = applyEvent(s, { type: 'stackAdd', stone: 'soul' })
    expect(s.stack).toEqual(['power', 'space', 'soul'])
    expect(() => applyEvent(s, { type: 'stackRemove', index: 9 })).toThrow(GameRuleError)
  })
})

describe('end of round (docs/automa.md → Playing a round)', () => {
  const ended = (overrides: Partial<GameState>, settings: Settings = S) =>
    applyEvent(at(1, { step: 'player', ...overrides }, settings), { type: 'endRound' })

  it('moves to the next round and notes the reshuffle at phase starts', () => {
    const s = ended({ round: 10 })
    expect(s.round).toBe(11)
    expect(s.step).toBe('reveal')
    expect(s.log.at(-1)).toEqual({ kind: 'phase', round: 11, phase: 2 })
    expect(ended({ round: 3 }).log).toEqual([])
  })

  it('lets you win when only you complete the Gauntlet', () => {
    const s = ended({ round: 12, playerCards: fullSet([4, 3, 3, 3, 3]) })
    expect(s.step).toBe('over')
    expect(s.result).toEqual({ winner: 'player', reason: 'gauntlet', round: 12 })
  })

  it('needs 16 points, all five colours and the Time token', () => {
    expect(ended({ playerCards: fullSet([4, 3, 3, 3, 2]) }).result).toBeNull()
    expect(ended({ playerCards: fullSet([4, 3, 3, 3, 3], false) }).result).toBeNull()
    expect(ended({ playerCards: fullSet([16]).slice(0, 4) }).result).toBeNull()
  })

  it('lets Thanos win when only he completes it', () => {
    expect(ended({ round: 23, thanosCards: fullSet([5, 5, 3, 2, 1]) }).result).toEqual({
      winner: 'thanos',
      reason: 'gauntlet',
      round: 23,
    })
  })

  it('breaks ties: points, then the Avengers tile, then fewer cards, then Thanos', () => {
    const t16 = fullSet([4, 3, 3, 3, 3])
    expect(ended({ thanosCards: t16, playerCards: fullSet([5, 3, 3, 3, 3]) }).result).toMatchObject(
      {
        winner: 'player',
        reason: 'morePoints',
      },
    )
    // Equal points (16 + 3 for the tile vs 19 from cards): the tile holder wins.
    expect(
      ended({ thanosCards: t16, playerCards: fullSet([7, 3, 3, 3, 3]), avengers: 'thanos' }).result,
    ).toMatchObject({ winner: 'thanos', reason: 'avengersTile' })
    expect(
      ended({ thanosCards: [...t16, card('mind')], playerCards: fullSet([4, 3, 3, 3, 3]) }).result,
    ).toMatchObject({ winner: 'player', reason: 'fewerCards' })
    expect(ended({ thanosCards: t16, playerCards: fullSet([4, 3, 3, 3, 3]) }).result).toMatchObject(
      {
        winner: 'thanos',
        reason: 'thanosWinsTies',
      },
    )
  })

  it('gives Thanos every tie under the "Thanos wins outright" ruling', () => {
    const settings: Settings = { ...S, ties: 'thanosWins' }
    const s = ended(
      { thanosCards: fullSet([4, 3, 3, 3, 3]), playerCards: fullSet([9, 3, 3, 3, 3]) },
      settings,
    )
    expect(s.result).toMatchObject({ winner: 'thanos', reason: 'thanosWinsTies' })
  })

  it('ends with your loss after the last round (30, or 24 with 8/8/8)', () => {
    expect(ended({ round: 30 }).result).toEqual({
      winner: 'thanos',
      reason: 'roundLimit',
      round: 30,
    })
    const shortest = { ...S, phaseLengths: PHASE_LENGTH_PRESETS.shortest }
    expect(ended({ round: 24 }, shortest).result).toMatchObject({ reason: 'roundLimit' })
    expect(ended({ round: 23 }, shortest).result).toBeNull()
  })

  it('applies the special rule: losing the tile can drop a side below 16', () => {
    // Thanos: 13 card points + tile = 16 with the Gauntlet. You then out-tag him and take the tile.
    let s = at(1, {
      step: 'player',
      round: 25,
      thanosCards: [
        ...fullSet([5, 3, 3, 1, 1]).map((c, i) => (i === 0 ? { ...c, tags: 2 } : c)),
        card('mind', 0, 1),
      ],
      avengers: 'thanos',
    })
    expect(sideStats(s, 'thanos').gauntlet).toBe(true)
    s = applyEvent(s, { type: 'playerRecruit', card: card('mind', 0, 2) })
    s = applyEvent(s, { type: 'playerRecruit', card: card('soul', 0, 2) })
    expect(s.avengers).toBe('player')
    s = applyEvent(s, { type: 'endRound' })
    expect(s.result).toBeNull()
    expect(s.round).toBe(26)
  })
})

describe('step order', () => {
  it('rejects events in the wrong step and after the game is over', () => {
    const start = newGame(takeSeed, S)
    expect(() => applyEvent(start, { type: 'thanosTake', skipped: [] })).toThrow(GameRuleError)
    expect(() => applyEvent(start, { type: 'endRound' })).toThrow(GameRuleError)
    const revealed = applyEvent(start, { type: 'reveal' })
    expect(() => applyEvent(revealed, { type: 'reveal' })).toThrow(GameRuleError)
    expect(() => applyEvent(revealed, { type: 'playerRecruit', card: card('mind') })).toThrow(
      GameRuleError,
    )
    const over = { ...start, step: 'over' as const }
    expect(() => applyEvent(over, { type: 'stackAdd', stone: 'mind' })).toThrow(GameRuleError)
  })
})

describe('a whole game', () => {
  it('runs to the end and replays deterministically from its events', () => {
    const seed = 2026
    let state = newGame(seed, S)
    const events: GameEvent[] = []
    const apply = (e: GameEvent) => {
      events.push(e)
      state = applyEvent(state, e)
    }
    while (state.step !== 'over') {
      apply({ type: 'reveal' })
      const { action } = currentRoundCard(state)
      if (action.kind === 'take') apply({ type: 'thanosTake', skipped: [] })
      else apply(gain({ colour: missingColours(state)[0] ?? 'power', points: 2, tags: 0 }))
      apply({ type: 'endRound' })
    }
    // Thanos collects colours and points early but can only get the Time token in phase 3.
    expect(state.result).toMatchObject({ winner: 'thanos', reason: 'gauntlet' })
    expect(state.result!.round).toBeGreaterThanOrEqual(21)
    expect(replay(seed, S, events)).toEqual(state)
  })
})

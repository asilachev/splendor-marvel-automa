/**
 * The game as a pure, event-sourced state machine:
 *   state = replay(seed, settings, events)
 * Rules: docs/rules.md, docs/automa.md. Rulings: docs/automa.md → Rulings this app uses.
 */
import { LOCATIONS_IN_PLAY, type Settings } from './settings.ts'
import { cardForRound, createSetup, isPhaseStart, phaseOfRound, roundLimit } from './setup.ts'
import type { RoundCard, Setup } from './setup.ts'
import { STONES, type Stone } from './stones.ts'
import { LEVEL_OF_ROW, type GainAction, type Level, type Phase } from './types.ts'

export type Side = 'thanos' | 'player'
export type AvengersHolder = Side | 'none'

/** reveal → thanos (resolve the card) → player (your turn) → reveal … or over. */
export type Step = 'reveal' | 'thanos' | 'player' | 'over'

/** A recruited Character card, reduced to what the rules need (no card database). */
export interface RecruitedCard {
  readonly level: Level
  readonly colour: Stone
  readonly points: number
  readonly tags: number
}

/** Thanos's card as entered at the table; its level comes from the automa card's row. */
export type ThanosCardInput = Omit<RecruitedCard, 'level'>

/**
 * What you tell the app at the end of a round when you don't log your cards (#15): whether you
 * completed the Gauntlet, and your totals when the tiebreakers need them.
 */
export interface PlayerReport {
  readonly gauntlet: boolean
  /** Your Infinity Points, tiles included: 16 or more. */
  readonly points?: number
  /** Your Character cards: at least 5, one per colour. */
  readonly cards?: number
}

export type GameEvent =
  | { readonly type: 'reveal' }
  | { readonly type: 'thanosTake'; readonly skipped: readonly Stone[] }
  | {
      readonly type: 'thanosGain'
      /** null: nothing taken (empty slot under the "take nothing" ruling, or an empty row). */
      readonly card: ThanosCardInput | null
      /** He already had the targeted card's colour and took another card in the row. */
      readonly substituted: boolean
      /** The targeted slot was empty. */
      readonly slotEmpty: boolean
    }
  | { readonly type: 'playerRecruit'; readonly card: RecruitedCard }
  | { readonly type: 'playerLocation' }
  | { readonly type: 'setAvengers'; readonly holder: AvengersHolder }
  | { readonly type: 'stackAdd'; readonly stone: Stone }
  | { readonly type: 'stackRemove'; readonly index: number }
  | { readonly type: 'addCard'; readonly side: Side; readonly card: RecruitedCard }
  | { readonly type: 'removeCard'; readonly side: Side; readonly index: number }
  | { readonly type: 'endRound'; readonly report?: PlayerReport }

export type ResultReason =
  | 'gauntlet' // only one side completed the Infinity Gauntlet
  | 'morePoints' // both did: more Infinity Points
  | 'avengersTile' // tie on points: holder of the Avengers tile
  | 'fewerCards' // still tied: fewer Character cards
  | 'thanosWinsTies' // still tied (or the "Thanos wins outright" ruling)
  | 'roundLimit' // the round limit passed without a winner

export interface GameResult {
  readonly winner: Side
  readonly reason: ResultReason
  readonly round: number
}

export type LogEntry =
  | {
      readonly kind: 'take'
      readonly round: number
      readonly taken: readonly Stone[]
      readonly skipped: readonly Stone[]
      readonly capped: readonly Stone[]
    }
  | {
      readonly kind: 'gain'
      readonly round: number
      readonly slot: string
      readonly card: RecruitedCard | null
      readonly returned: readonly Stone[]
      readonly substituted: boolean
      readonly slotEmpty: boolean
      readonly gotTime: boolean
    }
  | {
      readonly kind: 'avengers'
      readonly round: number
      readonly holder: AvengersHolder
      readonly manual: boolean
    }
  | {
      readonly kind: 'playerRecruit'
      readonly round: number
      readonly card: RecruitedCard
      readonly gotTime: boolean
    }
  | { readonly kind: 'playerLocation'; readonly round: number }
  /** Hard variant (#11): Thanos claimed the Location at `index` in setup order. */
  | { readonly kind: 'thanosLocation'; readonly round: number; readonly index: number }
  | {
      readonly kind: 'stackFix'
      readonly round: number
      readonly change: 'add' | 'remove'
      readonly stone: Stone
    }
  | {
      readonly kind: 'cardFix'
      readonly round: number
      readonly side: Side
      readonly change: 'add' | 'remove'
      readonly card: RecruitedCard
    }
  | { readonly kind: 'phase'; readonly round: number; readonly phase: Phase }
  | { readonly kind: 'result'; readonly round: number; readonly result: GameResult }

export interface GameState {
  readonly setup: Setup
  readonly round: number
  readonly step: Step
  /** Thanos's token stack. Index 0 is the bottom: the oldest token, returned first. */
  readonly stack: readonly Stone[]
  readonly thanosCards: readonly RecruitedCard[]
  readonly playerCards: readonly RecruitedCard[]
  readonly playerLocations: number
  /** Hard variant (#11): the Locations Thanos claimed, as indexes in setup order. */
  readonly thanosLocations: readonly number[]
  readonly avengers: AvengersHolder
  /** Your report from the round that ended the game, when your cards aren't logged (#15). */
  readonly playerReport: PlayerReport | null
  readonly result: GameResult | null
  readonly log: readonly LogEntry[]
}

export interface SideStats {
  readonly points: number
  readonly colours: readonly Stone[]
  readonly hasTime: boolean
  readonly tags: number
  readonly cardCount: number
  /** 16+ points, all 5 colours and the Time token (docs/rules.md → End of the game). */
  readonly gauntlet: boolean
}

/** Thrown for events that the rules (or the step order) don't allow. */
export class GameRuleError extends Error {
  override name = 'GameRuleError'
}

export const GAUNTLET_POINTS = 16
export const AVENGERS_TILE_TAGS = 3
export const AVENGERS_TILE_POINTS = 3
export const LOCATION_POINTS = 3
export { LOCATIONS_IN_PLAY }

export function newGame(seed: number, settings: Settings): GameState {
  return {
    setup: createSetup(seed, settings),
    round: 1,
    step: 'reveal',
    stack: [],
    thanosCards: [],
    playerCards: [],
    playerLocations: 0,
    thanosLocations: [],
    avengers: 'none',
    playerReport: null,
    result: null,
    log: [],
  }
}

export function replay(seed: number, settings: Settings, events: readonly GameEvent[]): GameState {
  return events.reduce(applyEvent, newGame(seed, settings))
}

// ── selectors ────────────────────────────────────────────────────────────────

/** The automa card for the current round and the section that applies. */
export function currentRoundCard(state: GameState): RoundCard {
  return cardForRound(state.setup, state.round)
}

export function currentPhase(state: GameState): Phase {
  return phaseOfRound(state.round, state.setup.settings)
}

/** Tokens a gain action discards; `null` (not printed) uses the card-12 ruling. */
export function discardCount(state: GameState, action: GainAction): number {
  return action.discard ?? state.setup.settings.unprintedDiscard
}

/** The tokens Thanos would return for the current gain action, oldest first. */
export function discardPreview(state: GameState): readonly Stone[] {
  const { action } = currentRoundCard(state)
  if (action.kind !== 'gain') return []
  return state.stack.slice(0, discardCount(state, action))
}

/** Thanos's cards that count, per the "which cards count" ruling. */
export function countedThanosCards(state: GameState): readonly RecruitedCard[] {
  if (state.setup.settings.countedCards === 'all') return state.thanosCards
  return state.thanosCards.filter((c) => c.points > 0 || c.tags > 0)
}

export function sideStats(state: GameState, side: Side): SideStats {
  const cards = side === 'thanos' ? countedThanosCards(state) : state.playerCards
  const colourSet = new Set(cards.map((c) => c.colour))
  const colours = STONES.filter((s) => colourSet.has(s))
  const hasTime = cards.some((c) => c.level === 3)
  const points =
    cards.reduce((sum, c) => sum + c.points, 0) +
    (state.avengers === side ? AVENGERS_TILE_POINTS : 0) +
    (side === 'player' ? state.playerLocations : state.thanosLocations.length) * LOCATION_POINTS
  return {
    points,
    colours,
    hasTime,
    tags: cards.reduce((sum, c) => sum + c.tags, 0),
    cardCount: cards.length,
    gauntlet: points >= GAUNTLET_POINTS && colours.length === STONES.length && hasTime,
  }
}

/** Colours Thanos doesn't have yet: the colour-substitution targets. */
export function missingColours(state: GameState, side: Side = 'thanos'): readonly Stone[] {
  const have = sideStats(state, side).colours
  return STONES.filter((s) => !have.includes(s))
}

// ── reducer ──────────────────────────────────────────────────────────────────

export function applyEvent(state: GameState, event: GameEvent): GameState {
  if (state.step === 'over') throw new GameRuleError('The game is over')
  switch (event.type) {
    case 'reveal':
      expectStep(state, 'reveal', event.type)
      return { ...state, step: 'thanos' }
    // Either action ends his turn; then, in the hard variant, he may claim a Location.
    case 'thanosTake':
      return claimLocation(thanosTake(state, event.skipped))
    case 'thanosGain':
      return claimLocation(thanosGain(state, event.card, event.substituted, event.slotEmpty))
    case 'playerRecruit':
      expectStep(state, 'player', event.type)
      expectLogged(state, event.type)
      validateCard(event.card)
      return recruit(state, 'player', event.card)
    case 'playerLocation':
      return playerLocation(state)
    case 'setAvengers':
      if (state.avengers === event.holder) return state
      return {
        ...state,
        avengers: event.holder,
        log: [
          ...state.log,
          { kind: 'avengers', round: state.round, holder: event.holder, manual: true },
        ],
      }
    case 'stackAdd':
      return {
        ...state,
        stack: [...state.stack, event.stone],
        log: [
          ...state.log,
          { kind: 'stackFix', round: state.round, change: 'add', stone: event.stone },
        ],
      }
    case 'stackRemove': {
      const stone = state.stack[event.index]
      if (stone === undefined) throw new GameRuleError(`No token at stack index ${event.index}`)
      return {
        ...state,
        stack: state.stack.filter((_, i) => i !== event.index),
        log: [...state.log, { kind: 'stackFix', round: state.round, change: 'remove', stone }],
      }
    }
    case 'addCard':
      if (event.side === 'player') expectLogged(state, event.type)
      validateCard(event.card)
      return reconcileAvengers(
        withCards(state, event.side, [...cardsOf(state, event.side), event.card], {
          kind: 'cardFix',
          round: state.round,
          side: event.side,
          change: 'add',
          card: event.card,
        }),
      )
    case 'removeCard': {
      if (event.side === 'player') expectLogged(state, event.type)
      const card = cardsOf(state, event.side)[event.index]
      if (!card) throw new GameRuleError(`No ${event.side} card at index ${event.index}`)
      return reconcileAvengers(
        withCards(
          state,
          event.side,
          cardsOf(state, event.side).filter((_, i) => i !== event.index),
          { kind: 'cardFix', round: state.round, side: event.side, change: 'remove', card },
        ),
      )
    }
    case 'endRound':
      expectStep(state, 'player', event.type)
      return endRound(state, event.report)
  }
}

function thanosTake(state: GameState, skipped: readonly Stone[]): GameState {
  expectStep(state, 'thanos', 'thanosTake')
  const { action } = currentRoundCard(state)
  if (action.kind !== 'take') throw new GameRuleError('This round’s action is not "take tokens"')
  if (new Set(skipped).size !== skipped.length || skipped.some((s) => !action.tokens.includes(s))) {
    throw new GameRuleError('Skipped tokens must be distinct tokens of this action')
  }
  // Taken in printed order, onto the top of the stack; empty piles are skipped.
  const taken = action.tokens.filter((s) => !skipped.includes(s))
  let stack = [...state.stack, ...taken]
  // Optional cap: the oldest tokens beyond it go back to the supply.
  const cap = state.setup.settings.stackCap
  const excess = cap === null ? 0 : Math.max(0, stack.length - cap)
  const capped = stack.slice(0, excess)
  stack = stack.slice(excess)
  return {
    ...state,
    step: 'player',
    stack,
    log: [...state.log, { kind: 'take', round: state.round, taken, skipped: [...skipped], capped }],
  }
}

function thanosGain(
  state: GameState,
  input: ThanosCardInput | null,
  substituted: boolean,
  slotEmpty: boolean,
): GameState {
  expectStep(state, 'thanos', 'thanosGain')
  const { action } = currentRoundCard(state)
  if (action.kind !== 'gain') throw new GameRuleError('This round’s action is not "gain a card"')
  const slot = `${action.row}${action.column}`

  if (input === null) {
    if (!slotEmpty) throw new GameRuleError('Thanos can only take nothing when the slot is empty')
    const entry: LogEntry = {
      kind: 'gain',
      round: state.round,
      slot,
      card: null,
      returned: [],
      substituted: false,
      slotEmpty: true,
      gotTime: false,
    }
    return { ...state, step: 'player', log: [...state.log, entry] }
  }

  const card: RecruitedCard = { level: LEVEL_OF_ROW[action.row], ...input }
  validateCard(card)
  if (substituted && sideStats(state, 'thanos').colours.includes(card.colour)) {
    throw new GameRuleError('A substitute card must have a colour Thanos lacks')
  }
  // Discard from the bottom (oldest first); he takes the card even if he can't pay it all.
  const n = Math.min(discardCount(state, action), state.stack.length)
  const returned = state.stack.slice(0, n)
  const hadTime = sideStats(state, 'thanos').hasTime
  const next = recruit(
    { ...state, step: 'player', stack: state.stack.slice(n) },
    'thanos',
    card,
    false,
  )
  const gotTime = !hadTime && sideStats(next, 'thanos').hasTime
  const entry: LogEntry = {
    kind: 'gain',
    round: state.round,
    slot,
    card,
    returned,
    substituted,
    slotEmpty,
    gotTime,
  }
  // The gain entry goes before any Avengers entry the recruit produced.
  const avengersEntries = next.log.slice(state.log.length)
  return { ...next, log: [...state.log, entry, ...avengersEntries] }
}

/** Adds a card and applies the Avengers Assemble tile rule for the recruiting side. */
function recruit(state: GameState, side: Side, card: RecruitedCard, logRecruit = true): GameState {
  const hadTime = sideStats(state, side).hasTime
  let next = withCards(state, side, [...cardsOf(state, side), card])
  if (logRecruit) {
    const gotTime = !hadTime && sideStats(next, side).hasTime
    next = {
      ...next,
      log: [...next.log, { kind: 'playerRecruit', round: state.round, card, gotTime }],
    }
  }
  // docs/rules.md → Avengers Assemble tile: first to 3 tags takes it; only MORE tags take it away.
  // Without your cards logged your tags are unknown, so Thanos takes it only from the middle (#15).
  const holder = next.avengers
  const tags = sideStats(next, side).tags
  const takes =
    holder !== side &&
    tags >= AVENGERS_TILE_TAGS &&
    (holder === 'none' || (isLogged(next) && tags > sideStats(next, holder).tags))
  if (!takes) return next
  return {
    ...next,
    avengers: side,
    log: [...next.log, { kind: 'avengers', round: state.round, holder: side, manual: false }],
  }
}

/** After a correction, keep the tile consistent with the tags on the table. */
function reconcileAvengers(state: GameState): GameState {
  const thanos = sideStats(state, 'thanos').tags
  let holder = state.avengers
  if (!isLogged(state)) {
    // Your tags aren't known (#15): keep only Thanos's claim in line with his cards.
    if (holder === 'thanos' && thanos < AVENGERS_TILE_TAGS) holder = 'none'
    else if (holder === 'none' && thanos >= AVENGERS_TILE_TAGS) holder = 'thanos'
  } else {
    const player = sideStats(state, 'player').tags
    const tagsOf = (side: Side) => (side === 'thanos' ? thanos : player)
    if (holder !== 'none' && tagsOf(holder) < AVENGERS_TILE_TAGS) holder = 'none'
    if (holder !== 'none') {
      const other: Side = holder === 'thanos' ? 'player' : 'thanos'
      if (tagsOf(other) > tagsOf(holder)) holder = other
    } else if (Math.max(thanos, player) >= AVENGERS_TILE_TAGS && thanos !== player) {
      holder = thanos > player ? 'thanos' : 'player'
    }
  }
  if (holder === state.avengers) return state
  return {
    ...state,
    avengers: holder,
    log: [...state.log, { kind: 'avengers', round: state.round, holder, manual: false }],
  }
}

/**
 * Hard variant (#11; docs/automa.md → Hard variant): at the end of his turn Thanos claims a Location
 * his bonuses meet, at most one per turn. His bonuses come from the cards that count. If he meets
 * both, he takes the first entered at setup (docs/automa.md → Rulings this app uses).
 */
function claimLocation(state: GameState): GameState {
  const { variant, locations } = state.setup.settings
  if (variant !== 'hard') return state
  const bonuses = new Map<Stone, number>()
  for (const card of countedThanosCards(state)) {
    bonuses.set(card.colour, (bonuses.get(card.colour) ?? 0) + 1)
  }
  const index = locations.findIndex(
    (requirement, i) =>
      !state.thanosLocations.includes(i) &&
      STONES.every((stone) => (bonuses.get(stone) ?? 0) >= (requirement[stone] ?? 0)),
  )
  if (index < 0) return state
  return {
    ...state,
    thanosLocations: [...state.thanosLocations, index],
    log: [...state.log, { kind: 'thanosLocation', round: state.round, index }],
  }
}

function playerLocation(state: GameState): GameState {
  expectStep(state, 'player', 'playerLocation')
  expectLogged(state, 'playerLocation')
  if (state.setup.settings.variant === 'hard') {
    throw new GameRuleError('In the hard variant only Thanos claims Locations')
  }
  if (state.playerLocations >= LOCATIONS_IN_PLAY) {
    throw new GameRuleError(`Only ${LOCATIONS_IN_PLAY} Locations are in play`)
  }
  if (state.log.some((e) => e.kind === 'playerLocation' && e.round === state.round)) {
    throw new GameRuleError('At most one Location per turn')
  }
  return {
    ...state,
    playerLocations: state.playerLocations + 1,
    log: [...state.log, { kind: 'playerLocation', round: state.round }],
  }
}

function endRound(state: GameState, report: PlayerReport | undefined): GameState {
  if (report !== undefined) {
    if (isLogged(state)) throw new GameRuleError('Your cards are logged: the app checks your side')
    validateReport(report)
  }
  const result = roundResult(state, report)
  if (result) {
    return {
      ...state,
      step: 'over',
      result,
      playerReport: isLogged(state) ? null : (report ?? { gauntlet: false }),
      log: [...state.log, { kind: 'result', round: state.round, result }],
    }
  }
  const round = state.round + 1
  const settings = state.setup.settings
  const log = isPhaseStart(round, settings)
    ? [...state.log, { kind: 'phase' as const, round, phase: phaseOfRound(round, settings) }]
    : state.log
  return { ...state, round, step: 'reveal', log }
}

/**
 * End-of-round check (docs/automa.md → Playing a round, docs/rules.md → End of the game). When
 * your cards aren't logged, your side comes from your `report` (#15).
 */
export function roundResult(state: GameState, report?: PlayerReport): GameResult | null {
  const round = state.round
  const thanos = sideStats(state, 'thanos')
  const player = isLogged(state)
    ? sideStats(state, 'player')
    : { gauntlet: report?.gauntlet ?? false, points: report?.points, cardCount: report?.cards }
  if (thanos.gauntlet && player.gauntlet) {
    const win = (winner: Side, reason: ResultReason): GameResult => ({ winner, reason, round })
    if (state.setup.settings.ties === 'thanosWins') return win('thanos', 'thanosWinsTies')
    const { points, cardCount } = player
    if (points === undefined || cardCount === undefined) {
      throw new GameRuleError('The tiebreakers need your points and card count')
    }
    if (thanos.points !== points) {
      return win(thanos.points > points ? 'thanos' : 'player', 'morePoints')
    }
    if (state.avengers !== 'none') return win(state.avengers, 'avengersTile')
    if (thanos.cardCount !== cardCount) {
      return win(thanos.cardCount < cardCount ? 'thanos' : 'player', 'fewerCards')
    }
    return win('thanos', 'thanosWinsTies')
  }
  if (thanos.gauntlet) return { winner: 'thanos', reason: 'gauntlet', round }
  if (player.gauntlet) return { winner: 'player', reason: 'gauntlet', round }
  if (round >= roundLimit(state.setup.settings))
    return { winner: 'thanos', reason: 'roundLimit', round }
  return null
}

// ── helpers ──────────────────────────────────────────────────────────────────

function expectStep(state: GameState, step: Step, event: GameEvent['type']): void {
  if (state.step !== step) {
    throw new GameRuleError(`"${event}" is not allowed during the "${state.step}" step`)
  }
}

/** You log your own cards in this game (the default; #15). */
const isLogged = (state: GameState): boolean => state.setup.settings.logPlayerCards

function expectLogged(state: GameState, event: GameEvent['type']): void {
  if (!isLogged(state)) throw new GameRuleError(`"${event}" needs your cards logged`)
}

function validateReport(report: PlayerReport): void {
  if (typeof report.gauntlet !== 'boolean') throw new GameRuleError('Say whether you completed it')
  if (!report.gauntlet && (report.points !== undefined || report.cards !== undefined)) {
    throw new GameRuleError('Your totals are needed only with the Gauntlet')
  }
  const { points, cards } = report
  if (
    points !== undefined &&
    (!Number.isInteger(points) || points < GAUNTLET_POINTS || points > 99)
  ) {
    throw new GameRuleError(`Your points must be a whole number from ${GAUNTLET_POINTS} to 99`)
  }
  if (cards !== undefined && (!Number.isInteger(cards) || cards < STONES.length || cards > 99)) {
    throw new GameRuleError(`Your card count must be a whole number from ${STONES.length} to 99`)
  }
}

function validateCard(card: RecruitedCard): void {
  if (!STONES.includes(card.colour)) throw new GameRuleError(`Unknown colour: ${card.colour}`)
  if (![1, 2, 3].includes(card.level)) throw new GameRuleError(`Unknown level: ${card.level}`)
  if (!Number.isInteger(card.points) || card.points < 0 || card.points > 9) {
    throw new GameRuleError(`Points must be an integer from 0 to 9`)
  }
  if (!Number.isInteger(card.tags) || card.tags < 0 || card.tags > 2) {
    throw new GameRuleError(`Avengers tags must be 0, 1 or 2`)
  }
}

function cardsOf(state: GameState, side: Side): readonly RecruitedCard[] {
  return side === 'thanos' ? state.thanosCards : state.playerCards
}

function withCards(
  state: GameState,
  side: Side,
  cards: readonly RecruitedCard[],
  entry?: LogEntry,
): GameState {
  const log = entry ? [...state.log, entry] : state.log
  return side === 'thanos'
    ? { ...state, thanosCards: cards, log }
    : { ...state, playerCards: cards, log }
}

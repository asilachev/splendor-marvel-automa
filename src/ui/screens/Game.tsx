import { useState } from 'react'
import {
  currentRoundCard,
  discardCount,
  discardPreview,
  isPhaseStart,
  LOCATIONS_IN_PLAY,
  missingColours,
  roundLimit,
  sideStats,
  type AvengersHolder,
  type GainAction,
  type GameEvent,
  type GameState,
  type Level,
  type RecruitedCard,
  type Stone,
  type TakeAction,
} from '../../engine/index.ts'
import {
  AutomaCardView,
  MarketGrid,
  SideSummary,
  StoneRow,
  TokenStack,
  TurnTrack,
} from '../components/Board.tsx'
import { Segmented } from '../components/Choice.tsx'
import { StoneIcon, StonePicker } from '../components/Stone.tsx'
import {
  cardLabel,
  describeLog,
  numberOptions,
  PHASE_COLOUR,
  ROW_LABEL,
  slotOf,
  STONE_LABEL,
  stoneList,
} from '../format.ts'
import { useWakeLock } from '../state/useWakeLock.ts'
import { GameOver } from './GameOver.tsx'
import { Rules } from './Rules.tsx'
import styles from './screens.module.css'

type Dispatch = (event: GameEvent) => void

export function Game({
  state,
  canUndo,
  dispatch,
  onUndo,
  onHome,
  onNewGame,
}: {
  state: GameState
  canUndo: boolean
  dispatch: Dispatch
  onUndo: () => void
  onHome: () => void
  onNewGame: () => void
}) {
  const settings = state.setup.settings
  const over = state.step === 'over'
  const { phase } = currentRoundCard(state)
  const [fixingStack, setFixingStack] = useState(false)
  useWakeLock(!over)

  return (
    <main className={styles.screen}>
      <header className={styles.gameHeader}>
        <div className={styles.headerRow}>
          <button type="button" className={styles.ghost} onClick={onHome} aria-label="Home">
            ⌂
          </button>
          <div className={styles.roundInfo}>
            <span className={styles.round}>
              {state.round}
              <small> / {roundLimit(settings)}</small>
            </span>
            <span className={styles.phaseTag} data-phase={phase}>
              Phase {phase} · {PHASE_COLOUR[phase]}
            </span>
          </div>
          <button type="button" className={styles.ghost} onClick={onUndo} disabled={!canUndo}>
            Undo
          </button>
        </div>
        <TurnTrack round={state.round} settings={settings} over={over} />
      </header>

      <div className={styles.sides}>
        <SideSummary
          name="Thanos"
          stats={sideStats(state, 'thanos')}
          holdsTile={state.avengers === 'thanos'}
        />
        <SideSummary
          name="You"
          stats={sideStats(state, 'player')}
          holdsTile={state.avengers === 'player'}
        />
      </div>

      {over ? (
        <GameOver state={state} onUndo={onUndo} onNewGame={onNewGame} onHome={onHome} />
      ) : state.step === 'reveal' ? (
        <RevealStep state={state} dispatch={dispatch} />
      ) : state.step === 'thanos' ? (
        <ThanosTurn key={state.round} state={state} dispatch={dispatch} />
      ) : (
        <PlayerTurn key={state.round} state={state} dispatch={dispatch} />
      )}

      <section className={styles.box}>
        <div className={styles.boxHeader}>
          <h2>Thanos’s tokens ({state.stack.length})</h2>
          {!over ? (
            <button
              type="button"
              className={styles.ghost}
              onClick={() => setFixingStack((f) => !f)}
            >
              {fixingStack ? 'Done' : 'Fix'}
            </button>
          ) : null}
        </div>
        <TokenStack
          stack={state.stack}
          fixing={fixingStack && !over}
          onRemove={(index) => dispatch({ type: 'stackRemove', index })}
          onAdd={(stone) => dispatch({ type: 'stackAdd', stone })}
        />
      </section>

      {!over ? <Corrections state={state} dispatch={dispatch} /> : null}
      <GameLog state={state} />
      <Rules />
    </main>
  )
}

function RevealStep({ state, dispatch }: { state: GameState; dispatch: Dispatch }) {
  const { phase } = currentRoundCard(state)
  const reshuffled = isPhaseStart(state.round, state.setup.settings)
  return (
    <section className={styles.stage}>
      {reshuffled ? (
        <p className={styles.notice} role="status">
          Deck reshuffled. Phase {phase} begins: Thanos now reads the {PHASE_COLOUR[phase]} section.
        </p>
      ) : null}
      <button
        type="button"
        className={styles.cardBack}
        onClick={() => dispatch({ type: 'reveal' })}
      >
        <strong>Flip Thanos’s card</strong>
        <span>
          Thanos goes first. He reads the {PHASE_COLOUR[phase]} section ({phase}).
        </span>
      </button>
    </section>
  )
}

function ThanosTurn({ state, dispatch }: { state: GameState; dispatch: Dispatch }) {
  const { card, phase, action } = currentRoundCard(state)
  return (
    <section className={styles.stage} aria-label="Thanos’s turn">
      <AutomaCardView card={card} phase={phase} />
      <div className={styles.panel}>
        {action.kind === 'take' ? (
          <TakeStep action={action} dispatch={dispatch} />
        ) : (
          <GainStep state={state} action={action} dispatch={dispatch} />
        )}
      </div>
    </section>
  )
}

function TakeStep({ action, dispatch }: { action: TakeAction; dispatch: Dispatch }) {
  const [skipped, setSkipped] = useState<Stone[]>([])
  const taken = action.tokens.filter((s) => !skipped.includes(s))
  const toggle = (stone: Stone) =>
    setSkipped((list) =>
      list.includes(stone) ? list.filter((s) => s !== stone) : [...list, stone],
    )
  return (
    <>
      <p className={styles.instruction}>
        Thanos takes <strong>{taken.length ? stoneList(taken) : 'nothing'}</strong> and stacks them
        in that order.
      </p>
      <div className={styles.tokenToggles} role="group" aria-label="Tokens to take">
        {action.tokens.map((stone) => {
          const empty = skipped.includes(stone)
          return (
            <button
              key={stone}
              type="button"
              className={styles.tokenToggle}
              aria-pressed={!empty}
              onClick={() => toggle(stone)}
            >
              <StoneIcon stone={stone} size={34} hollow={empty} />
              <span>{STONE_LABEL[stone]}</span>
              <small>{empty ? 'pile empty' : 'take'}</small>
            </button>
          )
        })}
      </div>
      <p className={styles.hint}>
        Pile empty? Tap that token to skip it. Thanos has no 10-token limit.
      </p>
      <button
        type="button"
        className={styles.primary}
        onClick={() => dispatch({ type: 'thanosTake', skipped })}
      >
        {taken.length ? `Done · add ${taken.length} to his stack` : 'Done · nothing to take'}
      </button>
    </>
  )
}

type GainStage =
  | { readonly name: 'colour' }
  | { readonly name: 'substitute'; readonly target: Stone }
  | { readonly name: 'details'; readonly colour: Stone; readonly substituted: boolean }
  | { readonly name: 'nothing' }

function GainStep({
  state,
  action,
  dispatch,
}: {
  state: GameState
  action: GainAction
  dispatch: Dispatch
}) {
  const settings = state.setup.settings
  const slot = slotOf(action)
  const owned = sideStats(state, 'thanos').colours
  const missing = missingColours(state)
  const [stage, setStage] = useState<GainStage>({ name: 'colour' })
  const [slotEmpty, setSlotEmpty] = useState(false)
  const [points, setPoints] = useState(0)
  const [tags, setTags] = useState(0)

  const pickColour = (colour: Stone) =>
    setStage(
      owned.includes(colour) && missing.length > 0
        ? { name: 'substitute', target: colour }
        : { name: 'details', colour, substituted: false },
    )
  const markEmpty = () => {
    setSlotEmpty(true)
    if (settings.emptySlot === 'nothing') setStage({ name: 'nothing' })
  }
  const which = slotEmpty
    ? `the first card in row ${action.row} (from the left)`
    : `the card in ${slot}`

  return (
    <>
      <MarketGrid slot={slot} />
      <p className={styles.instruction}>
        Thanos recruits the card in <strong>{slot}</strong>, {ROW_LABEL[action.row]}.
      </p>
      <ReturnLine state={state} action={action} nothing={stage.name === 'nothing'} />

      {stage.name === 'colour' ? (
        <>
          {slotEmpty ? (
            <p className={styles.notice}>
              Slot {slot} is empty: use {which} instead.
            </p>
          ) : null}
          <p className={styles.question}>What colour is {which}?</p>
          <StonePicker label={`Colour of ${which}`} onPick={pickColour} />
          {!slotEmpty ? (
            <button type="button" className={styles.link} onClick={markEmpty}>
              Slot {slot} is empty
            </button>
          ) : (
            <button
              type="button"
              className={styles.link}
              onClick={() => setStage({ name: 'nothing' })}
            >
              Row {action.row} is empty: Thanos takes nothing
            </button>
          )}
        </>
      ) : null}

      {stage.name === 'substitute' ? (
        <>
          <p className={styles.notice}>
            Thanos already has <strong>{STONE_LABEL[stage.target]}</strong>. Scan row {action.row}{' '}
            from the left for the first card in a colour he lacks:{' '}
            <StoneRow stones={missing} size={18} />
          </p>
          <StonePicker
            label="Colour of the card Thanos takes instead"
            allowed={missing}
            onPick={(colour) => setStage({ name: 'details', colour, substituted: true })}
          />
          <button
            type="button"
            className={styles.link}
            onClick={() => setStage({ name: 'details', colour: stage.target, substituted: false })}
          >
            None in that row: he takes {slotEmpty ? 'that' : `the ${slot}`} card anyway
          </button>
        </>
      ) : null}

      {stage.name === 'details' ? (
        <>
          <p className={styles.chosen}>
            <StoneIcon stone={stage.colour} size={26} /> {STONE_LABEL[stage.colour]} card
            {stage.substituted ? ' (substitute)' : ''}
            <button
              type="button"
              className={styles.link}
              onClick={() => setStage({ name: 'colour' })}
            >
              change
            </button>
          </p>
          <Segmented
            label="Infinity points on the card"
            options={numberOptions(0, 5)}
            value={points}
            onChange={setPoints}
            compact
          />
          <Segmented
            label="Avengers tags on the card"
            options={numberOptions(0, 2)}
            value={tags}
            onChange={setTags}
            compact
          />
          <button
            type="button"
            className={styles.primary}
            onClick={() =>
              dispatch({
                type: 'thanosGain',
                card: { colour: stage.colour, points, tags },
                substituted: stage.substituted,
                slotEmpty,
              })
            }
          >
            Thanos takes it
          </button>
        </>
      ) : null}

      {stage.name === 'nothing' ? (
        <>
          <p className={styles.notice}>Thanos takes nothing this turn and returns no tokens.</p>
          <button
            type="button"
            className={styles.primary}
            onClick={() =>
              dispatch({ type: 'thanosGain', card: null, substituted: false, slotEmpty: true })
            }
          >
            Confirm
          </button>
          <button
            type="button"
            className={styles.link}
            onClick={() => setStage({ name: 'colour' })}
          >
            Back
          </button>
        </>
      ) : null}
    </>
  )
}

function ReturnLine({
  state,
  action,
  nothing,
}: {
  state: GameState
  action: GainAction
  nothing: boolean
}) {
  const n = discardCount(state, action)
  const returned = discardPreview(state)
  if (nothing || n === 0) return <p className={styles.hint}>No tokens to return.</p>
  if (returned.length === 0) {
    return (
      <p className={styles.hint}>
        His stack is empty, so nothing to return. He still takes the card.
      </p>
    )
  }
  return (
    <p className={styles.returnLine}>
      Return to the supply, oldest first: <StoneRow stones={returned} />
      {returned.length < n ? (
        <small>
          {' '}
          (only {returned.length} of {n}; he still takes the card)
        </small>
      ) : null}
    </p>
  )
}

/** What the table needs to do after Thanos's action this round. */
function thanosReminders(state: GameState): string[] {
  const entries = state.log.filter((e) => e.round === state.round)
  const out: string[] = []
  for (const e of entries) {
    if (e.kind === 'take') {
      out.push(e.taken.length ? `Thanos took ${stoneList(e.taken)}.` : 'Thanos took no tokens.')
      if (e.capped.length) out.push(`Stack cap: return ${stoneList(e.capped)} to the supply.`)
    } else if (e.kind === 'gain' && e.card) {
      if (e.returned.length) out.push(`Return ${stoneList(e.returned)} to the supply.`)
      out.push(
        `Thanos took ${cardLabel(e.card)}. Refill ${e.slotEmpty ? 'the market' : `slot ${e.slot}`} from the deck.`,
      )
      if (e.gotTime) out.push('Give Thanos a green Time token.')
    } else if (e.kind === 'avengers' && !e.manual && e.holder === 'thanos') {
      out.push('Move the Avengers Assemble tile to Thanos.')
    }
  }
  return out
}

function PlayerTurn({ state, dispatch }: { state: GameState; dispatch: Dispatch }) {
  const [logging, setLogging] = useState(false)
  const reminders = thanosReminders(state)
  const mine = state.log.filter((e) => e.kind === 'playerRecruit' && e.round === state.round)
  const tookLocation = state.log.some((e) => e.kind === 'playerLocation' && e.round === state.round)
  const canLocation = !tookLocation && state.playerLocations < LOCATIONS_IN_PLAY
  return (
    <section className={styles.stage} aria-label="Your turn">
      {reminders.length ? (
        <ul className={styles.reminders} aria-label="Do this on the table">
          {reminders.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      ) : null}
      <div className={styles.panel}>
        <h2 className={styles.panelTitle}>Your turn</h2>
        <p className={styles.hint}>
          Play your turn on the table. Log any card you recruit so the app can track your Gauntlet
          and the Avengers tile.
        </p>
        {mine.length ? (
          <ul className={styles.logged}>
            {mine.map((e, i) => (
              <li key={i}>{e.kind === 'playerRecruit' ? `Logged: ${cardLabel(e.card)}` : null}</li>
            ))}
          </ul>
        ) : null}
        {logging ? (
          <RecruitForm
            onAdd={(card) => {
              dispatch({ type: 'playerRecruit', card })
              setLogging(false)
            }}
            onCancel={() => setLogging(false)}
          />
        ) : (
          <div className={styles.row}>
            <button type="button" className={styles.secondary} onClick={() => setLogging(true)}>
              + Log a recruited card
            </button>
            <button
              type="button"
              className={styles.secondary}
              disabled={!canLocation}
              onClick={() => dispatch({ type: 'playerLocation' })}
            >
              {tookLocation ? 'Location logged' : '+ Location (3 pts)'}
            </button>
          </div>
        )}
        <button
          type="button"
          className={styles.primary}
          onClick={() => dispatch({ type: 'endRound' })}
        >
          End round {state.round}
        </button>
      </div>
    </section>
  )
}

function RecruitForm({
  onAdd,
  onCancel,
}: {
  onAdd: (card: RecruitedCard) => void
  onCancel: () => void
}) {
  const [level, setLevel] = useState<Level>(1)
  const [colour, setColour] = useState<Stone | null>(null)
  const [points, setPoints] = useState(0)
  const [tags, setTags] = useState(0)
  return (
    <div className={styles.form}>
      <Segmented<number>
        label="Level"
        options={numberOptions(1, 3)}
        value={level}
        onChange={(v) => setLevel(v as Level)}
        compact
      />
      <StonePicker label="Bonus colour" onPick={setColour} selected={colour} />
      <Segmented
        label="Infinity points"
        options={numberOptions(0, 5)}
        value={points}
        onChange={setPoints}
        compact
      />
      <Segmented
        label="Avengers tags"
        options={numberOptions(0, 2)}
        value={tags}
        onChange={setTags}
        compact
      />
      <div className={styles.row}>
        <button type="button" className={styles.ghost} onClick={onCancel}>
          Cancel
        </button>
        <button
          type="button"
          className={styles.secondary}
          disabled={colour === null}
          onClick={() => colour && onAdd({ level, colour, points, tags })}
        >
          Add card
        </button>
      </div>
    </div>
  )
}

function Corrections({ state, dispatch }: { state: GameState; dispatch: Dispatch }) {
  const sides = [
    ['thanos', 'Thanos’s cards', state.thanosCards],
    ['player', 'Your cards', state.playerCards],
  ] as const
  return (
    <details className={styles.details}>
      <summary>Corrections</summary>
      <Segmented<AvengersHolder>
        label="Avengers Assemble tile"
        value={state.avengers}
        onChange={(holder) => dispatch({ type: 'setAvengers', holder })}
        options={[
          { value: 'none', label: 'Middle' },
          { value: 'thanos', label: 'Thanos' },
          { value: 'player', label: 'You' },
        ]}
      />
      {sides.map(([side, title, cards]) => (
        <div key={side} className={styles.cardList}>
          <span className={styles.fieldLabel}>{title}</span>
          {cards.length === 0 ? <span className={styles.hint}>None yet</span> : null}
          {cards.map((card, index) => (
            <span key={index} className={styles.cardChip}>
              <StoneIcon stone={card.colour} size={16} /> {cardLabel(card)}
              <button
                type="button"
                className={styles.link}
                aria-label={`Remove ${cardLabel(card)}`}
                onClick={() => dispatch({ type: 'removeCard', side, index })}
              >
                remove
              </button>
            </span>
          ))}
        </div>
      ))}
      <p className={styles.hint}>To fix the last few steps, Undo is usually simpler.</p>
    </details>
  )
}

function GameLog({ state }: { state: GameState }) {
  if (state.log.length === 0) return null
  return (
    <details className={styles.details}>
      <summary>Game log</summary>
      <ol className={styles.log} reversed>
        {[...state.log].reverse().map((entry, i) => (
          <li key={state.log.length - i}>
            <span className={styles.logRound}>R{entry.round}</span> {describeLog(entry)}
          </li>
        ))}
      </ol>
    </details>
  )
}

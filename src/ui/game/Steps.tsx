import {
  Award,
  Ban,
  CircleCheck,
  CornerDownRight,
  Flag,
  MapPin,
  Rotate3d,
  SquarePlus,
  Swords,
  ArrowRight,
  Check,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import {
  currentRoundCard,
  discardCount,
  discardPreview,
  LOCATIONS_IN_PLAY,
  missingColours,
  phaseStarts,
  sideStats,
  type GainAction,
  type GameEvent,
  type GameState,
  type Stone,
  type TakeAction,
} from '../../engine/index.ts'
import { CardBack, MarketMap, MiniCard } from '../components/Cards.tsx'
import {
  Button,
  Caption,
  CheckItem,
  LinkButton,
  NumberChips,
  Panel,
  Speech,
  StonePicker,
} from '../components/Kit.tsx'
import { RuleTip } from '../components/RuleTip.tsx'
import { GemRow, Token } from '../components/Token.tsx'
import {
  cardLabel,
  describeResult,
  PHASE_COLOUR,
  recruitSpeech,
  resultHeadline,
  slotOf,
  STONE_LABEL,
  tableChecklist,
  takeSpeech,
} from '../format.ts'
import styles from './game.module.css'

export type Dispatch = (event: GameEvent) => void

/** Scrollable step content plus the pinned footer (primary action + dock). */
export function StepFrame({
  label,
  cta,
  dock,
  children,
}: {
  label: string
  cta?: ReactNode
  dock?: ReactNode
  children: ReactNode
}) {
  return (
    <>
      <main className={styles.scroll} aria-label={label}>
        {children}
      </main>
      <footer className={styles.footer}>
        {cta}
        {dock}
      </footer>
    </>
  )
}

const prefersReducedMotion = () =>
  typeof window.matchMedia !== 'function' ||
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** 2.1 — Thanos makes his move: tap the printed card back to reveal it. */
export function RevealStep({
  state,
  dispatch,
  dock,
}: {
  state: GameState
  dispatch: Dispatch
  dock: ReactNode
}) {
  const { phase } = currentRoundCard(state)
  const [flipping, setFlipping] = useState(false)
  const reveal = () => {
    if (flipping) return
    if (prefersReducedMotion()) return dispatch({ type: 'reveal' })
    setFlipping(true)
    window.setTimeout(() => dispatch({ type: 'reveal' }), 380)
  }
  return (
    <StepFrame
      label="Thanos’s turn"
      dock={dock}
      cta={
        <Button icon={<Rotate3d size={22} />} onClick={reveal}>
          REVEAL HIS CARD
        </Button>
      }
    >
      <span className={styles.centerCaption}>
        <Caption>{`PHASE ${phase} · ${PHASE_COLOUR[phase].toUpperCase()} SECTION`}</Caption>
      </span>
      <h1 className={styles.headline}>THANOS MAKES HIS MOVE</h1>
      <CardBack flipping={flipping} onFlip={reveal} />
      <p className={styles.hint}>
        He always goes first — then it’s your turn.
        <RuleTip title="Thanos’s turn">
          Each round Thanos flips the next automa card and does the action in the{' '}
          {PHASE_COLOUR[phase]} section. Then you play your turn on the table as normal.
        </RuleTip>
      </p>
    </StepFrame>
  )
}

/** 5.1 — Deck reshuffled at the start of phases 2 and 3. */
export function PhaseChangeStep({
  state,
  dispatch,
  dock,
}: {
  state: GameState
  dispatch: Dispatch
  dock: ReactNode
}) {
  const { card, phase } = currentRoundCard(state)
  const starts = phaseStarts(state.setup.settings)
  const end =
    phase === 3 ? state.round + (state.setup.settings.phaseLengths[2] - 1) : starts[phase]! - 1
  return (
    <StepFrame
      label="Phase change"
      dock={dock}
      cta={
        <Button icon={<Rotate3d size={22} />} onClick={() => dispatch({ type: 'reveal' })}>
          REVEAL HIS CARD
        </Button>
      }
    >
      <div className={styles.burst} data-phase={phase}>
        <h1 className={styles.burstTitle}>DECK RESHUFFLED!</h1>
        <span className={styles.burstSub}>PHASE {phase} BEGINS</span>
      </div>
      <div className={styles.centered}>
        <MiniCard card={card} phase={phase} />
      </div>
      <p className={styles.hint}>
        Rounds {state.round}–{end}: Thanos now reads the {PHASE_COLOUR[phase]} section of every
        automa card. Each card is used once per phase.
      </p>
    </StepFrame>
  )
}

/** 2.2 — Thanos takes tokens; tap a token if its pile is empty. */
export function TakeStep({
  state,
  action,
  dispatch,
  dock,
}: {
  state: GameState
  action: TakeAction
  dispatch: Dispatch
  dock: ReactNode
}) {
  const { card, phase } = currentRoundCard(state)
  const [skipped, setSkipped] = useState<Stone[]>([])
  const taken = action.tokens.filter((s) => !skipped.includes(s))
  const toggle = (s: Stone) =>
    setSkipped((list) => (list.includes(s) ? list.filter((x) => x !== s) : [...list, s]))
  return (
    <StepFrame
      label="Thanos takes tokens"
      dock={dock}
      cta={
        <Button
          icon={<Check size={22} />}
          onClick={() => dispatch({ type: 'thanosTake', skipped })}
        >
          {taken.length ? `DONE · ADD ${taken.length} TO HIS PILES` : 'DONE · NOTHING TO TAKE'}
        </Button>
      }
    >
      <div className={styles.head}>
        <Caption>THANOS TAKES TOKENS</Caption>
        <span className={styles.tag}>
          CARD {String(card.id).padStart(2, '0')} · PHASE {phase}
        </span>
      </div>
      <Panel className={styles.move}>
        <MiniCard card={card} phase={phase} />
        <div className={styles.say}>
          <Speech>{takeSpeech(action.tokens)}</Speech>
          <p className={styles.plain}>In printed order onto his piles. He has no 10-token limit.</p>
        </div>
      </Panel>
      <h2 className={styles.question}>
        TAP A TOKEN IF ITS PILE IS EMPTY
        <RuleTip title="Taking tokens">
          The numbers are the token board: 1 Power, 2 Mind, 3 Space, 4 Reality, 5 Soul. He takes
          them in printed order and skips any colour whose pile is empty.
        </RuleTip>
      </h2>
      <div className={styles.toggles} role="group" aria-label="Tokens to take">
        {action.tokens.map((s) => {
          const empty = skipped.includes(s)
          return (
            <button
              key={s}
              type="button"
              className={styles.toggle}
              aria-pressed={!empty}
              onClick={() => toggle(s)}
            >
              <Token stone={s} size={52} hollow={empty} />
              <span>{STONE_LABEL[s]}</span>
              <span className={styles.toggleState}>{empty ? 'PILE EMPTY' : 'TAKE'}</span>
            </button>
          )
        })}
      </div>
    </StepFrame>
  )
}

type Stage =
  | { readonly name: 'colour' }
  | { readonly name: 'substitute'; readonly target: Stone }
  | { readonly name: 'details'; readonly colour: Stone; readonly substituted: boolean }
  | { readonly name: 'nothing' }

/** 3.1–3.5 — Thanos recruits: which stone, substitution, empty slot, points & tags. */
export function RecruitStep({
  state,
  action,
  dispatch,
  dock,
}: {
  state: GameState
  action: GainAction
  dispatch: Dispatch
  dock: ReactNode
}) {
  const settings = state.setup.settings
  const { card } = currentRoundCard(state)
  const slot = slotOf(action)
  const owned = sideStats(state, 'thanos').colours
  const missing = missingColours(state)
  const n = discardCount(state, action)
  const returned = discardPreview(state)
  const [stage, setStage] = useState<Stage>({ name: 'colour' })
  const [slotEmpty, setSlotEmpty] = useState(false)
  const [points, setPoints] = useState(0)
  const [tags, setTags] = useState(0)

  const pick = (s: Stone) =>
    setStage(
      owned.includes(s) && missing.length > 0
        ? { name: 'substitute', target: s }
        : { name: 'details', colour: s, substituted: false },
    )
  const markEmpty = () => {
    setSlotEmpty(true)
    setStage(settings.emptySlot === 'nothing' ? { name: 'nothing' } : { name: 'colour' })
  }
  const confirm = () => {
    if (stage.name === 'details') {
      dispatch({
        type: 'thanosGain',
        card: { colour: stage.colour, points, tags },
        substituted: stage.substituted,
        slotEmpty,
      })
    } else if (stage.name === 'nothing') {
      dispatch({ type: 'thanosGain', card: null, substituted: false, slotEmpty: true })
    }
  }
  const row = action.row
  const speech = slotEmpty
    ? `${slot} IS EMPTY? THEN THE FIRST CARD OF THAT ROW.`
    : recruitSpeech(action)
  const plain = slotEmpty
    ? 'Your ruling: first card in the row, from the left. The colour rule still applies.'
    : `Level ${({ A: 3, B: 2, C: 1 } as const)[row]}, slot ${action.column} from the left. If he already has its colour, he takes the first card in that row in a colour he lacks.`

  return (
    <StepFrame
      label="Thanos recruits"
      dock={dock}
      cta={
        <Button
          icon={stage.name === 'nothing' ? <Ban size={22} /> : <Check size={22} />}
          disabled={stage.name !== 'details' && stage.name !== 'nothing'}
          onClick={confirm}
        >
          {stage.name === 'nothing' ? 'CONFIRM · HE TAKES NOTHING' : 'HE TAKES IT'}
        </Button>
      }
    >
      <div className={styles.head}>
        <Caption>THANOS RECRUITS</Caption>
        <span className={styles.tag}>
          CARD {String(card.id).padStart(2, '0')}
          {card.star ? ' ★' : ''} · RETURNS {n}
        </span>
      </div>
      <Panel className={styles.move}>
        <MarketMap slot={slot} empty={slotEmpty} />
        <div className={styles.say}>
          <Speech>{speech}</Speech>
          <p className={styles.plain}>{plain}</p>
        </div>
      </Panel>
      <div className={styles.pays}>
        <span className={styles.paysLabel}>
          <span className={styles.paysTitle}>
            {returned.length && stage.name !== 'nothing' ? 'HE RETURNS' : 'RETURNS NOTHING'}
          </span>
          <span className={styles.paysSub}>
            {stage.name === 'nothing'
              ? 'he takes nothing'
              : returned.length
                ? returned.length < n
                  ? `oldest first · only ${returned.length} of ${n}`
                  : 'oldest first'
                : n === 0
                  ? 'none printed'
                  : 'his piles are empty'}
          </span>
        </span>
        {returned.length && stage.name !== 'nothing' ? <GemRow gems={returned} size={30} /> : null}
        <span className={styles.supply}>
          <ArrowRight size={18} /> SUPPLY
        </span>
        <RuleTip title="Returning tokens">
          Tokens go back from the bottom of his piles, oldest first. He still takes the card if he
          can’t return them all, or any.
        </RuleTip>
      </div>

      {stage.name === 'substitute' ? (
        <>
          <h2 className={styles.question} data-tone="gold">
            HE ALREADY HAS {STONE_LABEL[stage.target].toUpperCase()}!
          </h2>
          <p className={styles.text}>
            Scan row {row} from the left: he takes the first card in a colour he lacks.
          </p>
          <StonePicker
            label="Colour of the card Thanos takes instead"
            allowed={missing}
            lacks={missing}
            onPick={(s) => setStage({ name: 'details', colour: s, substituted: true })}
          />
          <button
            type="button"
            className={styles.escape}
            onClick={() => setStage({ name: 'details', colour: stage.target, substituted: false })}
          >
            <CornerDownRight size={18} /> No such card in that row — he takes{' '}
            {slotEmpty ? 'that card' : slot} anyway
          </button>
        </>
      ) : stage.name === 'nothing' ? (
        <>
          <p className={styles.notice}>Thanos takes nothing this turn and returns no tokens.</p>
          <LinkButton onClick={() => setStage({ name: 'colour' })}>Back</LinkButton>
        </>
      ) : (
        <>
          <h2 className={styles.question}>
            {slotEmpty ? `WHICH STONE IS ON ROW ${row}’S FIRST CARD?` : 'WHICH STONE IS ON IT?'}
            <RuleTip title="Colour substitution">
              If he already has a card in that colour, he takes the first card in the same row (left
              to right) in a colour he lacks — none? then the original card.{' '}
              {settings.countedCards === 'all'
                ? 'Every card he has counts (Shamus’s clarification).'
                : 'Only his cards with points or Avengers tags count.'}
            </RuleTip>
          </h2>
          <StonePicker
            label={
              slotEmpty ? `Colour of the first card in row ${row}` : `Colour of the card in ${slot}`
            }
            selected={stage.name === 'details' ? stage.colour : null}
            onPick={pick}
          />
          {slotEmpty ? (
            <button
              type="button"
              className={styles.escape}
              data-tone="red"
              onClick={() => setStage({ name: 'nothing' })}
            >
              <Ban size={18} /> Row {row} is empty too — he takes nothing, returns nothing
            </button>
          ) : (
            <span>
              <LinkButton onClick={markEmpty}>Slot {slot} is empty</LinkButton>
              <RuleTip title="Empty slot">
                The PDF doesn’t cover this, so it’s a ruling:{' '}
                {settings.emptySlot === 'firstInRow'
                  ? 'he takes the first card in that row from the left instead.'
                  : 'he takes nothing and returns no tokens.'}
              </RuleTip>
            </span>
          )}
        </>
      )}

      <NumberChips
        label="Points"
        values={[0, 1, 2, 3, 4, 5]}
        value={points}
        onChange={setPoints}
        disabled={stage.name !== 'details'}
      />
      <NumberChips
        label="Avengers"
        values={[0, 1, 2]}
        value={tags}
        onChange={setTags}
        disabled={stage.name !== 'details'}
      />
    </StepFrame>
  )
}

/** 2.3 / 4.1 / 4.3 — at the table, then your move. */
export function TableStep({
  state,
  dispatch,
  dock,
  onLogCard,
}: {
  state: GameState
  dispatch: Dispatch
  dock: ReactNode
  onLogCard: () => void
}) {
  const items = tableChecklist(state)
  const [done, setDone] = useState<ReadonlySet<string>>(new Set())
  const toggle = (k: string) =>
    setDone((d) => (d.has(k) ? new Set([...d].filter((x) => x !== k)) : new Set([...d, k])))
  const thisRound = state.log.filter((e) => e.round === state.round)
  const recruits = thisRound.filter((e) => e.kind === 'playerRecruit')
  const tookLocation = thisRound.some((e) => e.kind === 'playerLocation')
  const canLocation = !tookLocation && state.playerLocations < LOCATIONS_IN_PLAY
  const tileToYou = thisRound.some(
    (e) => e.kind === 'avengers' && !e.manual && e.holder === 'player',
  )
  const logged = [
    ...recruits.map((e) => (e.kind === 'playerRecruit' ? cardLabel(e.card) : '')),
    ...(tookLocation ? ['Location +3'] : []),
  ]
  const ties =
    state.setup.settings.ties === 'thanosWins'
      ? 'If both complete the Gauntlet in the same round, Thanos wins (your ruling).'
      : 'If both complete the Gauntlet: more points wins, then the Avengers tile, then fewer cards — and Thanos wins any remaining tie.'
  return (
    <StepFrame
      label="Your turn"
      dock={dock}
      cta={
        <Button icon={<Flag size={22} />} onClick={() => dispatch({ type: 'endRound' })}>
          END ROUND {state.round}
        </Button>
      }
    >
      <Caption>AT THE TABLE</Caption>
      {items.length ? (
        <Panel className={styles.checklist}>
          {items.map((it) => (
            <CheckItem
              key={it.key}
              done={done.has(it.key)}
              onToggle={() => toggle(it.key)}
              extra={it.gems ? <GemRow gems={it.gems} size={22} /> : undefined}
            >
              {it.text}
            </CheckItem>
          ))}
        </Panel>
      ) : null}
      <Caption tone="blue">YOUR MOVE</Caption>
      <div className={styles.moveTiles}>
        <button type="button" className={styles.moveTile} onClick={onLogCard}>
          <SquarePlus size={26} />
          <strong>I RECRUITED</strong>
          <small>log the card</small>
        </button>
        <button
          type="button"
          className={styles.moveTile}
          data-done={tookLocation}
          disabled={!canLocation}
          onClick={() => dispatch({ type: 'playerLocation' })}
        >
          {tookLocation ? <CircleCheck size={26} /> : <MapPin size={26} />}
          <strong>{tookLocation ? 'LOCATION TAKEN' : 'I TOOK A LOCATION'}</strong>
          <small>{tookLocation ? '+3 · one per turn' : '+3 points'}</small>
        </button>
      </div>
      {logged.length ? (
        <div className={styles.logged}>
          <CircleCheck size={18} />
          <span>Logged: {logged.join(' · ')}</span>
        </div>
      ) : null}
      {tileToYou ? (
        <div className={styles.inlineToast} role="status">
          <Award size={20} />
          <span>You have more Avengers tags — the Avengers tile moves to you (+3).</span>
        </div>
      ) : null}
      <p className={styles.after}>
        Took tokens or reserved? Nothing to log. Then the app checks both sides for the Gauntlet.
        <RuleTip title="End of round">{ties}</RuleTip>
      </p>
    </StepFrame>
  )
}

/** 5.2–5.4 — game over. */
export function GameOverStep({
  state,
  onUndo,
  onNewGame,
  onHome,
}: {
  state: GameState
  onUndo: () => void
  onNewGame: () => void
  onHome: () => void
}) {
  if (!state.result) return null
  const { title, tone, tiebreak } = resultHeadline(state)
  const { text } = describeResult(state.result)
  const sides = [
    ['THANOS', sideStats(state, 'thanos'), state.result.winner === 'thanos'],
    ['YOU', sideStats(state, 'player'), state.result.winner === 'player'],
  ] as const
  return (
    <StepFrame label="Game over">
      {tiebreak ? (
        <span className={styles.centerCaption}>
          <Caption tone="red">TIEBREAKER</Caption>
        </span>
      ) : null}
      <section className={styles.result} data-tone={tone} aria-live="polite">
        <h1 className={styles.resultTitle}>{title}</h1>
        <p className={styles.resultText}>{text}</p>
      </section>
      <div className={styles.tallies}>
        {sides.map(([who, s, won]) => (
          <div key={who} className={styles.tally} data-winner={won && who === 'YOU'}>
            <span className={styles.tallyWho}>{who}</span>
            <span className={styles.tallyPts}>{s.points} PTS</span>
            <span className={styles.tallyMeta}>
              {s.colours.length} of 5 colours{s.hasTime ? ' + Time' : ''}
              {state.avengers === (who === 'YOU' ? 'player' : 'thanos') ? ' · Avengers tile' : ''}
            </span>
          </div>
        ))}
      </div>
      <div className={styles.actions}>
        <Button icon={<Swords size={22} />} onClick={onNewGame}>
          NEW GAME
        </Button>
        <Button variant="secondary" onClick={onUndo}>
          UNDO THE LAST STEP
        </Button>
        <LinkButton onClick={onHome}>Back to home</LinkButton>
      </div>
    </StepFrame>
  )
}

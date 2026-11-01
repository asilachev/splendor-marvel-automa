import {
  Award,
  Ban,
  Circle,
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
import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  currentRoundCard,
  discardCount,
  discardPreview,
  GAUNTLET_POINTS,
  LOCATIONS_IN_PLAY,
  missingColours,
  phaseStarts,
  sideStats,
  STONES,
  type GainAction,
  type GameEvent,
  type GameState,
  type PlayerReport,
  type Stone,
  type TakeAction,
} from '../../engine/index.ts'
import { CardBack, MarketMap, MiniCard } from '../components/Cards.tsx'
import {
  Button,
  Caption,
  CheckItem,
  Collapse,
  LinkButton,
  NumberChips,
  Options,
  Panel,
  Speech,
  Stepper,
  StonePicker,
} from '../components/Kit.tsx'
import { RuleTip } from '../components/RuleTip.tsx'
import { prefersReducedMotion } from '../motion.ts'
import { GemRow, Token } from '../components/Token.tsx'
import {
  cardLabel,
  describeResult,
  recruitSpeech,
  resultHeadline,
  slotOf,
  tableChecklist,
  takeSpeech,
} from '../format.ts'
import { useT } from '../i18n/index.ts'
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

/** 2.1 — Thanos makes his move: tap the printed card back to reveal it. */
export function RevealStep({
  state,
  dispatch,
  dock,
  onRevealed,
}: {
  state: GameState
  dispatch: Dispatch
  dock: ReactNode
  /** Called as the card is revealed, so the next step can finish the flip. */
  onRevealed?: () => void
}) {
  const t = useT()
  const { phase } = currentRoundCard(state)
  const [flipping, setFlipping] = useState(false)
  const done = () => {
    onRevealed?.()
    dispatch({ type: 'reveal' })
  }
  const reveal = () => {
    if (flipping) return
    if (prefersReducedMotion()) return done()
    setFlipping(true)
    window.setTimeout(done, 380)
  }
  return (
    <StepFrame
      label={t('reveal.label')}
      dock={dock}
      cta={
        <Button icon={<Rotate3d size={22} />} onClick={reveal}>
          {t('reveal.cta')}
        </Button>
      }
    >
      <span className={styles.centerCaption}>
        <Caption>{t('reveal.caption', { phase })}</Caption>
      </span>
      <h1 className={styles.headline}>{t('reveal.headline')}</h1>
      <CardBack flipping={flipping} onFlip={reveal} />
      <p className={styles.hint}>
        {t('reveal.hint')}
        <RuleTip title={t('reveal.tipTitle')}>{t('reveal.tip', { phase })}</RuleTip>
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
  const t = useT()
  const { card, phase } = currentRoundCard(state)
  const starts = phaseStarts(state.setup.settings)
  const end =
    phase === 3 ? state.round + (state.setup.settings.phaseLengths[2] - 1) : starts[phase]! - 1
  return (
    <StepFrame
      label={t('phaseChange.label')}
      dock={dock}
      cta={
        <Button icon={<Rotate3d size={22} />} onClick={() => dispatch({ type: 'reveal' })}>
          {t('reveal.cta')}
        </Button>
      }
    >
      <div className={styles.burst} data-phase={phase}>
        <h1 className={styles.burstTitle}>{t('phaseChange.title')}</h1>
        <span className={styles.burstSub}>{t('phaseChange.begins', { phase })}</span>
      </div>
      <div className={styles.centered}>
        <MiniCard card={card} phase={phase} />
      </div>
      <p className={styles.hint}>{t('phaseChange.hint', { from: state.round, to: end, phase })}</p>
    </StepFrame>
  )
}

/** 2.2 — Thanos takes tokens; tap a token if its pile is empty. */
export function TakeStep({
  state,
  action,
  dispatch,
  dock,
  entering = false,
}: {
  state: GameState
  action: TakeAction
  dispatch: Dispatch
  dock: ReactNode
  /** The card was just flipped: the mini card finishes the flip. */
  entering?: boolean
}) {
  const t = useT()
  const { card, phase } = currentRoundCard(state)
  const [skipped, setSkipped] = useState<Stone[]>([])
  const taken = action.tokens.filter((s) => !skipped.includes(s))
  const toggle = (s: Stone) =>
    setSkipped((list) => (list.includes(s) ? list.filter((x) => x !== s) : [...list, s]))
  return (
    <StepFrame
      label={t('take.label')}
      dock={dock}
      cta={
        <Button
          icon={<Check size={22} />}
          onClick={() => dispatch({ type: 'thanosTake', skipped })}
        >
          {t('take.cta', { n: taken.length })}
        </Button>
      }
    >
      <div className={styles.head}>
        <Caption>{t('take.caption')}</Caption>
        <span className={styles.tag}>
          {t('take.tag', { card: String(card.id).padStart(2, '0'), phase })}
        </span>
      </div>
      <Panel className={styles.move}>
        <MiniCard card={card} phase={phase} entering={entering} />
        <div className={styles.say}>
          <Speech>{takeSpeech(t, action.tokens)}</Speech>
          <p className={styles.plain}>{t('take.plain')}</p>
        </div>
      </Panel>
      <h2 className={styles.question}>
        {t('take.question')}
        <RuleTip title={t('take.tipTitle')}>{t('take.tip')}</RuleTip>
      </h2>
      <div className={styles.toggles} role="group" aria-label={t('take.group')}>
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
              <span>{t(`stone.${s}`)}</span>
              <span className={styles.toggleState}>
                {empty ? t('take.pileEmpty') : t('take.takeIt')}
              </span>
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
  const t = useT()
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
  // Points and tags become available once the colour is known; bring them into view if they
  // sit below the pinned button (#52). `nearest` means no scroll when they are visible.
  const details = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (stage.name !== 'details') return
    details.current?.scrollIntoView?.({
      block: 'nearest',
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    })
  }, [stage.name])

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
  const speech = slotEmpty ? t('recruit.speechEmpty', { slot }) : recruitSpeech(t, action)
  const plain = slotEmpty
    ? t('recruit.plainEmpty')
    : t('recruit.plain', { level: ({ A: 3, B: 2, C: 1 } as const)[row], column: action.column })

  return (
    <StepFrame
      label={t('recruit.label')}
      dock={dock}
      cta={
        <Button
          icon={stage.name === 'nothing' ? <Ban size={22} /> : <Check size={22} />}
          disabled={stage.name !== 'details' && stage.name !== 'nothing'}
          onClick={confirm}
        >
          {stage.name === 'nothing' ? t('recruit.ctaNothing') : t('recruit.cta')}
        </Button>
      }
    >
      <div className={styles.head}>
        <Caption>{t('recruit.caption')}</Caption>
        <span className={styles.tag}>
          {t('recruit.tag', { card: String(card.id).padStart(2, '0'), star: card.star, n })}
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
            {returned.length && stage.name !== 'nothing'
              ? t('recruit.returns')
              : t('recruit.returnsNothing')}
          </span>
          <span className={styles.paysSub}>
            {stage.name === 'nothing'
              ? t('recruit.takesNothingSub')
              : returned.length
                ? returned.length < n
                  ? t('recruit.onlyOf', { have: returned.length, n })
                  : t('recruit.oldestFirst')
                : n === 0
                  ? t('recruit.nonePrinted')
                  : t('recruit.pilesEmpty')}
          </span>
        </span>
        {returned.length && stage.name !== 'nothing' ? <GemRow gems={returned} size={30} /> : null}
        <span className={styles.supply}>
          <ArrowRight size={18} /> {t('recruit.supply')}
        </span>
        <RuleTip title={t('recruit.returningTipTitle')}>{t('recruit.returningTip')}</RuleTip>
      </div>

      {stage.name === 'substitute' ? (
        <div key="substitute" className={styles.stageBlock}>
          <h2 className={styles.question} data-tone="gold">
            {t('recruit.alreadyHas', { stone: t(`stone.${stage.target}`).toUpperCase() })}
          </h2>
          <p className={styles.text}>{t('recruit.scanRow', { row })}</p>
          <StonePicker
            label={t('recruit.insteadLabel')}
            allowed={missing}
            lacks={missing}
            onPick={(s) => setStage({ name: 'details', colour: s, substituted: true })}
          />
          <button
            type="button"
            className={styles.escape}
            onClick={() => setStage({ name: 'details', colour: stage.target, substituted: false })}
          >
            <CornerDownRight size={18} />{' '}
            {t('recruit.noSuchCard', { target: slotEmpty ? t('recruit.thatCard') : slot })}
          </button>
        </div>
      ) : stage.name === 'nothing' ? (
        <div key="nothing" className={styles.stageBlock}>
          <p className={styles.notice}>{t('recruit.nothingNotice')}</p>
          <LinkButton onClick={() => setStage({ name: 'colour' })}>{t('common.back')}</LinkButton>
        </div>
      ) : (
        <div key="pick" className={styles.stageBlock}>
          <h2 className={styles.question}>
            {slotEmpty ? t('recruit.questionEmpty', { row }) : t('recruit.question')}
            <RuleTip title={t('recruit.substitutionTipTitle')}>
              {t('recruit.substitutionTip', { allCount: settings.countedCards === 'all' })}
            </RuleTip>
          </h2>
          <StonePicker
            label={
              slotEmpty
                ? t('recruit.colourLabelEmpty', { row })
                : t('recruit.colourLabel', { slot })
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
              <Ban size={18} /> {t('recruit.rowEmpty', { row })}
            </button>
          ) : (
            <span>
              <LinkButton onClick={markEmpty}>{t('recruit.slotEmpty', { slot })}</LinkButton>
              <RuleTip title={t('recruit.emptySlotTipTitle')}>
                {t('recruit.emptySlotTip', { firstInRow: settings.emptySlot === 'firstInRow' })}
              </RuleTip>
            </span>
          )}
        </div>
      )}

      <div ref={details} className={styles.stageBlock}>
        <NumberChips
          label={t('recruit.points')}
          values={[0, 1, 2, 3, 4, 5]}
          value={points}
          onChange={setPoints}
          disabled={stage.name !== 'details'}
        />
        <NumberChips
          label={t('recruit.avengers')}
          values={[0, 1, 2]}
          value={tags}
          onChange={setTags}
          disabled={stage.name !== 'details'}
        />
      </div>
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
  const t = useT()
  const items = tableChecklist(t, state)
  const [done, setDone] = useState<ReadonlySet<string>>(new Set())
  const toggle = (k: string) =>
    setDone((d) => (d.has(k) ? new Set([...d].filter((x) => x !== k)) : new Set([...d, k])))
  const thisRound = state.log.filter((e) => e.round === state.round)
  const recruits = thisRound.filter((e) => e.kind === 'playerRecruit')
  // One card per turn, like the Location (docs/rules.md → A turn): once logged, the tile is done.
  // Undo brings it back. The engine still accepts more, so older saves keep loading (#99).
  const recruited = recruits.length > 0
  const tookLocation = thisRound.some((e) => e.kind === 'playerLocation')
  const canLocation = !tookLocation && state.playerLocations < LOCATIONS_IN_PLAY
  const tileToYou = thisRound.some(
    (e) => e.kind === 'avengers' && !e.manual && e.holder === 'player',
  )
  const logged = [
    ...recruits.map((e) => (e.kind === 'playerRecruit' ? cardLabel(t, e.card) : '')),
    ...(tookLocation ? [t('table.locationLogged')] : []),
  ]
  const settings = state.setup.settings
  const ties = t('table.ties', { thanosWins: settings.ties === 'thanosWins' })
  // Without your cards logged, you report the Gauntlet yourself (#15).
  const unlogged = !settings.logPlayerCards
  const hard = settings.variant === 'hard'
  const thanos = sideStats(state, 'thanos')
  const [gauntlet, setGauntlet] = useState(false)
  const [points, setPoints] = useState(GAUNTLET_POINTS)
  const [cards, setCards] = useState(Math.max(STONES.length, thanos.cardCount))
  const tiebreak =
    unlogged && gauntlet && thanos.gauntlet && settings.ties === 'tiebreakersThenThanos'
  const report: PlayerReport | null =
    unlogged && gauntlet ? (tiebreak ? { gauntlet, points, cards } : { gauntlet }) : null
  return (
    <StepFrame
      label={t('table.label')}
      dock={dock}
      cta={
        <Button
          icon={<Flag size={22} />}
          onClick={() => dispatch(report ? { type: 'endRound', report } : { type: 'endRound' })}
        >
          {t('table.cta', { round: state.round })}
        </Button>
      }
    >
      <Caption>{t('table.caption')}</Caption>
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
      <Caption tone="blue">{t('table.yourMove')}</Caption>
      {unlogged ? (
        <>
          <div className={styles.moveTiles}>
            <button
              type="button"
              role="checkbox"
              aria-checked={gauntlet}
              className={styles.moveTile}
              data-wide="true"
              data-done={gauntlet}
              onClick={() => setGauntlet((g) => !g)}
            >
              {gauntlet ? <CircleCheck size={26} /> : <Circle size={26} />}
              <strong>{t('table.gauntlet')}</strong>
              <small>{t('table.gauntletSub')}</small>
            </button>
          </div>
          <Options
            label={t('hoard.tile')}
            value={state.avengers}
            onChange={(holder) => dispatch({ type: 'setAvengers', holder })}
            options={[
              { value: 'none', label: t('hoard.tileOptions.none') },
              { value: 'thanos', label: t('hoard.tileOptions.thanos') },
              { value: 'player', label: t('hoard.tileOptions.player') },
            ]}
          />
          <Collapse open={tiebreak}>
            <div className={styles.tiebreak}>
              <Caption tone="red">{t('table.tiebreak')}</Caption>
              <p className={styles.tiebreakNote}>{t('table.tiebreakNote')}</p>
              <Stepper
                label={t('table.yourPoints')}
                value={points}
                min={GAUNTLET_POINTS}
                max={99}
                onChange={setPoints}
                hint={t('table.thanosHas', { n: thanos.points })}
              />
              <Stepper
                label={t('table.yourCards')}
                value={cards}
                min={STONES.length}
                max={99}
                onChange={setCards}
                hint={t('table.thanosHas', { n: thanos.cardCount })}
              />
            </div>
          </Collapse>
        </>
      ) : (
        <>
          <div className={styles.moveTiles}>
            <button
              type="button"
              className={styles.moveTile}
              data-wide={hard}
              data-done={recruited}
              disabled={recruited}
              onClick={onLogCard}
            >
              {recruited ? <CircleCheck size={26} /> : <SquarePlus size={26} />}
              <strong>{recruited ? t('table.recruitedDone') : t('table.recruited')}</strong>
              <small>{recruited ? t('table.recruitedDoneSub') : t('table.recruitedSub')}</small>
            </button>
            {/* In the hard variant only Thanos claims Locations (#11). */}
            {hard ? null : (
              <button
                type="button"
                className={styles.moveTile}
                data-done={tookLocation}
                disabled={!canLocation}
                onClick={() => dispatch({ type: 'playerLocation' })}
              >
                {tookLocation ? <CircleCheck size={26} /> : <MapPin size={26} />}
                <strong>{tookLocation ? t('table.locationTaken') : t('table.location')}</strong>
                <small>{tookLocation ? t('table.locationTakenSub') : t('table.locationSub')}</small>
              </button>
            )}
          </div>
          {logged.length ? (
            <div className={styles.logged}>
              <CircleCheck size={18} />
              <span>{t('table.logged', { items: logged.join(' · ') })}</span>
            </div>
          ) : null}
          {tileToYou ? (
            <div className={styles.inlineToast} role="status">
              <Award size={20} />
              <span>{t('table.tileToYou')}</span>
            </div>
          ) : null}
        </>
      )}
      <p className={styles.after}>
        {unlogged ? t('table.afterUnlogged') : t('table.after')}
        <RuleTip title={t('table.tipTitle')}>{ties}</RuleTip>
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
  const t = useT()
  if (!state.result) return null
  const { title, tone, tiebreak } = resultHeadline(t, state)
  const { text } = describeResult(t, state.result)
  const sides = [
    ['thanos', t('over.thanos'), sideStats(state, 'thanos'), state.result.winner === 'thanos'],
    ['player', t('over.you'), sideStats(state, 'player'), state.result.winner === 'player'],
  ] as const
  return (
    <StepFrame label={t('over.label')}>
      {tiebreak ? (
        <span className={styles.centerCaption}>
          <Caption tone="red">{t('over.tiebreaker')}</Caption>
        </span>
      ) : null}
      <section className={styles.result} data-tone={tone} aria-live="polite">
        <h1 className={styles.resultTitle}>{title}</h1>
        <p className={styles.resultText}>{text}</p>
      </section>
      <div className={styles.tallies}>
        {sides.map(([side, who, s, won]) => {
          // Without your cards logged, only what you reported is known about your side (#15).
          const unknown = side === 'player' && !state.setup.settings.logPlayerCards
          const reported = state.playerReport?.points
          return (
            <div key={side} className={styles.tally} data-winner={won && side === 'player'}>
              <span className={styles.tallyWho}>{who}</span>
              <span className={styles.tallyPts}>
                {!unknown
                  ? t('over.pts', { n: s.points })
                  : reported !== undefined
                    ? t('over.pts', { n: reported })
                    : t('over.ptsUnknown')}
              </span>
              <span className={styles.tallyMeta}>
                {unknown
                  ? t('over.unlogged', { tile: state.avengers === side })
                  : t('over.meta', {
                      colours: s.colours.length,
                      time: s.hasTime,
                      tile: state.avengers === side,
                    })}
              </span>
            </div>
          )
        })}
      </div>
      <div className={styles.actions}>
        <Button icon={<Swords size={22} />} onClick={onNewGame}>
          {t('over.newGame')}
        </Button>
        <Button variant="secondary" onClick={onUndo}>
          {t('over.undo')}
        </Button>
        <LinkButton onClick={onHome}>{t('over.home')}</LinkButton>
      </div>
    </StepFrame>
  )
}

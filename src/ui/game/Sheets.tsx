import {
  Award,
  ChevronRight,
  Flag,
  House,
  OctagonX,
  Plus,
  Shuffle,
  Skull,
  User,
  Wrench,
  X,
} from 'lucide-react'
import { useState } from 'react'
import {
  type GameState,
  type Level,
  type LogEntry,
  type RecruitedCard,
  type Stone,
} from '../../engine/index.ts'
import { TokenPiles } from '../components/Cards.tsx'
import { Credits } from '../components/Credits.tsx'
import {
  Button,
  Collapse,
  NumberChips,
  Options,
  Sheet,
  SheetLabel,
  StonePicker,
} from '../components/Kit.tsx'
import { Token } from '../components/Token.tsx'
import { cardLabel, describeLog } from '../format.ts'
import styles from './game.module.css'
import type { Dispatch } from './Steps.tsx'

/** 6.1 / 6.2 — Thanos's hoard: colour piles, his cards, fix mode. */
export function HoardSheet({
  state,
  dispatch,
  onClose,
}: {
  state: GameState
  dispatch: Dispatch
  onClose: () => void
}) {
  const [fixing, setFixing] = useState(false)
  return (
    <Sheet title="THANOS’S HOARD" onClose={onClose}>
      <div className={styles.sheetRow}>
        <SheetLabel>TOKENS · {state.stack.length}</SheetLabel>
        <Button variant="small" aria-pressed={fixing} onClick={() => setFixing((f) => !f)}>
          {fixing ? 'DONE' : 'FIX'}
        </Button>
      </div>
      <TokenPiles
        stack={state.stack}
        fixing={fixing}
        onRemove={(index) => dispatch({ type: 'stackRemove', index })}
        onAdd={(stone) => dispatch({ type: 'stackAdd', stone })}
      />
      <SheetLabel>CARDS · {state.thanosCards.length}</SheetLabel>
      <div className={styles.chipsWrap}>
        {state.thanosCards.length === 0 ? (
          <span className={styles.sheetNote}>No cards yet.</span>
        ) : null}
        {state.thanosCards.map((c, index) => (
          <span key={index} className={styles.cardChip}>
            <Token stone={c.colour} size={20} />
            {cardLabel(c)}
            {fixing ? (
              <button
                type="button"
                aria-label={`Remove ${cardLabel(c)}`}
                onClick={() => dispatch({ type: 'removeCard', side: 'thanos', index })}
              >
                <X size={14} />
              </button>
            ) : null}
          </span>
        ))}
      </div>
      {fixing ? (
        <Options
          paper
          label="Avengers Assemble tile"
          value={state.avengers}
          onChange={(holder) => dispatch({ type: 'setAvengers', holder })}
          options={[
            { value: 'none', label: 'MIDDLE' },
            { value: 'thanos', label: 'THANOS' },
            { value: 'player', label: 'YOU' },
          ]}
        />
      ) : null}
      <p className={styles.sheetNote}>
        {fixing
          ? 'Fix only when the table and the app disagree — Undo is simpler for the last few steps.'
          : 'Keep his tokens in colour piles on the table — the app remembers which go back first.'}
      </p>
    </Sheet>
  )
}

const LOG_ICON: Record<LogEntry['kind'], [typeof Skull, string]> = {
  take: [Skull, 'var(--purple)'],
  gain: [Skull, 'var(--purple)'],
  avengers: [Award, 'var(--green)'],
  playerRecruit: [User, 'var(--blue)'],
  playerLocation: [User, 'var(--blue)'],
  stackFix: [Wrench, '#6b5f86'],
  cardFix: [Wrench, '#6b5f86'],
  phase: [Shuffle, 'var(--gold-deep)'],
  result: [Flag, 'var(--red)'],
}

/** 6.3 — the game log, newest round first. */
export function LogSheet({ state, onClose }: { state: GameState; onClose: () => void }) {
  const rounds = [...new Set(state.log.map((e) => e.round))].sort((a, b) => b - a)
  return (
    <Sheet title="GAME LOG" onClose={onClose}>
      {rounds.length === 0 ? (
        <p className={styles.sheetNote}>Nothing yet — flip Thanos’s first card.</p>
      ) : null}
      {rounds.map((r) => (
        <section key={r} aria-label={`Round ${r}`}>
          <h3 className={styles.logRound}>
            ROUND {r}
            {r === state.round && state.step !== 'over' ? ' · NOW' : ''}
          </h3>
          {state.log
            .filter((e) => e.round === r)
            .reverse()
            .map((e, i) => {
              const [Icon, colour] = LOG_ICON[e.kind]
              return (
                <p key={i} className={styles.logEntry}>
                  <span
                    className={styles.logIcon}
                    style={{ background: colour }}
                    aria-hidden="true"
                  >
                    <Icon size={14} />
                  </span>
                  <span>{describeLog(e)}</span>
                </p>
              )
            })}
        </section>
      ))}
    </Sheet>
  )
}

const RULES: readonly [string, string][] = [
  [
    'Thanos’s turn',
    'Thanos goes first every round: flip the next automa card and do the action in the section for the current phase (green rounds 1–10, yellow 11–20, red 21–30). The deck is reshuffled between phases.',
  ],
  [
    'Taking tokens',
    'He takes the tokens shown, in printed order (1 Power, 2 Mind, 3 Space, 4 Reality, 5 Soul), onto his piles. Skip any colour whose pile is empty. He has no 10-token limit.',
  ],
  [
    'Recruiting & colour substitution',
    'He takes the card in the named slot (row A = level 3 on top, C = level 1 at the bottom; columns from the left). If he already has that colour, he takes the first card in the row in a colour he lacks; none? then the original.',
  ],
  [
    'Returning tokens (oldest first)',
    'When he recruits he returns the printed number of tokens, oldest first. He still takes the card if he can’t return them all, or any.',
  ],
  [
    'Avengers tile & Locations',
    'The first side with 3+ Avengers tags takes the Avengers Assemble tile (+3); only more tags take it away. Thanos never takes Locations.',
  ],
  [
    'Winning & tiebreakers',
    'At the end of a round, 16+ points, a bonus of every colour and the green Time token complete the Gauntlet. Ties: more points, then the Avengers tile, then fewer cards; then Thanos. After the last round without your Gauntlet, you lose.',
  ],
]

/** 6.4 — the menu: leave or end the game, then rules, settings, rulings and credits (#53). */
export function MenuSheet({
  state,
  wakeLock,
  onWakeLock,
  onClose,
  onHome,
  onEndGame,
}: {
  state: GameState
  wakeLock: boolean
  onWakeLock: (on: boolean) => void
  onClose: () => void
  onHome: () => void
  onEndGame: () => void
}) {
  const [open, setOpen] = useState<number | null>(null)
  const s = state.setup.settings
  return (
    <Sheet title="MENU" onClose={onClose}>
      <Button variant="secondary" icon={<House size={20} />} onClick={onHome}>
        BACK TO HOME · GAME SAVED
      </Button>
      <Button variant="quietDanger" icon={<OctagonX size={20} />} onClick={onEndGame}>
        END THIS GAME
      </Button>
      <SheetLabel>RULES</SheetLabel>
      <div>
        {RULES.map(([title, text], i) => (
          <div key={title} className={styles.ruleRow}>
            <button
              type="button"
              className={styles.ruleHead}
              aria-expanded={open === i}
              onClick={() => setOpen(open === i ? null : i)}
            >
              <span className={styles.ruleIcon} aria-hidden="true">
                i
              </span>
              <span className={styles.ruleTitle}>{title}</span>
              <ChevronRight size={16} className={styles.ruleChevron} />
            </button>
            <Collapse open={open === i}>
              <span className={styles.ruleBody}>{text}</span>
            </Collapse>
          </div>
        ))}
      </div>
      <SheetLabel>SETTINGS</SheetLabel>
      <div className={styles.setting}>
        <div>
          <strong>Keep the screen awake</strong>
          <small>during a game, so the phone doesn’t lock</small>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={wakeLock}
          aria-label="Keep the screen awake"
          className={styles.switch}
          onClick={() => onWakeLock(!wakeLock)}
        />
      </div>
      <SheetLabel>THIS GAME’S RULINGS</SheetLabel>
      <ul className={styles.rulings}>
        <li>
          {s.phaseLengths.join(' / ')} rounds per phase
          {s.stackCap ? ` · token cap ${s.stackCap}` : ''}
        </li>
        <li>
          Thanos’s cards that count:{' '}
          {s.countedCards === 'all' ? 'all (Shamus’s clarification)' : 'points/Avengers only'}
        </li>
        <li>Card 12, phase 3 returns {s.unprintedDiscard}</li>
        <li>
          Empty slot: {s.emptySlot === 'firstInRow' ? 'first card in the row' : 'he takes nothing'}
        </li>
        <li>
          Both complete the Gauntlet:{' '}
          {s.ties === 'thanosWins' ? 'Thanos wins' : 'tiebreakers, then Thanos'}
        </li>
      </ul>
      <Credits tone="paper" />
    </Sheet>
  )
}

/** 4.2 — log the card you recruited. */
export function LogCardSheet({
  onAdd,
  onClose,
}: {
  onAdd: (card: RecruitedCard) => void
  onClose: () => void
}) {
  const [level, setLevel] = useState<Level>(1)
  const [colour, setColour] = useState<Stone | null>(null)
  const [points, setPoints] = useState(0)
  const [tags, setTags] = useState(0)
  return (
    <Sheet title="LOG YOUR CARD" onClose={onClose}>
      <NumberChips
        paper
        label="Level"
        values={[1, 2, 3]}
        value={level}
        onChange={(v) => setLevel(v as Level)}
      />
      <SheetLabel>BONUS COLOUR</SheetLabel>
      <StonePicker paper label="Bonus colour" selected={colour} onPick={setColour} />
      <NumberChips
        paper
        label="Points"
        values={[0, 1, 2, 3, 4, 5]}
        value={points}
        onChange={setPoints}
      />
      <NumberChips paper label="Avengers" values={[0, 1, 2]} value={tags} onChange={setTags} />
      <p className={styles.sheetNote}>Level 3 cards also give you the green Time token.</p>
      <Button
        icon={<Plus size={22} />}
        disabled={colour === null}
        onClick={() => colour && onAdd({ level, colour, points, tags })}
      >
        ADD CARD
      </Button>
    </Sheet>
  )
}

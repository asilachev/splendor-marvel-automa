import {
  phaseOfRound,
  roundLimit,
  STONES,
  type AutomaAction,
  type AutomaCard,
  type Phase,
  type Settings,
  type SideStats,
  type Stone,
} from '../../engine/index.ts'
import { OFFICIAL_ART } from '../assets/official/index.ts'
import { STONE_LABEL, slotOf } from '../format.ts'
import styles from './components.module.css'
import { DiscardMark, StoneIcon, StoneWheel } from './Stone.tsx'

const tokenNumber = (stone: Stone) => STONES.indexOf(stone) + 1

/** One pip per round, coloured by phase; the current round glows gold. */
export function TurnTrack({
  round,
  settings,
  over,
}: {
  round: number
  settings: Settings
  over: boolean
}) {
  const limit = roundLimit(settings)
  return (
    <div className={styles.track} aria-hidden="true">
      {Array.from({ length: limit }, (_, i) => {
        const r = i + 1
        const done = r < round || (over && r <= round)
        return (
          <span
            key={r}
            className={styles.pip}
            data-phase={phaseOfRound(r, settings)}
            data-done={done}
            data-now={r === round && !over}
          />
        )
      })}
    </div>
  )
}

const CHECK = (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.check}>
    <path
      d="M4 12.5l5 5L20 6.5"
      fill="none"
      stroke="#21c55d"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

/** One section of an automa card, drawn like the printed card. */
function Section({ action, active }: { action: AutomaAction; active: boolean }) {
  if (action.kind === 'take') {
    return (
      <span className={styles.sectionBody} data-kind="take">
        <StoneWheel stones={action.tokens} size={active ? 52 : 40} />
        <span className={styles.takeNumbers}>{action.tokens.map(tokenNumber).join(',')}</span>
      </span>
    )
  }
  return (
    <span className={styles.sectionBody} data-kind="gain">
      <span className={styles.slotBadge}>
        {CHECK}
        {slotOf(action)}
      </span>
      {action.discard === null ? null : (
        <DiscardMark count={action.discard} size={active ? 52 : 40} />
      )}
    </span>
  )
}

/** The face of an automa card: three sections, the current phase's highlighted. */
export function AutomaCardFace({ card, phase }: { card: AutomaCard; phase: Phase }) {
  return (
    <div className={styles.automaCard} role="group" aria-label={`Automa card ${card.id}`}>
      {card.actions.map((action, i) => {
        const bandPhase = (i + 1) as Phase
        return (
          <div
            key={i}
            className={styles.band}
            data-active={bandPhase === phase}
            data-phase={bandPhase}
          >
            <span className={styles.bandNumber}>{bandPhase}</span>
            <Section action={action} active={bandPhase === phase} />
            {bandPhase === 3 ? (
              <>
                <span className={styles.cardNumber}>{String(card.id).padStart(2, '0')}</span>
                {card.star ? (
                  <span className={styles.cardStar} aria-label="Star card">
                    ★
                  </span>
                ) : null}
              </>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

/**
 * Thanos's card: the printed card back (official art, #30) that flips to the face when revealed.
 * One instance spans the reveal and resolve steps so the flip animates.
 */
export function AutomaCardFlip({
  card,
  phase,
  flipped,
  onFlip,
}: {
  card: AutomaCard
  phase: Phase
  flipped: boolean
  onFlip: () => void
}) {
  return (
    <div className={styles.flipScene}>
      <div className={styles.flipCard} data-flipped={flipped}>
        <div className={styles.cardBackFace} inert={flipped}>
          <button
            type="button"
            className={styles.cardBackButton}
            onClick={onFlip}
            aria-label="Flip Thanos’s card"
          >
            <img src={OFFICIAL_ART.cardBack} alt="" draggable={false} />
            <span className={styles.soloAutoma} aria-hidden="true">
              SOLO
              <br />
              AUTOMA
            </span>
          </button>
        </div>
        <div className={styles.cardFrontFace} inert={!flipped}>
          <AutomaCardFace card={card} phase={phase} />
        </div>
      </div>
    </div>
  )
}

/** The 3×4 market with the targeted slot highlighted. Row A is the top (level 3). */
export function MarketGrid({ slot }: { slot: string }) {
  return (
    <div className={styles.market} aria-label={`Market, slot ${slot} highlighted`} role="img">
      {(['A', 'B', 'C'] as const).map((row) => (
        <div key={row} className={styles.marketRow}>
          <span className={styles.marketLabel}>{row}</span>
          {[1, 2, 3, 4].map((col) => (
            <span key={col} className={styles.marketCell} data-hit={`${row}${col}` === slot}>
              {`${row}${col}` === slot ? slot : ''}
            </span>
          ))}
        </div>
      ))}
    </div>
  )
}

export function StoneRow({ stones, size = 22 }: { stones: readonly Stone[]; size?: number }) {
  return (
    <span className={styles.stoneRow}>
      {stones.map((stone, i) => (
        <span key={i} title={STONE_LABEL[stone]}>
          <StoneIcon stone={stone} size={size} />
        </span>
      ))}
    </span>
  )
}

const DISC = 34
const DISC_STEP = 7

/**
 * Thanos's tokens as colour piles, the way they sit on the table (#38). The automa still returns
 * the oldest tokens first, so a slim strip shows that order. Fix mode works per colour: − removes
 * his newest token of that colour, + adds one on top.
 */
export function TokenStack({
  stack,
  fixing,
  onRemove,
  onAdd,
}: {
  stack: readonly Stone[]
  fixing: boolean
  onRemove: (index: number) => void
  onAdd: (stone: Stone) => void
}) {
  const count = (stone: Stone) => stack.filter((s) => s === stone).length
  const summary = STONES.filter((s) => count(s) > 0)
    .map((s) => `${count(s)} ${STONE_LABEL[s]}`)
    .join(', ')
  return (
    <div>
      <div
        className={styles.piles}
        role="group"
        aria-label={`Thanos’s tokens: ${summary || 'none'}`}
      >
        {stack.length === 0 && !fixing ? <span className={styles.muted}>No tokens</span> : null}
        {STONES.map((stone) => {
          const n = count(stone)
          if (n === 0 && !fixing) return null
          return (
            <div
              key={stone}
              className={styles.pile}
              data-empty={n === 0}
              aria-label={`${n} ${STONE_LABEL[stone]}`}
            >
              <div
                className={styles.pileDiscs}
                style={{ height: DISC + Math.max(0, n - 1) * DISC_STEP }}
              >
                {Array.from({ length: Math.max(n, 1) }, (_, i) => (
                  <span key={i} className={styles.pileDisc} style={{ bottom: i * DISC_STEP }}>
                    <StoneIcon stone={stone} size={DISC} hollow={n === 0} />
                  </span>
                ))}
              </div>
              <span className={styles.pileCount}>×{n}</span>
              {fixing ? (
                <div className={styles.pileFix}>
                  <button
                    type="button"
                    aria-label={`Remove a ${STONE_LABEL[stone]} token`}
                    disabled={n === 0}
                    onClick={() => onRemove(stack.lastIndexOf(stone))}
                  >
                    −
                  </button>
                  <button
                    type="button"
                    aria-label={`Add a ${STONE_LABEL[stone]} token`}
                    onClick={() => onAdd(stone)}
                  >
                    +
                  </button>
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
      {stack.length > 0 ? (
        <div className={styles.order} aria-label="Return order, oldest first">
          <span>Returned first →</span>
          {stack.map((stone, i) => (
            <StoneIcon key={i} stone={stone} size={16} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

/** Points, colours, Time token, Avengers tags and tile for one side. */
export function SideSummary({
  name,
  side,
  stats,
  holdsTile,
}: {
  name: string
  side: 'thanos' | 'player'
  stats: SideStats
  holdsTile: boolean
}) {
  return (
    <div className={styles.side} data-side={side} data-gauntlet={stats.gauntlet}>
      <div className={styles.sideTop}>
        <strong className={styles.sideName}>{name}</strong>
        <span className={styles.points}>
          {stats.points}
          <small>/16</small>
        </span>
      </div>
      <div
        className={styles.sideStones}
        aria-label={`${name}: ${stats.colours.length} of 5 colours${stats.hasTime ? ' and the Time token' : ''}`}
      >
        {STONES.map((stone) => (
          <StoneIcon key={stone} stone={stone} size={22} hollow={!stats.colours.includes(stone)} />
        ))}
        <StoneIcon stone="time" size={22} hollow={!stats.hasTime} />
      </div>
      <div className={styles.sideMeta}>
        <span>
          {stats.tags} Avengers tag{stats.tags === 1 ? '' : 's'}
        </span>
        {holdsTile ? <span className={styles.tile}>Avengers tile</span> : null}
        {stats.gauntlet ? <span className={styles.ready}>Gauntlet ready</span> : null}
      </div>
    </div>
  )
}

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
import { STONE_LABEL, slotOf } from '../format.ts'
import styles from './components.module.css'
import { StoneIcon } from './Stone.tsx'

/** One pip per round, coloured by phase; the current round is outlined. */
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

function ActionSummary({ action, size }: { action: AutomaAction; size: number }) {
  if (action.kind === 'take') {
    return (
      <span className={styles.actionTokens}>
        {action.tokens.map((stone, i) => (
          <StoneIcon key={i} stone={stone} size={size} />
        ))}
        <span className={styles.actionText}>Take</span>
      </span>
    )
  }
  return (
    <span className={styles.actionTokens}>
      <span className={styles.slotBadge}>{slotOf(action)}</span>
      <span className={styles.actionText}>
        {action.discard === null ? 'no discard printed' : `return ${action.discard}`}
      </span>
    </span>
  )
}

/** The flipped automa card: all three sections, the current phase's highlighted. */
export function AutomaCardView({ card, phase }: { card: AutomaCard; phase: Phase }) {
  return (
    <div className={styles.automaCard} role="group" aria-label={`Automa card ${card.id}`}>
      {card.actions.map((action, i) => {
        const bandPhase = (i + 1) as Phase
        const active = bandPhase === phase
        return (
          <div key={i} className={styles.band} data-active={active} data-phase={bandPhase}>
            <span className={styles.bandNumber}>{bandPhase}</span>
            <ActionSummary action={action} size={active ? 30 : 18} />
          </div>
        )
      })}
      <span className={styles.cardId}>
        #{String(card.id).padStart(2, '0')}
        {card.star ? ' ★' : ''}
      </span>
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

/** Thanos's ordered stack: bottom (returned first) on the left. */
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
  return (
    <div>
      <div className={styles.stack} aria-label={`Thanos’s token stack, ${stack.length} tokens`}>
        {stack.length === 0 ? <span className={styles.muted}>No tokens</span> : null}
        {stack.map((stone, i) =>
          fixing ? (
            <button
              key={i}
              type="button"
              className={styles.stackToken}
              aria-label={`Remove ${STONE_LABEL[stone]} (position ${i + 1})`}
              onClick={() => onRemove(i)}
            >
              <StoneIcon stone={stone} size={26} />
            </button>
          ) : (
            <span key={i} className={styles.stackToken} title={STONE_LABEL[stone]}>
              <StoneIcon stone={stone} size={26} />
            </span>
          ),
        )}
      </div>
      <div className={styles.stackEnds}>
        <span>← bottom (returned first)</span>
        <span>top</span>
      </div>
      {fixing ? (
        <div className={styles.stackAdd} role="group" aria-label="Add a token on top">
          <span className={styles.muted}>Tap a token to remove it, or add on top:</span>
          {STONES.map((stone) => (
            <button
              key={stone}
              type="button"
              className={styles.stackToken}
              aria-label={`Add ${STONE_LABEL[stone]} on top`}
              onClick={() => onAdd(stone)}
            >
              <StoneIcon stone={stone} size={26} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

/** Points, colours, Time token, Avengers tags and tile for one side. */
export function SideSummary({
  name,
  stats,
  holdsTile,
}: {
  name: string
  stats: SideStats
  holdsTile: boolean
}) {
  return (
    <div className={styles.side} data-gauntlet={stats.gauntlet}>
      <div className={styles.sideTop}>
        <strong>{name}</strong>
        <span className={styles.points}>
          {stats.points}
          <small>/16</small>
        </span>
      </div>
      <div
        className={styles.sideStones}
        aria-label={`${name}: ${stats.colours.length} of 5 colours`}
      >
        {STONES.map((stone) => (
          <StoneIcon key={stone} stone={stone} size={18} hollow={!stats.colours.includes(stone)} />
        ))}
        <StoneIcon stone="time" size={18} hollow={!stats.hasTime} />
      </div>
      <div className={styles.sideMeta}>
        <span>
          {stats.tags} tag{stats.tags === 1 ? '' : 's'}
        </span>
        {holdsTile ? <span className={styles.tile}>Avengers tile</span> : null}
        {stats.gauntlet ? <span className={styles.ready}>Gauntlet ready</span> : null}
      </div>
    </div>
  )
}

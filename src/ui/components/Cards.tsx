import { Minus, Plus } from 'lucide-react'
import { STONES, type AutomaCard, type Phase, type Stone } from '../../engine/index.ts'
import { OFFICIAL_ART } from '../assets/official/index.ts'
import { sectionLabel, STONE_LABEL } from '../format.ts'
import styles from './game-kit.module.css'
import { Token } from './Token.tsx'

/** The printed automa card back (official art), tapped to reveal (design 2.1). */
export function CardBack({ flipping, onFlip }: { flipping: boolean; onFlip: () => void }) {
  return (
    <div className={styles.stage} data-flipping={flipping}>
      <button
        type="button"
        className={styles.cardBack}
        data-flipping={flipping}
        aria-label="Flip Thanos’s card"
        onClick={onFlip}
      >
        <img src={OFFICIAL_ART.cardBack} alt="" draggable={false} />
        <span className={styles.solo} aria-hidden="true">
          SOLO
          <br />
          AUTOMA
        </span>
      </button>
      <span className={styles.sticker} aria-hidden="true">
        TAP TO REVEAL!
      </span>
    </div>
  )
}

const PHASE_STRIP = ['var(--phase-1)', 'var(--phase-2)', 'var(--phase-3)']

/**
 * Small face of the automa card: three bands, the current phase lit. `entering` plays the second
 * half of the flip, only right after the card back was flipped (not on resume or undo).
 */
export function MiniCard({
  card,
  phase,
  entering = false,
}: {
  card: AutomaCard
  phase: Phase
  entering?: boolean
}) {
  return (
    <div
      className={styles.miniCard}
      data-entering={entering}
      role="img"
      aria-label={`Automa card ${card.id}, phase ${phase} section`}
    >
      {card.actions.map((action, i) => (
        <div key={i} className={styles.band} data-active={i + 1 === phase}>
          <span className={styles.bandStrip} style={{ background: PHASE_STRIP[i] }} />
          <span className={styles.bandBody}>{sectionLabel(action)}</span>
        </div>
      ))}
    </div>
  )
}

/** The 3×4 market with the target lit; row A (level 3) on top (design 3.1, 3.3). */
export function MarketMap({ slot, empty = false }: { slot: string; empty?: boolean }) {
  return (
    <div
      className={styles.market}
      role="img"
      aria-label={`Market, slot ${slot}${empty ? ' (empty)' : ''}`}
    >
      {(
        [
          ['A', 3],
          ['B', 2],
          ['C', 1],
        ] as const
      ).map(([row, level]) => (
        <div key={row} className={styles.marketRow}>
          <span className={styles.marketLevel}>L{level}</span>
          {[1, 2, 3, 4].map((col) => {
            const hit = `${row}${col}` === slot
            return (
              <span
                key={col}
                className={styles.marketCell}
                data-level={level}
                data-hit={hit}
                data-empty={empty}
              >
                {hit ? (empty ? '?' : slot) : ''}
              </span>
            )
          })}
        </div>
      ))}
    </div>
  )
}

const DISC = 42
const STEP = 9

/**
 * Thanos's tokens as colour piles, as on the table. The automa returns the oldest first, so a
 * strip shows that order. Fix mode works per colour: − removes his newest of that colour.
 */
export function TokenPiles({
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
  const count = (s: Stone) => stack.filter((x) => x === s).length
  const summary = STONES.filter((s) => count(s) > 0)
    .map((s) => `${count(s)} ${STONE_LABEL[s]}`)
    .join(', ')
  return (
    <>
      <div
        className={styles.piles}
        role="group"
        aria-label={`Thanos’s tokens: ${summary || 'none'}`}
      >
        {STONES.map((s) => {
          const n = count(s)
          if (n === 0 && !fixing) return null
          return (
            <div
              key={s}
              className={styles.pile}
              data-empty={n === 0}
              aria-label={`${n} ${STONE_LABEL[s]}`}
            >
              <div
                className={styles.pileDiscs}
                style={{ height: DISC + Math.max(0, n - 1) * STEP }}
              >
                {Array.from({ length: Math.max(n, 1) }, (_, i) => (
                  <span key={i} className={styles.pileDisc} style={{ bottom: i * STEP }}>
                    <Token stone={s} size={DISC} hollow={n === 0} />
                  </span>
                ))}
              </div>
              <span className={styles.pileCount}>×{n}</span>
              {fixing ? (
                <div className={styles.pileFix}>
                  <button
                    type="button"
                    aria-label={`Remove a ${STONE_LABEL[s]} token`}
                    disabled={n === 0}
                    onClick={() => onRemove(stack.lastIndexOf(s))}
                  >
                    <Minus size={16} />
                  </button>
                  <button
                    type="button"
                    aria-label={`Add a ${STONE_LABEL[s]} token`}
                    onClick={() => onAdd(s)}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              ) : null}
            </div>
          )
        })}
        {stack.length === 0 && !fixing ? <span className={styles.order}>No tokens yet</span> : null}
      </div>
      {stack.length > 0 ? (
        <div className={styles.order} aria-label="Return order, oldest first">
          <span>Returned first →</span>
          {stack.map((s, i) => (
            <Token key={i} stone={s} size={18} />
          ))}
        </div>
      ) : null}
    </>
  )
}

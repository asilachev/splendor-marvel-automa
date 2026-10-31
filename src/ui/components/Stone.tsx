import { STONES, type Stone } from '../../engine/index.ts'
import { STONE_LABEL } from '../format.ts'
import styles from './components.module.css'

type Gem = Stone | 'time'

/** White symbols drawn inside each token (24×24 box, centred on 12,12). */
const SYMBOLS: Readonly<Record<Gem, string>> = {
  power: 'M12 7.6a4.4 4.4 0 1 1 0 8.8a4.4 4.4 0 0 1 0-8.8z',
  mind: 'M9.4 7.5h5.2l2.6 4.5l-2.6 4.5H9.4L6.8 12z',
  space: 'M8 8h8v8H8z',
  reality: 'M12 6.8l5.2 9H6.8z',
  soul: 'M12 6.3l1.3 2.5l2.7-.8l-.8 2.7L17.7 12l-2.5 1.3l.8 2.7l-2.7-.8L12 17.7l-1.3-2.5l-2.7.8l.8-2.7L6.3 12l2.5-1.3l-.8-2.7l2.7.8z',
  time: 'M12 6.5l5.5 5.5l-5.5 5.5L6.5 12z',
}

/**
 * A stone as a game-like token: a coloured disc with a white symbol. The symbols keep the colours
 * distinguishable without colour vision. `hollow` shows a colour that isn't owned yet.
 */
export function StoneIcon({
  stone,
  size = 24,
  hollow = false,
}: {
  stone: Gem
  size?: number
  hollow?: boolean
}) {
  const colour = `var(--stone-${stone})`
  return (
    <svg
      className={styles.stoneIcon}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      data-hollow={hollow}
    >
      <circle
        cx="12"
        cy="12"
        r="10.6"
        fill={hollow ? 'rgb(255 255 255 / 4%)' : colour}
        stroke={hollow ? colour : 'rgb(0 0 0 / 55%)'}
        strokeWidth={hollow ? 1.4 : 1}
        strokeDasharray={hollow ? '2.6 2' : undefined}
      />
      {hollow ? null : (
        <>
          <circle
            cx="12"
            cy="12"
            r="8.4"
            fill="none"
            stroke="rgb(255 255 255 / 30%)"
            strokeWidth="0.8"
          />
          <ellipse cx="9" cy="6.6" rx="4.2" ry="2" fill="rgb(255 255 255 / 28%)" />
        </>
      )}
      <path
        d={SYMBOLS[stone]}
        fill="none"
        stroke={hollow ? colour : '#fff'}
        strokeWidth="1.5"
        strokeLinejoin="round"
        opacity={hollow ? 0.8 : 1}
      />
    </svg>
  )
}

/** A wheel split into one slice per stone, like the token wheels printed on the automa cards. */
export function StoneWheel({ stones, size = 40 }: { stones: readonly Stone[]; size?: number }) {
  const n = Math.max(stones.length, 1)
  const slice = (i: number) => {
    const a0 = (i / n) * 2 * Math.PI - Math.PI / 2
    const a1 = ((i + 1) / n) * 2 * Math.PI - Math.PI / 2
    const p = (a: number) => `${12 + 11 * Math.cos(a)} ${12 + 11 * Math.sin(a)}`
    return n === 1
      ? 'M12 1a11 11 0 1 1 0 22a11 11 0 0 1 0-22z'
      : `M12 12L${p(a0)}A11 11 0 0 1 ${p(a1)}z`
  }
  return (
    <svg
      className={styles.stoneIcon}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      {stones.map((stone, i) => (
        <path
          key={i}
          d={slice(i)}
          fill={`var(--stone-${stone})`}
          stroke="rgb(0 0 0 / 45%)"
          strokeWidth="0.6"
        />
      ))}
      <circle cx="12" cy="12" r="11" fill="none" stroke="rgb(255 255 255 / 55%)" strokeWidth="1" />
    </svg>
  )
}

/** The printed "return N tokens" mark: a five-colour wheel crossed out, with the number. */
export function DiscardMark({ count, size = 40 }: { count: number; size?: number }) {
  return (
    <span className={styles.discardMark} style={{ width: size, height: size }}>
      <StoneWheel stones={STONES} size={size} />
      <svg className={styles.discardCross} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 5l14 14M19 5L5 19" stroke="#e01e1e" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
      <span className={styles.discardCount}>{count}</span>
    </span>
  )
}

/** Five big stone buttons. `allowed` limits the choice (e.g. to colours Thanos lacks). */
export function StonePicker({
  onPick,
  allowed = STONES,
  selected,
  label,
}: {
  onPick: (stone: Stone) => void
  allowed?: readonly Stone[]
  selected?: Stone | null
  label: string
}) {
  return (
    <div className={styles.stonePicker} role="group" aria-label={label}>
      {STONES.map((stone, i) => (
        <button
          key={stone}
          type="button"
          className={styles.stoneButton}
          disabled={!allowed.includes(stone)}
          aria-pressed={selected === stone}
          onClick={() => onPick(stone)}
        >
          <StoneIcon stone={stone} size={34} />
          <span>{STONE_LABEL[stone]}</span>
          <small aria-hidden="true">{i + 1}</small>
        </button>
      ))}
    </div>
  )
}

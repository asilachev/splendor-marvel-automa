import { STONES, type Stone } from '../../engine/index.ts'
import { STONE_LABEL } from '../format.ts'
import styles from './components.module.css'

type Gem = Stone | 'time'

const SHAPES: Readonly<Record<Gem, string>> = {
  power: 'M12 3a9 9 0 1 1 0 18a9 9 0 0 1 0-18z',
  mind: 'M7 3.5h10l5 8.5l-5 8.5H7L2 12z',
  space: 'M5.5 3.5h13a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2z',
  reality: 'M12 2.5l10 18H2z',
  soul: 'M12 1.5l2.4 4.6l5.1-1.6l-1.6 5.1L22.5 12l-4.6 2.4l1.6 5.1l-5.1-1.6L12 22.5l-2.4-4.6l-5.1 1.6l1.6-5.1L1.5 12l4.6-2.4l-1.6-5.1l5.1 1.6z',
  time: 'M12 2l10 10l-10 10L2 12z',
}

/** A stone in its colour and shape, so colours stay distinguishable without colour vision. */
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
    >
      <path
        d={SHAPES[stone]}
        fill={hollow ? 'none' : colour}
        stroke={hollow ? colour : 'rgba(0,0,0,.55)'}
        strokeWidth={hollow ? 2 : 1.2}
        strokeLinejoin="round"
      />
    </svg>
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
      {STONES.map((stone) => (
        <button
          key={stone}
          type="button"
          className={styles.stoneButton}
          disabled={!allowed.includes(stone)}
          aria-pressed={selected === stone}
          onClick={() => onPick(stone)}
        >
          <StoneIcon stone={stone} size={30} />
          <span>{STONE_LABEL[stone]}</span>
        </button>
      ))}
    </div>
  )
}

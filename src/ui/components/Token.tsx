import type { ReactNode } from 'react'
import type { Gem } from '../format.ts'
import { STONE_LABEL } from '../format.ts'
import styles from './kit.module.css'

/** White symbols inside each token (24×24). Colour + symbol keeps stones distinguishable. */
const SYMBOL: Readonly<Record<Gem, ReactNode>> = {
  power: <circle cx="12" cy="12" r="4.6" />,
  mind: <path d="M9.4 7.4h5.2l2.6 4.6-2.6 4.6H9.4L6.8 12z" />,
  space: <rect x="7.6" y="7.6" width="8.8" height="8.8" rx="1.2" />,
  reality: <path d="M12 6.8l5.4 9.3H6.6z" />,
  soul: (
    <>
      <circle cx="12" cy="12" r="2.8" />
      <path d="M12 5.4v1.6M12 17v1.6M5.4 12H7M17 12h1.6M7.3 7.3l1.1 1.1M15.6 15.6l1.1 1.1M7.3 16.7l1.1-1.1M15.6 8.4l1.1-1.1" />
    </>
  ),
  time: <path d="M12 6.5l5.5 5.5-5.5 5.5L6.5 12z" />,
}

/** A stone as a game token: coloured disc, black outline, white symbol. Hollow = not owned. */
export function Token({
  stone,
  size = 40,
  hollow = false,
}: {
  stone: Gem
  size?: number
  hollow?: boolean
}) {
  const colour = `var(--stone-${stone})`
  return (
    <svg
      className={styles.token}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <circle
        cx="12"
        cy="12"
        r="10.8"
        fill={hollow ? 'transparent' : colour}
        stroke={hollow ? colour : '#000'}
        strokeWidth={hollow ? 1.4 : 1.6}
        opacity={hollow ? 0.75 : 1}
      />
      <g
        fill="none"
        stroke={hollow ? colour : '#fff'}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={hollow ? 0.75 : 1}
      >
        {SYMBOL[stone]}
      </g>
    </svg>
  )
}

export function GemRow({ gems, size = 22 }: { gems: readonly Gem[]; size?: number }) {
  return (
    <span className={styles.gemRow}>
      {gems.map((g, i) => (
        <span key={i} title={g === 'time' ? 'Time' : STONE_LABEL[g]}>
          <Token stone={g} size={size} />
        </span>
      ))}
    </span>
  )
}

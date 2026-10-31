import { BookOpen, Layers, ScrollText, Shield, Undo2 } from 'lucide-react'
import {
  roundLimit,
  STONES,
  sideStats,
  type GameState,
  type SideStats,
} from '../../engine/index.ts'
import { OFFICIAL_ART } from '../assets/official/index.ts'
import styles from './game-kit.module.css'
import { Token } from './Token.tsx'

const GAUNTLET = 16

function Fighter({ side, stats }: { side: 'thanos' | 'player'; stats: SideStats }) {
  const thanos = side === 'thanos'
  return (
    <div className={styles.fighter} data-mirrored={!thanos}>
      <span
        className={styles.portrait}
        data-side={side}
        aria-hidden="true"
        style={thanos ? { backgroundImage: `url(${OFFICIAL_ART.cardBack})` } : undefined}
      >
        {thanos ? null : <Shield size={22} />}
      </span>
      <span>
        <span className={styles.fighterName}>{thanos ? 'THANOS' : 'YOU'}</span>
        <span className={styles.fighterPoints}>
          {stats.points} / {GAUNTLET} PTS
        </span>
      </span>
    </div>
  )
}

function Bar({ stats, mirrored }: { stats: SideStats; mirrored: boolean }) {
  const pct = Math.min(stats.points, GAUNTLET) / GAUNTLET
  return (
    <div className={styles.bar} data-mirrored={mirrored} data-ready={stats.gauntlet}>
      <div className={styles.barFill} style={{ width: `${pct * 100}%` }} />
    </div>
  )
}

function Sockets({ stats, mirrored }: { stats: SideStats; mirrored: boolean }) {
  const gems = [
    ...STONES.map((s) => ({ gem: s, on: stats.colours.includes(s) })),
    { gem: 'time' as const, on: stats.hasTime },
  ]
  return (
    <div className={styles.socketRow}>
      {(mirrored ? [...gems].reverse() : gems).map(({ gem, on }) => (
        <Token key={gem} stone={gem} size={18} hollow={!on} />
      ))}
    </div>
  )
}

/** Fighting-game style header: the race to the Gauntlet at a glance (design: Versus HUD). */
export function VersusHud({ state }: { state: GameState }) {
  const thanos = sideStats(state, 'thanos')
  const player = sideStats(state, 'player')
  const limit = roundLimit(state.setup.settings)
  const over = state.step === 'over'
  const last = !over && state.round === limit
  const summary =
    `Round ${state.round} of ${limit}. Thanos ${thanos.points} points, ${thanos.colours.length} colours${thanos.hasTime ? ' and Time' : ''}. ` +
    `You ${player.points} points, ${player.colours.length} colours${player.hasTime ? ' and Time' : ''}.`
  return (
    <header className={styles.hud} aria-label={summary}>
      <div className={styles.fighters}>
        <Fighter side="thanos" stats={thanos} />
        <div className={styles.clock} data-last={last}>
          <strong>{over ? 'GAME OVER' : `ROUND ${state.round}`}</strong>
          <span>
            {over ? `ROUND ${state.round}` : last ? 'LAST ROUND' : `${limit - state.round} LEFT`}
          </span>
        </div>
        <Fighter side="player" stats={player} />
      </div>
      <div className={styles.bars}>
        <Bar stats={thanos} mirrored={false} />
        <Bar stats={player} mirrored />
      </div>
      <div className={styles.sockets}>
        <Sockets stats={thanos} mirrored={false} />
        <Sockets stats={player} mirrored />
      </div>
    </header>
  )
}

export type SheetName = 'hoard' | 'log' | 'rules'

/** The comic capsule dock: Undo, Hoard, Log, Rules. */
export function Dock({
  tokens,
  canUndo,
  open,
  onUndo,
  onOpen,
}: {
  tokens: number
  canUndo: boolean
  open: SheetName | null
  onUndo: () => void
  onOpen: (sheet: SheetName) => void
}) {
  const item = (sheet: SheetName, icon: React.ReactNode, label: string) => (
    <button
      type="button"
      className={styles.dockItem}
      aria-expanded={open === sheet}
      aria-haspopup="dialog"
      onClick={() => onOpen(sheet)}
    >
      {icon}
      {label}
    </button>
  )
  return (
    <nav className={styles.dock} aria-label="Game menu">
      <button type="button" className={styles.dockItem} disabled={!canUndo} onClick={onUndo}>
        <Undo2 size={22} />
        Undo
      </button>
      {item('hoard', <Layers size={22} />, `Hoard · ${tokens}`)}
      {item('log', <ScrollText size={22} />, 'Log')}
      {item('rules', <BookOpen size={22} />, 'Rules')}
    </nav>
  )
}

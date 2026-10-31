import { sideStats, type GameState } from '../../engine/index.ts'
import { SideSummary } from '../components/Board.tsx'
import { describeResult } from '../format.ts'
import styles from './screens.module.css'

export function GameOver({
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
  const { title, text } = describeResult(state.result)
  return (
    <section className={styles.result} data-winner={state.result.winner} aria-live="polite">
      <h2 className={styles.resultTitle}>{title}</h2>
      <p>{text}</p>
      <div className={styles.sides}>
        <SideSummary
          name="Thanos"
          side="thanos"
          stats={sideStats(state, 'thanos')}
          holdsTile={state.avengers === 'thanos'}
        />
        <SideSummary
          name="You"
          side="player"
          stats={sideStats(state, 'player')}
          holdsTile={state.avengers === 'player'}
        />
      </div>
      <div className={styles.actions}>
        <button type="button" className={styles.primary} onClick={onNewGame}>
          New game
        </button>
        <button type="button" className={styles.secondary} onClick={onUndo}>
          Undo the last step
        </button>
        <button type="button" className={styles.ghost} onClick={onHome}>
          Home
        </button>
      </div>
    </section>
  )
}

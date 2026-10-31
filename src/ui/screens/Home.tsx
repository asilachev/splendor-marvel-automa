import type { GameState } from '../../engine/index.ts'
import { describeResult } from '../format.ts'
import { Rules } from './Rules.tsx'
import styles from './screens.module.css'

export function Home({
  state,
  corruptSave,
  onContinue,
  onNewGame,
}: {
  state: GameState | null
  corruptSave: boolean
  onContinue: () => void
  onNewGame: () => void
}) {
  const inProgress = state !== null && state.step !== 'over'
  return (
    <main className={styles.home}>
      <header className={styles.hero}>
        <img src="favicon.svg" width="88" height="88" alt="" className={styles.logo} />
        <p className={styles.kicker}>Splendor Marvel · solo</p>
        <h1 className={styles.title}>Thanos Automa</h1>
        <p className={styles.lead}>
          Play Splendor Marvel solo against the fan-made Thanos automa. Your table holds the game;
          this app runs Thanos.
        </p>
      </header>

      {corruptSave ? (
        <p className={styles.notice} role="status">
          Your saved game couldn’t be read, so it was cleared.
        </p>
      ) : null}
      {state?.result ? (
        <p className={styles.notice}>
          Last game: <strong>{describeResult(state.result).title}</strong> in round{' '}
          {state.result.round}.
        </p>
      ) : null}

      <div className={styles.actions}>
        {inProgress ? (
          <button type="button" className={styles.primary} onClick={onContinue}>
            Continue · round {state.round}
          </button>
        ) : null}
        <button
          type="button"
          className={inProgress ? styles.secondary : styles.primary}
          onClick={onNewGame}
        >
          New game
        </button>
      </div>

      <Rules />
    </main>
  )
}

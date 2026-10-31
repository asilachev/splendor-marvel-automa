import type { GameState } from '../../engine/index.ts'
import { OFFICIAL_ART } from '../assets/official/index.ts'
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
        <img
          src={OFFICIAL_ART.logoBanner}
          width="534"
          height="121"
          alt="Splendor Marvel"
          className={styles.banner}
        />
        <div className={styles.heroCard} aria-hidden="true">
          <img src={OFFICIAL_ART.cardBack} alt="" />
          <span>
            SOLO
            <br />
            AUTOMA
          </span>
        </div>
        <h1 className={styles.title}>Thanos Automa</h1>
        <p className={styles.lead}>
          Face Thanos at your own table. Your physical game holds the market and your cards; this
          app flips his automa deck, keeps his tokens and checks the Infinity Gauntlet.
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

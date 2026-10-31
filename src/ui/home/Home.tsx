import { Play, Swords } from 'lucide-react'
import type { ReactNode } from 'react'
import type { GameState } from '../../engine/index.ts'
import { OFFICIAL_ART } from '../assets/official/index.ts'
import { Credits } from '../components/Credits.tsx'
import { Button } from '../components/Kit.tsx'
import { describeResult } from '../format.ts'
import styles from './home.module.css'

/** 1.1 / 1.2 — Home on first launch or with a saved game. */
export function Home({
  state,
  corruptSave,
  install,
  onContinue,
  onNewGame,
}: {
  state: GameState | null
  corruptSave: boolean
  install?: ReactNode
  onContinue: () => void
  onNewGame: () => void
}) {
  const inProgress = state !== null && state.step !== 'over'
  const firstLaunch = state === null
  return (
    <div className={styles.screen}>
      <main className={styles.scroll}>
        <div className={styles.logos} role="img" aria-label="Splendor Marvel">
          <img
            className={styles.splendor}
            src={OFFICIAL_ART.splendorLogo}
            width="640"
            height="233"
            alt=""
          />
          <img
            className={styles.marvel}
            src={OFFICIAL_ART.marvelLogo}
            width="360"
            height="145"
            alt=""
          />
        </div>
        <div className={styles.hero} aria-hidden="true">
          <div className={styles.heroCard}>
            <img src={OFFICIAL_ART.cardBack} alt="" />
            <span>
              SOLO
              <br />
              AUTOMA
            </span>
          </div>
        </div>
        <h1 className={styles.title}>THANOS AUTOMA</h1>
        <p className={styles.tagline}>
          Play Splendor Marvel solo. Your table holds the game — this app runs Thanos: his deck, his
          tokens, his race to the Gauntlet.
        </p>
        {firstLaunch ? (
          <div className={styles.steps}>
            {[
              ['1', 'Set up a 2-player game'],
              ['2', 'Flip his card each round'],
              ['3', 'Race him to the Gauntlet'],
            ].map(([n, t]) => (
              <div key={n} className={styles.step}>
                <strong>{n}</strong>
                {t}
              </div>
            ))}
          </div>
        ) : null}
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
        <Credits />
      </main>
      <footer className={styles.footer}>
        {install}
        {inProgress ? (
          <>
            <Button icon={<Play size={20} />} onClick={onContinue}>
              CONTINUE · ROUND {state.round}
            </Button>
            <Button variant="secondary" onClick={onNewGame}>
              NEW GAME
            </Button>
          </>
        ) : (
          <Button icon={<Swords size={22} />} onClick={onNewGame}>
            {firstLaunch ? 'START YOUR FIRST GAME' : 'NEW GAME'}
          </Button>
        )}
      </footer>
    </div>
  )
}

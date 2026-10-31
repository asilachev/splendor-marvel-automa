import { Globe, Play, Swords } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import type { GameState } from '../../engine/index.ts'
import { OFFICIAL_ART } from '../assets/official/index.ts'
import { Credits } from '../components/Credits.tsx'
import { Button, LinkButton, Sheet } from '../components/Kit.tsx'
import { LanguagePicker } from '../components/LanguagePicker.tsx'
import { describeResult } from '../format.ts'
import { LANGS, useI18n } from '../i18n/index.ts'
import styles from './home.module.css'

/** 1.1 / 1.2 — Home on first launch or with a saved game; the language picker sits on top. */
export function Home({
  state,
  firstLaunch,
  corruptSave,
  install,
  onContinue,
  onNewGame,
  onEndGame,
}: {
  state: GameState | null
  /** No game was ever started on this device. */
  firstLaunch: boolean
  corruptSave: boolean
  install?: ReactNode
  onContinue: () => void
  onNewGame: () => void
  /** Asks to end the game in progress (#53). */
  onEndGame: () => void
}) {
  const { t, lang } = useI18n()
  const h = t.home
  const [languages, setLanguages] = useState(false)
  const inProgress = state !== null && state.step !== 'over'
  const langName = LANGS.find((l) => l.code === lang)?.name ?? lang
  return (
    <div className={styles.screen}>
      <main className={styles.scroll}>
        <div className={styles.topBar}>
          <button
            type="button"
            className={styles.langButton}
            aria-label={t.language.change(langName)}
            aria-haspopup="dialog"
            onClick={() => setLanguages(true)}
          >
            <Globe size={16} aria-hidden="true" />
            {lang.toUpperCase()}
          </button>
        </div>
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
        <p className={styles.tagline}>{h.tagline}</p>
        {firstLaunch ? (
          <div className={styles.steps}>
            {h.steps.map((text, i) => (
              <div key={i} className={styles.step}>
                <strong>{i + 1}</strong>
                {text}
              </div>
            ))}
          </div>
        ) : null}
        {corruptSave ? (
          <p className={styles.notice} role="status">
            {h.corruptSave}
          </p>
        ) : null}
        {state?.result ? (
          <p className={styles.notice}>
            {h.lastGame} <strong>{describeResult(t, state.result).title}</strong>{' '}
            {h.lastGameRound(state.result.round)}
          </p>
        ) : null}
        <Credits />
      </main>
      <footer className={styles.footer}>
        {install}
        {inProgress ? (
          <>
            <Button icon={<Play size={20} />} onClick={onContinue}>
              {h.continue(state.round)}
            </Button>
            <Button variant="secondary" onClick={onNewGame}>
              {h.newGame}
            </Button>
            <LinkButton onClick={onEndGame}>{h.endGame}</LinkButton>
          </>
        ) : (
          <Button icon={<Swords size={22} />} onClick={onNewGame}>
            {firstLaunch ? h.firstGame : h.newGame}
          </Button>
        )}
      </footer>
      {languages ? (
        <Sheet title={t.language.title} onClose={() => setLanguages(false)}>
          <LanguagePicker paper />
        </Sheet>
      ) : null}
    </div>
  )
}

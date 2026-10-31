import { Globe, Play, Swords } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import type { GameState } from '../../engine/index.ts'
import { OFFICIAL_ART } from '../assets/official/index.ts'
import { Credits } from '../components/Credits.tsx'
import { Button, LinkButton } from '../components/Kit.tsx'
import { LanguageSheet } from '../components/LanguagePicker.tsx'
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
            aria-label={t('language.change', { name: langName })}
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
        <p className={styles.tagline}>{t('home.tagline')}</p>
        {firstLaunch ? (
          <div className={styles.steps}>
            {t.list('home.steps').map((text, i) => (
              <div key={i} className={styles.step}>
                <strong>{i + 1}</strong>
                {text}
              </div>
            ))}
          </div>
        ) : null}
        {corruptSave ? (
          <p className={styles.notice} role="status">
            {t('home.corruptSave')}
          </p>
        ) : null}
        {state?.result ? (
          <p className={styles.notice}>
            {t('home.lastGame')} <strong>{describeResult(t, state.result).title}</strong>{' '}
            {t('home.lastGameRound', { round: state.result.round })}
          </p>
        ) : null}
        <Credits />
      </main>
      <footer className={styles.footer}>
        {install}
        {inProgress ? (
          <>
            <Button icon={<Play size={20} />} onClick={onContinue}>
              {t('home.continue', { round: state.round })}
            </Button>
            <Button variant="secondary" onClick={onNewGame}>
              {t('home.newGame')}
            </Button>
            <LinkButton onClick={onEndGame}>{t('home.endGame')}</LinkButton>
          </>
        ) : (
          <Button icon={<Swords size={22} />} onClick={onNewGame}>
            {firstLaunch ? t('home.firstGame') : t('home.newGame')}
          </Button>
        )}
      </footer>
      {languages ? <LanguageSheet onClose={() => setLanguages(false)} /> : null}
    </div>
  )
}

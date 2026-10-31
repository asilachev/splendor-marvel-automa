import { Check, Maximize, Share, Smartphone, SquarePlus, Sun, WifiOff } from 'lucide-react'
import { Button, Sheet } from '../components/Kit.tsx'
import { APP_ICON } from './pwa.ts'
import styles from './pwa.module.css'

/** 7.2 — Chrome/Android: the Install card on Home while the browser offers to install. */
export function InstallCard({ onInstall }: { onInstall: () => void }) {
  return (
    <section className={styles.card} aria-label="Install Thanos Automa">
      <img className={styles.cardIcon} src={APP_ICON} width="48" height="48" alt="" />
      <div className={styles.cardText}>
        <strong>INSTALL THANOS AUTOMA</strong>
        <small>Full screen, offline, screen kept awake.</small>
      </div>
      <button type="button" className={styles.cardButton} onClick={onInstall}>
        INSTALL
      </button>
    </section>
  )
}

const BENEFITS = [
  [WifiOff, 'Works offline'],
  [Maximize, 'Full screen'],
  [Sun, 'Screen stays on'],
] as const

const STEPS = [
  [Share, 'Tap Share in Safari’s toolbar'],
  [SquarePlus, 'Choose “Add to Home Screen”'],
  [Smartphone, 'Open Thanos Automa from your home screen'],
] as const

/** 7.1 — iPhone/iPad Safari, not installed: how to add the app to the home screen. Shown once. */
export function InstallSheet({ onClose }: { onClose: () => void }) {
  return (
    <Sheet title="INSTALL THE APP" onClose={onClose}>
      <div className={styles.benefits}>
        {BENEFITS.map(([Icon, label]) => (
          <div key={label} className={styles.benefit}>
            <Icon size={20} aria-hidden="true" />
            {label}
          </div>
        ))}
      </div>
      <ol className={styles.steps}>
        {STEPS.map(([Icon, text], i) => (
          <li key={text}>
            <span className={styles.stepNumber} aria-hidden="true">
              {i + 1}
            </span>
            <span className={styles.stepText}>{text}</span>
            <Icon size={20} aria-hidden="true" />
          </li>
        ))}
      </ol>
      <Button icon={<Check size={22} />} onClick={onClose}>
        GOT IT
      </Button>
    </Sheet>
  )
}

/** 7.3 — the splash on launch from the home screen. */
export function Splash({ leaving }: { leaving: boolean }) {
  return (
    <div className={styles.splash} data-leaving={leaving} aria-hidden="true">
      <div className={styles.splashArt}>
        <img src={APP_ICON} width="132" height="132" alt="" />
      </div>
      <p className={styles.splashTitle}>THANOS AUTOMA</p>
      <p className={styles.splashSub}>Splendor Marvel · solo companion</p>
      <div className={styles.loader}>
        <span />
        <span />
        <span />
      </div>
    </div>
  )
}

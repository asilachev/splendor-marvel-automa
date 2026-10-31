import { Check, Maximize, Share, Smartphone, SquarePlus, Sun, WifiOff } from 'lucide-react'
import { Button, Sheet } from '../components/Kit.tsx'
import { useT } from '../i18n/index.ts'
import { APP_ICON } from './pwa.ts'
import styles from './pwa.module.css'

/** 7.2 — Chrome/Android: the Install card on Home while the browser offers to install. */
export function InstallCard({ onInstall }: { onInstall: () => void }) {
  const { pwa } = useT()
  return (
    <section className={styles.card} aria-label={pwa.cardLabel}>
      <img className={styles.cardIcon} src={APP_ICON} width="48" height="48" alt="" />
      <div className={styles.cardText}>
        <strong>{pwa.cardTitle}</strong>
        <small>{pwa.cardSub}</small>
      </div>
      <button type="button" className={styles.cardButton} onClick={onInstall}>
        {pwa.install}
      </button>
    </section>
  )
}

const BENEFIT_ICONS = [WifiOff, Maximize, Sun] as const
const STEP_ICONS = [Share, SquarePlus, Smartphone] as const

/** 7.1 — iPhone/iPad Safari, not installed: how to add the app to the home screen. Shown once. */
export function InstallSheet({ onClose }: { onClose: () => void }) {
  const { pwa } = useT()
  return (
    <Sheet title={pwa.sheetTitle} onClose={onClose}>
      <div className={styles.benefits}>
        {BENEFIT_ICONS.map((Icon, i) => (
          <div key={i} className={styles.benefit}>
            <Icon size={20} aria-hidden="true" />
            {pwa.benefits[i]}
          </div>
        ))}
      </div>
      <ol className={styles.steps}>
        {STEP_ICONS.map((Icon, i) => (
          <li key={i}>
            <span className={styles.stepNumber} aria-hidden="true">
              {i + 1}
            </span>
            <span className={styles.stepText}>{pwa.steps[i]}</span>
            <Icon size={20} aria-hidden="true" />
          </li>
        ))}
      </ol>
      <Button icon={<Check size={22} />} onClick={onClose}>
        {pwa.gotIt}
      </Button>
    </Sheet>
  )
}

/** 7.3 — the splash on launch from the home screen. */
export function Splash({ leaving }: { leaving: boolean }) {
  const { pwa } = useT()
  return (
    <div className={styles.splash} data-leaving={leaving} aria-hidden="true">
      <div className={styles.splashArt}>
        <img src={APP_ICON} width="132" height="132" alt="" />
      </div>
      <p className={styles.splashTitle}>THANOS AUTOMA</p>
      <p className={styles.splashSub}>{pwa.splashSub}</p>
      <div className={styles.loader}>
        <span />
        <span />
        <span />
      </div>
    </div>
  )
}

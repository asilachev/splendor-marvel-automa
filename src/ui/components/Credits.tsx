import { useT } from '../i18n/index.ts'
import styles from './credits.module.css'

/**
 * Always-visible credits and copyright notes (#35). Shown on Home and in the menu, never hidden
 * inside an accordion. Names stay as they are in every language (#54).
 */
export function Credits({ tone = 'dark' }: { tone?: 'dark' | 'paper' }) {
  const t = useT()
  return (
    <footer className={styles.credits} data-tone={tone} aria-label={t('credits.label')}>
      <h2 className={styles.title}>{t('credits.title')}</h2>
      <ul className={styles.list}>
        <li>
          <strong>{t('credits.game.name')}</strong>: {t('credits.game.text')}
        </li>
        <li>
          <strong>{t('credits.automa.name')}</strong>: {t('credits.automa.before')}{' '}
          <a href="https://boardgamegeek.com/filepage/201926" target="_blank" rel="noreferrer">
            Dukefanblue2005
          </a>{' '}
          {t('credits.automa.after')}
        </li>
        <li>
          <strong>{t('credits.fonts.name')}</strong>: {t('credits.fonts.text')}
        </li>
      </ul>
      <h2 className={styles.title}>{t('credits.copyrightTitle')}</h2>
      {t.list('credits.notices').map((notice) => (
        <p key={notice}>{notice}</p>
      ))}
    </footer>
  )
}

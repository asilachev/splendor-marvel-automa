import { useT } from '../i18n/index.ts'
import styles from './credits.module.css'

/**
 * Always-visible credits and copyright notes (#35). Shown on Home and in the menu, never hidden
 * inside an accordion. Names stay as they are in every language (#54).
 */
export function Credits({ tone = 'dark' }: { tone?: 'dark' | 'paper' }) {
  const { credits: c } = useT()
  return (
    <footer className={styles.credits} data-tone={tone} aria-label={c.label}>
      <h2 className={styles.title}>{c.title}</h2>
      <ul className={styles.list}>
        <li>
          <strong>{c.game.name}</strong>: {c.game.text}
        </li>
        <li>
          <strong>{c.automa.name}</strong>: {c.automa.before}{' '}
          <a href="https://boardgamegeek.com/filepage/201926" target="_blank" rel="noreferrer">
            Dukefanblue2005
          </a>{' '}
          {c.automa.after}
        </li>
        <li>
          <strong>{c.retheme.name}</strong>: {c.retheme.before}{' '}
          <a href="https://boardgamegeek.com/filepage/215783" target="_blank" rel="noreferrer">
            Shamus
          </a>{' '}
          {c.retheme.after}
        </li>
      </ul>
      <h2 className={styles.title}>{c.copyrightTitle}</h2>
      {c.notices.map((notice) => (
        <p key={notice}>{notice}</p>
      ))}
    </footer>
  )
}

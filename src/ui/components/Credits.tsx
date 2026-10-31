import styles from './credits.module.css'

/**
 * Always-visible credits and copyright notes (#35). Shown on Home and in the Rules sheet, never
 * hidden inside an accordion.
 */
export function Credits({ tone = 'dark' }: { tone?: 'dark' | 'paper' }) {
  return (
    <footer className={styles.credits} data-tone={tone} aria-label="Credits and copyright">
      <h2 className={styles.title}>Credits</h2>
      <ul className={styles.list}>
        <li>
          <strong>Splendor Marvel</strong>: game by Marc André, published by Space Cowboys (2020).
        </li>
        <li>
          <strong>Solo automa</strong>: designed by{' '}
          <a href="https://boardgamegeek.com/filepage/201926" target="_blank" rel="noreferrer">
            Dukefanblue2005
          </a>{' '}
          on BoardGameGeek.
        </li>
        <li>
          <strong>Marvel re-theme of the automa</strong>: by{' '}
          <a href="https://boardgamegeek.com/filepage/215783" target="_blank" rel="noreferrer">
            Shamus
          </a>{' '}
          on BoardGameGeek.
        </li>
      </ul>
      <h2 className={styles.title}>Copyright &amp; trademarks</h2>
      <p>
        Splendor and the Splendor logo are trademarks of Space Cowboys (Asmodee). Game rules and box
        artwork © 2020 Space Cowboys.
      </p>
      <p>MARVEL, the MARVEL logo and all related characters and names are ™ &amp; © MARVEL.</p>
      <p>
        The logos and the automa card back (box art © Space Cowboys and © MARVEL, card design by
        Shamus) are used for personal, non-commercial use only.
      </p>
      <p>
        Unofficial fan tool, not affiliated with or endorsed by Space Cowboys, Asmodee or Marvel.
        You need the physical game to play.
      </p>
    </footer>
  )
}

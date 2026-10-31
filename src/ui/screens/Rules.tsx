import styles from './screens.module.css'

/** Short rules reminder, in our own words. Full text: docs/rules.md, docs/automa.md. */
export function Rules() {
  return (
    <>
      <details className={styles.details}>
        <summary>Rules reminder</summary>
        <ul>
          <li>
            Win by having <strong>16+ points, all five colours and the green Time token</strong> at
            the end of a round, within 30 rounds. At the start of round 31 you lose.
          </li>
          <li>Thanos goes first each round. After your turn the app checks both sides.</li>
          <li>
            Rounds 1–10 use the green section of each automa card, 11–20 the yellow, 21–30 the red.
            The deck is reshuffled between phases.
          </li>
          <li>Taking tokens: in the printed order, onto the top of his stack. Skip empty piles.</li>
          <li>
            Gaining a card: if he already has its colour, he takes the first card in that row (left
            to right) with a colour he lacks. He returns tokens from the bottom of his stack, and
            gets the card even if he can’t return them all.
          </li>
          <li>
            Avengers tile: first to 3 tags takes it; only more tags take it away. Thanos never takes
            Locations.
          </li>
          <li>Ties: more points, then the Avengers tile, then fewer cards; then Thanos wins.</li>
        </ul>
      </details>
      <Credits />
    </>
  )
}

/** Always-visible credits and copyright notes (#35), shown under the rules reminder. */
export function Credits() {
  return (
    <footer className={styles.footer} aria-label="Credits and copyright">
      <h2 className={styles.footerTitle}>Credits</h2>
      <ul className={styles.footerList}>
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
      <h2 className={styles.footerTitle}>Copyright &amp; trademarks</h2>
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

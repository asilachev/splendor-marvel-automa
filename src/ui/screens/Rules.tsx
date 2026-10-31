import styles from './screens.module.css'

/** Short rules reminder and credits, in our own words. Full text: docs/rules.md, docs/automa.md. */
export function Rules() {
  return (
    <details className={styles.details}>
      <summary>Rules reminder &amp; credits</summary>
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
          Gaining a card: if he already has its colour, he takes the first card in that row (left to
          right) with a colour he lacks. He returns tokens from the bottom of his stack, and gets
          the card even if he can’t return them all.
        </li>
        <li>
          Avengers tile: first to 3 tags takes it; only more tags take it away. Thanos never takes
          Locations.
        </li>
        <li>Ties: more points, then the Avengers tile, then fewer cards; then Thanos wins.</li>
      </ul>
      <p className={styles.credit}>
        Unofficial fan tool. Splendor Marvel by Marc André, © Space Cowboys, © MARVEL. Solo automa
        by{' '}
        <a href="https://boardgamegeek.com/filepage/201926" target="_blank" rel="noreferrer">
          Dukefanblue2005
        </a>
        , Marvel re-theme by{' '}
        <a href="https://boardgamegeek.com/filepage/215783" target="_blank" rel="noreferrer">
          Shamus
        </a>{' '}
        (BoardGameGeek). You need the physical game to play.
      </p>
    </details>
  )
}

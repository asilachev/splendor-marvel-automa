import styles from './App.module.css'

export function App() {
  return (
    <main className={styles.home}>
      <header className={styles.header}>
        <p className={styles.kicker}>Splendor Marvel · solo</p>
        <h1 className={styles.title}>Thanos Automa</h1>
        <p className={styles.lead}>
          A companion for playing solo against the fan-made Thanos automa. Your table holds the
          game; this app runs Thanos.
        </p>
      </header>

      <div className={styles.actions}>
        <button type="button" className={styles.primary} disabled>
          New game · coming soon
        </button>
      </div>

      <footer className={styles.credits}>
        Unofficial fan project. Game by Marc André (Space Cowboys). Automa by Dukefanblue2005,
        Marvel re-theme by Shamus.
      </footer>
    </main>
  )
}

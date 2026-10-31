import { useState } from 'react'
import { PHASE_LENGTH_PRESETS, type PhaseLengths, type Settings } from '../../engine/index.ts'
import { Segmented } from '../components/Choice.tsx'
import styles from './screens.module.css'

type Preset = keyof typeof PHASE_LENGTH_PRESETS

const presetOf = (lengths: PhaseLengths): Preset =>
  (Object.keys(PHASE_LENGTH_PRESETS) as Preset[]).find(
    (key) => PHASE_LENGTH_PRESETS[key].join() === lengths.join(),
  ) ?? 'standard'

/** Physical setup for the 2-player game the automa uses (docs/rules.md → Setup). */
const CHECKLIST = [
  'Character decks by level, level 1 at the bottom; deal 4 cards face up per level',
  'Return 3 tokens of each colour to the box (4 of each left)',
  'Return 2 green Time tokens (2 left); keep all 5 grey S.H.I.E.L.D. tokens',
  '2 random Location tiles, plus the Avengers Assemble and Infinity Gauntlet tiles',
  'A spot for Thanos’s tokens: a loose pile is fine, the app remembers the order',
]

export function Setup({
  initial,
  onStart,
  onBack,
}: {
  initial: Settings
  onStart: (settings: Settings) => void
  onBack: () => void
}) {
  const [settings, setSettings] = useState<Settings>(initial)
  const set = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setSettings((s) => ({ ...s, [key]: value }))

  return (
    <main className={styles.screen}>
      <header className={styles.screenHeader}>
        <button type="button" className={styles.ghost} onClick={onBack}>
          ← Back
        </button>
        <h1 className={styles.screenTitle}>New game</h1>
      </header>

      <section className={styles.box}>
        <h2>Table setup (2 players)</h2>
        <ol className={styles.checklist}>
          {CHECKLIST.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </section>

      <section className={styles.box}>
        <h2>Difficulty</h2>
        <Segmented<Preset>
          label="Game length"
          value={presetOf(settings.phaseLengths)}
          onChange={(preset) => set('phaseLengths', PHASE_LENGTH_PRESETS[preset])}
          options={[
            { value: 'standard', label: '30 rounds', hint: '10/10/10 · as printed' },
            { value: 'shorter', label: '27', hint: '10/9/8 · harder' },
            { value: 'shortest', label: '24', hint: '8/8/8 · hardest' },
          ]}
        />
        <Segmented<number>
          label="Cap on Thanos’s token stack"
          value={settings.stackCap ?? 0}
          onChange={(cap) => set('stackCap', cap === 0 ? null : cap)}
          options={[
            { value: 0, label: 'No cap', hint: 'as printed' },
            { value: 12, label: '12 tokens', hint: 'community tweak' },
          ]}
        />
      </section>

      <details className={styles.details}>
        <summary>Rulings for gaps in the automa</summary>
        <p className={styles.hint}>Defaults follow the BGG clarifications (see docs/automa.md).</p>
        <Segmented<Settings['countedCards']>
          label="Which of Thanos’s cards count"
          value={settings.countedCards}
          onChange={(v) => set('countedCards', v)}
          options={[
            { value: 'all', label: 'All', hint: 'Shamus’s clarification' },
            { value: 'scoringOnly', label: 'Points/Avengers only', hint: 'as printed' },
          ]}
        />
        <Segmented<number>
          label="Card 12, phase 3: tokens to return"
          value={settings.unprintedDiscard}
          onChange={(v) => set('unprintedDiscard', v)}
          options={[
            { value: 0, label: '0', hint: 'none printed' },
            { value: 3, label: '3', hint: 'like the others' },
          ]}
        />
        <Segmented<Settings['emptySlot']>
          label="Targeted market slot is empty"
          value={settings.emptySlot}
          onChange={(v) => set('emptySlot', v)}
          options={[
            { value: 'firstInRow', label: 'First card in the row' },
            { value: 'nothing', label: 'He takes nothing' },
          ]}
        />
        <Segmented<Settings['ties']>
          label="Both complete the Gauntlet in the same round"
          value={settings.ties}
          onChange={(v) => set('ties', v)}
          options={[
            { value: 'tiebreakersThenThanos', label: 'Tiebreakers, then Thanos' },
            { value: 'thanosWins', label: 'Thanos wins' },
          ]}
        />
      </details>

      <div className={styles.actions}>
        <button type="button" className={styles.primary} onClick={() => onStart(settings)}>
          Start game
        </button>
      </div>
    </main>
  )
}

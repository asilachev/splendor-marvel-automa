import { useState } from 'react'
import { PHASE_LENGTH_PRESETS, type PhaseLengths, type Settings } from '../../engine/index.ts'
import { Segmented } from '../components/Choice.tsx'
import { RuleTip } from '../components/RuleTip.tsx'
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
          tip={
            <RuleTip title="Game length">
              A community tweak from BGG for the base-game automa: 10/9/8 (27 rounds) was “still too
              easy” and 8/8/8 (24) “pretty hard”.
            </RuleTip>
          }
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
          tip={
            <RuleTip title="Token cap">
              A community suggestion: cap Thanos’s stack at 12. The oldest tokens beyond the cap go
              back to the supply.
            </RuleTip>
          }
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
          tip={
            <RuleTip title="Which cards count">
              The PDF says to box his cards without points or Avengers tags, which breaks its own
              colour rule. Shamus clarified on BGG (2021): keep any card with a colour he needs,
              points or tags, so in effect every colour counts.
            </RuleTip>
          }
          value={settings.countedCards}
          onChange={(v) => set('countedCards', v)}
          options={[
            { value: 'all', label: 'All', hint: 'Shamus’s clarification' },
            { value: 'scoringOnly', label: 'Points/Avengers only', hint: 'as printed' },
          ]}
        />
        <Segmented<number>
          label="Card 12, phase 3: tokens to return"
          tip={
            <RuleTip title="Card 12">
              Card 12’s phase-3 section (“C1”) prints no number. The original base-game card is the
              same, so it’s probably intentional.
            </RuleTip>
          }
          value={settings.unprintedDiscard}
          onChange={(v) => set('unprintedDiscard', v)}
          options={[
            { value: 0, label: '0', hint: 'none printed' },
            { value: 3, label: '3', hint: 'like the others' },
          ]}
        />
        <Segmented<Settings['emptySlot']>
          label="Targeted market slot is empty"
          tip={
            <RuleTip title="Empty slot">
              Neither the PDF nor BGG covers this. “First card in the row” matches the left-to-right
              scan of the colour rule.
            </RuleTip>
          }
          value={settings.emptySlot}
          onChange={(v) => set('emptySlot', v)}
          options={[
            { value: 'firstInRow', label: 'First card in the row' },
            { value: 'nothing', label: 'He takes nothing' },
          ]}
        />
        <Segmented<Settings['ties']>
          label="Both complete the Gauntlet in the same round"
          tip={
            <RuleTip title="Ties">
              The PDF says to apply the normal winning conditions and that Thanos wins a draw. By
              default the official tiebreakers come first (points, Avengers tile, fewer cards), then
              Thanos wins what’s left.
            </RuleTip>
          }
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

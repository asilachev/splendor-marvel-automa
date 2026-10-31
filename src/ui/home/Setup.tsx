import { ArrowLeft, ChevronRight, Check, Swords } from 'lucide-react'
import { useState } from 'react'
import { PHASE_LENGTH_PRESETS, type PhaseLengths, type Settings } from '../../engine/index.ts'
import { Button, Caption, CheckItem, Options, Panel } from '../components/Kit.tsx'
import { RuleTip } from '../components/RuleTip.tsx'
import styles from './home.module.css'

type Preset = keyof typeof PHASE_LENGTH_PRESETS

const presetOf = (lengths: PhaseLengths): Preset =>
  (Object.keys(PHASE_LENGTH_PRESETS) as Preset[]).find(
    (k) => PHASE_LENGTH_PRESETS[k].join() === lengths.join(),
  ) ?? 'standard'

/** Physical setup for the 2-player game the automa uses (docs/rules.md → Setup). */
const TABLE = [
  'Deal 4 cards per level, level 1 at the bottom',
  'Keep 4 tokens of each colour, 2 green, all 5 grey',
  '2 random Location tiles + Avengers & Gauntlet tiles',
  'Leave space for Thanos’s colour piles',
]

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <header className={styles.header}>
      <button type="button" className={styles.back} aria-label="Back" onClick={onBack}>
        <ArrowLeft size={22} />
      </button>
      <h1 className={styles.screenTitle}>{title}</h1>
    </header>
  )
}

/** 1.3 — new game setup; 1.4 — rulings (a sub-screen). */
export function Setup({
  initial,
  onStart,
  onBack,
}: {
  initial: Settings
  onStart: (s: Settings) => void
  onBack: () => void
}) {
  const [settings, setSettings] = useState<Settings>(initial)
  const [rulings, setRulings] = useState(false)
  const [done, setDone] = useState<ReadonlySet<number>>(new Set())
  const set = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setSettings((s) => ({ ...s, [key]: value }))
  const changed =
    settings.countedCards !== 'all' ||
    settings.unprintedDiscard !== 0 ||
    settings.emptySlot !== 'firstInRow' ||
    settings.ties !== 'tiebreakersThenThanos'

  if (rulings) {
    return (
      <div className={styles.screen}>
        <main className={styles.scroll}>
          <Header title="RULINGS" onBack={() => setRulings(false)} />
          <p className={styles.intro}>
            The automa PDF leaves a few gaps. Defaults follow the BGG clarifications — change them
            if your table rules differ.
          </p>
          <Options
            label="Which of Thanos’s cards count"
            value={settings.countedCards}
            onChange={(v) => set('countedCards', v)}
            options={[
              { value: 'all', label: 'ALL', hint: 'Shamus’s clarification' },
              { value: 'scoringOnly', label: 'POINTS / AVENGERS', hint: 'as printed' },
            ]}
            tip={
              <RuleTip title="Which cards count">
                The PDF boxes his cards without points or Avengers tags, which breaks its own colour
                rule. Shamus clarified on BGG (2021): keep any card with a colour he needs — so in
                effect every colour counts.
              </RuleTip>
            }
          />
          <Options
            label="Card 12 · phase 3 returns"
            value={settings.unprintedDiscard}
            onChange={(v) => set('unprintedDiscard', v)}
            options={[
              { value: 0, label: '0', hint: 'none printed' },
              { value: 3, label: '3', hint: 'like the others' },
            ]}
            tip={
              <RuleTip title="Card 12">
                Its phase-3 section (“C1”) prints no number. The original base-game card is the
                same, so it’s probably intentional.
              </RuleTip>
            }
          />
          <Options
            label="Targeted slot is empty"
            value={settings.emptySlot}
            onChange={(v) => set('emptySlot', v)}
            options={[
              { value: 'firstInRow', label: 'FIRST IN ROW', hint: 'left to right' },
              { value: 'nothing', label: 'TAKES NOTHING' },
            ]}
            tip={
              <RuleTip title="Empty slot">
                Neither the PDF nor BGG covers this. “First in row” matches the left-to-right scan
                of the colour rule.
              </RuleTip>
            }
          />
          <Options
            label="Both complete the Gauntlet"
            value={settings.ties}
            onChange={(v) => set('ties', v)}
            options={[
              { value: 'tiebreakersThenThanos', label: 'TIEBREAKERS', hint: 'then Thanos' },
              { value: 'thanosWins', label: 'THANOS WINS' },
            ]}
            tip={
              <RuleTip title="Ties">
                The PDF says to apply the normal winning conditions and that Thanos wins a draw:
                official tiebreakers first (points, Avengers tile, fewer cards), then Thanos.
              </RuleTip>
            }
          />
        </main>
        <footer className={styles.footer}>
          <Button icon={<Check size={22} />} onClick={() => setRulings(false)}>
            SAVE RULINGS
          </Button>
        </footer>
      </div>
    )
  }

  return (
    <div className={styles.screen}>
      <main className={styles.scroll}>
        <Header title="NEW GAME" onBack={onBack} />
        <Caption>1 · SET UP THE TABLE</Caption>
        <Panel className={styles.checklist}>
          {TABLE.map((t, i) => (
            <CheckItem
              key={t}
              done={done.has(i)}
              onToggle={() =>
                setDone((d) =>
                  d.has(i) ? new Set([...d].filter((x) => x !== i)) : new Set([...d, i]),
                )
              }
            >
              {t}
            </CheckItem>
          ))}
        </Panel>
        <Caption tone="blue">2 · DIFFICULTY</Caption>
        <Options
          label="Game length"
          value={presetOf(settings.phaseLengths)}
          onChange={(p) => set('phaseLengths', PHASE_LENGTH_PRESETS[p])}
          options={[
            { value: 'standard', label: '30 ROUNDS', hint: 'as printed' },
            { value: 'shorter', label: '27', hint: 'harder' },
            { value: 'shortest', label: '24', hint: 'hardest' },
          ]}
          tip={
            <RuleTip title="Game length">
              A community tweak from BGG: 10/9/8 (27 rounds) was “still too easy”, 8/8/8 (24)
              “pretty hard”.
            </RuleTip>
          }
        />
        <Options
          label="Thanos’s token cap"
          value={settings.stackCap ?? 0}
          onChange={(c) => set('stackCap', c === 0 ? null : c)}
          options={[
            { value: 0, label: 'NO CAP', hint: 'as printed' },
            { value: 12, label: '12 TOKENS', hint: 'community tweak' },
          ]}
          tip={
            <RuleTip title="Token cap">
              A community suggestion: cap his tokens at 12; the oldest beyond the cap go back to the
              supply.
            </RuleTip>
          }
        />
        <button type="button" className={styles.rulingsRow} onClick={() => setRulings(true)}>
          <ChevronRight size={18} />
          <span>Rulings for gaps in the automa</span>
          <small>{changed ? 'customised' : 'defaults ✓'}</small>
        </button>
      </main>
      <footer className={styles.footer}>
        <Button icon={<Swords size={22} />} onClick={() => onStart(settings)}>
          START GAME
        </Button>
      </footer>
    </div>
  )
}

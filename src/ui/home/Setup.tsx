import { ArrowLeft, ChevronRight, Check, Swords } from 'lucide-react'
import { useLayoutEffect, useState } from 'react'
import { PHASE_LENGTH_PRESETS, type PhaseLengths, type Settings } from '../../engine/index.ts'
import { Button, Caption, CheckItem, Options, Panel } from '../components/Kit.tsx'
import { RuleTip } from '../components/RuleTip.tsx'
import { useT } from '../i18n/index.ts'
import styles from './home.module.css'

type Preset = keyof typeof PHASE_LENGTH_PRESETS

const presetOf = (lengths: PhaseLengths): Preset =>
  (Object.keys(PHASE_LENGTH_PRESETS) as Preset[]).find(
    (k) => PHASE_LENGTH_PRESETS[k].join() === lengths.join(),
  ) ?? 'standard'

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  const t = useT()
  return (
    <header className={styles.header}>
      <button type="button" className={styles.back} aria-label={t.common.back} onClick={onBack}>
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
  const t = useT()
  const u = t.setup
  const r = t.rulings
  const [settings, setSettings] = useState<Settings>(initial)
  const [rulings, setRulings] = useState(false)
  // The rulings sub-screen opens at its top, and so does setup when you come back (#52).
  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [rulings])
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
          <Header title={r.title} onBack={() => setRulings(false)} />
          <p className={styles.intro}>{r.intro}</p>
          <Options
            label={r.counted}
            value={settings.countedCards}
            onChange={(v) => set('countedCards', v)}
            options={[
              { value: 'all', ...r.countedOptions.all },
              { value: 'scoringOnly', ...r.countedOptions.scoringOnly },
            ]}
            tip={<RuleTip title={r.countedTip.title}>{r.countedTip.body}</RuleTip>}
          />
          <Options
            label={r.card12}
            value={settings.unprintedDiscard}
            onChange={(v) => set('unprintedDiscard', v)}
            options={[
              { value: 0, ...r.card12Options.zero },
              { value: 3, ...r.card12Options.three },
            ]}
            tip={<RuleTip title={r.card12Tip.title}>{r.card12Tip.body}</RuleTip>}
          />
          <Options
            label={r.emptySlot}
            value={settings.emptySlot}
            onChange={(v) => set('emptySlot', v)}
            options={[
              { value: 'firstInRow', ...r.emptySlotOptions.firstInRow },
              { value: 'nothing', ...r.emptySlotOptions.nothing },
            ]}
            tip={<RuleTip title={r.emptySlotTip.title}>{r.emptySlotTip.body}</RuleTip>}
          />
          <Options
            label={r.ties}
            value={settings.ties}
            onChange={(v) => set('ties', v)}
            options={[
              { value: 'tiebreakersThenThanos', ...r.tiesOptions.tiebreakers },
              { value: 'thanosWins', ...r.tiesOptions.thanosWins },
            ]}
            tip={<RuleTip title={r.tiesTip.title}>{r.tiesTip.body}</RuleTip>}
          />
        </main>
        <footer className={styles.footer}>
          <Button icon={<Check size={22} />} onClick={() => setRulings(false)}>
            {r.save}
          </Button>
        </footer>
      </div>
    )
  }

  return (
    <div className={styles.screen}>
      <main className={styles.scroll}>
        <Header title={u.title} onBack={onBack} />
        <Caption>{u.tableCaption}</Caption>
        <Panel className={styles.checklist}>
          {u.table.map((item, i) => (
            <CheckItem
              key={i}
              done={done.has(i)}
              onToggle={() =>
                setDone((d) =>
                  d.has(i) ? new Set([...d].filter((x) => x !== i)) : new Set([...d, i]),
                )
              }
            >
              {item}
            </CheckItem>
          ))}
        </Panel>
        <Caption tone="blue">{u.difficulty}</Caption>
        <Options
          label={u.length}
          value={presetOf(settings.phaseLengths)}
          onChange={(p) => set('phaseLengths', PHASE_LENGTH_PRESETS[p])}
          options={[
            { value: 'standard', ...u.lengthOptions.standard },
            { value: 'shorter', ...u.lengthOptions.shorter },
            { value: 'shortest', ...u.lengthOptions.shortest },
          ]}
          tip={<RuleTip title={u.lengthTip.title}>{u.lengthTip.body}</RuleTip>}
        />
        <Options
          label={u.cap}
          value={settings.stackCap ?? 0}
          onChange={(c) => set('stackCap', c === 0 ? null : c)}
          options={[
            { value: 0, ...u.capOptions.none },
            { value: 12, ...u.capOptions.twelve },
          ]}
          tip={<RuleTip title={u.capTip.title}>{u.capTip.body}</RuleTip>}
        />
        <button type="button" className={styles.rulingsRow} onClick={() => setRulings(true)}>
          <ChevronRight size={18} />
          <span>{u.rulingsRow}</span>
          <small>{changed ? u.customised : u.defaults}</small>
        </button>
      </main>
      <footer className={styles.footer}>
        <Button icon={<Swords size={22} />} onClick={() => onStart(settings)}>
          {u.start}
        </Button>
      </footer>
    </div>
  )
}

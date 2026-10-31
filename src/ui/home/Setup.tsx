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
      <button type="button" className={styles.back} aria-label={t('common.back')} onClick={onBack}>
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
          <Header title={t('rulings.title')} onBack={() => setRulings(false)} />
          <p className={styles.intro}>{t('rulings.intro')}</p>
          <Options
            label={t('rulings.counted')}
            value={settings.countedCards}
            onChange={(v) => set('countedCards', v)}
            options={[
              {
                value: 'all',
                label: t('rulings.countedOptions.all.label'),
                hint: t('rulings.countedOptions.all.hint'),
              },
              {
                value: 'scoringOnly',
                label: t('rulings.countedOptions.scoringOnly.label'),
                hint: t('rulings.countedOptions.scoringOnly.hint'),
              },
            ]}
            tip={
              <RuleTip title={t('rulings.countedTip.title')}>
                {t('rulings.countedTip.body')}
              </RuleTip>
            }
          />
          <Options
            label={t('rulings.card12')}
            value={settings.unprintedDiscard}
            onChange={(v) => set('unprintedDiscard', v)}
            options={[
              {
                value: 0,
                label: t('rulings.card12Options.zero.label'),
                hint: t('rulings.card12Options.zero.hint'),
              },
              {
                value: 3,
                label: t('rulings.card12Options.three.label'),
                hint: t('rulings.card12Options.three.hint'),
              },
            ]}
            tip={
              <RuleTip title={t('rulings.card12Tip.title')}>{t('rulings.card12Tip.body')}</RuleTip>
            }
          />
          <Options
            label={t('rulings.emptySlot')}
            value={settings.emptySlot}
            onChange={(v) => set('emptySlot', v)}
            options={[
              {
                value: 'firstInRow',
                label: t('rulings.emptySlotOptions.firstInRow.label'),
                hint: t('rulings.emptySlotOptions.firstInRow.hint'),
              },
              {
                value: 'nothing',
                label: t('rulings.emptySlotOptions.nothing.label'),
                hint: t('rulings.emptySlotOptions.nothing.hint'),
              },
            ]}
            tip={
              <RuleTip title={t('rulings.emptySlotTip.title')}>
                {t('rulings.emptySlotTip.body')}
              </RuleTip>
            }
          />
          <Options
            label={t('rulings.ties')}
            value={settings.ties}
            onChange={(v) => set('ties', v)}
            options={[
              {
                value: 'tiebreakersThenThanos',
                label: t('rulings.tiesOptions.tiebreakers.label'),
                hint: t('rulings.tiesOptions.tiebreakers.hint'),
              },
              {
                value: 'thanosWins',
                label: t('rulings.tiesOptions.thanosWins.label'),
                hint: t('rulings.tiesOptions.thanosWins.hint'),
              },
            ]}
            tip={<RuleTip title={t('rulings.tiesTip.title')}>{t('rulings.tiesTip.body')}</RuleTip>}
          />
        </main>
        <footer className={styles.footer}>
          <Button icon={<Check size={22} />} onClick={() => setRulings(false)}>
            {t('rulings.save')}
          </Button>
        </footer>
      </div>
    )
  }

  return (
    <div className={styles.screen}>
      <main className={styles.scroll}>
        <Header title={t('setup.title')} onBack={onBack} />
        <Caption>{t('setup.tableCaption')}</Caption>
        <Panel className={styles.checklist}>
          {t.list('setup.table').map((item, i) => (
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
        <Caption tone="blue">{t('setup.difficulty')}</Caption>
        <Options
          label={t('setup.length')}
          value={presetOf(settings.phaseLengths)}
          onChange={(p) => set('phaseLengths', PHASE_LENGTH_PRESETS[p])}
          options={[
            {
              value: 'standard',
              label: t('setup.lengthOptions.standard.label'),
              hint: t('setup.lengthOptions.standard.hint'),
            },
            {
              value: 'shorter',
              label: t('setup.lengthOptions.shorter.label'),
              hint: t('setup.lengthOptions.shorter.hint'),
            },
            {
              value: 'shortest',
              label: t('setup.lengthOptions.shortest.label'),
              hint: t('setup.lengthOptions.shortest.hint'),
            },
          ]}
          tip={<RuleTip title={t('setup.lengthTip.title')}>{t('setup.lengthTip.body')}</RuleTip>}
        />
        <Options
          label={t('setup.cap')}
          value={settings.stackCap ?? 0}
          onChange={(c) => set('stackCap', c === 0 ? null : c)}
          options={[
            {
              value: 0,
              label: t('setup.capOptions.none.label'),
              hint: t('setup.capOptions.none.hint'),
            },
            {
              value: 12,
              label: t('setup.capOptions.twelve.label'),
              hint: t('setup.capOptions.twelve.hint'),
            },
          ]}
          tip={<RuleTip title={t('setup.capTip.title')}>{t('setup.capTip.body')}</RuleTip>}
        />
        <button type="button" className={styles.rulingsRow} onClick={() => setRulings(true)}>
          <ChevronRight size={18} />
          <span>{t('setup.rulingsRow')}</span>
          <small>{changed ? t('setup.customised') : t('setup.defaults')}</small>
        </button>
      </main>
      <footer className={styles.footer}>
        <Button icon={<Swords size={22} />} onClick={() => onStart(settings)}>
          {t('setup.start')}
        </Button>
      </footer>
    </div>
  )
}

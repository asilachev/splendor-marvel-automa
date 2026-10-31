import {
  Award,
  ChevronRight,
  Flag,
  House,
  OctagonX,
  Plus,
  Shuffle,
  Skull,
  User,
  Wrench,
  X,
} from 'lucide-react'
import { useState } from 'react'
import {
  type GameState,
  type Level,
  type LogEntry,
  type RecruitedCard,
  type Stone,
} from '../../engine/index.ts'
import { TokenPiles } from '../components/Cards.tsx'
import { Credits } from '../components/Credits.tsx'
import {
  Button,
  Collapse,
  NumberChips,
  Options,
  Sheet,
  SheetLabel,
  StonePicker,
} from '../components/Kit.tsx'
import { LanguageSheet } from '../components/LanguagePicker.tsx'
import { Token } from '../components/Token.tsx'
import { cardLabel, describeLog } from '../format.ts'
import { LANGS, useI18n, useT } from '../i18n/index.ts'
import styles from './game.module.css'
import type { Dispatch } from './Steps.tsx'

/** 6.1 / 6.2 — Thanos's hoard: colour piles, his cards, fix mode. */
export function HoardSheet({
  state,
  dispatch,
  onClose,
}: {
  state: GameState
  dispatch: Dispatch
  onClose: () => void
}) {
  const t = useT()
  const [fixing, setFixing] = useState(false)
  return (
    <Sheet title={t('hoard.title')} onClose={onClose}>
      <div className={styles.sheetRow}>
        <SheetLabel>{t('hoard.tokens', { n: state.stack.length })}</SheetLabel>
        <Button variant="small" aria-pressed={fixing} onClick={() => setFixing((f) => !f)}>
          {fixing ? t('hoard.done') : t('hoard.fix')}
        </Button>
      </div>
      <TokenPiles
        stack={state.stack}
        fixing={fixing}
        onRemove={(index) => dispatch({ type: 'stackRemove', index })}
        onAdd={(stone) => dispatch({ type: 'stackAdd', stone })}
      />
      <SheetLabel>{t('hoard.cards', { n: state.thanosCards.length })}</SheetLabel>
      <div className={styles.chipsWrap}>
        {state.thanosCards.length === 0 ? (
          <span className={styles.sheetNote}>{t('hoard.noCards')}</span>
        ) : null}
        {state.thanosCards.map((c, index) => (
          <span key={index} className={styles.cardChip}>
            <Token stone={c.colour} size={20} />
            {cardLabel(t, c)}
            {fixing ? (
              <button
                type="button"
                aria-label={t('hoard.removeCard', { card: cardLabel(t, c) })}
                onClick={() => dispatch({ type: 'removeCard', side: 'thanos', index })}
              >
                <X size={14} />
              </button>
            ) : null}
          </span>
        ))}
      </div>
      {fixing ? (
        <Options
          paper
          label={t('hoard.tile')}
          value={state.avengers}
          onChange={(holder) => dispatch({ type: 'setAvengers', holder })}
          options={[
            { value: 'none', label: t('hoard.tileOptions.none') },
            { value: 'thanos', label: t('hoard.tileOptions.thanos') },
            { value: 'player', label: t('hoard.tileOptions.player') },
          ]}
        />
      ) : null}
      <p className={styles.sheetNote}>{fixing ? t('hoard.noteFix') : t('hoard.note')}</p>
    </Sheet>
  )
}

const LOG_ICON: Record<LogEntry['kind'], [typeof Skull, string]> = {
  take: [Skull, 'var(--purple)'],
  gain: [Skull, 'var(--purple)'],
  avengers: [Award, 'var(--green)'],
  playerRecruit: [User, 'var(--blue)'],
  playerLocation: [User, 'var(--blue)'],
  stackFix: [Wrench, '#6b5f86'],
  cardFix: [Wrench, '#6b5f86'],
  phase: [Shuffle, 'var(--gold-deep)'],
  result: [Flag, 'var(--red)'],
}

/** 6.3 — the game log, newest round first. */
export function LogSheet({ state, onClose }: { state: GameState; onClose: () => void }) {
  const t = useT()
  const rounds = [...new Set(state.log.map((e) => e.round))].sort((a, b) => b - a)
  return (
    <Sheet title={t('logSheet.title')} onClose={onClose}>
      {rounds.length === 0 ? <p className={styles.sheetNote}>{t('logSheet.empty')}</p> : null}
      {rounds.map((r) => (
        <section key={r} aria-label={t('logSheet.round', { round: r })}>
          <h3 className={styles.logRound}>
            {t('logSheet.roundTitle', {
              round: r,
              now: r === state.round && state.step !== 'over',
            })}
          </h3>
          {state.log
            .filter((e) => e.round === r)
            .reverse()
            .map((e, i) => {
              const [Icon, colour] = LOG_ICON[e.kind]
              return (
                <p key={i} className={styles.logEntry}>
                  <span
                    className={styles.logIcon}
                    style={{ background: colour }}
                    aria-hidden="true"
                  >
                    <Icon size={14} />
                  </span>
                  <span>{describeLog(t, e)}</span>
                </p>
              )
            })}
        </section>
      ))}
    </Sheet>
  )
}

/** 6.4 — the menu: leave or end the game, then rules, settings, rulings and credits (#53). */
export function MenuSheet({
  state,
  wakeLock,
  onWakeLock,
  onClose,
  onHome,
  onEndGame,
}: {
  state: GameState
  wakeLock: boolean
  onWakeLock: (on: boolean) => void
  onClose: () => void
  onHome: () => void
  onEndGame: () => void
}) {
  const t = useT()
  const { lang } = useI18n()
  const [open, setOpen] = useState<number | null>(null)
  const [languages, setLanguages] = useState(false)
  const s = state.setup.settings
  return (
    <>
      <Sheet title={t('menu.title')} onClose={onClose}>
        <Button variant="secondary" icon={<House size={20} />} onClick={onHome}>
          {t('menu.home')}
        </Button>
        <Button variant="quietDanger" icon={<OctagonX size={20} />} onClick={onEndGame}>
          {t('menu.end')}
        </Button>
        <SheetLabel>{t('menu.rules')}</SheetLabel>
        <div>
          {t.list('rules').map(({ title, text }, i) => (
            <div key={title} className={styles.ruleRow}>
              <button
                type="button"
                className={styles.ruleHead}
                aria-expanded={open === i}
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className={styles.ruleIcon} aria-hidden="true">
                  i
                </span>
                <span className={styles.ruleTitle}>{title}</span>
                <ChevronRight size={16} className={styles.ruleChevron} />
              </button>
              <Collapse open={open === i}>
                <span className={styles.ruleBody}>{text}</span>
              </Collapse>
            </div>
          ))}
        </div>
        <SheetLabel>{t('menu.settings')}</SheetLabel>
        <div className={styles.setting}>
          <div>
            <strong>{t('menu.wake')}</strong>
            <small>{t('menu.wakeSub')}</small>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={wakeLock}
            aria-label={t('menu.wake')}
            className={styles.switch}
            onClick={() => onWakeLock(!wakeLock)}
          />
        </div>
        <button
          type="button"
          className={styles.settingRow}
          aria-haspopup="dialog"
          onClick={() => setLanguages(true)}
        >
          <span>
            <strong>{t('language.label')}</strong>
            <small>{LANGS.find((l) => l.code === lang)?.name}</small>
          </span>
          <ChevronRight size={18} aria-hidden="true" />
        </button>
        <SheetLabel>{t('menu.rulingsTitle')}</SheetLabel>
        <ul className={styles.rulings}>
          <li>
            {t('menu.rulingLength', {
              lengths: s.phaseLengths.join(' / '),
              cap: s.stackCap ?? 'none',
            })}
          </li>
          <li>{t('menu.rulingCounted', { all: s.countedCards === 'all' })}</li>
          <li>{t('menu.rulingCard12', { n: s.unprintedDiscard })}</li>
          <li>{t('menu.rulingEmpty', { firstInRow: s.emptySlot === 'firstInRow' })}</li>
          <li>{t('menu.rulingTies', { thanosWins: s.ties === 'thanosWins' })}</li>
        </ul>
        <Credits tone="paper" />
      </Sheet>
      {languages ? <LanguageSheet onClose={() => setLanguages(false)} /> : null}
    </>
  )
}

/** 4.2 — log the card you recruited. */
export function LogCardSheet({
  onAdd,
  onClose,
}: {
  onAdd: (card: RecruitedCard) => void
  onClose: () => void
}) {
  const t = useT()
  const [level, setLevel] = useState<Level>(1)
  const [colour, setColour] = useState<Stone | null>(null)
  const [points, setPoints] = useState(0)
  const [tags, setTags] = useState(0)
  return (
    <Sheet title={t('logCard.title')} onClose={onClose}>
      <NumberChips
        paper
        label={t('logCard.level')}
        values={[1, 2, 3]}
        value={level}
        onChange={(v) => setLevel(v as Level)}
      />
      <SheetLabel>{t('logCard.colour')}</SheetLabel>
      <StonePicker paper label={t('logCard.colourLabel')} selected={colour} onPick={setColour} />
      <NumberChips
        paper
        label={t('logCard.points')}
        values={[0, 1, 2, 3, 4, 5]}
        value={points}
        onChange={setPoints}
      />
      <NumberChips
        paper
        label={t('logCard.avengers')}
        values={[0, 1, 2]}
        value={tags}
        onChange={setTags}
      />
      <p className={styles.sheetNote}>{t('logCard.note')}</p>
      <Button
        icon={<Plus size={22} />}
        disabled={colour === null}
        onClick={() => colour && onAdd({ level, colour, points, tags })}
      >
        {t('logCard.add')}
      </Button>
    </Sheet>
  )
}

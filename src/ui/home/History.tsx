import { Trash2 } from 'lucide-react'
import { useLayoutEffect, useState } from 'react'
import { roundLimit } from '../../engine/index.ts'
import { Button, Caption, Dialog, Panel } from '../components/Kit.tsx'
import { LANGS, useI18n } from '../i18n/index.ts'
import { statsByDifficulty, statsOf, type GameSummary } from '../state/history.ts'
import { Header } from './Header.tsx'
import styles from './home.module.css'

/** 1.7 — finished games, win rate and average winning round, overall and per difficulty (#12). */
export function History({
  history,
  onBack,
  onClear,
}: {
  history: readonly GameSummary[]
  onBack: () => void
  onClear: () => void
}) {
  const { t, lang } = useI18n()
  const [confirm, setConfirm] = useState(false)
  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [])
  const tag = LANGS.find((l) => l.code === lang)?.tag ?? lang
  const percent = new Intl.NumberFormat(tag, { style: 'percent', maximumFractionDigits: 0 })
  const decimal = new Intl.NumberFormat(tag, { maximumFractionDigits: 1 })
  const date = new Intl.DateTimeFormat(tag, { day: 'numeric', month: 'short', year: 'numeric' })
  const rate = (r: number | null) => (r === null ? '—' : percent.format(r))
  const round = (r: number | null) => (r === null ? '—' : decimal.format(r))
  const difficulty = (rounds: number, cap: number | null) =>
    t('history.difficulty', { rounds, cap: cap ?? 'none' })
  const all = statsOf(history)

  return (
    <div className={styles.screen}>
      <main className={styles.scroll}>
        <Header title={t('history.title')} onBack={onBack} />
        {history.length === 0 ? (
          <p className={styles.intro}>{t('history.empty')}</p>
        ) : (
          <>
            <dl className={styles.stats}>
              {(
                [
                  [t('history.games'), String(all.games)],
                  [t('history.wins'), String(all.wins)],
                  [t('history.winRate'), rate(all.winRate)],
                  [t('history.avgRound'), round(all.avgWinRound)],
                ] as const
              ).map(([label, value]) => (
                <div key={label} className={styles.stat}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            <Caption tone="blue">{t('history.byDifficulty')}</Caption>
            <Panel className={styles.historyPanel}>
              {statsByDifficulty(history).map(({ key, rounds, cap, stats }) => (
                <div key={key} className={styles.historyRow}>
                  <strong>{difficulty(rounds, cap)}</strong>
                  <span>
                    {t('history.record', {
                      wins: stats.wins,
                      games: stats.games,
                      rate: rate(stats.winRate),
                    })}
                  </span>
                  {stats.avgWinRound === null ? null : (
                    <small>{t('history.recordRound', { round: round(stats.avgWinRound) })}</small>
                  )}
                </div>
              ))}
            </Panel>
            <Caption>{t('history.list')}</Caption>
            <ol className={styles.gameList}>
              {history.map((g) => {
                const won = g.result.winner === 'player'
                return (
                  <li key={g.id} className={styles.gameRow} data-won={won}>
                    <strong>
                      {won
                        ? t('history.won')
                        : g.result.reason === 'roundLimit'
                          ? t('result.snap')
                          : t('history.lost')}
                    </strong>
                    <span>
                      {t('history.score', { you: g.playerPoints ?? '—', thanos: g.thanosPoints })}
                    </span>
                    <small>
                      {[
                        date.format(new Date(g.finishedAt)),
                        t('history.round', { round: g.result.round }),
                        difficulty(roundLimit(g.settings), g.settings.stackCap),
                      ].join(' · ')}
                    </small>
                  </li>
                )
              })}
            </ol>
          </>
        )}
      </main>
      {history.length ? (
        <footer className={styles.footer}>
          <Button
            variant="quietDanger"
            icon={<Trash2 size={20} />}
            onClick={() => setConfirm(true)}
          >
            {t('history.clear')}
          </Button>
        </footer>
      ) : null}
      {confirm ? (
        <Dialog title={t('history.clearTitle')} onClose={() => setConfirm(false)}>
          <p>{t('history.clearBody', { n: history.length })}</p>
          <Button
            variant="danger"
            icon={<Trash2 size={20} />}
            onClick={() => {
              setConfirm(false)
              onClear()
            }}
          >
            {t('history.clearConfirm')}
          </Button>
          <Button variant="secondary" onClick={() => setConfirm(false)}>
            {t('history.keep')}
          </Button>
        </Dialog>
      ) : null}
    </div>
  )
}

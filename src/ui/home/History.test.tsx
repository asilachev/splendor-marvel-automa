import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DEFAULT_SETTINGS } from '../../engine/index.ts'
import type { GameSummary } from '../state/history.ts'
import { History } from './History.tsx'

const games: GameSummary[] = [
  {
    id: 2,
    finishedAt: '2026-11-01T20:00:00.000Z',
    settings: DEFAULT_SETTINGS,
    result: { winner: 'player', reason: 'gauntlet', round: 25 },
    thanosPoints: 12,
    playerPoints: 18,
  },
  {
    id: 1,
    finishedAt: '2026-10-31T20:00:00.000Z',
    settings: { ...DEFAULT_SETTINGS, logPlayerCards: false, stackCap: 12 },
    result: { winner: 'thanos', reason: 'roundLimit', round: 30 },
    thanosPoints: 14,
    playerPoints: null,
  },
]

describe('History screen (#12)', () => {
  it('shows the stats, each difficulty and each game', () => {
    render(<History history={games} onBack={() => {}} onClear={() => {}} />)
    expect(screen.getByRole('heading', { name: 'HISTORY' })).toBeInTheDocument()
    const stat = (label: string) => screen.getByText(label).nextElementSibling?.textContent
    expect(stat('Games')).toBe('2')
    expect(stat('Wins')).toBe('1')
    expect(stat('Win rate')).toBe('50%')
    expect(stat('Avg. winning round')).toBe('25')
    expect(screen.getByText('1 of 1 won · 100%')).toBeInTheDocument()
    expect(screen.getByText('0 of 1 won · 0%')).toBeInTheDocument()
    const rows = within(screen.getByRole('list')).getAllByRole('listitem')
    expect(rows[0]).toHaveTextContent('YOU WON')
    expect(rows[0]).toHaveTextContent('You 18 · Thanos 12')
    expect(rows[1]).toHaveTextContent('SNAP.')
    expect(rows[1]).toHaveTextContent('You — · Thanos 14')
    expect(rows[1]).toHaveTextContent('round 30 · 30 rounds · cap 12')
  })

  it('clears the history only after you confirm', async () => {
    const user = userEvent.setup()
    const onClear = vi.fn()
    render(<History history={games} onBack={() => {}} onClear={onClear} />)
    await user.click(screen.getByRole('button', { name: 'CLEAR HISTORY' }))
    const dialog = screen.getByRole('alertdialog', { name: 'CLEAR HISTORY?' })
    await user.click(within(dialog).getByRole('button', { name: 'KEEP IT' }))
    expect(onClear).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'CLEAR HISTORY' }))
    await user.click(screen.getByRole('button', { name: 'CLEAR IT' }))
    expect(onClear).toHaveBeenCalledOnce()
  })

  it('says so when there are no finished games yet', () => {
    render(<History history={[]} onBack={() => {}} onClear={() => {}} />)
    expect(screen.getByText(/No finished games yet/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'CLEAR HISTORY' })).toBeNull()
  })
})

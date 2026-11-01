import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DEFAULT_SETTINGS } from '../../engine/index.ts'
import { Setup } from './Setup.tsx'

describe('setup: the hard variant (#11)', () => {
  it('asks for both Locations before the game can start', async () => {
    const user = userEvent.setup()
    const onStart = vi.fn()
    render(<Setup initial={DEFAULT_SETTINGS} onStart={onStart} onBack={() => {}} />)
    await user.click(screen.getByRole('button', { name: /^HARD/ }))
    const start = screen.getByRole('button', { name: 'START GAME' })
    expect(start).toBeDisabled()
    expect(screen.getByText('Enter both Locations to start.')).toBeInTheDocument()

    const first = screen.getByRole('group', { name: 'Location 1' })
    for (let i = 0; i < 3; i++) {
      await user.click(within(first).getByRole('button', { name: /^Mind/ }))
    }
    expect(within(first).getByRole('button', { name: 'Mind: 3' })).toBeInTheDocument()
    expect(start).toBeDisabled()
    const second = screen.getByRole('group', { name: 'Location 2' })
    await user.click(within(second).getByRole('button', { name: /^Soul/ }))
    expect(start).toBeEnabled()

    await user.click(start)
    expect(onStart).toHaveBeenCalledWith(
      expect.objectContaining({ variant: 'hard', locations: [{ mind: 3 }, { soul: 1 }] }),
    )
  })

  it('counts a stone up to 5, then back to 0', async () => {
    const user = userEvent.setup()
    render(<Setup initial={DEFAULT_SETTINGS} onStart={() => {}} onBack={() => {}} />)
    await user.click(screen.getByRole('button', { name: /^HARD/ }))
    const first = screen.getByRole('group', { name: 'Location 1' })
    for (let i = 0; i < 6; i++) {
      await user.click(within(first).getByRole('button', { name: /^Power/ }))
    }
    expect(within(first).getByRole('button', { name: 'Power: 0' })).toBeInTheDocument()
  })

  it('enters the Locations afresh and drops them from a standard game', async () => {
    const user = userEvent.setup()
    const onStart = vi.fn()
    const lastHard = {
      ...DEFAULT_SETTINGS,
      variant: 'hard' as const,
      locations: [{ mind: 3 }, { soul: 4 }],
    }
    render(<Setup initial={lastHard} onStart={onStart} onBack={() => {}} />)
    expect(screen.getByRole('button', { name: 'START GAME' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: /^STANDARD/ }))
    await user.click(screen.getByRole('button', { name: 'START GAME' }))
    expect(onStart).toHaveBeenCalledWith(
      expect.objectContaining({ variant: 'standard', locations: [] }),
    )
  })
})

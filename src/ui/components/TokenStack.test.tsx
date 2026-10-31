import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Stone } from '../../engine/index.ts'
import { TokenStack } from './Board.tsx'

const stack: Stone[] = ['power', 'mind', 'power', 'space', 'power']

describe('TokenStack (#38)', () => {
  it('shows one pile per colour with counts, plus the oldest-first return order', () => {
    render(<TokenStack stack={stack} fixing={false} onRemove={() => {}} onAdd={() => {}} />)
    const piles = screen.getByRole('group', { name: 'Thanos’s tokens: 3 Power, 1 Mind, 1 Space' })
    expect(within(piles).getByLabelText('3 Power')).toHaveTextContent('×3')
    expect(within(piles).queryByLabelText(/Reality/)).toBeNull()
    expect(screen.getByLabelText('Return order, oldest first')).toHaveTextContent(
      'Returned first →',
    )
  })

  it('fixes per colour: − removes his newest token of that colour, + adds one on top', async () => {
    const onRemove = vi.fn()
    const onAdd = vi.fn()
    const user = userEvent.setup()
    render(<TokenStack stack={stack} fixing onRemove={onRemove} onAdd={onAdd} />)
    await user.click(screen.getByRole('button', { name: 'Remove a Power token' }))
    expect(onRemove).toHaveBeenCalledWith(4)
    expect(screen.getByRole('button', { name: 'Remove a Reality token' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Add a Reality token' }))
    expect(onAdd).toHaveBeenCalledWith('reality')
  })
})

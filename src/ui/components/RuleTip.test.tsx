import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { RuleTip } from './RuleTip.tsx'

describe('RuleTip (#31)', () => {
  it('toggles an accessible explanation on tap', async () => {
    const user = userEvent.setup()
    render(<RuleTip title="Taking tokens">In printed order, onto the top of his stack.</RuleTip>)
    const button = screen.getByRole('button', { name: 'Rule: Taking tokens' })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('note')).toBeNull()

    await user.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
    const note = screen.getByRole('note')
    expect(note).toHaveTextContent('Taking tokens. In printed order, onto the top of his stack.')
    expect(button).toHaveAttribute('aria-controls', note.id)

    await user.click(button)
    expect(screen.queryByRole('note')).toBeNull()
  })
})

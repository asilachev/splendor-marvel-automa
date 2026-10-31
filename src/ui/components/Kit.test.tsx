import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { Sheet } from './Kit.tsx'

function SheetHarness() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open
      </button>
      {open ? (
        <Sheet title="TEST SHEET" onClose={() => setOpen(false)}>
          <button type="button">First</button>
          <button type="button">Last</button>
        </Sheet>
      ) : null}
    </>
  )
}

describe('Sheet', () => {
  it('traps focus inside and gives it back to the opener on close (PWA checklist)', async () => {
    const user = userEvent.setup()
    render(<SheetHarness />)
    await user.click(screen.getByRole('button', { name: 'Open' }))
    expect(screen.getByRole('dialog', { name: 'TEST SHEET' })).toHaveFocus()

    const close = screen.getByRole('button', { name: 'Close TEST SHEET' })
    await user.tab()
    expect(close).toHaveFocus()
    await user.tab()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Last' })).toHaveFocus()
    await user.tab()
    expect(close).toHaveFocus()
    await user.tab({ shift: true })
    expect(screen.getByRole('button', { name: 'Last' })).toHaveFocus()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByRole('button', { name: 'Open' })).toHaveFocus()
  })
})

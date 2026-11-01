import { screen, within } from '@testing-library/react'
import type { UserEvent } from '@testing-library/user-event'

/** Ticks every setup step, as at the table, so START GAME can be tapped (#101). */
export async function tickSetup(user: UserEvent): Promise<void> {
  for (const box of screen.getAllByRole('checkbox', { checked: false })) await user.click(box)
}

/**
 * Finishes your turn as at the table, then taps END ROUND (#101). It picks I TOOK TOKENS unless a
 * card is logged and ticks every box, leaving the Gauntlet tile alone: that one reports a result.
 */
export async function endRound(user: UserEvent, round: number): Promise<void> {
  const turn = screen.getByRole('main', { name: 'Your turn' })
  const tokens = within(turn).queryByRole<HTMLButtonElement>('button', { name: /^I TOOK TOKENS/ })
  if (tokens && !tokens.disabled) await user.click(tokens)
  for (const box of within(turn).queryAllByRole('checkbox', { checked: false })) {
    if (!/GAUNTLET/.test(box.textContent ?? '')) await user.click(box)
  }
  await user.click(screen.getByRole('button', { name: `END ROUND ${round}` }))
}

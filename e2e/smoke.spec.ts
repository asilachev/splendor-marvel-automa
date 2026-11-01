import { expect, test } from '@playwright/test'

// A game on a phone, as at the table (#14): start it from Home, play round 1, undo the end of the
// round, then reload and CONTINUE. The game is saved after every tap, and every launch opens on
// Home with CONTINUE · ROUND N (docs/design.md → A round, PWA).
//
// A new game gets a random seed, so round 1's card either takes tokens or gains a card: the test
// plays whichever step appears.
test('plays a round, undoes the end of it and resumes after a reload', async ({ page }) => {
  const pageErrors: Error[] = []
  page.on('pageerror', (error) => pageErrors.push(error))

  const button = (name: string) => page.getByRole('button', { name, exact: true })
  const hud = page.getByRole('banner')
  const dock = page.getByRole('navigation', { name: 'Game menu' })
  const undo = dock.getByRole('button', { name: 'Undo', exact: true })
  const thanosMoves = page.getByRole('heading', { name: 'THANOS MAKES HIS MOVE' })
  const yourTurn = page.getByRole('main', { name: 'Your turn' })

  await test.step('start a game from Home', async () => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'THANOS AUTOMA' })).toBeVisible()
    await button('START YOUR FIRST GAME').tap()
    await expect(page.getByRole('heading', { name: 'NEW GAME' })).toBeVisible()
    await button('START GAME').tap()
    await expect(thanosMoves).toBeVisible()
    await expect(hud).toHaveAccessibleName(/^Round 1 of 30\./)
    await expect(undo).toBeDisabled()
  })

  // The table after Thanos's turn, which undo and the reload must bring back as it was.
  let hoard = ''
  let summary = ''
  let table = ''
  await test.step('Thanos’s turn: reveal his card and resolve it', async () => {
    await button('REVEAL HIS CARD').tap()
    const take = page.getByRole('main', { name: 'Thanos takes tokens' })
    const recruit = page.getByRole('main', { name: 'Thanos recruits' })
    await expect(take.or(recruit)).toBeVisible()
    const takes = await take.isVisible()
    // The report says which card this run drew.
    test.info().annotations.push({
      type: 'round 1',
      description: takes ? 'Thanos takes tokens' : 'Thanos recruits',
    })
    if (takes) {
      // He takes every token on his card: no pile is empty.
      const tokens = take.getByRole('group', { name: 'Tokens to take' }).getByRole('button')
      const n = await tokens.count()
      await button(`DONE · ADD ${n} TO HIS PILES`).tap()
      hoard = `Hoard · ${n}`
    } else {
      // He recruits a Power card worth 1 point. He has no tokens yet, so he returns none.
      await recruit
        .getByRole('group', { name: /^Colour of the card in / })
        .getByRole('button', { name: 'Power', exact: true })
        .tap()
      await recruit
        .getByRole('group', { name: 'Points', exact: true })
        .getByRole('button', { name: '1', exact: true })
        .tap()
      await button('HE TAKES IT').tap()
      hoard = 'Hoard · 0'
      await expect(hud).toHaveAccessibleName(/Thanos 1 points, 1 colours/)
    }
    await expect(yourTurn).toBeVisible()
    await expect(dock.getByRole('button', { name: hoard, exact: true })).toBeVisible()
    summary = (await hud.getAttribute('aria-label')) ?? ''
    table = await yourTurn.ariaSnapshot()
  })
  const expectTableAsItWas = async () => {
    await expect(yourTurn).toMatchAriaSnapshot(table)
    await expect(hud).toHaveAccessibleName(summary)
    await expect(dock.getByRole('button', { name: hoard, exact: true })).toBeVisible()
  }

  await test.step('end round 1: round 2 starts with Thanos’s turn', async () => {
    await button('END ROUND 1').tap()
    await expect(thanosMoves).toBeVisible()
    await expect(hud).toHaveAccessibleName(/^Round 2 of 30\./)
  })

  await test.step('undo: back at the table in round 1', async () => {
    await undo.tap()
    await expect(
      page.getByRole('status').getByText('Undone — stepped back one action.'),
    ).toBeVisible()
    await expect(button('END ROUND 1')).toBeVisible()
    await expectTableAsItWas()
  })

  await test.step('reload: Home, then CONTINUE where the game was', async () => {
    await page.reload()
    await expect(page.getByRole('heading', { name: 'THANOS AUTOMA' })).toBeVisible()
    await button('CONTINUE · ROUND 1').tap()
    await expectTableAsItWas()
    // The resumed game plays on.
    await button('END ROUND 1').tap()
    await expect(thanosMoves).toBeVisible()
    await expect(hud).toHaveAccessibleName(/^Round 2 of 30\./)
  })

  expect(pageErrors).toEqual([])
})

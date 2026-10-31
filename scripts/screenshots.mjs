// Captures the user-guide screenshots in docs/guide/screenshots from real game states.
//
//   npm run screenshots      (builds first, then serves dist/ with `vite preview`)
//
// Every shot is a 390×844 viewport at 2×, so every PNG is exactly 780×1688; the script fails if
// any differs. It drives the installed Google Chrome through playwright-core (set CHROME_PATH to
// use another Chromium). Game states come from the engine with fixed seeds, so reruns match.
import { mkdir, readdir, readFile, rm } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'
import { preview } from 'vite'
import * as E from '../src/engine/index.ts'

const OUT = fileURLToPath(new URL('../docs/guide/screenshots/', import.meta.url))
const VIEWPORT = { width: 390, height: 844 }
const SCALE = 2
const SIZE = { width: VIEWPORT.width * SCALE, height: VIEWPORT.height * SCALE }
const GAME_KEY = 'thanos-automa:v1:game'
const IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1'

// ---- Game states -------------------------------------------------------------------------------

const S = E.DEFAULT_SETTINGS
const start = (seed) => E.newGame(seed, S)
const actionAt = (seed, round) => E.cardForRound(start(seed).setup, round).action
const saved = (seed, events) => ({ version: 1, seed, settings: S, events })

/** The first seed that makes `pred` true, so every run captures the same games. */
function findSeed(pred) {
  for (let seed = 1; seed < 20_000; seed++) if (pred(seed)) return seed
  throw new Error('No seed matches')
}

/** Colours you recruit, in order. */
const YOURS = ['space', 'reality', 'soul', 'power', 'mind']

/**
 * A game played up to the start of `round`, plus Thanos's turn when `thanos` is set. Thanos takes
 * every token, or gains the targeted card in a colour he lacks (never enough points to win); you
 * log a card every second round.
 */
function game(seed, round, { thanos = false } = {}) {
  const events = []
  let state = start(seed)
  const push = (event) => {
    events.push(event)
    state = E.applyEvent(state, event)
  }
  const thanosTurn = () => {
    push({ type: 'reveal' })
    const { action } = E.currentRoundCard(state)
    if (action.kind === 'take') {
      push({ type: 'thanosTake', skipped: [] })
      return
    }
    const his = E.sideStats(state, 'thanos')
    const colour = E.STONES.find((c) => !his.colours.includes(c)) ?? 'mind'
    const points = his.points < 10 ? { A: 2, B: 1, C: 0 }[action.row] : 0
    const tags = action.row === 'A' ? 1 : 0
    push({
      type: 'thanosGain',
      card: { colour, points, tags },
      substituted: false,
      slotEmpty: false,
    })
  }
  while (state.round < round) {
    thanosTurn()
    if (state.round % 2 === 0) {
      const colour = YOURS[(state.round / 2 - 1) % YOURS.length]
      push({
        type: 'playerRecruit',
        card: { level: 1, colour, points: state.round >= 4 ? 1 : 0, tags: 0 },
      })
    }
    push({ type: 'endRound' })
    if (state.step === 'over') throw new Error(`Game ${seed} ended in round ${state.round}`)
  }
  if (thanos) thanosTurn()
  return { events, state }
}

// Round 7 starts with "take tokens": reveal, take, then the table, the sheets and your card.
const takeSeed = findSeed(
  (s) => actionAt(s, 7).kind === 'take' && actionAt(s, 7).tokens.length === 3,
)
// Round 8 is a recruit that returns tokens, and Thanos already has a colour to substitute for.
const recruitSeed = findSeed((s) => {
  const a = actionAt(s, 8)
  if (a.kind !== 'gain' || (a.discard ?? 0) < 2) return false
  const { state } = game(s, 8)
  return state.stack.length >= 3 && E.sideStats(state, 'thanos').colours.length >= 2
})
const recruit = game(recruitSeed, 8)
const hisColour = E.sideStats(recruit.state, 'thanos').colours[0]

const round7 = saved(takeSeed, game(takeSeed, 7).events)
const table7 = saved(takeSeed, game(takeSeed, 7, { thanos: true }).events)
const phaseEnd = saved(takeSeed, game(takeSeed, 10, { thanos: true }).events)
const snap = saved(takeSeed, game(takeSeed, 30, { thanos: true }).events)

// You complete the Infinity Gauntlet in round 22: a level-3 card (Time) and a Location.
const winGame = game(takeSeed, 22, { thanos: true })
const win = saved(takeSeed, [
  ...winGame.events,
  { type: 'playerRecruit', card: { level: 3, colour: 'space', points: 4, tags: 1 } },
  { type: 'playerLocation' },
])
const winState = win.events.slice(winGame.events.length).reduce(E.applyEvent, winGame.state)
if (!E.sideStats(winState, 'player').gauntlet) throw new Error('The win game has no Gauntlet')

// ---- Capture -----------------------------------------------------------------------------------

const cap = (stone) => stone[0].toUpperCase() + stone.slice(1)
const resume = (page) => page.getByRole('button', { name: /^CONTINUE · ROUND/ }).click()
const flip = (page) => page.getByRole('button', { name: /^Flip Thanos/ }).click()
const dock = (name) => async (page) => {
  await resume(page)
  await page.getByRole('button', { name, exact: true }).click()
}

/** name → [saved game or null, actions, context options]. Order = the guide's order. */
const SHOTS = {
  '01-home': [null],
  '02-setup': [null, (p) => p.getByRole('button', { name: 'START YOUR FIRST GAME' }).click()],
  '03-rulings': [
    null,
    async (p) => {
      await p.getByRole('button', { name: 'START YOUR FIRST GAME' }).click()
      await p.getByRole('button', { name: /Rulings for gaps/ }).click()
      await p.getByRole('button', { name: 'Rule: Which cards count' }).click()
    },
  ],
  '04-reveal': [round7, resume],
  '05-take': [
    round7,
    async (p) => {
      await resume(p)
      await flip(p)
    },
  ],
  '06-recruit': [
    saved(recruitSeed, recruit.events),
    async (p) => {
      await resume(p)
      await flip(p)
    },
  ],
  '07-substitute': [
    saved(recruitSeed, recruit.events),
    async (p) => {
      await resume(p)
      await flip(p)
      await p
        .getByRole('group', { name: /^Colour of the card in/ })
        .getByRole('button', { name: new RegExp(cap(hisColour)) })
        .click()
    },
  ],
  '08-table': [table7, resume],
  '09-log-card': [
    table7,
    async (p) => {
      await resume(p)
      await p.getByRole('button', { name: /I RECRUITED/ }).click()
      const sheet = p.getByRole('dialog', { name: 'LOG YOUR CARD' })
      await sheet.getByRole('group', { name: 'Level' }).getByRole('button', { name: '2' }).click()
      await sheet
        .getByRole('group', { name: 'Bonus colour' })
        .getByRole('button', { name: /Mind/ })
        .click()
      await sheet.getByRole('group', { name: 'Points' }).getByRole('button', { name: '2' }).click()
    },
  ],
  '10-phase-change': [
    phaseEnd,
    async (p) => {
      await resume(p)
      await p.getByRole('button', { name: 'END ROUND 10' }).click()
    },
  ],
  '11-hoard': [table7, dock(`Hoard · ${E.replay(takeSeed, S, table7.events).stack.length}`)],
  '12-log': [table7, dock('Log')],
  '13-rules': [
    table7,
    async (p) => {
      await dock('Rules')(p)
      await p.getByRole('button', { name: /Recruiting & colour substitution/ }).click()
    },
  ],
  '14-win': [
    win,
    async (p) => {
      await resume(p)
      await p.getByRole('button', { name: 'END ROUND 22' }).click()
    },
  ],
  '15-snap': [
    snap,
    async (p) => {
      await resume(p)
      await p.getByRole('button', { name: 'END ROUND 30' }).click()
    },
  ],
  '16-install-iphone': [null, null, { userAgent: IPHONE, isMobile: true, hasTouch: true }],
  '17-install-android': [
    round7,
    (p) =>
      p.evaluate(() => {
        const event = new Event('beforeinstallprompt', { cancelable: true })
        Object.assign(event, {
          prompt: () => Promise.resolve(),
          userChoice: Promise.resolve({ outcome: 'dismissed' }),
        })
        window.dispatchEvent(event)
      }),
  ],
}

async function pngSize(file) {
  const png = await readFile(file)
  if (png.toString('ascii', 12, 16) !== 'IHDR') throw new Error(`${file} is not a PNG`)
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) }
}

await rm(OUT, { recursive: true, force: true })
await mkdir(OUT, { recursive: true })

const server = await preview({ logLevel: 'error', preview: { port: 4180, open: false } })
const url = server.resolvedUrls?.local[0]
if (!url) throw new Error('vite preview did not start')
const browser = await chromium.launch(
  process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' },
)

try {
  for (const [name, [save, act, options = {}]] of Object.entries(SHOTS)) {
    const context = await browser.newContext({
      viewport: VIEWPORT,
      deviceScaleFactor: SCALE,
      reducedMotion: 'reduce',
      colorScheme: 'dark',
      locale: 'en-GB',
      ...options,
    })
    await context.addInitScript(
      ([key, value]) => {
        try {
          localStorage.clear()
          if (value) localStorage.setItem(key, value)
        } catch {
          // about:blank has no storage.
        }
      },
      [GAME_KEY, save ? JSON.stringify(save) : null],
    )
    const page = await context.newPage()
    await page.goto(url, { waitUntil: 'networkidle' })
    if (act) await act(page)
    await page.evaluate(() => document.fonts.ready)
    await page.waitForFunction(() => [...document.images].every((img) => img.complete))
    await page.screenshot({ path: `${OUT}${name}.png`, animations: 'disabled', caret: 'hide' })
    await context.close()
    console.log(`✓ ${name}`)
  }
} finally {
  await browser.close()
  await server.close()
}

// Every screenshot must have exactly the same dimensions.
const files = (await readdir(OUT)).filter((f) => f.endsWith('.png')).sort()
const wrong = []
for (const file of files) {
  const { width, height } = await pngSize(`${OUT}${file}`)
  if (width !== SIZE.width || height !== SIZE.height) wrong.push(`${file}: ${width}×${height}`)
}
if (files.length !== Object.keys(SHOTS).length || wrong.length > 0) {
  console.error(`Expected ${Object.keys(SHOTS).length} PNGs of ${SIZE.width}×${SIZE.height}.`)
  for (const line of wrong) console.error(`  ✗ ${line}`)
  process.exit(1)
}
console.log(
  `${files.length} screenshots, all ${SIZE.width}×${SIZE.height}, in docs/guide/screenshots`,
)

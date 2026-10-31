// Captures the user-guide screenshots in docs/guide/screenshots from real game states.
//
//   npm run screenshots      (builds first, then serves dist/ with `vite preview`)
//
// Every shot is a 390×844 viewport at 2×, so every PNG is exactly 780×1688; the script fails if
// any differs. It drives the installed Google Chrome through playwright-core (set CHROME_PATH to
// use another Chromium). Game states come from the engine with fixed seeds, so reruns match.
//
// Options, e.g. `npm run screenshots -- --lang ru --only 04,06 --out .screenshots/ru`:
//   --lang ru|sr|es|de   the app's language (default en); texts and buttons come from its file
//   --only 04,06-recruit shots whose names start with these
//   --out <dir>          where to write (default docs/guide/screenshots, or .screenshots/<lang>)
//   --width 360          viewport width, e.g. to check a narrow phone (default 390)
import { mkdir, readdir, readFile, rm } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { chromium } from 'playwright-core'
import { preview } from 'vite'
import * as E from '../src/engine/index.ts'
import { formatMessage, parseMessage } from '../src/ui/i18n/icu.ts'
import { typeset } from '../src/ui/i18n/typography.ts'

const { values: opt } = parseArgs({
  options: {
    lang: { type: 'string', default: 'en' },
    only: { type: 'string' },
    out: { type: 'string' },
    width: { type: 'string' },
  },
})
const LANG = opt.lang
/** BCP 47 tags, as in LANGS in src/ui/i18n/index.ts. */
const TAGS = { en: 'en-GB', ru: 'ru', sr: 'sr-Cyrl', es: 'es', de: 'de' }
if (!(LANG in TAGS)) throw new Error(`Unknown language ${LANG}`)
const GUIDE = !opt.out && LANG === 'en'
const OUT = opt.out
  ? `${resolve(opt.out)}/`
  : fileURLToPath(
      new URL(GUIDE ? '../docs/guide/screenshots/' : `../.screenshots/${LANG}/`, import.meta.url),
    )
const VIEWPORT = { width: Number(opt.width ?? 390), height: 844 }
const SCALE = 2
const SIZE = { width: VIEWPORT.width * SCALE, height: VIEWPORT.height * SCALE }
const GAME_KEY = 'thanos-automa:v1:game'
const PREFS_KEY = 'thanos-automa:v1:prefs'

// ---- The app's texts -----------------------------------------------------------------------------

const catalog = JSON.parse(
  await readFile(new URL(`../src/ui/i18n/locales/${LANG}.json`, import.meta.url), 'utf8'),
)
const plural = new Intl.PluralRules(TAGS[LANG])
/** A text as the app shows it in this language, typeset the same way (#65). */
function T(key, vars = {}) {
  const message = key.split('.').reduce((node, part) => node?.[part], catalog)
  if (typeof message !== 'string') throw new Error(`No text for ${key} in ${LANG}`)
  return typeset(
    LANG,
    formatMessage(parseMessage(message), vars, (n) => plural.select(n)),
  )
}
const pattern = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/[ \u00a0]/g, '\\s')
/** Names that start with, or contain, a text, whichever spaces the text uses. */
const startsWith = (text) => new RegExp(`^${pattern(text.trim())}`)
const contains = (text) => new RegExp(pattern(text.trim()))
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

/** The cards you log, in order: colour, points and Avengers tags (all level 1, so no Time). */
const YOURS = ['space', 'reality', 'soul', 'power', 'mind']
const YOUR_POINTS = [0, 1, 1, 2, 1, 2, 1, 3, 1, 2, 1, 2, 1, 2, 1]
const YOUR_TAGS = [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0]

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
    // Level 3 / 2 / 1 points as on real cards, but never enough for his Gauntlet.
    const points = his.points <= 8 ? { A: 4, B: 2, C: state.round % 2 }[action.row] : 0
    const tags = action.row === 'C' ? 0 : 1
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
      const n = state.round / 2 - 1
      push({
        type: 'playerRecruit',
        card: {
          level: 1,
          colour: YOURS[n % YOURS.length],
          points: YOUR_POINTS[n % YOUR_POINTS.length],
          tags: YOUR_TAGS[n % YOUR_TAGS.length],
        },
      })
    }
    push({ type: 'endRound' })
    if (state.step === 'over') throw new Error(`Game ${seed} ended in round ${state.round}`)
  }
  if (thanos) thanosTurn()
  return { events, state }
}

// Round 7 starts with "take tokens": reveal, take, then the table, the sheets and your card.
// Thanos already holds a few tokens and cards, so the hoard has something to show.
const takeSeed = findSeed((s) => {
  const a = actionAt(s, 7)
  if (a.kind !== 'take' || a.tokens.length !== 3) return false
  const { state } = game(s, 7)
  return state.stack.length >= 4 && E.sideStats(state, 'thanos').cardCount >= 2
})
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

const resume = (page) =>
  page.getByRole('button', { name: startsWith(T('home.continue', { round: '' })) }).click()
const flip = (page) => page.getByRole('button', { name: startsWith(T('cards.flip')) }).click()
const dock = (name) => async (page) => {
  await resume(page)
  await page.getByRole('button', { name, exact: true }).click()
}

/** name → [saved game or null, actions, context options]. Order = the guide's order. */
const SHOTS = {
  '01-home': [null],
  '02-setup': [null, (p) => p.getByRole('button', { name: T('home.firstGame') }).click()],
  '03-rulings': [
    null,
    async (p) => {
      await p.getByRole('button', { name: T('home.firstGame') }).click()
      await p.getByRole('button', { name: startsWith(T('setup.rulingsRow')) }).click()
      await p
        .getByRole('button', { name: T('common.rule', { title: T('rulings.countedTip.title') }) })
        .click()
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
        .getByRole('group', { name: startsWith(T('recruit.colourLabel', { slot: '' })) })
        .getByRole('button', { name: contains(T(`stone.${hisColour}`)) })
        .click()
    },
  ],
  '08-table': [table7, resume],
  '09-log-card': [
    table7,
    async (p) => {
      await resume(p)
      await p.getByRole('button', { name: contains(T('table.recruited')) }).click()
      const sheet = p.getByRole('dialog', { name: T('logCard.title') })
      const group = (key) => sheet.getByRole('group', { name: T(key) })
      await group('logCard.level').getByRole('button', { name: '2' }).click()
      await group('logCard.colourLabel')
        .getByRole('button', { name: contains(T('stone.mind')) })
        .click()
      await group('logCard.points').getByRole('button', { name: '2' }).click()
    },
  ],
  '10-phase-change': [
    phaseEnd,
    async (p) => {
      await resume(p)
      await p.getByRole('button', { name: T('table.cta', { round: 10 }) }).click()
    },
  ],
  '11-hoard': [
    table7,
    dock(T('dock.hoard', { n: E.replay(takeSeed, S, table7.events).stack.length })),
  ],
  '12-log': [table7, dock(T('dock.log'))],
  '13-menu': [table7, dock(T('dock.menu'))],
  '14-win': [
    win,
    async (p) => {
      await resume(p)
      await p.getByRole('button', { name: T('table.cta', { round: 22 }) }).click()
    },
  ],
  '15-snap': [
    snap,
    async (p) => {
      await resume(p)
      await p.getByRole('button', { name: T('table.cta', { round: 30 }) }).click()
    },
  ],
  '16-end-game': [
    table7,
    async (p) => {
      await dock(T('dock.menu'))(p)
      await p.getByRole('button', { name: T('menu.end') }).click()
    },
  ],
  '17-install-iphone': [null, null, { userAgent: IPHONE, isMobile: true, hasTouch: true }],
  '18-install-android': [
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

const only = opt.only?.split(',').map((s) => s.trim())
const selected = Object.entries(SHOTS).filter(
  ([name]) => !only || only.some((o) => name.startsWith(o)),
)
if (selected.length === 0) throw new Error(`No shots match --only ${opt.only}`)

// The guide's folder is rebuilt from scratch; other folders only get the selected shots.
if (GUIDE && !only) await rm(OUT, { recursive: true, force: true })
await mkdir(OUT, { recursive: true })

const server = await preview({ logLevel: 'error', preview: { port: 4180, open: false } })
const url = server.resolvedUrls?.local[0]
if (!url) throw new Error('vite preview did not start')
const browser = await chromium.launch({
  ...(process.env.CHROME_PATH
    ? { executablePath: process.env.CHROME_PATH }
    : { channel: 'chrome' }),
  // Software rendering and a fixed colour profile, so reruns produce the same pixels.
  args: ['--disable-gpu', '--force-color-profile=srgb', '--font-render-hinting=none'],
})

try {
  for (const [name, [save, act, options = {}]] of selected) {
    const context = await browser.newContext({
      viewport: VIEWPORT,
      deviceScaleFactor: SCALE,
      reducedMotion: 'reduce',
      colorScheme: 'dark',
      locale: TAGS[LANG],
      ...options,
    })
    await context.addInitScript(
      ([key, value, prefs]) => {
        try {
          localStorage.clear()
          if (value) localStorage.setItem(key, value)
          if (prefs) localStorage.setItem(prefs[0], prefs[1])
        } catch {
          // about:blank has no storage.
        }
      },
      [
        GAME_KEY,
        save ? JSON.stringify(save) : null,
        LANG === 'en' ? null : [PREFS_KEY, JSON.stringify({ language: LANG })],
      ],
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

// Every screenshot must have exactly the same dimensions; the guide's folder holds exactly the set.
const files = GUIDE
  ? (await readdir(OUT)).filter((f) => f.endsWith('.png')).sort()
  : selected.map(([name]) => `${name}.png`)
const wrong = []
for (const file of files) {
  const { width, height } = await pngSize(`${OUT}${file}`)
  if (width !== SIZE.width || height !== SIZE.height) wrong.push(`${file}: ${width}×${height}`)
}
if (files.length !== selected.length || wrong.length > 0) {
  console.error(`Expected ${selected.length} PNGs of ${SIZE.width}×${SIZE.height}.`)
  for (const line of wrong) console.error(`  ✗ ${line}`)
  process.exit(1)
}
console.log(`${files.length} screenshots, all ${SIZE.width}×${SIZE.height}, in ${OUT}`)

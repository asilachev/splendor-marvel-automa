// The app's own mark (#108, option A "gold tag" on board 05 of the Pencil design): a gold tile with
// halftone dots that grow toward the bottom-right corner, and a black Bangers T with a dark-gold
// hard shadow. The T is Bangers' outline (SIL OFL, see src/ui/assets/fonts/README.md), stored
// below, so drawing the icon needs no font.
//
// Usage:
//   npm run icons    write every icon file and render the PNGs with Google Chrome (playwright-core;
//                    set CHROME_PATH to use another Chromium):
//                      docs/assets/logo.svg       rounded corners, with the halftone
//                      public/favicon.svg         rounded, no halftone: the dots don't show at 16–36 px
//                      public/pwa-192x192.png, pwa-512x512.png, apple-touch-icon.png (180)
//                                                 full bleed: platforms apply their own masks
//                      public/maskable-512x512.png  full bleed, the T inside the safe zone
//   node scripts/gen-logo.mjs [--plain] [--bleed] [--scale 0.76] > out.svg
//                    print one SVG: --plain leaves out the halftone, --bleed squares the corners,
//                    --scale shrinks the T (0.76 keeps it inside the maskable-icon safe zone)
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const GOLD_TOP = '#ffd25a'
const GOLD = '#ffc533'
const DOTS = '#f0a90a'
const INK = '#0f0b1a'
const SHADOW = '#c7860a'

// Bangers "T" at 112 px, its ink box centred on (63, 64) of the 128 grid.
const T =
  'M61.49 101.74L41.33 104.88Q42.56 98.72 43.85 92.62Q45.14 86.51 46.26 80.58Q50.51 59.3 53.2 39.81' +
  'Q51.97 39.58 50.62 39.53Q49.28 39.47 48.05 39.58Q45.36 39.81 42.78 38.91Q42.9 38.02 42.9 36.95' +
  'Q42.9 35.89 42.9 34.77Q42.9 33.54 42.9 32.36Q42.9 31.18 43.01 30.06Q43.12 28.83 43.12 27.43' +
  'Q43.12 26.03 43.23 24.58Q46.14 24.8 49.06 24.91Q51.97 25.02 54.88 25.02Q63.17 25.02 70.73 24.46' +
  'Q78.29 23.9 84.67 23.12L83.44 29.17L82.43 34.43Q81.87 37.34 81.42 39.02Q80.19 39.36 78.96 39.58' +
  'Q77.73 39.81 76.5 39.92Q75.26 40.03 73.98 40.26Q72.69 40.48 71.46 40.7Q69.78 48.99 68.71 55.04' +
  'Q67.65 61.09 66.81 66.63Q65.97 72.18 64.85 78.78Q62.94 90.1 61.49 101.74Z'

const f = (n) => Math.round(n * 10) / 10

/** Dots on a 45° grid, bigger toward the bottom-right corner, like a comic's print. */
function halftone() {
  const step = 5.6 / Math.SQRT2
  const dots = []
  for (let i = -30; i <= 30; i++) {
    for (let j = -30; j <= 30; j++) {
      const x = 64 + (i + j) * step
      const y = 64 + (i - j) * step
      if (x <= -2 || x >= 130 || y <= -2 || y >= 130) continue
      const t = 1 - Math.min(1, Math.hypot(x - 128, y - 128) / 150)
      const r = 0.35 + 1.55 * t ** 1.3
      if (r >= 0.55) dots.push(`<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}"/>`)
    }
  }
  return `<g fill="${DOTS}">${dots.join('')}</g>`
}

/** The icon as SVG on a 128 grid. */
export function icon({ plain = false, bleed = false, scale = 1 } = {}) {
  const rx = bleed ? 0 : 28
  const clip = !plain && !bleed
  const t = scale === 1 ? '' : ` transform="translate(64 64) scale(${scale}) translate(-64 -64)"`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" role="img" aria-label="Thanos Automa logo">
  <defs>
    <linearGradient id="tag" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${GOLD_TOP}"/>
      <stop offset="1" stop-color="${GOLD}"/>
    </linearGradient>${clip ? `\n    <clipPath id="tile"><rect width="128" height="128" rx="${rx}"/></clipPath>` : ''}
  </defs>
  <rect width="128" height="128" rx="${rx}" fill="url(#tag)"/>${plain ? '' : `\n  ${clip ? '<g clip-path="url(#tile)">' : '<g>'}${halftone()}</g>`}
  <g${t}>
    <path d="${T}" fill="${SHADOW}" transform="translate(5 5)"/>
    <path d="${T}" fill="${INK}"/>
  </g>
</svg>
`
}

const args = process.argv.slice(2)

if (args.includes('--write')) {
  const root = fileURLToPath(new URL('..', import.meta.url))
  await mkdir(`${root}docs/assets`, { recursive: true })
  await writeFile(`${root}docs/assets/logo.svg`, icon())
  await writeFile(`${root}public/favicon.svg`, icon({ plain: true }))
  console.log('✓ docs/assets/logo.svg, public/favicon.svg')

  const PNGS = [
    ['pwa-192x192.png', 192, icon({ bleed: true })],
    ['pwa-512x512.png', 512, icon({ bleed: true })],
    ['apple-touch-icon.png', 180, icon({ bleed: true })],
    ['maskable-512x512.png', 512, icon({ bleed: true, scale: 0.76 })],
  ]
  const { chromium } = await import('playwright-core')
  const browser = await chromium.launch(
    process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' },
  )
  try {
    for (const [name, size, svg] of PNGS) {
      const page = await browser.newPage({ viewport: { width: size, height: size } })
      const src = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
      await page.setContent(
        `<body style="margin:0"><img src="${src}" width="${size}" height="${size}" style="display:block"></body>`,
      )
      await page.waitForFunction(() => document.images[0]?.complete)
      await page.screenshot({
        path: `${root}public/${name}`,
        clip: { x: 0, y: 0, width: size, height: size },
      })
      await page.close()
      console.log(`✓ public/${name}`)
    }
  } finally {
    await browser.close()
  }
} else {
  const n = args.indexOf('--scale')
  process.stdout.write(
    icon({
      plain: args.includes('--plain'),
      bleed: args.includes('--bleed'),
      scale: n >= 0 ? Number(args[n + 1]) || 1 : 1,
    }),
  )
}

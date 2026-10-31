// Renders the landing page's cartoon-glove cursor (site/cursors/glove.svg, our own drawing) to the
// PNGs that browsers accept as cursors: 32 px (1×) and 64 px (2×). It prints the hotspot, the tip of
// the pointing finger, for `cursor: … x y` in site/styles.css.
//
//   node scripts/gen-cursor.mjs     (needs Google Chrome; set CHROME_PATH to use another Chromium)
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const dir = fileURLToPath(new URL('../site/cursors/', import.meta.url))
const svg = await readFile(`${dir}glove.svg`, 'utf8')
const src = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`

const browser = await chromium.launch(
  process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' },
)
try {
  for (const [size, file] of [
    [32, 'glove.png'],
    [64, 'glove@2x.png'],
  ]) {
    const page = await browser.newPage({ viewport: { width: size, height: size } })
    await page.setContent(
      `<style>html,body{margin:0;background:transparent}img{display:block}</style>` +
        `<img src="${src}" width="${size}" height="${size}">`,
    )
    // The first opaque pixel from the top is the fingertip; nothing may touch the edges.
    const { tip, edge } = await page.evaluate(async (n) => {
      const img = document.querySelector('img')
      await img.decode()
      const canvas = Object.assign(document.createElement('canvas'), { width: n, height: n })
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, n, n)
      const { data } = ctx.getImageData(0, 0, n, n)
      const alpha = (x, y) => data[(y * n + x) * 4 + 3]
      let found = null
      for (let y = 0; y < n && !found; y++)
        for (let x = 0; x < n; x++) if (alpha(x, y) > 128) found = [x, y]
      const box = [n, n, -1, -1]
      for (let y = 0; y < n; y++)
        for (let x = 0; x < n; x++)
          if (alpha(x, y)) {
            box[0] = Math.min(box[0], x)
            box[1] = Math.min(box[1], y)
            box[2] = Math.max(box[2], x)
            box[3] = Math.max(box[3], y)
          }
      const touches = box[0] === 0 || box[1] === 0 || box[2] === n - 1 || box[3] === n - 1
      return { tip: found, edge: touches && box.join(',') }
    }, size)
    if (edge)
      throw new Error(`${file}: the drawing (${edge}) touches the edge of the ${size} px square`)
    await page.screenshot({ path: `${dir}${file}`, omitBackground: true })
    console.log(`${file}: ${size}×${size}, fingertip at ${tip}`)
    await page.close()
  }
} finally {
  await browser.close()
}

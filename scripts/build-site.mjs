// Assembles the GitHub Pages landing page into _site/: the page in site/ (with its glove cursor in
// site/cursors/, rendered by scripts/gen-cursor.mjs), plus the guide's screenshots, the fonts and
// the app icon, copied in rather than duplicated in the repo.
//
//   npm run site            then preview with: npx vite preview --outDir _site
//
// Fails if the page references a file that isn't there.
import { cp, mkdir, readdir, readFile, rm, stat } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const out = `${root}_site/`

await rm(out, { recursive: true, force: true })
await mkdir(`${out}screenshots`, { recursive: true })
await mkdir(`${out}fonts`, { recursive: true })
await cp(`${root}site`, out, { recursive: true })
for (const file of await readdir(`${root}docs/guide/screenshots`)) {
  if (file.endsWith('.png'))
    await cp(`${root}docs/guide/screenshots/${file}`, `${out}screenshots/${file}`)
}
await cp(`${root}src/ui/assets/fonts/bangers-cyrillic.woff2`, `${out}fonts/bangers-cyrillic.woff2`)
await cp(
  `${root}node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2`,
  `${out}fonts/inter-latin-wght-normal.woff2`,
)
await cp(`${root}public/favicon.svg`, `${out}favicon.svg`)
await cp(`${root}public/pwa-512x512.png`, `${out}icon-512.png`)

// Every local file the page or its stylesheet points at must exist.
const html = await readFile(`${out}index.html`, 'utf8')
const css = await readFile(`${out}styles.css`, 'utf8')
const refs = [
  ...[...html.matchAll(/(?:src|href)="([^"#:]+)"/g)].map((m) => m[1]),
  ...[...css.matchAll(/url\('([^')]+)'\)/g)].map((m) => m[1]),
].filter((ref) => !ref.startsWith('//'))
const missing = []
for (const ref of new Set(refs)) {
  try {
    await stat(out + ref)
  } catch {
    missing.push(ref)
  }
}
if (missing.length) {
  console.error(`Missing files: ${missing.join(', ')}`)
  process.exit(1)
}
console.log(`_site/ ready: ${new Set(refs).size} local files referenced, all present`)

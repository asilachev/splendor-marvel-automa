// Assembles the GitHub Pages landing page into _site/, once per language (#61, #69):
//
//   _site/index.html          English, from the template site/index.html and site/locales/en.json
//   _site/{ru,sr,es,de}/      the other languages
//   _site/screenshots/<lang>/ the app in that language: English from docs/guide/screenshots,
//                             the others from .screenshots/<lang> (npm run site:shots)
//
//   npm run site:shots && npm run site     then preview with: npx vite preview --outDir _site
//
// Fails if a language misses a text, the page references a file that isn't there, or a
// placeholder is left over. Russian texts get the app's typography (src/ui/i18n/typography.ts).
import { cp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { typeset } from '../src/ui/i18n/typography.ts'

const root = fileURLToPath(new URL('..', import.meta.url))
const out = `${root}_site/`
const SITE_URL = 'https://asilachev.github.io/splendor-marvel-automa/'
const STORAGE_KEY = 'thanos-site:lang'

/** The app's languages, in the app's order; English lives at the root. */
const LANGS = [
  { code: 'en', name: 'English', tag: 'en', locale: 'en_GB' },
  { code: 'ru', name: 'Русский', tag: 'ru', locale: 'ru_RU' },
  { code: 'sr', name: 'Српски', tag: 'sr-Cyrl', locale: 'sr_RS' },
  { code: 'es', name: 'Español', tag: 'es', locale: 'es_ES' },
  { code: 'de', name: 'Deutsch', tag: 'de', locale: 'de_DE' },
]
const dirOf = (code) => (code === 'en' ? '' : `${code}/`)

/** Asmodee's store locator has country pages for some of our languages; the rest get the default. */
const STORE = { de: 'de/', es: 'es/' }
const links = (code) => ({
  github: 'https://github.com/asilachev/splendor-marvel-automa',
  guide: 'https://github.com/asilachev/splendor-marvel-automa/blob/master/docs/guide/README.md',
  publisher: 'https://www.spacecowboys-games.com/game/splendor-marvel/',
  store: `https://storelocator.asmodee.com/${STORE[code] ?? ''}`,
  bgg: 'https://boardgamegeek.com/boardgame/293296/splendor-marvel',
  automa: 'https://boardgamegeek.com/filepage/201926',
  retheme: 'https://boardgamegeek.com/filepage/215783',
})

/** First visit to the English page: go to the browser's language, unless one was picked here. */
const REDIRECT = `<script>
      ;(() => {
        const others = ${JSON.stringify(LANGS.map((l) => l.code).filter((c) => c !== 'en'))}
        const go = (code) => location.replace(\`\${code}/\${location.hash}\`)
        try {
          const picked = localStorage.getItem('${STORAGE_KEY}')
          if (picked) {
            if (others.includes(picked)) go(picked)
            return
          }
        } catch {
          // No storage: fall back to the browser's languages.
        }
        for (const tag of navigator.languages ?? [navigator.language]) {
          const code = String(tag).toLowerCase().split('-')[0]
          if (code === 'en') return
          if (others.includes(code)) return go(code)
        }
      })()
    </script>`

// ---- Texts ---------------------------------------------------------------------------------------

/** Every text in a locale file, by dotted path. */
function flatten(value, path = '', into = new Map()) {
  if (typeof value === 'string') into.set(path, value)
  else if (Array.isArray(value)) value.forEach((v, i) => flatten(v, `${path}.${i}`, into))
  else for (const [k, v] of Object.entries(value)) flatten(v, path ? `${path}.${k}` : k, into)
  return into
}
const texts = Object.fromEntries(
  await Promise.all(
    LANGS.map(async ({ code }) => [
      code,
      flatten(JSON.parse(await readFile(`${root}site/locales/${code}.json`, 'utf8'))),
    ]),
  ),
)
const problems = []
for (const { code } of LANGS) {
  const missing = [...texts.en.keys()].filter((k) => !texts[code].has(k))
  const extra = [...texts[code].keys()].filter((k) => !texts.en.has(k))
  if (missing.length) problems.push(`site/locales/${code}.json misses ${missing.join(', ')}`)
  if (extra.length) problems.push(`site/locales/${code}.json has unknown ${extra.join(', ')}`)
}

// ---- Pages ---------------------------------------------------------------------------------------

const escapeAttribute = (text) =>
  text.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;')

/** Fills {{key}}: inside a tag the value is attribute text; elsewhere it's (trusted) HTML. */
function render(template, value) {
  let html = template.replace(/<!--[\s\S]*?-->\n?/g, '')
  const fill = (escape) => (_, key) => (escape ? escapeAttribute(value(key)) : value(key))
  for (let pass = 0; pass < 3 && html.includes('{{'); pass++) {
    html = html.replace(/<[^<>]*>/g, (tag) => tag.replace(/\{\{([\w.]+)\}\}/g, fill(true)))
    html = html.replace(/\{\{([\w.]+)\}\}/g, fill(false))
  }
  const left = html.match(/\{\{[^}]*\}\}/)
  if (left) throw new Error(`Unknown placeholder ${left[0]}`)
  return html
}

function page(template, lang) {
  const { code, tag, name, locale } = lang
  const base = code === 'en' ? '' : '../'
  // The same links serve the menu and the chips; CSS styles each by where it sits.
  const link = (other) =>
    `<li><a href="${base}${dirOf(other.code)}" hreflang="${other.tag}" lang="${other.tag}" ` +
    `data-lang="${other.code}"${other.code === code ? ' aria-current="page"' : ''}>` +
    `${other.name}</a></li>`
  const languageLinks = LANGS.map(link).join('\n          ')
  const generated = {
    lang: tag,
    code,
    langName: name,
    langCode: code.toUpperCase(),
    base,
    shots: `${base}screenshots/${code}/`,
    siteUrl: SITE_URL,
    pageUrl: SITE_URL + dirOf(code),
    ogLocale: locale,
    alternates: [
      ...LANGS.map(
        (l) => `<link rel="alternate" hreflang="${l.code}" href="${SITE_URL}${dirOf(l.code)}" />`,
      ),
      `<link rel="alternate" hreflang="x-default" href="${SITE_URL}" />`,
    ].join('\n    '),
    langMenu: languageLinks,
    langChips: languageLinks,
    redirect: code === 'en' ? REDIRECT : '',
    ...Object.fromEntries(Object.entries(links(code)).map(([k, v]) => [`links.${k}`, v])),
  }
  return render(template, (key) => {
    if (key in generated) return generated[key]
    const text = texts[code].get(key)
    if (text === undefined) throw new Error(`site/locales/${code}.json has no text for ${key}`)
    return typeset(code, text)
  })
}

// ---- Files ---------------------------------------------------------------------------------------

/** The screenshots the template shows. */
const template = await readFile(`${root}site/index.html`, 'utf8')
const shots = [...new Set([...template.matchAll(/\{\{shots\}\}([\w-]+\.png)/g)].map((m) => m[1]))]

await rm(out, { recursive: true, force: true })
await mkdir(`${out}fonts`, { recursive: true })
await cp(`${root}site/styles.css`, `${out}styles.css`)
await cp(`${root}site/cursors`, `${out}cursors`, { recursive: true })
await cp(`${root}src/ui/assets/fonts/bangers-cyrillic.woff2`, `${out}fonts/bangers-cyrillic.woff2`)
for (const subset of ['latin', 'cyrillic']) {
  const file = `inter-${subset}-wght-normal.woff2`
  await cp(`${root}node_modules/@fontsource-variable/inter/files/${file}`, `${out}fonts/${file}`)
}
await cp(`${root}public/favicon.svg`, `${out}favicon.svg`)
await cp(`${root}public/pwa-512x512.png`, `${out}icon-512.png`)

for (const lang of LANGS) {
  const from =
    lang.code === 'en' ? `${root}docs/guide/screenshots/` : `${root}.screenshots/${lang.code}/`
  await mkdir(`${out}screenshots/${lang.code}`, { recursive: true })
  for (const shot of shots) {
    try {
      await cp(`${from}${shot}`, `${out}screenshots/${lang.code}/${shot}`)
    } catch {
      problems.push(`No ${lang.code} screenshot ${shot}: run npm run site:shots`)
    }
  }
  await mkdir(`${out}${dirOf(lang.code)}`, { recursive: true })
  await writeFile(`${out}${dirOf(lang.code)}index.html`, page(template, lang))
}

// Every local file a page or the stylesheet points at must exist.
let checked = 0
const check = async (file, ref) => {
  const target = new URL(ref, `file://${file}`)
  checked++
  try {
    await stat(fileURLToPath(target))
  } catch {
    problems.push(`${file.slice(out.length)} points at missing ${ref}`)
  }
}
for (const lang of LANGS) {
  const file = `${out}${dirOf(lang.code)}index.html`
  const html = await readFile(file, 'utf8')
  for (const [, ref] of html.matchAll(/(?:src|href)="([^"#:]+)"/g)) await check(file, ref)
}
const css = await readFile(`${out}styles.css`, 'utf8')
for (const [, ref] of css.matchAll(/url\('([^')]+)'\)/g)) await check(`${out}styles.css`, ref)

if (problems.length) {
  for (const problem of problems) console.error(`✗ ${problem}`)
  process.exit(1)
}
console.log(`_site/ ready: ${LANGS.length} languages, ${checked} local references, all present`)

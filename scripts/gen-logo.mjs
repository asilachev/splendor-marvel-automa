// Usage: node scripts/gen-logo.mjs [--bleed] [--scale 0.76] > out.svg
//   (no flags)  docs/assets/logo.svg and public/favicon.svg (rounded corners)
//   --bleed     full-bleed square for the PWA icons (platforms apply their own masks)
//   --scale s   shrink the mark, e.g. 0.76 keeps it inside the maskable-icon safe zone
// PNGs in public/ are renders of these SVGs (512, 192, 180 px).
// Generates the original app logo: five stone-shaped gems on a gold ring around a green gem.
// Shapes follow docs/design.md → Visual language. No game art or marks.
const args = process.argv.slice(2)
const bleed = args.includes('--bleed')
const scale = Number(args[args.indexOf('--scale') + 1]) || 1
const C = 64,
  R = 38
const f = (n) => Math.round(n * 10) / 10
const at = (deg, r = R) => [
  C + r * Math.cos((deg * Math.PI) / 180),
  C + r * Math.sin((deg * Math.PI) / 180),
]
const poly = (pts) => pts.map(([x, y]) => `${f(x)},${f(y)}`).join(' ')
const ngon = ([cx, cy], n, r, rot) =>
  Array.from(
    { length: n },
    (_, i) =>
      at.call(null, 0) && [
        cx + r * Math.cos(((rot + (360 / n) * i) * Math.PI) / 180),
        cy + r * Math.sin(((rot + (360 / n) * i) * Math.PI) / 180),
      ],
  )
const star = ([cx, cy], n, ro, ri) =>
  Array.from({ length: n * 2 }, (_, i) => {
    const r = i % 2 ? ri : ro
    const a = ((-90 + (180 / n) * i) * Math.PI) / 180
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)]
  })
const stroke = 'stroke="#0b0d1a" stroke-width="3" stroke-linejoin="round"'
const hl = ([x, y], dx = -3, dy = -3) =>
  `<circle cx="${f(x + dx)}" cy="${f(y + dy)}" r="2.2" fill="#fff" fill-opacity=".55"/>`
const [power, mind, space, reality, soul] = [-90, -18, 54, 126, 198].map((d) => at(d))
const gems = [
  `<circle cx="${f(power[0])}" cy="${f(power[1])}" r="11" fill="#9b5de5" ${stroke}/>` + hl(power),
  `<polygon points="${poly(ngon(mind, 6, 12, 0))}" fill="#f7d046" ${stroke}/>` + hl(mind),
  `<rect x="${f(space[0] - 10)}" y="${f(space[1] - 10)}" width="20" height="20" rx="3" fill="#3a86ff" ${stroke}/>` +
    hl(space),
  `<polygon points="${poly(ngon([reality[0], reality[1] + 1.5], 3, 13, -90))}" fill="#ef233c" ${stroke}/>` +
    hl(reality, -1.5, -1),
  `<polygon points="${poly(star(soul, 8, 13, 9.5))}" fill="#fb8500" ${stroke}/>` + hl(soul),
  `<polygon points="${poly(ngon([C, C], 4, 14, -90))}" fill="#2dc653" ${stroke}/>` +
    hl([C, C], -2.5, -4),
].join('\n  ')
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" role="img" aria-label="Solo automa logo">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#232a5c"/>
      <stop offset="1" stop-color="#0b0d1a"/>
    </linearGradient>
  </defs>
  <rect width="128" height="128" rx="${bleed ? 0 : 28}" fill="url(#bg)"/>
  <g transform="translate(64 64) scale(${scale}) translate(-64 -64)">
  <circle cx="${C}" cy="${C}" r="${R}" fill="none" stroke="#f2c14e" stroke-width="3.5"/>
  ${gems}
  </g>
</svg>
`
process.stdout.write(svg)

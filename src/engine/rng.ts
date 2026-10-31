/** A function returning a float in [0, 1). */
export type Random = () => number

/**
 * mulberry32: a tiny, well-known 32-bit seeded PRNG. Good enough for shuffling a 10-card deck,
 * and deterministic, so a saved game replays exactly (docs/design.md → Principles).
 */
export function mulberry32(seed: number): Random {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Integer in [0, maxExclusive). */
export function randomInt(maxExclusive: number, random: Random): number {
  return Math.floor(random() * maxExclusive)
}

/** Fisher–Yates shuffle. Returns a new array; the input is untouched. */
export function shuffle<T>(items: readonly T[], random: Random): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = randomInt(i + 1, random)
    const tmp = out[i] as T
    out[i] = out[j] as T
    out[j] = tmp
  }
  return out
}

/** A fresh 32-bit seed. Only for starting a new game; never used inside the engine. */
export function newSeed(): number {
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  return buf[0] ?? 0
}

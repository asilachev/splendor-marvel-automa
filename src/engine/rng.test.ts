import { describe, expect, it } from 'vitest'
import { mulberry32, newSeed, randomInt, shuffle } from './rng.ts'

describe('mulberry32', () => {
  it('is deterministic for a seed and stays in [0, 1)', () => {
    const a = mulberry32(42)
    const b = mulberry32(42)
    const xs = Array.from({ length: 1000 }, () => a())
    expect(xs.slice(0, 5)).toEqual(Array.from({ length: 5 }, () => b()))
    expect(xs.every((x) => x >= 0 && x < 1)).toBe(true)
  })

  it('differs between seeds', () => {
    expect(mulberry32(1)()).not.toBe(mulberry32(2)())
  })
})

describe('shuffle', () => {
  it('returns a permutation and leaves the input untouched', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const out = shuffle(input, mulberry32(7))
    expect(input).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    expect([...out].sort((a, b) => a - b)).toEqual(input)
  })

  it('is deterministic for a seed', () => {
    expect(shuffle([1, 2, 3, 4, 5], mulberry32(99))).toEqual(
      shuffle([1, 2, 3, 4, 5], mulberry32(99)),
    )
  })

  it('is roughly uniform over permutations', () => {
    const random = mulberry32(2024)
    const counts = new Map<string, number>()
    for (let i = 0; i < 6000; i++) {
      const key = shuffle(['a', 'b', 'c'], random).join('')
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    expect(counts.size).toBe(6)
    for (const n of counts.values()) expect(Math.abs(n - 1000)).toBeLessThan(150)
  })
})

describe('helpers', () => {
  it('randomInt stays in range', () => {
    const random = mulberry32(5)
    for (let i = 0; i < 100; i++) {
      const n = randomInt(4, random)
      expect(n >= 0 && n < 4 && Number.isInteger(n)).toBe(true)
    }
  })

  it('newSeed returns a 32-bit unsigned integer', () => {
    const seed = newSeed()
    expect(Number.isInteger(seed) && seed >= 0 && seed <= 0xffffffff).toBe(true)
  })
})

import { describe, expect, it } from 'vitest'
import { STONES, stoneForTokenNumber } from './stones.ts'

describe('token placement board', () => {
  it('maps 1–5 to Power, Mind, Space, Reality, Soul (docs/automa.md → Components)', () => {
    expect(STONES).toHaveLength(5)
    expect(stoneForTokenNumber(1)).toBe('power')
    expect(stoneForTokenNumber(2)).toBe('mind')
    expect(stoneForTokenNumber(3)).toBe('space')
    expect(stoneForTokenNumber(4)).toBe('reality')
    expect(stoneForTokenNumber(5)).toBe('soul')
  })
})

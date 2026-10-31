import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useWakeLock } from './useWakeLock.ts'

function mockWakeLock() {
  const sentinel = { release: vi.fn(async () => undefined), addEventListener: vi.fn() }
  const request = vi.fn(async () => sentinel)
  Object.defineProperty(navigator, 'wakeLock', { value: { request }, configurable: true })
  return { request, sentinel }
}

afterEach(() => {
  Reflect.deleteProperty(navigator, 'wakeLock')
})

describe('useWakeLock (#9)', () => {
  it('requests a screen wake lock while active and releases it afterwards', async () => {
    const { request, sentinel } = mockWakeLock()
    const { unmount } = renderHook(() => useWakeLock(true))
    await waitFor(() => expect(request).toHaveBeenCalledWith('screen'))
    unmount()
    await waitFor(() => expect(sentinel.release).toHaveBeenCalled())
  })

  it('does nothing when inactive', () => {
    const { request } = mockWakeLock()
    renderHook(() => useWakeLock(false))
    expect(request).not.toHaveBeenCalled()
  })

  it('degrades gracefully when unsupported or refused', async () => {
    expect(() => renderHook(() => useWakeLock(true))).not.toThrow()
    const request = vi.fn(async () => {
      throw new Error('NotAllowedError')
    })
    Object.defineProperty(navigator, 'wakeLock', { value: { request }, configurable: true })
    renderHook(() => useWakeLock(true))
    await waitFor(() => expect(request).toHaveBeenCalled())
  })
})

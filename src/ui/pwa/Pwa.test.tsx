import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_SETTINGS } from '../../engine/index.ts'
import { tickSetup } from '../../test/play.ts'
import { App } from '../App.tsx'
import { saveGame } from '../state/persistence.ts'
import { loadPrefs } from '../state/prefs.ts'
import { listenForInstallPrompt } from './pwa.ts'

const sw = vi.hoisted(() => ({ needRefresh: false, update: vi.fn() }))

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({
    needRefresh: [sw.needRefresh, () => {}],
    offlineReady: [false, () => {}],
    updateServiceWorker: sw.update,
  }),
}))

const IPHONE_SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1'

listenForInstallPrompt(window)

/** Pretends the app was launched from the home screen. */
function launchStandalone() {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string) => ({
      matches: query === '(display-mode: standalone)',
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  })
}

beforeEach(() => localStorage.clear())

afterEach(() => {
  act(() => {
    window.dispatchEvent(new Event('appinstalled'))
  })
  sw.needRefresh = false
  sw.update.mockReset()
  vi.restoreAllMocks()
  vi.useRealTimers()
  Reflect.deleteProperty(window, 'matchMedia')
  Reflect.deleteProperty(navigator, 'storage')
})

describe('launch (#45)', () => {
  it('opens on Home with CONTINUE when a game is saved (7.3 → 1.2)', async () => {
    const user = userEvent.setup()
    saveGame({ version: 1, seed: 1, settings: DEFAULT_SETTINGS, events: [] })
    render(<App />)
    expect(screen.getByRole('heading', { name: 'THANOS AUTOMA' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'CONTINUE · ROUND 1' }))
    expect(screen.getByRole('heading', { name: 'THANOS MAKES HIS MOVE' })).toBeInTheDocument()
  })

  it('shows the splash when launched from the home screen, then Home (7.3)', () => {
    vi.useFakeTimers()
    launchStandalone()
    render(<App />)
    expect(screen.getByText('Splendor Marvel · solo companion')).toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(900)
    })
    act(() => {
      vi.advanceTimersByTime(250)
    })
    expect(screen.queryByText('Splendor Marvel · solo companion')).toBeNull()
    expect(screen.getByRole('button', { name: 'START YOUR FIRST GAME' })).toBeInTheDocument()
  })

  it('has no splash in a browser tab', () => {
    render(<App />)
    expect(screen.queryByText('Splendor Marvel · solo companion')).toBeNull()
  })
})

describe('install (#45)', () => {
  it('offers the Install card on Home when the browser allows installing (7.2)', async () => {
    const user = userEvent.setup()
    render(<App />)
    expect(screen.queryByRole('region', { name: 'Install Thanos Automa' })).toBeNull()

    const prompt = vi.fn(() => Promise.resolve())
    const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
      prompt,
      userChoice: Promise.resolve({ outcome: 'accepted' as const }),
    })
    act(() => {
      window.dispatchEvent(event)
    })
    expect(event.defaultPrevented).toBe(true)
    const card = screen.getByRole('region', { name: 'Install Thanos Automa' })
    await user.click(within(card).getByRole('button', { name: 'INSTALL' }))
    expect(prompt).toHaveBeenCalledOnce()
    expect(screen.queryByRole('region', { name: 'Install Thanos Automa' })).toBeNull()
  })

  it('shows the Add to Home Screen sheet once, in iPhone Safari (7.1)', async () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(IPHONE_SAFARI)
    const user = userEvent.setup()
    const { unmount } = render(<App />)
    const sheet = screen.getByRole('dialog', { name: 'INSTALL THE APP' })
    expect(within(sheet).getByText('Tap Share in Safari’s toolbar')).toBeInTheDocument()
    await user.click(within(sheet).getByRole('button', { name: 'GOT IT' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(loadPrefs().installHintSeen).toBe(true)

    unmount()
    render(<App />)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('skips the iOS sheet once installed', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(IPHONE_SAFARI)
    vi.useFakeTimers()
    launchStandalone()
    render(<App />)
    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})

describe('offline and updates (#45)', () => {
  it('says everything still works when the network drops (7.4)', () => {
    render(<App />)
    act(() => {
      window.dispatchEvent(new Event('offline'))
    })
    expect(screen.getByText('You’re offline — everything still works.')).toBeInTheDocument()
    act(() => {
      window.dispatchEvent(new Event('online'))
    })
    expect(screen.queryByText('You’re offline — everything still works.')).toBeNull()
  })

  it('waits for RELOAD before switching to a new version (7.4)', async () => {
    sw.needRefresh = true
    const user = userEvent.setup()
    render(<App />)
    expect(screen.getByText('A new version is ready. Your game is saved.')).toBeInTheDocument()
    expect(sw.update).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'RELOAD' }))
    expect(sw.update).toHaveBeenCalledWith(true)
  })

  it('asks the browser to keep the saved game when a game starts', async () => {
    const persist = vi.fn(() => Promise.resolve(true))
    Object.defineProperty(navigator, 'storage', { configurable: true, value: { persist } })
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'START YOUR FIRST GAME' }))
    expect(persist).not.toHaveBeenCalled()
    await tickSetup(user)
    await user.click(screen.getByRole('button', { name: 'START GAME' }))
    expect(persist).toHaveBeenCalledOnce()
  })
})

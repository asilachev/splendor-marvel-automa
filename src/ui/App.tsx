import { OctagonX, RotateCcw, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { Button, Dialog } from './components/Kit.tsx'
import { useToasts } from './components/toast.ts'
import { Toaster } from './components/Toaster.tsx'
import { Game } from './game/Game.tsx'
import { History } from './home/History.tsx'
import { Home } from './home/Home.tsx'
import { Setup } from './home/Setup.tsx'
import {
  browserLanguages,
  detectLang,
  I18nContext,
  LANGS,
  loadCatalog,
  loadedCatalog,
  translatorFor,
  useT,
  type I18n,
  type Lang,
} from './i18n/index.ts'
import {
  isIosSafari,
  isStandalone,
  requestPersistentStorage,
  useInstallPrompt,
  useSplash,
} from './pwa/pwa.ts'
import { InstallCard, InstallSheet, Splash } from './pwa/Pwa.tsx'
import { usePwaToasts } from './pwa/usePwaToasts.tsx'
import { loadSettings } from './state/persistence.ts'
import { loadPrefs, savePrefs, type Prefs } from './state/prefs.ts'
import { useGame } from './state/useGame.ts'

type Screen = 'home' | 'setup' | 'game' | 'history'

/** Confirmations that clear the saved game: a new game over it, or ending it (#53). */
type Confirm = 'newGame' | 'endGame'

type UpdatePrefs = (change: Partial<Prefs>) => void

/**
 * Device preferences live here, above the toasts, because the language (#54) is one of them:
 * the browser's language on first launch, then whatever was picked.
 */
export function App() {
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs)
  const updatePrefs = useCallback<UpdatePrefs>(
    (change) =>
      setPrefs((prev) => {
        const next = { ...prev, ...change }
        savePrefs(next)
        return next
      }),
    [],
  )
  const preferred = prefs.language ?? detectLang(browserLanguages())
  // A language's file is loaded before it goes on screen, so text never flashes in English.
  const [lang, setLang] = useState<Lang>(() => (loadedCatalog(preferred) ? preferred : 'en'))
  useEffect(() => {
    if (lang === preferred) return
    let cancelled = false
    loadCatalog(preferred)
      .then(() => {
        if (!cancelled) setLang(preferred)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [lang, preferred])
  const i18n = useMemo<I18n>(
    () => ({ lang, t: translatorFor(lang), setLang: (language) => updatePrefs({ language }) }),
    [lang, updatePrefs],
  )
  useEffect(() => {
    document.documentElement.lang = LANGS.find((l) => l.code === lang)?.tag ?? lang
  }, [lang])
  return (
    <I18nContext.Provider value={i18n}>
      <Toaster>
        <Shell prefs={prefs} updatePrefs={updatePrefs} />
      </Toaster>
    </I18nContext.Provider>
  )
}

function Shell({ prefs, updatePrefs }: { prefs: Prefs; updatePrefs: UpdatePrefs }) {
  const t = useT()
  const game = useGame()
  // Every launch opens on Home; a saved game shows CONTINUE (design: 7.3 splash → 1.2).
  const [screen, setScreen] = useState<Screen>('home')
  const [confirm, setConfirm] = useState<Confirm | null>(null)
  const toasts = useToasts()
  const splash = useSplash()
  const installPrompt = useInstallPrompt()
  const [iosNotInstalled] = useState(() => isIosSafari() && !isStandalone())
  usePwaToasts()
  const inProgress = game.state !== null && game.state.step !== 'over'
  const newGame = () => (inProgress ? setConfirm('newGame') : setScreen('setup'))
  const endGame = () => setConfirm('endGame')

  // Each screen opens at its top, set before paint (#52).
  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [screen])

  let view
  if (screen === 'setup') {
    view = (
      <Setup
        initial={loadSettings()}
        onBack={() => setScreen('home')}
        onStart={(settings) => {
          requestPersistentStorage()
          updatePrefs({ played: true })
          game.start(settings)
          setScreen('game')
        }}
      />
    )
  } else if (screen === 'history') {
    view = (
      <History
        history={game.history}
        onBack={() => setScreen('home')}
        onClear={() => {
          game.clearHistory()
          toasts.push({
            key: 'historyCleared',
            icon: <Trash2 size={20} />,
            text: t('toasts.historyCleared'),
            tone: 'muted',
          })
        }}
      />
    )
  } else if (screen === 'game' && game.state) {
    view = (
      <Game
        state={game.state}
        canUndo={game.canUndo}
        dispatch={game.dispatch}
        undo={game.undo}
        wakeLock={prefs.wakeLock}
        onWakeLock={(on) => updatePrefs({ wakeLock: on })}
        onHome={() => setScreen('home')}
        onNewGame={newGame}
        onEndGame={endGame}
      />
    )
  } else {
    view = (
      <Home
        state={game.state}
        firstLaunch={game.state === null && !prefs.played}
        corruptSave={game.recoveredFromCorruptSave}
        install={
          installPrompt.available ? (
            <InstallCard onInstall={() => void installPrompt.install()} />
          ) : null
        }
        historyCount={game.history.length}
        onContinue={() => setScreen('game')}
        onNewGame={newGame}
        onEndGame={endGame}
        onHistory={() => setScreen('history')}
      />
    )
  }

  const ending = confirm === 'endGame'
  return (
    <>
      {view}
      {confirm && game.state ? (
        <Dialog
          title={ending ? t('dialogs.endTitle') : t('dialogs.abandonTitle')}
          onClose={() => setConfirm(null)}
        >
          <p>
            {ending
              ? t('dialogs.endBody', { round: game.state.round })
              : t('dialogs.abandonBody', { round: game.state.round })}
          </p>
          <Button
            variant="danger"
            icon={ending ? <OctagonX size={20} /> : <RotateCcw size={20} />}
            onClick={() => {
              setConfirm(null)
              game.abandon()
              updatePrefs({ played: true })
              if (ending) {
                setScreen('home')
                toasts.push({
                  key: 'ended',
                  icon: <OctagonX size={20} />,
                  text: t('toasts.ended'),
                  tone: 'muted',
                })
              } else {
                setScreen('setup')
              }
            }}
          >
            {ending ? t('dialogs.end') : t('dialogs.startOver')}
          </Button>
          <Button variant="secondary" onClick={() => setConfirm(null)}>
            {t('common.keepPlaying')}
          </Button>
        </Dialog>
      ) : null}
      {screen === 'home' && iosNotInstalled && !prefs.installHintSeen ? (
        <InstallSheet onClose={() => updatePrefs({ installHintSeen: true })} />
      ) : null}
      {splash === 'off' ? null : <Splash leaving={splash === 'leaving'} />}
    </>
  )
}

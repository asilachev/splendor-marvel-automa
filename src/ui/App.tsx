import { OctagonX, RotateCcw } from 'lucide-react'
import { useLayoutEffect, useState } from 'react'
import { Button, Dialog } from './components/Kit.tsx'
import { useToasts } from './components/toast.ts'
import { Toaster } from './components/Toaster.tsx'
import { Game } from './game/Game.tsx'
import { Home } from './home/Home.tsx'
import { Setup } from './home/Setup.tsx'
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

type Screen = 'home' | 'setup' | 'game'

/** Confirmations that clear the saved game: a new game over it, or ending it (#53). */
type Confirm = 'newGame' | 'endGame'

export function App() {
  return (
    <Toaster>
      <Shell />
    </Toaster>
  )
}

function Shell() {
  const game = useGame()
  // Every launch opens on Home; a saved game shows CONTINUE (design: 7.3 splash → 1.2).
  const [screen, setScreen] = useState<Screen>('home')
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs)
  const [confirm, setConfirm] = useState<Confirm | null>(null)
  const toasts = useToasts()
  const splash = useSplash()
  const installPrompt = useInstallPrompt()
  const [iosNotInstalled] = useState(() => isIosSafari() && !isStandalone())
  usePwaToasts()
  const updatePrefs = (p: Partial<Prefs>) =>
    setPrefs((prev) => {
      const next = { ...prev, ...p }
      savePrefs(next)
      return next
    })
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
        onContinue={() => setScreen('game')}
        onNewGame={newGame}
        onEndGame={endGame}
      />
    )
  }

  return (
    <>
      {view}
      {confirm && game.state ? (
        <Dialog
          title={confirm === 'endGame' ? 'END THIS GAME?' : 'ABANDON THIS GAME?'}
          onClose={() => setConfirm(null)}
        >
          <p>
            You’re in round {game.state.round}.{' '}
            {confirm === 'endGame'
              ? 'Ending it clears the saved game — Undo can’t bring it back.'
              : 'Starting over clears it — Undo can’t bring it back.'}
          </p>
          <Button
            variant="danger"
            icon={confirm === 'endGame' ? <OctagonX size={20} /> : <RotateCcw size={20} />}
            onClick={() => {
              setConfirm(null)
              game.abandon()
              updatePrefs({ played: true })
              if (confirm === 'endGame') {
                setScreen('home')
                toasts.push({
                  key: 'ended',
                  icon: <OctagonX size={20} />,
                  text: 'Game ended.',
                  tone: 'muted',
                })
              } else {
                setScreen('setup')
              }
            }}
          >
            {confirm === 'endGame' ? 'END GAME' : 'START OVER'}
          </Button>
          <Button variant="secondary" onClick={() => setConfirm(null)}>
            KEEP PLAYING
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

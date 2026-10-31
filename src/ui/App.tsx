import { RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { Button, Dialog } from './components/Kit.tsx'
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
  const [confirmAbandon, setConfirmAbandon] = useState(false)
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
  const newGame = () => (inProgress ? setConfirmAbandon(true) : setScreen('setup'))

  let view
  if (screen === 'setup') {
    view = (
      <Setup
        initial={loadSettings()}
        onBack={() => setScreen('home')}
        onStart={(settings) => {
          requestPersistentStorage()
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
      />
    )
  } else {
    view = (
      <Home
        state={game.state}
        corruptSave={game.recoveredFromCorruptSave}
        install={
          installPrompt.available ? (
            <InstallCard onInstall={() => void installPrompt.install()} />
          ) : null
        }
        onContinue={() => setScreen('game')}
        onNewGame={newGame}
      />
    )
  }

  return (
    <>
      {view}
      {confirmAbandon && game.state ? (
        <Dialog title="ABANDON THIS GAME?" onClose={() => setConfirmAbandon(false)}>
          <p>
            You’re in round {game.state.round}. Starting over clears it — Undo can’t bring it back.
          </p>
          <Button
            variant="danger"
            icon={<RotateCcw size={20} />}
            onClick={() => {
              setConfirmAbandon(false)
              game.abandon()
              setScreen('setup')
            }}
          >
            START OVER
          </Button>
          <Button variant="secondary" onClick={() => setConfirmAbandon(false)}>
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

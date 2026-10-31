import { RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { Button, Dialog } from './components/Kit.tsx'
import { Toaster } from './components/Toaster.tsx'
import { Game } from './game/Game.tsx'
import { Home } from './home/Home.tsx'
import { Setup } from './home/Setup.tsx'
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
  const [screen, setScreen] = useState<Screen>(() =>
    game.state && game.state.step !== 'over' ? 'game' : 'home',
  )
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs)
  const [confirmAbandon, setConfirmAbandon] = useState(false)
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
    </>
  )
}

import { useState } from 'react'
import { Game } from './screens/Game.tsx'
import { Home } from './screens/Home.tsx'
import { Setup } from './screens/Setup.tsx'
import { loadSettings } from './state/persistence.ts'
import { useGame } from './state/useGame.ts'

type Screen = 'home' | 'setup' | 'game'

export function App() {
  const game = useGame()
  const [screen, setScreen] = useState<Screen>(() =>
    game.state && game.state.step !== 'over' ? 'game' : 'home',
  )

  if (screen === 'setup') {
    return (
      <Setup
        initial={loadSettings()}
        onBack={() => setScreen('home')}
        onStart={(settings) => {
          game.start(settings)
          setScreen('game')
        }}
      />
    )
  }

  if (screen === 'game' && game.state) {
    return (
      <Game
        state={game.state}
        canUndo={game.canUndo}
        dispatch={game.dispatch}
        onUndo={game.undo}
        onHome={() => setScreen('home')}
        onNewGame={() => setScreen('setup')}
      />
    )
  }

  return (
    <Home
      state={game.state}
      corruptSave={game.recoveredFromCorruptSave}
      onContinue={() => setScreen('game')}
      onNewGame={() => setScreen('setup')}
    />
  )
}

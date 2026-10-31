import { Undo2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import {
  currentRoundCard,
  isPhaseStart,
  type GameEvent,
  type GameState,
} from '../../engine/index.ts'
import { Dock, VersusHud, type SheetName } from '../components/Hud.tsx'
import { useToasts } from '../components/toast.ts'
import { useWakeLock } from '../state/useWakeLock.ts'
import styles from './game.module.css'
import { HoardSheet, LogCardSheet, LogSheet, RulesSheet } from './Sheets.tsx'
import {
  GameOverStep,
  PhaseChangeStep,
  RecruitStep,
  RevealStep,
  TableStep,
  TakeStep,
} from './Steps.tsx'

/** The game screen: Versus HUD, the current step, the dock and its sheets (flows 2–6). */
export function Game({
  state,
  canUndo,
  dispatch,
  undo,
  wakeLock,
  onWakeLock,
  onHome,
  onNewGame,
}: {
  state: GameState
  canUndo: boolean
  dispatch: (event: GameEvent) => void
  undo: () => void
  wakeLock: boolean
  onWakeLock: (on: boolean) => void
  onHome: () => void
  onNewGame: () => void
}) {
  const [sheet, setSheet] = useState<SheetName | 'logCard' | null>(null)
  const toasts = useToasts()
  useWakeLock(wakeLock && state.step !== 'over')

  // Undo with a toast offering "undo more" (design 6.5).
  const undoRef = useRef<() => void>(() => {})
  useEffect(() => {
    undoRef.current = () => {
      undo()
      toasts.push({
        key: 'undo',
        icon: <Undo2 size={20} />,
        text: 'Undone — stepped back one action.',
        action: { label: 'UNDO MORE', run: () => undoRef.current() },
      })
    }
  })
  const doUndo = () => undoRef.current()

  // Close sheets when the round or step changes underneath them (e.g. after undo).
  const stepKey = `${state.round}-${state.step}`
  const lastKey = useRef(stepKey)
  useEffect(() => {
    if (lastKey.current !== stepKey && sheet === 'logCard') setSheet(null)
    lastKey.current = stepKey
  }, [stepKey, sheet])

  const dock = (
    <Dock
      tokens={state.stack.length}
      canUndo={canUndo}
      open={sheet === 'logCard' ? null : sheet}
      onUndo={doUndo}
      onOpen={(s) => setSheet(sheet === s ? null : s)}
    />
  )

  let step
  if (state.step === 'over') {
    step = <GameOverStep state={state} onUndo={doUndo} onNewGame={onNewGame} onHome={onHome} />
  } else if (state.step === 'reveal') {
    step = isPhaseStart(state.round, state.setup.settings) ? (
      <PhaseChangeStep key={state.round} state={state} dispatch={dispatch} dock={dock} />
    ) : (
      <RevealStep key={state.round} state={state} dispatch={dispatch} dock={dock} />
    )
  } else if (state.step === 'thanos') {
    const { action } = currentRoundCard(state)
    step =
      action.kind === 'take' ? (
        <TakeStep key={state.round} state={state} action={action} dispatch={dispatch} dock={dock} />
      ) : (
        <RecruitStep
          key={state.round}
          state={state}
          action={action}
          dispatch={dispatch}
          dock={dock}
        />
      )
  } else {
    step = (
      <TableStep
        key={state.round}
        state={state}
        dispatch={dispatch}
        dock={dock}
        onLogCard={() => setSheet('logCard')}
      />
    )
  }

  return (
    <div className={styles.screen}>
      <VersusHud state={state} />
      {step}
      {sheet === 'hoard' ? (
        <HoardSheet state={state} dispatch={dispatch} onClose={() => setSheet(null)} />
      ) : null}
      {sheet === 'log' ? <LogSheet state={state} onClose={() => setSheet(null)} /> : null}
      {sheet === 'rules' ? (
        <RulesSheet
          state={state}
          wakeLock={wakeLock}
          onWakeLock={onWakeLock}
          onClose={() => setSheet(null)}
          onHome={onHome}
        />
      ) : null}
      {sheet === 'logCard' ? (
        <LogCardSheet
          onClose={() => setSheet(null)}
          onAdd={(card) => {
            dispatch({ type: 'playerRecruit', card })
            setSheet(null)
          }}
        />
      ) : null}
    </div>
  )
}

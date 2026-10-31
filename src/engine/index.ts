// Public API of the automa engine. The UI imports from here only.
export { AUTOMA_CARDS, cardById, STAR_CARD_IDS } from './cards.ts'
export { newSeed } from './rng.ts'
export {
  DEFAULT_SETTINGS,
  PHASE_LENGTH_PRESETS,
  validateSettings,
  type PhaseLengths,
  type Settings,
} from './settings.ts'
export {
  cardForRound,
  createSetup,
  isPhaseStart,
  phaseOfRound,
  phaseStarts,
  roundLimit,
  type RoundCard,
  type Setup,
} from './setup.ts'
export { STONES, stoneForTokenNumber, type Stone, type TokenNumber } from './stones.ts'
export * from './types.ts'

// Public API of the automa engine. The UI imports from here only.
export { AUTOMA_CARDS, cardById, STAR_CARD_IDS } from './cards.ts'
export { newSeed } from './rng.ts'
export {
  DEFAULT_SETTINGS,
  MAX_LOCATION_BONUS,
  PHASE_LENGTH_PRESETS,
  validateSettings,
  type LocationRequirement,
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
export {
  applyEvent,
  AVENGERS_TILE_POINTS,
  AVENGERS_TILE_TAGS,
  countedThanosCards,
  currentPhase,
  currentRoundCard,
  discardCount,
  discardPreview,
  GameRuleError,
  GAUNTLET_POINTS,
  LOCATION_POINTS,
  LOCATIONS_IN_PLAY,
  missingColours,
  newGame,
  replay,
  roundResult,
  sideStats,
  type AvengersHolder,
  type GameEvent,
  type GameResult,
  type GameState,
  type LogEntry,
  type PlayerReport,
  type RecruitedCard,
  type ResultReason,
  type Side,
  type SideStats,
  type Step,
  type ThanosCardInput,
} from './game.ts'

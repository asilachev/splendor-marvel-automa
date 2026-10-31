/**
 * Official artwork, used at the owner's request for personal use only (#30).
 * This module is the only place that references it, so removing it before the repository goes
 * public (#17) is a one-module swap. Don't add more official art.
 */
import cardBack from './automa-card-back.jpg'
import marvelLogo from './marvel-logo.png'
import splendorLogo from './splendor-logo.png'

export const OFFICIAL_ART = {
  /** Automa card back from the Solo Automa V1 PDF (518×759). */
  cardBack,
  /** Splendor wordmark, transparent background (640×233), from the rulebook cover rendered at 6×. */
  splendorLogo,
  /** MARVEL logo box (360×145), from the rulebook cover rendered at 6×. */
  marvelLogo,
} as const

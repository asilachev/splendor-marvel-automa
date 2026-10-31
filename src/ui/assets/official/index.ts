/**
 * Official artwork, used at the owner's request for personal use only (#30).
 * This module is the only place that references it, so removing it before the repository goes
 * public (#17) is a one-module swap. Don't add more official art.
 */
import cardBack from './automa-card-back.jpg'
import logoBanner from './splendor-marvel-banner.jpg'

export const OFFICIAL_ART = {
  /** Automa card back from the Solo Automa V1 PDF (518×759). */
  cardBack,
  /** "Marc André · Splendor | MARVEL" banner from the Solo Automa V1 PDF (534×121). */
  logoBanner,
} as const

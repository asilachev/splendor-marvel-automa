import { Minus, Plus, X } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
  type RefObject,
} from 'react'
import { EXIT_MS, prefersReducedMotion } from '../motion.ts'
import { STONES, type Stone } from '../../engine/index.ts'
import { useT } from '../i18n/index.ts'
import styles from './kit.module.css'
import { Token } from './Token.tsx'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'quietDanger' | 'small'
  icon?: ReactNode
}

/** Comic button: black outline, hard shadow, presses into its shadow. */
export function Button({ variant = 'primary', icon, children, ...props }: ButtonProps) {
  return (
    <button type="button" className={styles.button} data-variant={variant} {...props}>
      {icon}
      <span>{children}</span>
    </button>
  )
}

export function LinkButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" className={styles.linkButton} {...props} />
}

/** A comic narration box: gold, blue, red or yellow. */
export function Caption({
  tone = 'gold',
  children,
}: {
  tone?: 'gold' | 'blue' | 'red' | 'yellow'
  children: ReactNode
}) {
  return (
    <span className={styles.caption} data-tone={tone}>
      {children}
    </span>
  )
}

export function Panel({
  children,
  className,
}: {
  children: ReactNode
  className?: string | undefined
}) {
  return <div className={`${styles.panel} ${className ?? ''}`}>{children}</div>
}

export function Speech({ children }: { children: ReactNode }) {
  return <p className={styles.speech}>“{children}”</p>
}

/** A labelled row of number chips (points, tags, level). */
export function NumberChips({
  label,
  values,
  value,
  onChange,
  disabled = false,
  paper = false,
}: {
  label: string
  values: readonly number[]
  value: number | null
  onChange: (v: number) => void
  disabled?: boolean
  paper?: boolean
}) {
  return (
    <div
      className={styles.chips}
      data-disabled={disabled}
      data-paper={paper}
      role="group"
      aria-label={label}
    >
      <span className={styles.chipsLabel}>{label.toUpperCase()}</span>
      <div className={styles.chipsRow}>
        {values.map((v) => (
          <button
            key={v}
            type="button"
            className={styles.chip}
            aria-pressed={value === v}
            disabled={disabled}
            onClick={() => onChange(v)}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  )
}

/** A number with − and + buttons, for totals too wide for chips (#15). */
export function Stepper({
  label,
  value,
  min,
  max,
  onChange,
  hint,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (v: number) => void
  hint?: string
}) {
  const t = useT()
  return (
    <div className={styles.stepper} role="group" aria-label={label}>
      <span className={styles.stepperLabel}>{label.toUpperCase()}</span>
      <div className={styles.stepperRow}>
        <button
          type="button"
          className={styles.stepperButton}
          aria-label={t('common.decrease', { label })}
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
        >
          <Minus size={20} />
        </button>
        <output className={styles.stepperValue} aria-live="polite">
          {value}
        </output>
        <button
          type="button"
          className={styles.stepperButton}
          aria-label={t('common.increase', { label })}
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
        >
          <Plus size={20} />
        </button>
        {hint ? <small className={styles.stepperHint}>{hint}</small> : null}
      </div>
    </div>
  )
}

/** Five stone tiles. `allowed` limits the choice; `lacks` highlights the colours Thanos lacks. */
export function StonePicker({
  label,
  onPick,
  selected = null,
  allowed = STONES,
  lacks = [],
  paper = false,
}: {
  label: string
  onPick: (s: Stone) => void
  selected?: Stone | null
  allowed?: readonly Stone[]
  lacks?: readonly Stone[]
  paper?: boolean
}) {
  const t = useT()
  return (
    <div className={styles.picker} role="group" aria-label={label} data-paper={paper}>
      {STONES.map((s, i) => (
        <button
          key={s}
          type="button"
          className={styles.tile}
          aria-pressed={selected === s}
          data-lacks={lacks.includes(s)}
          disabled={!allowed.includes(s)}
          onClick={() => onPick(s)}
        >
          <Token stone={s} size={40} />
          <span>{t(`stone.${s}`)}</span>
          <small aria-hidden="true">{i + 1}</small>
        </button>
      ))}
    </div>
  )
}

/** One row of a paper checklist; tapping toggles it. */
export function CheckItem({
  done,
  onToggle,
  children,
  extra,
}: {
  done: boolean
  onToggle: () => void
  children: ReactNode
  extra?: ReactNode
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={done}
      className={styles.checkItem}
      onClick={onToggle}
    >
      <span className={styles.checkBox} aria-hidden="true">
        {done ? '✓' : ''}
      </span>
      <span className={styles.checkText}>{children}</span>
      {extra}
    </button>
  )
}

/** Mutually exclusive option tiles (difficulty, rulings, Avengers tile override). */
export function Options<T extends string | number>({
  label,
  options,
  value,
  onChange,
  tip,
  paper = false,
}: {
  label: string
  options: readonly { value: T; label: string; hint?: string }[]
  value: T
  onChange: (v: T) => void
  tip?: ReactNode
  paper?: boolean
}) {
  return (
    <div className={styles.options} data-paper={paper}>
      <span className={styles.optionsLabel}>
        {label.toUpperCase()}
        {tip}
      </span>
      <div className={styles.optionsRow} role="group" aria-label={label}>
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            className={styles.option}
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
          >
            <span>{o.label}</span>
            {o.hint ? <small>{o.hint}</small> : null}
          </button>
        ))}
      </div>
    </div>
  )
}

/** Open layers, innermost last: Escape closes only the top one (e.g. Language over the Menu). */
const escapeStack: (() => void)[] = []
const onEscapeKey = (e: KeyboardEvent) => {
  if (e.key === 'Escape') escapeStack[escapeStack.length - 1]?.()
}

function useEscape(onClose: () => void) {
  const latest = useRef(onClose)
  useEffect(() => {
    latest.current = onClose
  })
  useEffect(() => {
    const close = () => latest.current()
    if (escapeStack.push(close) === 1) window.addEventListener('keydown', onEscapeKey)
    return () => {
      escapeStack.splice(escapeStack.lastIndexOf(close), 1)
      if (escapeStack.length === 0) window.removeEventListener('keydown', onEscapeKey)
    }
  }, [])
}

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Moves focus into a sheet or dialog, keeps Tab inside it, and gives focus back to the opener on
 * close (PWA checklist: dialogs and sheets are focus-trapped).
 */
function useFocusTrap(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const node = ref.current
    if (!node) return
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    node.focus({ preventScroll: true })
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const items = [...node.querySelectorAll<HTMLElement>(FOCUSABLE)]
      const first = items[0]
      const last = items[items.length - 1]
      if (!first || !last) {
        e.preventDefault()
      } else if (
        e.shiftKey &&
        (document.activeElement === first || document.activeElement === node)
      ) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    node.addEventListener('keydown', onKey)
    return () => {
      node.removeEventListener('keydown', onKey)
      opener?.focus({ preventScroll: true })
    }
  }, [ref])
}

/** Plays the exit animation, then calls `onClose` (at once under reduced motion). */
function useAnimatedClose(onClose: () => void): [closing: boolean, close: () => void] {
  const [closing, setClosing] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  const close = useCallback(() => {
    if (prefersReducedMotion()) {
      onClose()
      return
    }
    setClosing(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(onClose, EXIT_MS)
  }, [onClose])
  return [closing, close]
}

let scrollLocks = 0

/** Keeps the page behind a sheet or dialog still while it is open. */
function useScrollLock() {
  useEffect(() => {
    const root = document.documentElement
    if (scrollLocks++ === 0) root.style.overflow = 'hidden'
    return () => {
      if (--scrollLocks === 0) root.style.overflow = ''
    }
  }, [])
}

/**
 * Expands and collapses smoothly (#52). Opening mounts the content and expands it in one go;
 * closing collapses it first and unmounts it when the transition ends. Collapsed content is
 * hidden from assistive technology and can't be focused.
 */
export function Collapse({ open, children }: { open: boolean; children: ReactNode }) {
  const [mounted, setMounted] = useState(open)
  if (open && !mounted) setMounted(true)
  return (
    <span
      className={styles.collapse}
      data-open={open}
      onTransitionEnd={(e) => {
        if (!open && e.target === e.currentTarget) setMounted(false)
      }}
    >
      <span className={styles.collapseInner} aria-hidden={!open} inert={!open}>
        {mounted ? children : null}
      </span>
    </span>
  )
}

/** Bottom sheet over a scrim (Hoard, Log, Menu, Log your card, Install). */
export function Sheet({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  /** Content, or a function of the animated close (e.g. close after a pick). */
  children: ReactNode | ((close: () => void) => ReactNode)
}) {
  const t = useT()
  const [closing, close] = useAnimatedClose(onClose)
  useEscape(close)
  useScrollLock()
  const ref = useRef<HTMLElement>(null)
  useFocusTrap(ref)
  return (
    <div className={styles.layer} data-closing={closing}>
      <button
        type="button"
        className={styles.scrim}
        aria-label={t('common.close')}
        tabIndex={-1}
        onClick={close}
      />
      <section
        ref={ref}
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
      >
        <div className={styles.grabber} aria-hidden="true" />
        <header className={styles.sheetHead}>
          <h2>{title}</h2>
          <button
            type="button"
            className={styles.close}
            aria-label={t('common.closeTitle', { title })}
            onClick={close}
          >
            <X size={20} />
          </button>
        </header>
        <div className={styles.sheetBody}>
          {typeof children === 'function' ? children(close) : children}
        </div>
      </section>
    </div>
  )
}

export function SheetLabel({ children }: { children: ReactNode }) {
  return <span className={styles.sheetLabel}>{children}</span>
}

/** Centred confirmation dialog (abandon game). */
export function Dialog({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  const t = useT()
  const [closing, close] = useAnimatedClose(onClose)
  useEscape(close)
  useScrollLock()
  const ref = useRef<HTMLElement>(null)
  useFocusTrap(ref)
  return (
    <div className={styles.layer} data-center="true" data-closing={closing}>
      <button
        type="button"
        className={styles.scrim}
        aria-label={t('common.close')}
        tabIndex={-1}
        onClick={close}
      />
      <section
        ref={ref}
        className={styles.dialog}
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
      >
        <h2>{title}</h2>
        {children}
      </section>
    </div>
  )
}

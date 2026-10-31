import { X } from 'lucide-react'
import { useEffect, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { STONES, type Stone } from '../../engine/index.ts'
import { STONE_LABEL } from '../format.ts'
import styles from './kit.module.css'
import { Token } from './Token.tsx'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'small'
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
          <span>{STONE_LABEL[s]}</span>
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

function useEscape(onClose: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
}

/** Bottom sheet over a scrim (Hoard, Log, Rules, Log your card, Install). */
export function Sheet({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  useEscape(onClose)
  return (
    <div className={styles.layer}>
      <button
        type="button"
        className={styles.scrim}
        aria-label="Close"
        tabIndex={-1}
        onClick={onClose}
      />
      <section className={styles.sheet} role="dialog" aria-modal="true" aria-label={title}>
        <div className={styles.grabber} aria-hidden="true" />
        <header className={styles.sheetHead}>
          <h2>{title}</h2>
          <button
            type="button"
            className={styles.close}
            aria-label={`Close ${title}`}
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </header>
        <div className={styles.sheetBody}>{children}</div>
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
  useEscape(onClose)
  return (
    <div className={styles.layer} data-center="true">
      <button
        type="button"
        className={styles.scrim}
        aria-label="Close"
        tabIndex={-1}
        onClick={onClose}
      />
      <section className={styles.dialog} role="alertdialog" aria-modal="true" aria-label={title}>
        <h2>{title}</h2>
        {children}
      </section>
    </div>
  )
}

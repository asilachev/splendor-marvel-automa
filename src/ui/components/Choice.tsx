import styles from './components.module.css'

export interface Option<T> {
  readonly value: T
  readonly label: string
  readonly hint?: string
}

/** A row of mutually exclusive, thumb-sized buttons (numbers, presets, rulings). */
export function Segmented<T extends string | number>({
  label,
  options,
  value,
  onChange,
  compact = false,
}: {
  label: string
  options: readonly Option<T>[]
  value: T | null
  onChange: (value: T) => void
  compact?: boolean
}) {
  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <div
        className={compact ? styles.segmentedCompact : styles.segmented}
        role="group"
        aria-label={label}
      >
        {options.map((option) => (
          <button
            key={String(option.value)}
            type="button"
            className={styles.segment}
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
          >
            <span>{option.label}</span>
            {option.hint ? <small>{option.hint}</small> : null}
          </button>
        ))}
      </div>
    </div>
  )
}

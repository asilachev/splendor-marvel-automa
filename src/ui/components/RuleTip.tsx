import { useId, useState, type ReactNode } from 'react'
import { useT } from '../i18n/index.ts'
import { Collapse } from './Kit.tsx'
import styles from './kit.module.css'

/**
 * A tap-to-open rule explanation: hover doesn't exist on phones, so an "i" button toggles a short
 * note, which expands below the line it belongs to. Wording follows docs/automa.md and
 * docs/rules.md, in our own words.
 */
export function RuleTip({ title, children }: { title: string; children: ReactNode }) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const id = useId()
  return (
    <>
      <button
        type="button"
        className={styles.tipButton}
        aria-expanded={open}
        aria-controls={id}
        aria-label={t('common.rule', { title })}
        onClick={() => setOpen((o) => !o)}
      >
        i
      </button>
      <Collapse open={open}>
        <span id={id} role="note" className={styles.tip}>
          <strong>{title}.</strong> {children}
        </span>
      </Collapse>
    </>
  )
}

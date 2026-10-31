import { X } from 'lucide-react'
import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import styles from './kit.module.css'
import { ToastContext, type ToastApi, type ToastInput } from './toast.ts'

interface Live extends ToastInput {
  readonly id: number
}

/** Toast stack above the bottom bar (undo, offline, update ready). */
export function Toaster({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Live[]>([])
  const next = useRef(1)
  const dismissId = useCallback(
    (id: number) => setToasts((ts) => ts.filter((t) => t.id !== id)),
    [],
  )
  const api = useMemo<ToastApi>(
    () => ({
      push(toast) {
        const id = next.current++
        setToasts((ts) =>
          [...ts.filter((t) => !toast.key || t.key !== toast.key), { ...toast, id }].slice(-3),
        )
        const duration = toast.duration ?? 3500
        if (duration > 0) setTimeout(() => dismissId(id), duration)
      },
      dismiss(key) {
        setToasts((ts) => ts.filter((t) => t.key !== key))
      },
    }),
    [dismissId],
  )
  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className={styles.toasts} role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={styles.toast} data-tone={t.tone ?? 'gold'}>
            {t.icon}
            <span>{t.text}</span>
            {t.action ? (
              <button
                type="button"
                className={styles.toastAction}
                onClick={() => {
                  dismissId(t.id)
                  t.action?.run()
                }}
              >
                {t.action.label}
              </button>
            ) : null}
            {t.duration === 0 ? (
              <button
                type="button"
                className={styles.toastClose}
                aria-label="Dismiss"
                onClick={() => dismissId(t.id)}
              >
                <X size={18} />
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

import { createContext, useContext, type ReactNode } from 'react'

export interface ToastInput {
  readonly icon?: ReactNode
  readonly text: string
  readonly tone?: 'gold' | 'muted' | 'green'
  readonly action?: { readonly label: string; readonly run: () => void }
  /** Milliseconds; 0 keeps it until dismissed or replaced. Default 3500. */
  readonly duration?: number
  /** Toasts with the same key replace each other. */
  readonly key?: string
}

export interface ToastApi {
  push(toast: ToastInput): void
  dismiss(key: string): void
}

export const ToastContext = createContext<ToastApi>({ push: () => {}, dismiss: () => {} })

export const useToasts = (): ToastApi => useContext(ToastContext)

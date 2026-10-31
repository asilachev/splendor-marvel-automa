import { Sparkles, WifiOff } from 'lucide-react'
import { useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { useToasts } from '../components/toast.ts'
import { useT } from '../i18n/index.ts'

/**
 * 7.4 — the offline and update-ready toasts. The service worker is in prompt mode, so a new
 * version waits for RELOAD instead of reloading mid-game; the game is saved after every tap, so
 * reloading is safe.
 */
export function usePwaToasts(): void {
  const toasts = useToasts()
  const t = useT()
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  useEffect(() => {
    if (!needRefresh) return
    toasts.push({
      key: 'update',
      icon: <Sparkles size={20} />,
      text: t('toasts.update'),
      tone: 'gold',
      duration: 0,
      action: { label: t('toasts.reload'), run: () => void updateServiceWorker(true) },
    })
  }, [needRefresh, toasts, updateServiceWorker, t])

  useEffect(() => {
    const offline = () =>
      toasts.push({
        key: 'network',
        icon: <WifiOff size={20} />,
        text: t('toasts.offline'),
        tone: 'muted',
        duration: 5000,
      })
    const online = () => toasts.dismiss('network')
    if (!navigator.onLine) offline()
    window.addEventListener('offline', offline)
    window.addEventListener('online', online)
    return () => {
      window.removeEventListener('offline', offline)
      window.removeEventListener('online', online)
    }
  }, [toasts, t])
}

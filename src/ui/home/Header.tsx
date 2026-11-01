import { ArrowLeft } from 'lucide-react'
import { useT } from '../i18n/index.ts'
import styles from './home.module.css'

/** A screen title with the back button: setup, rulings and history. */
export function Header({ title, onBack }: { title: string; onBack: () => void }) {
  const t = useT()
  return (
    <header className={styles.header}>
      <button type="button" className={styles.back} aria-label={t('common.back')} onClick={onBack}>
        <ArrowLeft size={22} />
      </button>
      <h1 className={styles.screenTitle}>{title}</h1>
    </header>
  )
}

import { LANGS, useI18n } from '../i18n/index.ts'
import { Options, Sheet } from './Kit.tsx'

/** The app's languages as tiles: code and the language's own name (#54). */
export function LanguagePicker({
  paper = false,
  onPicked,
}: {
  paper?: boolean
  /** Called after a language is picked, e.g. to close the selector (#58). */
  onPicked?: () => void
}) {
  const { lang, setLang, t } = useI18n()
  return (
    <Options
      paper={paper}
      label={t('language.label')}
      value={lang}
      onChange={(next) => {
        setLang(next)
        onPicked?.()
      }}
      options={LANGS.map((l) => ({ value: l.code, label: l.code.toUpperCase(), hint: l.name }))}
    />
  )
}

/** The language selector: closes as soon as a language is picked (#58). */
export function LanguageSheet({ onClose }: { onClose: () => void }) {
  const { t } = useI18n()
  return (
    <Sheet title={t('language.title')} onClose={onClose}>
      {(close) => <LanguagePicker paper onPicked={close} />}
    </Sheet>
  )
}

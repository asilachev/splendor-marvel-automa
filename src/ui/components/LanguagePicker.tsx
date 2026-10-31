import { LANGS, useI18n } from '../i18n/index.ts'
import { Options } from './Kit.tsx'

/** The app's languages as tiles: code and the language's own name (#54). */
export function LanguagePicker({ paper = false }: { paper?: boolean }) {
  const { lang, setLang, t } = useI18n()
  return (
    <Options
      paper={paper}
      label={t.language.label}
      value={lang}
      onChange={setLang}
      options={LANGS.map((l) => ({ value: l.code, label: l.code.toUpperCase(), hint: l.name }))}
    />
  )
}

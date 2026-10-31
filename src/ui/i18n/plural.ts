/** Plural forms by CLDR category. Russian and Serbian need `few` and `many`; `#` is the number. */
export interface Plural {
  readonly one: string
  readonly few?: string
  readonly many?: string
  readonly other: string
}

/** A plural picker for one locale, using the browser's CLDR rules (`Intl.PluralRules`). */
export function pluralizer(locale: string): (n: number, forms: Plural) => string {
  const rules = new Intl.PluralRules(locale)
  return (n, forms) => {
    const category = rules.select(n)
    const form =
      (category === 'one' || category === 'few' || category === 'many'
        ? forms[category]
        : undefined) ?? forms.other
    return form.replace('#', String(n))
  }
}

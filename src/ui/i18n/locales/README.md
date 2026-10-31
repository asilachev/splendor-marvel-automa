# Translations

Every text in the app lives here, in one file per language:

| File | Language |
| --- | --- |
| `en.json` | English: the source, bundled with the app, and the fallback for missing texts |
| `ru.json` | Русский |
| `sr.json` | Srpski (Latin script) |
| `es.json` | Español |
| `de.json` | Deutsch |

The app loads only the file for the chosen language, so each file is one self-contained translation.

## Changing a text

Edit the value and keep the key. For example, in `de.json`:

```json
"home": { "newGame": "NEUES SPIEL" }
```

Tests check every file against `en.json`, so nothing silently goes missing. They check that:

- every file has the same keys;
- every message parses;
- a translation only uses placeholders that English uses.

## Message syntax

Messages use a small part of [ICU MessageFormat](https://unicode-org.github.io/icu/userguide/format_parse/messages/):

| Syntax | Meaning | Example |
| --- | --- | --- |
| `{name}` | a value from the app | `"CONTINUE · ROUND {round}"` |
| `{name, select, a {…} b {…} other {…}}` | pick a branch by value | `"{you, select, true {You win!} other {Thanos wins}}"` |
| `{n, plural, one {…} few {…} many {…} other {…}}` | pick by the language's plural rules | `"{n, plural, one {# очко} few {# очка} many {# очков} other {# очка}}"` |
| `#` | inside `plural`: the number | `"{n, plural, =0 {nothing} other {# tokens}}"` |

- **`other`.** Every `select` and `plural` needs an `other` branch.
- **Exact numbers.** In a `plural`, `=0`, `=1` and so on match exact numbers before the plural rules apply.
- **Plural categories.**
  - Russian: one (1, 21, 31…), few (2–4, 22–24…), many (5–20, 25–30…) and other (fractions).
  - Serbian: one, few and other.
  - English, Spanish and German: one and other.
- **Branch values.** The app passes `true`/`false` for yes/no choices, `1`/`2`/`3` for the phase, `A`/`B`/`C` for the market row, and `thanos`/`player` for a side.
- **Grammar.** A language can put whole sentences in each branch, so it never has to glue pieces together. That's how the Russian and German phase colours change by grammatical case.
- **Apostrophes.** Use the typographic ’ rather than '.
- **Uppercase.** Buttons and headings are written in uppercase in the file itself, as they should appear.

## Adding a language

1. Copy `en.json` to `<code>.json` and translate every value.
2. Add the language to `LANGS` and `LOADERS` in `src/ui/i18n/index.ts`.
3. Run `npm test` and `npm run typecheck`. Then check the key screens at 360 px wide in the new language: long words must still fit.

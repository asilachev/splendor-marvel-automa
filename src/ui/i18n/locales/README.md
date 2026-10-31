# Translations

Every text in the app lives here, in one file per language:

| File | Language |
| --- | --- |
| `en.json` | English: the source, bundled with the app, and the fallback for missing texts |
| `ru.json` | Русский |
| `sr.json` | Српски (Cyrillic script) |
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
- **Long words.** A soft hyphen (U+00AD) marks where a long word may break in narrow tiles; it's invisible otherwise. Serbian «Ствар­ност» has one.
- **Fonts.** Headings use Bangers Cyrillic, which covers Latin, Latin-1 and Cyrillic, but not the Latin letters Č Ć Đ. That's why Serbian is in Cyrillic.
- **Uppercase.** Buttons and headings are written in uppercase in the file itself, as they should appear.
- **Card names.** `common.card` orders a card's level and colour for the language: `L2 Reality`,
  `Реальность, ур. 2`.

## Typography

Write ordinary spaces. When a text is shown, `../typography.ts` adds the non-breaking spaces the
language needs, so lines never break in the wrong place on any screen. Tests cover every rule.

**Russian** follows Russian typesetting rules (Мильчин, «Справочник издателя и автора»):

- A one- or two-letter word stays with the next word: «в раунде», «и всё», «на столе».
- «же», «ли» and «бы» stay with the word before them.
- A number stays with the word after it: «16 очков», «+3 очка».
- A dash never starts a line, and an abbreviation stays with its number: «ур. 2», «© 2011».
- Quotes are «ёлочки», with „лапки“ inside: «На экран „Домой“».
- Use a real dash: « — » between words, «–» without spaces in ranges («раунды 1–10»), and «1 — Сила»
  in numbered lists. Use «…» for an ellipsis.
- Address the player with the polite «вы», lowercase, and polite imperatives: «Откройте», not
  «Открой».
- Spell game terms as the dictionary does: «тай-брейк».

## Adding a language

1. Copy `en.json` to `<code>.json` and translate every value.
2. Add the language to `LANGS` and `LOADERS` in `src/ui/i18n/index.ts`.
3. Run `npm test` and `npm run typecheck`. Then check the key screens at 360 px wide in the new language: long words must still fit.

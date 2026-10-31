# Fonts

## Bangers Cyrillic: `bangers-cyrillic.woff2`

This is the app's only display font, used for headings, buttons, captions and the HUD in every language (#57).

- **What it is:** Bangers by Vernon Adams, extended with Cyrillic. The font's own name table reads:
  - "Bangers Cyrillic, Version 1.00, September 23, 2016, initial release";
  - "Copyright (c) 2011 by Vernon Adams. All rights reserved.";
  - "Bangers is a trademark of Vernon Adams".
- **Coverage:** Basic Latin, Latin-1 (Spanish and German), Š Ž, and all of Cyrillic, including Ё and the Serbian letters Ђ Ћ Џ Љ Њ Ј. It lacks the Latin letters Č Ć Đ, which is why Serbian is written in Cyrillic.
- **License:** the original Bangers is licensed under the SIL Open Font License 1.1 (see `OFL.txt`, copied from [googlefonts/bangers](https://github.com/googlefonts/bangers)). The Cyrillic extension names no separate author or license, and the OFL requires derived fonts to stay under the OFL.
- **Source:** downloaded by the owner on 2026-10-31 from [online-fonts.com](https://online-fonts.com/fonts/bangers-cyrillic). The same file is listed on fonts-online.ru.
- **Conversion:** the OTF was converted to WOFF2 with fontTools, which dropped the `DSIG` table because conversion invalidates the signature. The glyphs are unchanged.

> **Before going public (#17):** confirm who made the Cyrillic extension, and its license.

Inter (body text) comes from `@fontsource-variable/inter` (SIL Open Font License 1.1).

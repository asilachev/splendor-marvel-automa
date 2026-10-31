# App design

## Principles

1. **A companion, not a digital game.**
   - The physical table holds the market, the supply and your cards.
   - The app replaces the automa deck, the token placement board and Thanos's bookkeeping.
   - There is no card database, card art or digital market. A recruited card is entered as
     `{ level, colour, points, tags }`.
2. **Few taps.** Each step has one primary action, anchored at the bottom of the screen within thumb
   reach.
3. **Faithful to the automa.** Every gap in the PDF is an explicit setting with a documented default
   ([automa.md → Rulings](automa.md#rulings-this-app-uses)).
4. **Deterministic and undoable.**
   - Shuffles come from a seed stored with the game.
   - Game state is rebuilt by replaying an event log, so undo means dropping the last event.
5. **Offline and phone-first.** It installs as a PWA, works without a network, keeps the screen awake,
   and survives reloads.

## A round

```
Thanos's turn                        Your turn                End of round
──────────────                       ─────────                ────────────
[Reveal] → action for the phase      log recruits (optional)  Gauntlet check (both sides)
  take:   tap empty piles → Done     +3 Location              tiebreakers → result
  gain:   colour → (substitute?)     Avengers tile override   or next round / phase change
          → points + tags → Confirm  [End round]              round limit reached → you lose
```

### Thanos takes tokens

The app lists the tokens in printed order, for example "Take Mind · Soul · Power". Tap any pile that
is empty to skip it, then tap **Done**.

The app records the stack in order, so the physical tokens can sit in a loose pile. Keeping an
ordered stack by hand is the fiddliest part of the paper automa.

### Thanos gains a card

1. The app highlights the slot on a 3×4 market grid and shows **Return to supply: …**, the oldest
   tokens in Thanos's stack. There may be fewer than the printed number.
2. A **Slot is empty** link applies the empty-slot ruling.
3. **Colour of that card?**
   - If Thanos doesn't have that colour, he takes the card.
   - Otherwise the app lists the colours he's missing and asks you to scan that row from left to
     right, then tap the colour of the first match. **None** means he takes the original card.
4. Enter **points** (0–5) and **Avengers tags** (0–2), then tap **Confirm**.
5. The app shows the reminders that apply:
   - refill the market slot;
   - give Thanos the green token (his first level-3 card);
   - move the Avengers tile.

### Your turn

- Optionally log each card you recruit with the same picker, plus its level so the app can award your
  Time token.
- Tap **+3** for a Location.
- With these logged, the app can run the Avengers tile, the Gauntlet check and the tiebreakers for
  both sides.
- A manual override for the Avengers tile holder covers mistakes and anyone who doesn't log.

## Screens

| Screen | Purpose |
| --- | --- |
| Home | Where every launch opens · Continue the saved game · New game · Install card · Credits |
| Setup | 2-player setup checklist · difficulty · rulings sub-screen · Start |
| Game | Versus HUD · current step with its one primary action · dock: Undo, Hoard, Log, Menu |
| Game over | Result, why, rounds taken, final tallies · New game |
| History (v1) | Past games, win rate, average rounds to win |

## State and events (engine)

`src/engine` is pure TypeScript: no React and no DOM.

- `GameState = replay(createGame(seed, settings), events)`.
- The three phase orders are drawn from the seed when the game is created.
- **Thanos:** an ordered token stack (index 0 is the bottom, the oldest token), the cards he has
  gained, and his Locations (hard mode).
- **Derived values:** colours, points, tags, Time token, card count.
- **Player:** the cards you have logged and your Locations.
- **Avengers tile holder:** `none`, `thanos` or `player`.
- **Events:**
  - `reveal`;
  - `thanosTake { skipped }`;
  - `thanosGain { colour, points, tags, … }`;
  - `playerRecruit { level, colour, points, tags }`;
  - `playerLocation`;
  - `setAvengers`;
  - `endRound`.
- **Persistence:** `{ version, seed, settings, events }` in `localStorage` under a versioned key.
  Every read and write is wrapped in try/catch.

## Tech and hosting

- **Stack:** Vite, React and TypeScript, built to static files in `dist/`. There is no server code.
- **Hosting:** self-hosted as a Docker image, with nginx serving `dist/`.
  - CI publishes the image to GHCR (issue #10).
  - The server must serve the app over **HTTPS**, because PWA install, offline mode and the screen
    wake lock all require a secure context.
- **Why not Next.js:** nothing here runs on a server. A static build is simpler to cache offline and
  simpler to host. Revisit this only if a backend becomes necessary, for example to sync game history
  across devices. The engine is framework-agnostic, so only the UI shell would move.

## Landing page (#61, #66)

`site/` is a static page on GitHub Pages: https://asilachev.github.io/splendor-marvel-automa/.

- **Look:**
  - The app's visual language: gold, Bangers and Inter, hard shadows.
  - The real guide screenshots sit in phone frames.
  - The page ink (`#241a3d`) is a little lighter than the app's (`#0f0b1a`), and each phone frame has
    a thin light rim, so the dark screenshots don't blend into the page.
- **Sections:**
  - a hero;
  - "a companion, not a digital game";
  - four taps a round;
  - features;
  - a gallery;
  - the five languages;
  - get the game;
  - how to host your own copy;
  - the credits.
- **"A companion, not a digital game"** is a comic strip, not a banner:
  - a gold narration box over two tilted panels, "On your table" (paper) and "In the app" (blue);
  - halftone dots, a sound effect on each panel, thick black borders and hard shadows;
  - the panels sit side by side from 720 px and stack on phones.
- **Get the game.** Three link cards:
  - the publisher's page (Space Cowboys);
  - where to buy (Asmodee's store locator);
  - the BoardGameGeek page.

  The credits link the publisher and the store locator too.
- **Cursor.** Links and buttons show our own cartoon glove pointing a finger, with the normal pointer
  as a fallback. `site/cursors/glove.svg` is the drawing; `node scripts/gen-cursor.mjs` renders the
  32 px and 64 px PNGs and prints the fingertip hotspot.
- **States:**
  - Buttons and link cards lift on hover with a bigger shadow, press in when active, and show a
    white focus ring.
  - Nav links get a wavy gold underline, the logo wiggles, and text links thicken their underline.
  - With reduced motion, the states keep their colours and shadows but don't tilt or animate.
- **No app link.** It doesn't link to a hosted copy of the app (see the community note in
  `docs/automa.md`).
- **Build:** `npm run site` copies the page, the screenshots, the two fonts and the icons into
  `_site/`, and fails if the page references a missing file. `.github/workflows/pages.yml` deploys it
  when any of them change on `master`, so `npm run screenshots` updates the page too.
- **Layout:** no sideways scrolling from 320 px up. The hero's two phones share one stage sized in
  percentages.

## Motion (#52)

Movement only when it means something, and then short and smooth.

- **Nothing jumps.** Selected tiles, chips and options draw their thicker ring with an inset shadow,
  so they never change size. Checking a checklist item doesn't change its font weight. The HUD is a
  three-column grid with tabular numbers, so the clock stays centred while scores change. Fonts are
  bundled with `font-display: block`, so text doesn't reflow when they arrive.
- **Scroll only when needed.** Every screen and step opens at its top, reset before paint. Points and
  tags in the recruit step scroll into view (`nearest`) once a colour is picked. The page reserves
  `scroll-padding-bottom` for the pinned footer. The page behind an open sheet or dialog doesn't move.
- **No replays.** The small automa card finishes the flip only right after you flip the card back,
  not on resume, after undo or at a phase change. A toast pushed again with the same key (UNDO MORE)
  updates in place.
- **Short transitions:** steps and stage changes fade in (160 ms, opacity only); sheets rise and sink;
  dialogs pop and shrink; the scrim fades; toasts rise and fade out; tips and rule rows expand and
  collapse (200 ms); HUD bars fill with a transform; the card flip uses 3D perspective.
- **Reduced motion:** every animation ends at once, and delayed steps (the flip, exits) happen
  immediately.

## Ending a game (#53)

- The dock's fourth item is **Menu**. It starts with BACK TO HOME · GAME SAVED and END THIS GAME,
  followed by the rules, settings, this game's rulings and the credits.
- Home with a game in progress shows CONTINUE · ROUND N, NEW GAME and an **End this game** link.
- Both ask "END THIS GAME?" (END GAME / KEEP PLAYING), because ending clears the saved game. A new
  game over a saved one asks "ABANDON THIS GAME?" (1.5).

## Languages (#54)

- **Languages:** English, Russian, Serbian (Cyrillic script, #57), Spanish and German. The browser's language
  is used on first launch. The picker is the globe button at the top of Home and the Language row in
  the Menu, and the choice is saved in prefs. `<html lang>` follows it, so screen readers and
  hyphenation use the right language.
- **Translation files:** `src/ui/i18n/locales/{en,ru,sr,es,de}.json`, one per language, in ICU
  message syntax: `{round}`, `select` and `plural` with `#` (#58). English is bundled as the
  fallback, and each other file loads only when its language is chosen, as its own chunk precached
  for offline use. Code calls `t('home.continue', { round })` with keys typed from `en.json`. Tests
  check that every file has the same keys, that messages parse, and that translations use only
  English's placeholders. Each language can put whole sentences in `select` branches, so grammar
  never depends on gluing pieces together. `locales/README.md` is the translator's guide.
- **Picking a language** closes the selector. On Home it's the globe button; in the Menu, a
  "Language · English" row opens the same sheet. Escape closes only the top layer.
- **Terms** follow each language's MCU and board-game usage:
  - stones: Сила/Разум/Пространство/Реальность/Душа; Моћ/Ум/Простор/Стварност/Душа;
    Poder/Mente/Espacio/Realidad/Alma; Macht/Gedanken/Raum/Realität/Seele;
  - the Infinity Gauntlet: Перчатка Бесконечности, Рукавица бесконачности, Guantelete del Infinito,
    Infinity-Handschuh;
  - the Avengers Assemble tile: «Мстители, общий сбор!», „Осветници, окупите се!“,
    «¡Vengadores, reuníos!», „Avengers Assemble“.
  - There is no Russian edition of Splendor Marvel, so the Russian terms follow the Russian MCU
    releases.
- **Address:** Russian and Serbian use the polite plural «вы»/«ви», which also keeps past tenses
  gender-neutral. Russian writes it lowercase, as interface texts addressed to everyone do. Spanish
  and German use the informal «tú»/«du».
- **Typography (#65):** the files use ordinary spaces. `src/ui/i18n/typography.ts` adds the
  non-breaking spaces a language needs when a text is shown, in the app and in the screenshot
  script alike.
  - Russian (Мильчин, «Справочник издателя и автора»): a one- or two-letter word stays with the
    next word, a number with its word, «же», «ли», «бы» with the word before, an abbreviation with
    its number («ур. 2»), © with its year, and a dash never starts a line.
  - Russian also uses «ёлочки» with „лапки“ inside, «тай-брейк» as the dictionary spells it,
    «1 — Сила» for numbered lists, and «Реальность, ур. 2» for a card (`common.card` lets each
    language order level and colour).
- **Fonts:** one display font for every language: **Bangers Cyrillic** (#57), in
  `src/ui/assets/fonts/`. It covers Latin, Latin-1 and Cyrillic, but lacks Latin Č Ć Đ, so Serbian
  is written in Cyrillic, which is also its official script. Body text is Inter (Latin and Cyrillic
  subsets). Both are precached for offline use. Credits are in the app's Credits section and the
  README; provenance is in `src/ui/assets/fonts/README.md`.
- **Fitting:** every screen was checked at 360 px in all five languages. The HUD never wraps, long
  buttons balance onto two lines when needed, and long stone names hyphenate. On game over the
  HUD's centre badge is a little narrower, so two-digit scores still fit beside it (#65).
  `npm run screenshots -- --lang ru --width 360 --out <dir>` captures any language at any width.

## PWA (flow 7)

- **Launch.** Every launch opens on Home, and a saved game shows CONTINUE · ROUND N (7.3 → 1.2).
  When launched from the home screen, a splash of about a second comes first (7.3).
- **Install.**
  - Chrome/Android: the app keeps the `beforeinstallprompt` event and shows an Install card on Home
    (7.2).
  - iPhone/iPad Safari, when not installed: an Add to Home Screen sheet, shown once (7.1). Closing it
    sets the `installHintSeen` pref.
- **Updates.** The service worker is in prompt mode, so a new version waits for "A new version is
  ready · RELOAD" (7.4) and never reloads the page mid-game. Reloading is safe: the game is saved
  after every tap.
- **Offline.** The service worker precaches everything: the shell, the bundled fonts, the art and the
  icons. When the network drops, a toast says "You're offline — everything still works." (7.4).
- **Storage.** Starting a game asks for `navigator.storage.persist()`, so the browser doesn't evict the
  saved game.
- **Standalone layout (7.5):**
  - `viewport-fit=cover` with safe-area padding and a black-translucent status bar;
  - `overscroll-behavior: none` and `touch-action: manipulation`;
  - manifest theme and background colour `#0f0b1a`.
- **Focus.** Sheets and dialogs take focus, keep Tab inside, and give focus back when they close.

## Visual language (v2 "Versus")

The approved design is the Pencil file `splendor-marvel-automa.pen`. It holds 30 screens in 7 flows, a
Components & states board, a user-flow map and a PWA checklist.

- **Versus HUD.** Thanos (portrait from the card back) against you. Health-bar points fill toward 16,
  with six stone sockets per side and a round clock that turns red in the last round.
- **One step on screen at a time:** reveal, then take or recruit, then the table checklist plus your
  move, then end of round. The step's primary action and the comic dock (Undo, Hoard, Log, Rules) stay
  pinned at the bottom, above the home indicator.
- **Comic styling.** Bangers display type, Inter for body text, black outlines, hard offset shadows,
  gold, blue and red caption boxes, and a paper panel with a speech bubble for Thanos's move.
- **Crisp text (#62).**
  - Text uses grayscale antialiasing (`-webkit-font-smoothing: antialiased`). Without it, macOS
    thickens light text on the dark ground and it reads as soft. Other systems ignore it.
  - Outlined display text paints its black outline outside the letters (`paint-order: stroke fill`,
    with the stroke doubled), so the outline doesn't eat into the letter shapes.
- **Stones** are tokens: a coloured disc, a black outline and a white symbol. Pickers show the
  token-board numbers 1–5.
- **Sheets.** Hoard (colour piles with a fix mode), Log, Menu (back to home, end the game, rules,
  keep the screen awake, credits), and Log your card. Dialogs: abandon or end the game.
- **Motion.** The card flip and the sheet rise both respect reduced motion. Touch targets are at least
  44 px.

## Logo and official art

- `docs/assets/logo.svg` is our own mark: five stone shapes on a gold ring around a green gem.
  - It is used for the favicon and the PWA icons, generated by `scripts/gen-logo.mjs`.
- The owner asked for the official Splendor and MARVEL logos and the automa card back to be used in the
  app (#30).
  - They live only in `src/ui/assets/official/` and are imported only through `OFFICIAL_ART`.
  - The repo is public, and the owner chose to keep them. The landing page shows them in the real
    screenshots (#17, #61).
  - Don't add any other official art.

## Prior art

An existing single-file Marvel automa helper, a Claude artifact by lajlev that the owner shared,
inspired several UI details. We took the ideas, not the code:

- the phase-coloured turn track;
- the flipped card drawn with all three bands and the active one lit;
- the left-to-right stack with "bottom, returned first";
- quick manual stack fixes;
- a rules reminder on the game screen.

We go further in a few ways:

- recruited cards are captured, so colours, points, Time and the Avengers tile are automatic;
- the colour-substitution prompt is exact;
- the full tiebreaker chain is applied;
- every ruling is a setting;
- games are seeded and replayable.

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
| Home | Continue the saved game · New game · Rules & credits |
| Setup | Variant, difficulty and rulings settings · 2-player setup checklist · Start |
| Game | Header (round, phase progress, both sides' summaries) · current step · Undo · Log |
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

## Visual language

- **Theme.** Cosmic "Infinity Gauntlet": deep space with nebula glows and a faint star field,
  gauntlet-gold accents, and glassy panels.
- **Type.** Bebas Neue (OFL, bundled via `@fontsource`, so it works offline and under the CSP) for
  headings, numbers and buttons; the system font for body text.
- **Stones** are drawn as game-like tokens: a coloured disc with a white symbol.
  - Power: circle. Mind: hexagon. Space: square. Reality: triangle. Soul: sun. Time: green diamond.
  - The symbols keep colours distinguishable for colour-blind players.
  - Pickers show the token-board numbers 1–5, matching the automa cards.
- **The automa card face** is drawn to resemble the printed card:
  - green, yellow and red phase strips;
  - metallic bands;
  - token wheels with the printed numbers;
  - a black slot badge with a green check;
  - a crossed-out discard wheel;
  - the card number and a ★ on star cards.
- **The flip.** The face flips from the official card back. The card shrinks once flipped, so the
  action panel stays near the top.
- **Thanos's side** is tinted purple and yours blue. A side that has completed the Gauntlet glows
  green.
- **Layout.** Tap targets are at least 48 px, and it is comfortable at 360 px wide. Animations respect
  reduced motion.
- **Rule tips** (#31) are small "i" buttons next to the rule they explain. A tap toggles an inline note,
  because hover doesn't exist on phones.

## Logo and official art

- `docs/assets/logo.svg` is our own mark: five stone shapes on a gold ring around a green gem.
  - It is used for the favicon and the PWA icons, generated by `scripts/gen-logo.mjs`.
- The owner asked for the official Splendor/MARVEL banner and the automa card back to be used in the
  app (#30).
  - They live only in `src/ui/assets/official/` and are imported only through `OFFICIAL_ART`.
  - They are for personal use.
  - Remove or replace them before the repo goes public (#17).
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

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

- **Stones** use colour plus shape, so they stay distinguishable for colour-blind players:
  - Power: purple circle;
  - Mind: yellow hexagon;
  - Space: blue square;
  - Reality: red triangle;
  - Soul: orange sun;
  - Time: green.
- Dark theme, tap targets of at least 48 px, comfortable at 360 px wide.
- On desktop the layout is centred and at most about 480 px wide.
- **No Marvel or Splendor artwork or logos.** Use our own icons and type only.

## Logo

`docs/assets/logo.svg` is our own mark: the five stone shapes on a gold ring around a green gem. It is
used in the README and as the favicon. It is generated by a small script so the geometry stays exact;
the PWA icons in #9 are rendered from it.

**Never** use the official Splendor or Marvel logos, box art, card art or the automa PDF's artwork,
here or in the app. They are trademarks and copyrighted art, and they would block opening the repo
(#17).

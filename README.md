# Splendor Marvel: Solo Automa companion

A phone-first web app (PWA) for playing **Splendor Marvel** solo against the fan-made **Thanos
automa**.

It is a *companion* to the physical game, not a digital version. The market, the tokens and your cards
stay on the table. The app replaces the automa deck, the token placement board and all of Thanos's
bookkeeping.

> **Status:** in development. Work is planned in
> [issues](https://github.com/asilachev/splendor-marvel-automa/issues) and
> [milestones](https://github.com/asilachev/splendor-marvel-automa/milestones).

## What it does

- **Runs the automa deck.** It shuffles and flips the deck, changes phase after rounds 10 and 20, and
  enforces the 30-round limit.
- **Tells you what Thanos does:**
  - which tokens to take;
  - which card he recruits, including the colour-substitution rule;
  - which tokens to return, oldest first.
- **Keeps Thanos's state:** his ordered token stack, colours, Time stone, points, Avengers tags, and the
  Avengers Assemble tile.
- **Checks for a winner.** At the end of every round it checks the Infinity Gauntlet condition and
  applies the official tiebreakers.
- **Handles real table use:**
  - undo for every step;
  - survives reloads;
  - works offline;
  - keeps the screen awake.
- **Needs no card data.** When a card is recruited you tap its colour, points and Avengers tags. There
  is no card database and no game art.

## Rules

- **Official game rules.** [`docs/rules.md`](docs/rules.md) summarises everything the app relies on,
  with page references. The official rulebook and the automa PDF are attached to the private
  [`reference-docs` release](https://github.com/asilachev/splendor-marvel-automa/releases/tag/reference-docs);
  `npm run reference` downloads them into `docs/reference/`. The game's page is on
  [BGG](https://boardgamegeek.com/boardgame/293296/splendor-marvel).
- **Automa rules.** [`docs/automa.md`](docs/automa.md) has:
  - the full card list, checked against the PDF;
  - clarifications from BGG;
  - the rulings the app uses for gaps in the PDF.
- **App design.** [`docs/design.md`](docs/design.md).

## Credits

- **Splendor Marvel** is designed by Marc André and published by Space Cowboys (2020). © Space Cowboys,
  © MARVEL.
- **The solo automa** was designed by **Dukefanblue2005** on BGG, originally for Splendor
  ([Splendor Automa](https://boardgamegeek.com/filepage/201926)).
- **The Marvel re-theme of the automa** is by **Shamus** on BGG
  ([Splendor Marvel Solo Automa V1](https://boardgamegeek.com/filepage/215783)).

This is an unofficial personal fan project. It is not affiliated with or endorsed by Space Cowboys,
Asmodee or Marvel, and you need the physical game to use it.

Shamus has said he dislikes web apps for his automa and asked that links to them be removed from his
BGG file page. **Please don't post this app there.** See the
[community note](docs/automa.md#community-note).

## Development

[![CI](https://github.com/asilachev/splendor-marvel-automa/actions/workflows/ci.yml/badge.svg)](https://github.com/asilachev/splendor-marvel-automa/actions/workflows/ci.yml)

```sh
npm ci
npm run dev        # http://localhost:5173 (use `npm run dev -- --host` to open it on your phone)
npm test           # Vitest
npm run build      # production build in dist/
```

Built with Vite, React and TypeScript, with a pure TypeScript automa engine in `src/engine`.
Contributor and agent guidance, including commands, layout, workflow and conventions, is in
[AGENTS.md](AGENTS.md).

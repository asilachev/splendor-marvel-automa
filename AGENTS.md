# AGENTS.md

Guidance for AI coding agents, and for humans, working in this repository.

## What this project is

A phone-first PWA that runs the fan-made **Solo Automa V1 (Thanos)** for the board game **Splendor
Marvel**, so one person can play solo with the physical game.

The app is a **companion**:

- the physical table holds the market, the token supply and the player's cards;
- the app replaces the automa deck, the token placement board and Thanos's bookkeeping.

## Read these first

| Doc | Contains |
| --- | --- |
| [`docs/rules.md`](docs/rules.md) | Summary of the official rules, with rulebook page references |
| [`docs/automa.md`](docs/automa.md) | Automa rules, the **card list**, BGG clarifications, and the **rulings table** (defaults for every gap in the PDF) |
| [`docs/design.md`](docs/design.md) | UX flow, screens, engine state and events, visual language |
| [`docs/reference/`](docs/reference/) | Source PDFs: the official rulebook and the automa |

When behaviour depends on a rule, cite the doc section in code comments or tests. If the code needs a
rule the docs don't cover, or contradicts them, **stop and raise it in the issue**. Don't guess. Any
change to a rule or ruling updates the docs in the same PR.

## Ground rules

- **Companion, not a digital game.**
  - Never add a card database, card art, card names or a digital market.
  - A recruited card is only `{ level, colour, points, tags }`.
- **No Marvel or Splendor artwork, logos or trade dress** in the app, and no art from the automa PDF.
  Use our own icons, colours and type.
- **Faithful to the automa.** Each gap in the PDF is a setting, and its default comes from the
  rulings table in `docs/automa.md`. Don't silently change a default.
- **Engine purity.**
  - `src/engine/` is plain TypeScript: no React, DOM, `Date.now()` or `Math.random()`.
  - All randomness comes from the seeded RNG.
  - Game state is a pure function of `(seed, settings, events)`.
- **Credit** Marc André and Space Cowboys (game), Dukefanblue2005 (automa) and Shamus (Marvel
  re-theme) wherever credits appear.
- **Visibility.** The repo is **private** because `docs/reference/` contains copyrighted PDFs. Don't
  make it public, and don't post links to the app on BGG; see the community note in
  `docs/automa.md`.
- **No secrets.** There is no backend. Don't add analytics, accounts or network calls without an issue
  that approves them.

## Commands

You need Node 22 or later (see `.nvmrc`). Use npm.

| Command | What it does |
| --- | --- |
| `npm ci` | Install dependencies exactly as locked |
| `npm run dev` | Start the dev server (add `-- --host` to open it on a phone on the same Wi-Fi) |
| `npm test` | Run all tests once (Vitest). The `engine` project runs on Node, the `ui` project on jsdom |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Run Oxlint; warnings fail |
| `npm run format` / `format:check` | Format, or check formatting, with Prettier (code and config only; Markdown is excluded) |
| `npm run typecheck` | `tsc -b`, strict |
| `npm run build` | Typecheck, then production build into `dist/` |
| `npm run preview` | Serve the production build |

CI (`.github/workflows/ci.yml`) runs `lint`, `format:check`, `typecheck`, `test` and `build` on every PR
and on every push to `master`. Run the same commands before pushing.

## Code layout

```
src/
  engine/   pure TypeScript automa engine: no React, no DOM; *.test.ts runs on Node
  ui/       React components and styles; *.test.tsx runs on jsdom with Testing Library
  test/     shared test setup
docs/       rules, automa spec, design, reference PDFs
```

**Conventions**

- Imports use explicit `.ts` / `.tsx` extensions.
- Use named exports.
- Style with CSS Modules (`*.module.css`), using the tokens in `src/ui/styles/global.css`.
- TypeScript is strict, with `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`.

## Workflow

GitHub Issues hold the plan, organised with milestones and labels: `engine`, `ui`, `infra`, `rules`,
`documentation`, `enhancement`.

1. **Pick an issue** and read its acceptance criteria. If anything is unclear, comment on the issue
   first.
2. **Branch** from `master` with the name `<issue-number>-<short-slug>`, for example `3-thanos-turn`.
3. **Commit** in small steps. Use imperative messages ("Add FIFO discard to token stack") and
   reference the issue (`#3`). **Never add `Co-Authored-By` or any other attribution trailer**:
   keep the history clean.
4. **Open a PR** whose body says `Closes #<n>`. Summarise what changed, how it was tested, and any rule
   decisions with links to the docs.
5. **CI must be green.** It runs lint, format check, typecheck, tests and build. **Squash-merge** into
   `master`, then delete the branch. The squash commit uses the PR title as its subject and a short
   summary as its body, with no trailers.
6. **Track new work** you discover as a new issue. Don't widen the PR you're working on.

### Definition of done

- Acceptance criteria met.
- Each engine rule touched has unit tests: one per rule or ruling, named after it.
- No `any` without a comment explaining it. Strict TypeScript passes.
- UI works at 360 px width with touch, with tap targets of at least 48 px.
- Docs updated: rules and rulings, design, this file if workflow or commands changed.

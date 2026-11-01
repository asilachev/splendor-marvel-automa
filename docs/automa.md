# Solo Automa V1 (Thanos)

The automa this app runs. A copy of the PDF, `splendor-marvel-solo-automa-v1.pdf`, is in the
[`reference-docs` release](https://github.com/asilachev/splendor-marvel-automa/releases/tag/reference-docs);
`npm run reference` downloads it into `docs/reference/`.

**Credits**

- **Automa design:** Dukefanblue2005 (BGG), originally made for base Splendor:
  [Splendor Automa](https://boardgamegeek.com/filepage/201926),
  [design thread](https://boardgamegeek.com/thread/2430634).
- **Marvel re-theme:**
  [Splendor Marvel Solo Automa V1](https://boardgamegeek.com/filepage/215783) on BGG. Its author
  prefers not to be credited, so this project doesn't name them (see the
  [community note](#community-note)). The 12 Marvel cards are a 1:1 renumbered port of the base-game
  cards. There is no Marvel V2.

## Components

- **12 automa cards.** Each has three sections, one per phase:
  - phase 1: green, top;
  - phase 2: yellow, middle;
  - phase 3: red, bottom.
- **Star cards.** Four cards carry a gold star: **01, 07, 08, 11**. Their phase-3 section is the only
  place the automa ever targets level 3.
- **Token placement board:** **1** Power (purple), **2** Mind (yellow), **3** Space (blue), **4**
  Reality (red), **5** Soul (orange).
- **Market grid:** rows **A / B / C** are levels **3 / 2 / 1**, and columns **1–4** run left to right.
  For example, `C4` is the 4th level-1 card.

## Setup

1. Set up a normal 2-player game (see [rules.md](rules.md#setup-p-2)).
2. Build the deck: the 8 non-star cards plus **2 random star cards**, 10 cards in all. The other 2
   star cards go back in the box.

## Playing a round

- At most **30 rounds**. **Thanos goes first** every round: flip the next automa card and resolve the
  section for the current phase. Then you take your turn.
- **Phases:**
  - phase 1 is rounds 1–10;
  - reshuffle, then phase 2 is rounds 11–20;
  - reshuffle, then phase 3 is rounds 21–30.

  Each phase uses every card once.
- **End-of-round check:** if either side has 16 points and "six different Infinity Stones" (5 colour
  bonuses plus the Time token), apply the normal end-game rules. **Thanos wins a draw.**
- At the **start of round 31**, you lose.

### Action: take tokens

- Take the listed tokens, by board number, **in the order printed**, and put them on **top** of
  Thanos's stack.
- Skip any colour whose pile is empty.
- Thanos has **no 10-token limit**.

### Action: gain a card

1. Thanos takes the card at the listed position.
2. He discards the printed number of tokens from the **bottom** of his stack, oldest first. He still
   takes the card if he can't discard them all, or can't discard any.
3. **Colour substitution:** if Thanos already has a card in that card's colour, he takes the first
   card in the same row, scanning left to right, whose colour he doesn't have. If there is none, he
   takes the original card.
4. Thanos **claims the Avengers Assemble tile** under the normal rules, but **never claims
   Locations**.

### Hard variant

You play as Thanos and don't claim Locations. The automa plays the heroes and claims a Location as
soon as its bonuses meet the requirement.

The app offers it as a setup option (#11). By the owner's decision it changes the rules only, not the
names: the automa is still called Thanos.

- At setup you enter what each of the 2 Locations in play asks for: bonuses per colour.
- At the end of each of his turns, Thanos claims a Location his bonuses meet (+3 points), at most one
  per turn. His bonuses come from the cards the "which cards count" ruling counts.
- You don't claim Locations.

## Card list

Checked against a high-resolution render of the PDF. Token numbers refer to the board above. In the
"Gain" entries, `−N` means discard N tokens.

| Card | ★ | Phase 1 (rounds 1–10) | Phase 2 (11–20) | Phase 3 (21–30) |
| --- | --- | --- | --- | --- |
| 01 | ★ | Take 1,2 | Take 5,1,4 | Gain A4 −3 |
| 02 |  | Gain C1 −3 | Gain C3 −3 | Take 2,4,3 |
| 03 |  | Take 5,4 | Gain C4 −3 | Take 3,2,4 |
| 04 |  | Take 3,2 | Gain C2 −3 | Gain B1 −2 |
| 05 |  | Take 2,5,1 | Gain C4 −3 | Take 4,3,5 |
| 06 |  | Take 4,3,2 | Gain C3 −3 | Gain B4 −2 |
| 07 | ★ | Gain C3 −3 | Take 3,4 | Gain A3 −3 |
| 08 | ★ | Gain C4 −3 | Take 2,5,1 | Gain A1 −3 |
| 09 |  | Gain B2 −4 | Take 5,2,1 | Take 5,1 |
| 10 |  | Gain C1 −3 | Gain C2 −3 | Take 3,4,1 |
| 11 | ★ | Gain C2 −3 | Take 1,5 | Gain A2 −3 |
| 12 |  | Take 1,3,4 | Gain B3 −3 | Gain C1 *(no discard printed)* |

### What follows from the card list

- **Phase 1:**
  - the non-star cards give 5 takes and 3 gains;
  - star card 01 is a take, and stars 07, 08 and 11 are gains;
  - so Thanos makes 4–5 gains this phase.
- **Phase 2:**
  - the non-star cards give 1 take and 7 gains;
  - every star card is a take.

  `C1` is never targeted in phase 2.
- **Phase 3:**
  - the non-star cards give 5 takes and 3 gains;
  - both star cards in the deck are level-3 gains.
- **Thanos can't win before round 21.** He gets the Time token only with his first level-3 card, and
  only the two star cards' phase-3 sections target row A. In the [simulation](#simulation) that first
  card arrives on round 23.6 on average (median 23), and on round 26 or later in 22% of games.
- **Token pressure.** In a 2-player game there are only 4 tokens per colour. In the
  [simulation](#simulation), Thanos playing alone holds 2–5 tokens on average: 3.4, 2.1 and 4.9 after
  his turn in phases 1, 2 and 3. His stack grows through phase 3, to 7 by round 30, and it reaches 10
  or more at some point in 62% of games.

## Clarifications from BGG

1. **Which cards Thanos keeps.** The PDF says to box cards without points or Avengers tags, which
   breaks the colour rule. The re-theme's author clarified on its file page,
   [2021-07-18](https://boardgamegeek.com/filepage/215783?commentid=10332239):

   > "keep the card if is has a colour the automa needs or if it provides points or it has the
   > Avengers symbol"

   In effect, every colour Thanos has collected counts.
2. **Avengers tile.** Normal rules apply. Thanos can win without it, and old Avengers cards with no
   points are kept ([comment](https://boardgamegeek.com/filepage/215783?commentid=10329818)). Count
   tags, not cards: some cards have 2.
3. **Card 12, phase 3, `C1` with no discard.** The original base-game card is identical, so this is
   probably intentional. There is no designer statement.
4. **Empty market slot after a deck runs out.** Not addressed anywhere on BGG.
5. **Base-game rulings that carry over.** The human gets the last turn of the round
   ([thread](https://boardgamegeek.com/thread/2430634/article/43972369)).
6. **Difficulty.** Reports are anecdotal and split. Tweaks suggested for the base game:
   - shorter phases: "10/9/8=27 still too easy and 8/8/8=24 pretty hard"
     ([post](https://boardgamegeek.com/thread/2430634/article/35690606));
   - a cap of 12 on the token stack
     ([comment](https://boardgamegeek.com/geeklist/273639?itemid=7714470&commentid=10121350)).

   The [simulation](#simulation) shows what each tweak changes for Thanos.

## Rulings this app uses

Every gap in the PDF is an explicit setting with a documented default. Change a default only in a PR
that updates this table.

| Question | Default | Alternatives | Basis |
| --- | --- | --- | --- |
| Which of Thanos's cards count for colours and the Gauntlet | **All of them** | Only cards with points or Avengers tags (as printed) | BGG clarification by the re-theme's author (1) |
| Card 12, phase 3 discard | **0** | 3 | Matches the base-game card (3) |
| Targeted slot is empty | **First card in that row from the left** (colour substitution still applies) | Thanos takes nothing and discards nothing | No ruling (4); left-to-right matches the substitution scan |
| Both sides complete the Gauntlet in the same round | **Official tiebreakers, then Thanos wins any remaining tie** | Thanos wins outright | The PDF says "apply the normal game winning conditions" and "Thanos wins a draw" |
| Phase lengths | **10 / 10 / 10** (30 rounds) | 10 / 9 / 8 (27), 8 / 8 / 8 (24) | Community tweak (6) |
| Cap on Thanos's token stack | **None** | 12; the oldest tokens beyond the cap go back to the supply | Community tweak (6) |
| Hard variant: Thanos meets both Locations in the same turn | **The one entered first at setup**; he takes the other at the end of a later turn if he still meets it | None: both are worth 3 | The rules allow one Location per turn and let a player choose; the automa can't choose |

## Simulation

`npm run sim` plays Thanos alone on the engine (`src/engine/sim.ts`) and prints Markdown tables for
each preset: his stack per phase and per round, his first level-3 card, his discards, empty piles and
the cap. `npm run sim -- --runs N --seed S` sets the number of games (default 10,000) and the seed
(default 1). The same arguments always print the same tables.

The model:

- Your turns do nothing. The supply is a 2-player game's 4 tokens per colour, less his stack. Tokens he
  returns, or loses to the cap, go back to it. A take skips a colour only when its pile is empty.
- Every card he gains is worth 0 points, so he never completes the Gauntlet and every game runs to the
  round limit. None of the figures depend on the cards.
- Every preset plays the same shuffled decks.

10,000 games per preset, seed 1:

| Preset | Stack, mean in phases 1 / 2 / 3 | Stack reaches 10 | First level-3 card: mean (median) | On round 26+ | None | Gains short | Tokens missing | Sent back by the cap |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 10/10/10, no cap | 3.4 / 2.1 / 4.9 | 62% | 23.6 (23) | 22% | 0% | 41% | 16.6 | 0 |
| 10/10/10, cap 12 | 3.4 / 2.0 / 4.8 | 62% | 23.6 (23) | 22% | 0% | 41% | 16.7 | 0.33 |
| 10/9/8, no cap | 3.4 / 2.1 / 4.4 | 53% | 22.5 (22) | 11% | 2% | 42% | 15.3 | 0 |
| 10/9/8, cap 12 | 3.4 / 2.1 / 4.4 | 53% | 22.5 (22) | 11% | 2% | 43% | 15.5 | 0.31 |
| 8/8/8, no cap | 3.1 / 2.2 / 4.5 | 47% | 19.5 (19) | 0% | 2% | 43% | 14.0 | 0 |
| 8/8/8, cap 12 | 3.1 / 2.1 / 4.4 | 47% | 19.5 (19) | 0% | 2% | 43% | 14.1 | 0.28 |
| 10/10/10, no cap, card 12 −3 | 3.4 / 2.1 / 4.1 | 53% | 23.6 (23) | 22% | 0% | 44% | 17.8 | 0 |

- **Stack** is his stack after his turn. **Stack reaches 10** counts the games where it gets to 10 or
  more at least once.
- **Gains short** is the share of his gains that can't return the whole discard. **Tokens missing**
  and **sent back by the cap** are per game.

What it shows:

- **The Time token comes late.** The level-3 figures match the exact odds: the first star card in phase
  3 is the k-th of the 10 with odds (10 − k)/45, which gives round 23.7 on average and round 26 or
  later 10 times in 45. With 10/9/8 or 8/8/8, phase 3 draws only 8 cards and misses both star cards in
  1 game in 45.
- **Discards often come up short,** most of all in phase 2: he holds about 2 tokens, and over half of
  his phase-2 gains can't return all 3.
- **Alone, he rarely empties a pile.** Under 2% of games skip a token. In a real game your takes empty
  piles too.
- **The cap of 12 rarely bites.** It sends back about 0.3 tokens per game, in 12–15% of games.
- **Card 12 discarding 3** lowers his phase-3 average from 4.9 to 4.1 tokens, and his round-30 average
  from 7.1 to 5.2.
- **Shorter phases** change his averages by half a token at most. They end the game sooner and bring
  phase 3, and with it his Time token, earlier.

## Community note

On 2026-10-06 the re-theme's author wrote that they "really hate the idea of a webapp", and asked for
two app links to be removed from its file page
([comment 1](https://boardgamegeek.com/filepage/215783?commentid=13729218),
[comment 2](https://boardgamegeek.com/filepage/215783?commentid=13730978)). By contrast,
Dukefanblue2005 promoted RIFO's web app for the base-game automa
([comment](https://boardgamegeek.com/filepage/201926?commentid=10065450)).

Before sharing anything, the owner asked the re-theme's author by GeekMail. The reply, on 2026-10-31:
"I prefer not to be credited. I don't own any of the IP."

So:

- **Don't post this app on the re-theme's file page.**
- **Don't name the re-theme's author**, in the app, docs, commits or posts (#90). Credit
  Dukefanblue2005 for the automa, and cite clarifications as "BGG clarification", with the link.
- **Don't add more of the PDF's artwork.** The card back is the one exception the owner approved
  (`src/ui/assets/official/`).

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
  only the two star cards' phase-3 sections target row A. In simulation that first card arrives around
  round 24 on average, and on round 26 or later about 22% of the time.
- **Token pressure.** In a 2-player game there are only 4 tokens per colour. A simulation of Thanos
  playing alone has him holding 2–5 tokens on average, and occasionally 10 or more after several takes
  in a row.

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

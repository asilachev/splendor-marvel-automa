# Splendor Marvel: official rules summary

This is a summary, in our own words, of the parts of the official rules that this app depends on. The
official English rulebook (Space Cowboys, 2020, 4 pages) is `splendor-marvel-rulebook-en.pdf` in the
[`reference-docs` release](https://github.com/asilachev/splendor-marvel-automa/releases/tag/reference-docs);
`npm run reference` downloads it into `docs/reference/`. **If this summary and the rulebook disagree,
the rulebook wins.** Fix the summary in the same PR as any code
change that depends on it.

Page numbers below refer to the rulebook PDF.

## Components (p. 2)

| Component | Count | Notes |
| --- | --- | --- |
| Infinity Stone tokens: Mind (yellow), Space (blue), Soul (orange), Power (purple), Reality (red) | 7 each | the five "colours" |
| Time tokens (green) | 4 | not a colour: one per player, earned with a level-3 card |
| S.H.I.E.L.D. tokens (grey) | 5 | wild |
| Character cards | 90 | 40 level 1, 30 level 2, 20 level 3 |
| Location tiles | 4 | double-sided, each side worth 3 points |
| Avengers Assemble tile | 1 | worth 3 points |
| Infinity Gauntlet tile | 1 | reminder of the win condition; not scored, not a tiebreaker |

## Setup (p. 2)

- Shuffle each level's deck. Stack them in a column: level 1 at the bottom, level 3 at the top.
  Deal 4 face-up cards to the right of each deck.
- Deal as many random Location tiles as there are players, each with a random side face up.
- Place the Gauntlet and Avengers tiles above the Locations, the grey tokens next to them, the green
  tokens near the Gauntlet, and the five coloured piles within reach.
- **2 players** (used by the solo automa):
  - remove 3 of each colour, leaving **4 per colour**;
  - remove 2 green, leaving **2 green**;
  - keep all **5 grey**;
  - use **2 Locations**.
- 3 players: remove 2 of each colour and 1 green, keep 5 grey, use 3 Locations.

## A turn (p. 3)

On your turn, do exactly one of these:

1. **Take 3 tokens of 3 different colours** (never grey or green). If fewer colours are available,
   take 2 different colours, or 1.
2. **Take 2 tokens of one colour**, only if that pile holds at least 4 before you take. Never grey or
   green.
3. **Reserve 1 card**, either face-up or the hidden top card of a deck, and take 1 grey token if any
   are left.
   - You may hold at most 3 reserved cards.
   - Reserved cards can't be discarded; the only way to get rid of one is to recruit it.
4. **Recruit 1 card**, face-up or reserved. Pay its cost minus your bonuses; grey tokens are wild.
   Spent tokens go back to the supply.

- **Token limit:** at the end of your turn you may hold at most 10 tokens, counting grey and green.
  Return extras of your choice, but you can never return a green token.
- **Market:** refill a recruited or reserved face-up card immediately from the same level. Once a
  deck is empty, its gaps stay empty.

## Cards (p. 3–4)

- Each card shows a cost, **one bonus colour**, Infinity Points (if any) and **0, 1 or 2 Avengers
  tags**.
- A bonus is a permanent discount of one token of its colour. There are no green bonuses, and green
  tokens are never spent.
- **Every level-3 card shows the Time Stone icon.** Card irregularities are intentional, according to
  the publisher ([BGG](https://boardgamegeek.com/thread/2909132)).

## The Time Stone (p. 4)

You take a green token when you recruit your first card with the Time icon, which means your first
level-3 card. You can hold at most 1 green token.

## Avengers Assemble tile (p. 4)

- The first player to have **3 or more Avengers tags** takes the tile, which is worth 3 points. This
  isn't an action.
- Another player takes it only when they have **more** tags than the holder. A tie leaves it where it
  is. The tile can change hands many times.
- You don't need the tile to win. The BGG game description claims you do; it is wrong.

## Locations (p. 4)

- At the end of your turn, if your **bonuses** meet a Location's requirement, you must take it and
  score 3 points. Tokens don't count.
- You may take at most 1 Location per turn. If you qualify for several, you choose.
- You don't need a Location to win.

## End of the game (p. 4)

- **Gauntlet condition:** you have **16 or more Infinity Points**, **at least one bonus of each of the
  5 colours**, and **a green token**. Meeting it triggers the end of the game.
- Finish the round, so everyone has had the same number of turns. If the triggering player was last
  in the round, they win at once.
- **Ties** between players who meet the condition are broken in this order:
  1. most Infinity Points;
  2. holding the Avengers tile;
  3. fewest Character cards;
  4. otherwise, a shared victory.
- **Special rule:** if the triggering player later loses the Avengers tile and drops below 16 points,
  the game continues.

## Official extras

- Helicarrier / Hydra Base promo Location tile, Gen Con 2022
  ([BGG](https://boardgamegeek.com/boardgameexpansion/369960)).
- There is no official solo mode. That is why this app exists; see [automa.md](automa.md).

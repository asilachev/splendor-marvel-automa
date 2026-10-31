import type { Phase, Row, Stone } from '../../engine/index.ts'
import { pluralizer } from './plural.ts'

const p = pluralizer('en')
const COLOUR: Record<Phase, string> = { 1: 'green', 2: 'yellow', 3: 'red' }

/**
 * English, the source catalog (#54). Every other language implements the same `Messages` shape,
 * so a missing or extra key fails the typecheck. Templates are functions, so each language can
 * order words and inflect them its own way.
 */
export const en = {
  common: {
    thanos: 'Thanos',
    close: 'Close',
    closeTitle: (title: string) => `Close ${title}`,
    dismiss: 'Dismiss',
    back: 'Back',
    rule: (title: string) => `Rule: ${title}`,
    keepPlaying: 'KEEP PLAYING',
    /** Short card level, e.g. "L3". */
    level: (level: number) => `L${level}`,
    points: (n: number) => p(n, { one: '# pt', other: '# pts' }),
    tags: (n: number) => p(n, { one: '# Avengers tag', other: '# Avengers tags' }),
    time: 'Time',
    list: (items: readonly string[]) => items.join(', '),
  },
  stone: {
    power: 'Power',
    mind: 'Mind',
    space: 'Space',
    reality: 'Reality',
    soul: 'Soul',
  } satisfies Record<Stone, string>,
  language: {
    title: 'LANGUAGE',
    label: 'Language',
    change: (name: string) => `Language: ${name}`,
  },

  hud: {
    thanos: 'THANOS',
    you: 'YOU',
    points: (n: number, goal: number) => `${n} / ${goal} PTS`,
    round: (n: number) => `ROUND ${n}`,
    left: (n: number) => `${n} LEFT`,
    lastRound: 'LAST ROUND',
    gameOver: 'GAME OVER',
    summary: (s: {
      round: number
      limit: number
      thanos: { points: number; colours: number; time: boolean }
      you: { points: number; colours: number; time: boolean }
    }) =>
      `Round ${s.round} of ${s.limit}. Thanos ${s.thanos.points} points, ${s.thanos.colours} colours${s.thanos.time ? ' and Time' : ''}. ` +
      `You ${s.you.points} points, ${s.you.colours} colours${s.you.time ? ' and Time' : ''}.`,
  },
  dock: {
    nav: 'Game menu',
    undo: 'Undo',
    hoard: (n: number) => `Hoard · ${n}`,
    log: 'Log',
    menu: 'Menu',
  },
  cards: {
    flip: 'Flip Thanos’s card',
    tapToReveal: 'TAP TO REVEAL!',
    mini: (id: number, phase: Phase) => `Automa card ${id}, phase ${phase} section`,
    market: (slot: string, empty: boolean) => `Market, slot ${slot}${empty ? ' (empty)' : ''}`,
    pile: (n: number, stone: string) => `${n} ${stone}`,
    piles: (summary: string) => `Thanos’s tokens: ${summary}`,
    pilesNone: 'none',
    remove: (stone: string) => `Remove a ${stone} token`,
    add: (stone: string) => `Add a ${stone} token`,
    noTokens: 'No tokens yet',
    returnOrder: 'Return order, oldest first',
    returnedFirst: 'Returned first →',
  },

  home: {
    tagline:
      'Play Splendor Marvel solo. Your table holds the game — this app runs Thanos: his deck, his tokens, his race to the Gauntlet.',
    steps: ['Set up a 2-player game', 'Flip his card each round', 'Race him to the Gauntlet'],
    corruptSave: 'Your saved game couldn’t be read, so it was cleared.',
    lastGame: 'Last game:',
    lastGameRound: (round: number) => `in round ${round}.`,
    continue: (round: number) => `CONTINUE · ROUND ${round}`,
    newGame: 'NEW GAME',
    firstGame: 'START YOUR FIRST GAME',
    endGame: 'End this game',
  },
  setup: {
    title: 'NEW GAME',
    tableCaption: '1 · SET UP THE TABLE',
    table: [
      'Deal 4 cards per level, level 1 at the bottom',
      'Keep 4 tokens of each colour, 2 green, all 5 grey',
      '2 random Location tiles + Avengers & Gauntlet tiles',
      'Leave space for Thanos’s colour piles',
    ],
    difficulty: '2 · DIFFICULTY',
    length: 'Game length',
    lengthOptions: {
      standard: { label: '30 ROUNDS', hint: 'as printed' },
      shorter: { label: '27', hint: 'harder' },
      shortest: { label: '24', hint: 'hardest' },
    },
    lengthTip: {
      title: 'Game length',
      body: 'A community tweak from BGG: 10/9/8 (27 rounds) was “still too easy”, 8/8/8 (24) “pretty hard”.',
    },
    cap: 'Thanos’s token cap',
    capOptions: {
      none: { label: 'NO CAP', hint: 'as printed' },
      twelve: { label: '12 TOKENS', hint: 'community tweak' },
    },
    capTip: {
      title: 'Token cap',
      body: 'A community suggestion: cap his tokens at 12; the oldest beyond the cap go back to the supply.',
    },
    rulingsRow: 'Rulings for gaps in the automa',
    customised: 'customised',
    defaults: 'defaults ✓',
    start: 'START GAME',
  },
  rulings: {
    title: 'RULINGS',
    intro:
      'The automa PDF leaves a few gaps. Defaults follow the BGG clarifications — change them if your table rules differ.',
    counted: 'Which of Thanos’s cards count',
    countedOptions: {
      all: { label: 'ALL', hint: 'Shamus’s clarification' },
      scoringOnly: { label: 'POINTS / AVENGERS', hint: 'as printed' },
    },
    countedTip: {
      title: 'Which cards count',
      body: 'The PDF boxes his cards without points or Avengers tags, which breaks its own colour rule. Shamus clarified on BGG (2021): keep any card with a colour he needs — so in effect every colour counts.',
    },
    card12: 'Card 12 · phase 3 returns',
    card12Options: {
      zero: { label: '0', hint: 'none printed' },
      three: { label: '3', hint: 'like the others' },
    },
    card12Tip: {
      title: 'Card 12',
      body: 'Its phase-3 section (“C1”) prints no number. The original base-game card is the same, so it’s probably intentional.',
    },
    emptySlot: 'Targeted slot is empty',
    emptySlotOptions: {
      firstInRow: { label: 'FIRST IN ROW', hint: 'left to right' },
      nothing: { label: 'TAKES NOTHING', hint: '' },
    },
    emptySlotTip: {
      title: 'Empty slot',
      body: 'Neither the PDF nor BGG covers this. “First in row” matches the left-to-right scan of the colour rule.',
    },
    ties: 'Both complete the Gauntlet',
    tiesOptions: {
      tiebreakers: { label: 'TIEBREAKERS', hint: 'then Thanos' },
      thanosWins: { label: 'THANOS WINS', hint: '' },
    },
    tiesTip: {
      title: 'Ties',
      body: 'The PDF says to apply the normal winning conditions and that Thanos wins a draw: official tiebreakers first (points, Avengers tile, fewer cards), then Thanos.',
    },
    save: 'SAVE RULINGS',
  },

  reveal: {
    label: 'Thanos’s turn',
    caption: (phase: Phase) => `PHASE ${phase} · ${COLOUR[phase].toUpperCase()} SECTION`,
    headline: 'THANOS MAKES HIS MOVE',
    hint: 'He always goes first — then it’s your turn.',
    tipTitle: 'Thanos’s turn',
    tip: (phase: Phase) =>
      `Each round Thanos flips the next automa card and does the action in the ${COLOUR[phase]} section. Then you play your turn on the table as normal.`,
    cta: 'REVEAL HIS CARD',
  },
  phaseChange: {
    label: 'Phase change',
    title: 'DECK RESHUFFLED!',
    begins: (phase: Phase) => `PHASE ${phase} BEGINS`,
    hint: (from: number, to: number, phase: Phase) =>
      `Rounds ${from}–${to}: Thanos now reads the ${COLOUR[phase]} section of every automa card. Each card is used once per phase.`,
  },
  take: {
    label: 'Thanos takes tokens',
    caption: 'THANOS TAKES TOKENS',
    tag: (card: string, phase: Phase) => `CARD ${card} · PHASE ${phase}`,
    speech: (stones: readonly string[]) => `${stones.join('. ')}. MINE.`,
    plain: 'In printed order onto his piles. He has no 10-token limit.',
    question: 'TAP A TOKEN IF ITS PILE IS EMPTY',
    tipTitle: 'Taking tokens',
    tip: 'The numbers are the token board: 1 Power, 2 Mind, 3 Space, 4 Reality, 5 Soul. He takes them in printed order and skips any colour whose pile is empty.',
    group: 'Tokens to take',
    takeIt: 'TAKE',
    pileEmpty: 'PILE EMPTY',
    cta: (n: number) => (n ? `DONE · ADD ${n} TO HIS PILES` : 'DONE · NOTHING TO TAKE'),
  },
  recruit: {
    label: 'Thanos recruits',
    caption: 'THANOS RECRUITS',
    tag: (card: string, star: boolean, n: number) =>
      `CARD ${card}${star ? ' ★' : ''} · RETURNS ${n}`,
    speech: (column: number, row: Row) =>
      `THE ${['1ST', '2ND', '3RD', '4TH'][column - 1] ?? `${column}TH`} CARD OF THE ${{ A: 'TOP', B: 'MIDDLE', C: 'BOTTOM' }[row]} ROW IS MINE.`,
    speechEmpty: (slot: string) => `${slot} IS EMPTY? THEN THE FIRST CARD OF THAT ROW.`,
    plain: (level: number, column: number) =>
      `Level ${level}, slot ${column} from the left. If he already has its colour, he takes the first card in that row in a colour he lacks.`,
    plainEmpty: 'Your ruling: first card in the row, from the left. The colour rule still applies.',
    returns: 'HE RETURNS',
    returnsNothing: 'RETURNS NOTHING',
    takesNothingSub: 'he takes nothing',
    oldestFirst: 'oldest first',
    onlyOf: (have: number, n: number) => `oldest first · only ${have} of ${n}`,
    nonePrinted: 'none printed',
    pilesEmpty: 'his piles are empty',
    supply: 'SUPPLY',
    returningTipTitle: 'Returning tokens',
    returningTip:
      'Tokens go back from the bottom of his piles, oldest first. He still takes the card if he can’t return them all, or any.',
    alreadyHas: (stone: string) => `HE ALREADY HAS ${stone.toUpperCase()}!`,
    scanRow: (row: Row) =>
      `Scan row ${row} from the left: he takes the first card in a colour he lacks.`,
    insteadLabel: 'Colour of the card Thanos takes instead',
    noSuchCard: (target: string | null) =>
      `No such card in that row — he takes ${target ?? 'that card'} anyway`,
    nothingNotice: 'Thanos takes nothing this turn and returns no tokens.',
    question: 'WHICH STONE IS ON IT?',
    questionEmpty: (row: Row) => `WHICH STONE IS ON ROW ${row}’S FIRST CARD?`,
    substitutionTipTitle: 'Colour substitution',
    substitutionTip: (allCount: boolean) =>
      `If he already has a card in that colour, he takes the first card in the same row (left to right) in a colour he lacks — none? then the original card. ${allCount ? 'Every card he has counts (Shamus’s clarification).' : 'Only his cards with points or Avengers tags count.'}`,
    colourLabel: (slot: string) => `Colour of the card in ${slot}`,
    colourLabelEmpty: (row: Row) => `Colour of the first card in row ${row}`,
    rowEmpty: (row: Row) => `Row ${row} is empty too — he takes nothing, returns nothing`,
    slotEmpty: (slot: string) => `Slot ${slot} is empty`,
    emptySlotTipTitle: 'Empty slot',
    emptySlotTip: (firstInRow: boolean) =>
      `The PDF doesn’t cover this, so it’s a ruling: ${firstInRow ? 'he takes the first card in that row from the left instead.' : 'he takes nothing and returns no tokens.'}`,
    points: 'Points',
    avengers: 'Avengers',
    cta: 'HE TAKES IT',
    ctaNothing: 'CONFIRM · HE TAKES NOTHING',
  },
  table: {
    label: 'Your turn',
    caption: 'AT THE TABLE',
    yourMove: 'YOUR MOVE',
    recruited: 'I RECRUITED',
    recruitedSub: 'log the card',
    location: 'I TOOK A LOCATION',
    locationSub: '+3 points',
    locationTaken: 'LOCATION TAKEN',
    locationTakenSub: '+3 · one per turn',
    logged: (items: readonly string[]) => `Logged: ${items.join(' · ')}`,
    locationLogged: 'Location +3',
    tileToYou: 'You have more Avengers tags — the Avengers tile moves to you (+3).',
    after:
      'Took tokens or reserved? Nothing to log. Then the app checks both sides for the Gauntlet.',
    tipTitle: 'End of round',
    ties: (thanosWins: boolean): string =>
      thanosWins
        ? 'If both complete the Gauntlet in the same round, Thanos wins (your ruling).'
        : 'If both complete the Gauntlet: more points wins, then the Avengers tile, then fewer cards — and Thanos wins any remaining tie.',
    cta: (round: number) => `END ROUND ${round}`,
  },
  over: {
    label: 'Game over',
    tiebreaker: 'TIEBREAKER',
    thanos: 'THANOS',
    you: 'YOU',
    pts: (n: number) => `${n} PTS`,
    meta: (colours: number, time: boolean, tile: boolean) =>
      `${colours} of 5 colours${time ? ' + Time' : ''}${tile ? ' · Avengers tile' : ''}`,
    newGame: 'NEW GAME',
    undo: 'UNDO THE LAST STEP',
    home: 'Back to home',
  },
  result: {
    win: 'YOU WIN!',
    snap: 'SNAP.',
    thanosWins: 'THANOS WINS',
    titleWin: 'You win!',
    titleThanos: 'Thanos wins',
    gauntlet: (you: boolean, round: number) =>
      `${you ? 'You' : 'Thanos'} completed the Infinity Gauntlet in round ${round}.`,
    morePoints: (you: boolean, round: number) =>
      `Both of you completed the Gauntlet in round ${round}. ${you ? 'You' : 'Thanos'} had more points.`,
    avengersTile: (you: boolean) =>
      `Both completed the Gauntlet with equal points. ${you ? 'You hold' : 'Thanos holds'} the Avengers tile.`,
    fewerCards: (you: boolean) =>
      `Both completed the Gauntlet with equal points and no tile decided it. ${you ? 'You have' : 'Thanos has'} fewer cards.`,
    thanosWinsTies: (round: number) =>
      `Both completed the Gauntlet in round ${round}, and Thanos wins ties.`,
    roundLimit: (round: number) => `Round ${round} ended without your Infinity Gauntlet.`,
  },
  checklist: {
    put: (stones: string) => `Put ${stones} on his piles`,
    tookNone: 'He took no tokens this time',
    skipped: (stones: string, n: number) =>
      `${stones} ${n === 1 ? 'pile was' : 'piles were'} empty — skipped`,
    cap: 'Stack cap: return to the supply',
    nothing: 'Thanos took nothing this turn',
    returnTo: 'Return to the supply',
    refillSlot: (slot: string, level: number) => `Refill slot ${slot} from the level ${level} deck`,
    refillMarket: (level: number) => `Refill the market from the level ${level} deck`,
    time: 'Give Thanos a green Time token',
    tile: 'Move the Avengers tile to Thanos',
  },
  log: {
    took: (stones: string) => `Thanos took ${stones}`,
    tookNothing: 'Thanos took nothing',
    empty: (stones: string) => `${stones} empty`,
    capReturned: (stones: string) => `cap returned ${stones}`,
    gainNothing: (slot: string) => `Thanos took nothing (${slot} empty)`,
    gain: (card: string, slot: string, how: 'substituted' | 'slotEmpty' | null) =>
      `Thanos took ${card} for ${slot}${how === 'substituted' ? ' instead (substitution)' : how === 'slotEmpty' ? ' (slot empty)' : ''}`,
    returned: (stones: string) => `returned ${stones}`,
    timeToken: 'Time token',
    tileMiddle: 'Avengers tile back in the middle',
    tileTo: (who: 'thanos' | 'player', manual: boolean) =>
      `Avengers tile → ${who === 'thanos' ? 'Thanos' : 'You'}${manual ? ' (manual)' : ''}`,
    youRecruited: (card: string) => `You recruited ${card}`,
    youLocation: 'You took a Location (+3)',
    stackFix: (added: boolean, stone: string) =>
      `Stack fix: ${added ? 'added' : 'removed'} ${stone}`,
    cardFix: (added: boolean, yours: boolean, card: string) =>
      `Card fix: ${added ? 'added' : 'removed'} ${yours ? 'your' : 'Thanos’s'} ${card}`,
    phase: (phase: Phase) => `Phase ${phase} begins: deck reshuffled`,
  },

  hoard: {
    title: 'THANOS’S HOARD',
    tokens: (n: number) => `TOKENS · ${n}`,
    fix: 'FIX',
    done: 'DONE',
    cards: (n: number) => `CARDS · ${n}`,
    noCards: 'No cards yet.',
    removeCard: (card: string) => `Remove ${card}`,
    tile: 'Avengers Assemble tile',
    tileOptions: { none: 'MIDDLE', thanos: 'THANOS', player: 'YOU' },
    noteFix:
      'Fix only when the table and the app disagree — Undo is simpler for the last few steps.',
    note: 'Keep his tokens in colour piles on the table — the app remembers which go back first.',
  },
  logSheet: {
    title: 'GAME LOG',
    empty: 'Nothing yet — flip Thanos’s first card.',
    round: (r: number) => `Round ${r}`,
    roundTitle: (r: number, now: boolean) => `ROUND ${r}${now ? ' · NOW' : ''}`,
  },
  menu: {
    title: 'MENU',
    home: 'BACK TO HOME · GAME SAVED',
    end: 'END THIS GAME',
    rules: 'RULES',
    settings: 'SETTINGS',
    wake: 'Keep the screen awake',
    wakeSub: 'during a game, so the phone doesn’t lock',
    rulingsTitle: 'THIS GAME’S RULINGS',
    rulingLength: (lengths: readonly number[], cap: number | null) =>
      `${lengths.join(' / ')} rounds per phase${cap ? ` · token cap ${cap}` : ''}`,
    rulingCounted: (all: boolean) =>
      `Thanos’s cards that count: ${all ? 'all (Shamus’s clarification)' : 'points/Avengers only'}`,
    rulingCard12: (n: number) => `Card 12, phase 3 returns ${n}`,
    rulingEmpty: (firstInRow: boolean) =>
      `Empty slot: ${firstInRow ? 'first card in the row' : 'he takes nothing'}`,
    rulingTies: (thanosWins: boolean) =>
      `Both complete the Gauntlet: ${thanosWins ? 'Thanos wins' : 'tiebreakers, then Thanos'}`,
  },
  rules: [
    {
      title: 'Thanos’s turn',
      text: 'Thanos goes first every round: flip the next automa card and do the action in the section for the current phase (green rounds 1–10, yellow 11–20, red 21–30). The deck is reshuffled between phases.',
    },
    {
      title: 'Taking tokens',
      text: 'He takes the tokens shown, in printed order (1 Power, 2 Mind, 3 Space, 4 Reality, 5 Soul), onto his piles. Skip any colour whose pile is empty. He has no 10-token limit.',
    },
    {
      title: 'Recruiting & colour substitution',
      text: 'He takes the card in the named slot (row A = level 3 on top, C = level 1 at the bottom; columns from the left). If he already has that colour, he takes the first card in the row in a colour he lacks; none? then the original.',
    },
    {
      title: 'Returning tokens (oldest first)',
      text: 'When he recruits he returns the printed number of tokens, oldest first. He still takes the card if he can’t return them all, or any.',
    },
    {
      title: 'Avengers tile & Locations',
      text: 'The first side with 3+ Avengers tags takes the Avengers Assemble tile (+3); only more tags take it away. Thanos never takes Locations.',
    },
    {
      title: 'Winning & tiebreakers',
      text: 'At the end of a round, 16+ points, a bonus of every colour and the green Time token complete the Gauntlet. Ties: more points, then the Avengers tile, then fewer cards; then Thanos. After the last round without your Gauntlet, you lose.',
    },
  ],
  logCard: {
    title: 'LOG YOUR CARD',
    level: 'Level',
    colour: 'BONUS COLOUR',
    colourLabel: 'Bonus colour',
    points: 'Points',
    avengers: 'Avengers',
    note: 'Level 3 cards also give you the green Time token.',
    add: 'ADD CARD',
  },

  dialogs: {
    endTitle: 'END THIS GAME?',
    endBody: (round: number) =>
      `You’re in round ${round}. Ending it clears the saved game — Undo can’t bring it back.`,
    end: 'END GAME',
    abandonTitle: 'ABANDON THIS GAME?',
    abandonBody: (round: number) =>
      `You’re in round ${round}. Starting over clears it — Undo can’t bring it back.`,
    startOver: 'START OVER',
  },
  toasts: {
    undone: 'Undone — stepped back one action.',
    undoMore: 'UNDO MORE',
    ended: 'Game ended.',
    update: 'A new version is ready. Your game is saved.',
    reload: 'RELOAD',
    offline: 'You’re offline — everything still works.',
  },
  pwa: {
    cardLabel: 'Install Thanos Automa',
    cardTitle: 'INSTALL THANOS AUTOMA',
    cardSub: 'Full screen, offline, screen kept awake.',
    install: 'INSTALL',
    sheetTitle: 'INSTALL THE APP',
    benefits: ['Works offline', 'Full screen', 'Screen stays on'],
    steps: [
      'Tap Share in Safari’s toolbar',
      'Choose “Add to Home Screen”',
      'Open Thanos Automa from your home screen',
    ],
    gotIt: 'GOT IT',
    splashSub: 'Splendor Marvel · solo companion',
  },
  credits: {
    label: 'Credits and copyright',
    title: 'Credits',
    game: {
      name: 'Splendor Marvel',
      text: 'game by Marc André, published by Space Cowboys (2020).',
    },
    automa: { name: 'Solo automa', before: 'designed by', after: 'on BoardGameGeek.' },
    retheme: { name: 'Marvel re-theme of the automa', before: 'by', after: 'on BoardGameGeek.' },
    copyrightTitle: 'Copyright & trademarks',
    notices: [
      'Splendor and the Splendor logo are trademarks of Space Cowboys (Asmodee). Game rules and box artwork © 2020 Space Cowboys.',
      'MARVEL, the MARVEL logo and all related characters and names are ™ & © MARVEL.',
      'The logos and the automa card back (box art © Space Cowboys and © MARVEL, card design by Shamus) are used for personal, non-commercial use only.',
      'Unofficial fan tool, not affiliated with or endorsed by Space Cowboys, Asmodee or Marvel. You need the physical game to play.',
    ],
  },
}

export type Messages = typeof en

import type { Phase, Row } from '../../engine/index.ts'
import type { Messages } from './en.ts'
import { pluralizer } from './plural.ts'

const p = pluralizer('de')
const points = (n: number) => p(n, { one: '# Punkt', other: '# Punkte' })
/** Section colour, by case: „grüner Abschnitt“, „im grünen Abschnitt“. */
const COLOUR: Record<Phase, { nom: string; dat: string }> = {
  1: { nom: 'grüner', dat: 'grünen' },
  2: { nom: 'gelber', dat: 'gelben' },
  3: { nom: 'roter', dat: 'roten' },
}
const ROW: Record<Row, string> = { A: 'OBEREN', B: 'MITTLEREN', C: 'UNTEREN' }

/** German (#54): informal „du“; the stones' German MCU names. */
export const de: Messages = {
  common: {
    thanos: 'Thanos',
    close: 'Schließen',
    closeTitle: (title) => `${title} schließen`,
    dismiss: 'Ausblenden',
    back: 'Zurück',
    rule: (title) => `Regel: ${title}`,
    keepPlaying: 'WEITERSPIELEN',
    level: (level) => `S${level}`,
    points: (n) => p(n, { one: '# Pkt.', other: '# Pkt.' }),
    tags: (n) => p(n, { one: '# Avengers-Symbol', other: '# Avengers-Symbole' }),
    time: 'Zeit',
    list: (items) => items.join(', '),
  },
  stone: {
    power: 'Macht',
    mind: 'Gedanken',
    space: 'Raum',
    reality: 'Realität',
    soul: 'Seele',
  },
  language: {
    title: 'SPRACHE',
    label: 'Sprache',
    change: (name) => `Sprache: ${name}`,
  },

  hud: {
    thanos: 'THANOS',
    you: 'DU',
    points: (n, goal) => `${n} / ${goal} PKT.`,
    round: (n) => `RUNDE ${n}`,
    left: (n) => `NOCH ${n}`,
    lastRound: 'LETZTE RUNDE',
    gameOver: 'SPIELENDE',
    summary: (s) =>
      `Runde ${s.round} von ${s.limit}. Thanos: ${points(s.thanos.points)}, ${s.thanos.colours} Farben${s.thanos.time ? ' und Zeit' : ''}. ` +
      `Du: ${points(s.you.points)}, ${s.you.colours} Farben${s.you.time ? ' und Zeit' : ''}.`,
  },
  dock: {
    nav: 'Spielmenü',
    undo: 'Rückgängig',
    hoard: (n) => `Beute · ${n}`,
    log: 'Protokoll',
    menu: 'Menü',
  },
  cards: {
    flip: 'Thanos’ Karte aufdecken',
    tapToReveal: 'AUFDECKEN!',
    mini: (id, phase) => `Automa-Karte ${id}, Abschnitt für Phase ${phase}`,
    market: (slot, empty) => `Markt, Feld ${slot}${empty ? ' (leer)' : ''}`,
    pile: (n, stone) => `${n}× ${stone}`,
    piles: (summary) => `Thanos’ Chips: ${summary}`,
    pilesNone: 'keine',
    remove: (stone) => `Einen ${stone}-Chip entfernen`,
    add: (stone) => `Einen ${stone}-Chip hinzufügen`,
    noTokens: 'Noch keine Chips',
    returnOrder: 'Rückgabe-Reihenfolge, älteste zuerst',
    returnedFirst: 'Gehen zuerst zurück →',
  },

  home: {
    tagline:
      'Spiele Splendor Marvel solo. Auf deinem Tisch liegt das Spiel – die App steuert Thanos: sein Deck, seine Chips, sein Rennen zum Handschuh.',
    steps: [
      'Baue ein Spiel für 2 auf',
      'Decke jede Runde seine Karte auf',
      'Schlag ihn im Rennen zum Handschuh',
    ],
    corruptSave: 'Dein gespeichertes Spiel war nicht lesbar und wurde gelöscht.',
    lastGame: 'Letztes Spiel:',
    lastGameRound: (round) => `in Runde ${round}.`,
    continue: (round) => `WEITER · RUNDE ${round}`,
    newGame: 'NEUES SPIEL',
    firstGame: 'DEIN ERSTES SPIEL',
    endGame: 'Dieses Spiel beenden',
  },
  setup: {
    title: 'NEUES SPIEL',
    tableCaption: '1 · TISCH AUFBAUEN',
    table: [
      '4 Karten je Stufe auslegen, Stufe 1 unten',
      '4 Chips je Farbe, 2 grüne und alle 5 grauen behalten',
      '2 zufällige Orte + Avengers- und Handschuh-Plättchen',
      'Platz für Thanos’ Farbstapel lassen',
    ],
    difficulty: '2 · SCHWIERIGKEIT',
    length: 'Spiellänge',
    lengthOptions: {
      standard: { label: '30 RUNDEN', hint: 'wie gedruckt' },
      shorter: { label: '27', hint: 'schwerer' },
      shortest: { label: '24', hint: 'am schwersten' },
    },
    lengthTip: {
      title: 'Spiellänge',
      body: 'Eine Community-Variante von BGG: 10/9/8 (27 Runden) war „immer noch zu leicht“, 8/8/8 (24) „ziemlich schwer“.',
    },
    cap: 'Chip-Limit für Thanos',
    capOptions: {
      none: { label: 'KEIN LIMIT', hint: 'wie gedruckt' },
      twelve: { label: '12 CHIPS', hint: 'Community-Variante' },
    },
    capTip: {
      title: 'Chip-Limit',
      body: 'Ein Vorschlag aus der Community: höchstens 12 Chips; die ältesten über dem Limit gehen in den Vorrat zurück.',
    },
    rulingsRow: 'Auslegungen für Lücken im Automa',
    customised: 'angepasst',
    defaults: 'Standard ✓',
    start: 'SPIEL STARTEN',
  },
  rulings: {
    title: 'AUSLEGUNGEN',
    intro:
      'Das Automa-PDF lässt ein paar Lücken. Die Standards folgen den Klarstellungen auf BGG – ändere sie, wenn ihr am Tisch anders spielt.',
    counted: 'Welche Karten von Thanos zählen',
    countedOptions: {
      all: { label: 'ALLE', hint: 'Klarstellung von Shamus' },
      scoringOnly: { label: 'PUNKTE / AVENGERS', hint: 'wie gedruckt' },
    },
    countedTip: {
      title: 'Welche Karten zählen',
      body: 'Das PDF legt seine Karten ohne Punkte oder Avengers-Symbole beiseite, was seine eigene Farbregel bricht. Shamus hat auf BGG klargestellt (2021): Jede Karte in einer Farbe, die er braucht, bleibt – praktisch zählt also jede Farbe.',
    },
    card12: 'Karte 12 · Rückgabe in Phase 3',
    card12Options: {
      zero: { label: '0', hint: 'keine Zahl' },
      three: { label: '3', hint: 'wie die anderen' },
    },
    card12Tip: {
      title: 'Karte 12',
      body: 'Ihr Abschnitt für Phase 3 („C1“) hat keine Zahl. Die Originalkarte aus dem Grundspiel ist genauso, also wohl Absicht.',
    },
    emptySlot: 'Zielfeld ist leer',
    emptySlotOptions: {
      firstInRow: { label: 'ERSTE DER REIHE', hint: 'von links nach rechts' },
      nothing: { label: 'NIMMT NICHTS', hint: '' },
    },
    emptySlotTip: {
      title: 'Leeres Feld',
      body: 'Weder das PDF noch BGG regeln das. „Erste der Reihe“ passt zur Suche von links nach rechts aus der Farbregel.',
    },
    ties: 'Beide vollenden den Handschuh',
    tiesOptions: {
      tiebreakers: { label: 'TIEBREAKER', hint: 'dann Thanos' },
      thanosWins: { label: 'THANOS GEWINNT', hint: '' },
    },
    tiesTip: {
      title: 'Gleichstand',
      body: 'Laut PDF gelten die normalen Siegbedingungen, und Thanos gewinnt bei Gleichstand: zuerst die offiziellen Tiebreaker (Punkte, Avengers-Plättchen, weniger Karten), dann Thanos.',
    },
    save: 'SPEICHERN',
  },

  reveal: {
    label: 'Thanos ist am Zug',
    caption: (phase) => `PHASE ${phase} · ${COLOUR[phase].nom.toUpperCase()} ABSCHNITT`,
    headline: 'THANOS IST AM ZUG',
    hint: 'Er beginnt immer – dann bist du dran.',
    tipTitle: 'Thanos’ Zug',
    tip: (phase) =>
      `Jede Runde deckt Thanos die nächste Automa-Karte auf und führt die Aktion im ${COLOUR[phase].dat} Abschnitt aus. Dann spielst du deinen Zug am Tisch wie gewohnt.`,
    cta: 'SEINE KARTE AUFDECKEN',
  },
  phaseChange: {
    label: 'Phasenwechsel',
    title: 'DECK GEMISCHT!',
    begins: (phase) => `PHASE ${phase} BEGINNT`,
    hint: (from, to, phase) =>
      `Runden ${from}–${to}: Thanos liest jetzt den ${COLOUR[phase].dat} Abschnitt jeder Automa-Karte. Jede Karte kommt einmal pro Phase dran.`,
  },
  take: {
    label: 'Thanos nimmt Chips',
    caption: 'THANOS NIMMT CHIPS',
    tag: (card, phase) => `KARTE ${card} · PHASE ${phase}`,
    speech: (stones) => `${stones.join('. ')}. MEINS.`,
    plain: 'In gedruckter Reihenfolge auf seine Stapel. Er hat kein 10-Chip-Limit.',
    question: 'STAPEL IM VORRAT LEER? TIPPE DEN CHIP AN',
    tipTitle: 'Chips nehmen',
    tip: 'Die Zahlen sind die Chip-Tafel: 1 Macht, 2 Gedanken, 3 Raum, 4 Realität, 5 Seele. Er nimmt sie in gedruckter Reihenfolge und überspringt jede Farbe, deren Stapel leer ist.',
    group: 'Chips, die er nimmt',
    takeIt: 'NEHMEN',
    pileEmpty: 'STAPEL LEER',
    cta: (n) => (n ? `FERTIG · +${n} IN SEINE BEUTE` : 'FERTIG · NICHTS ZU NEHMEN'),
  },
  recruit: {
    label: 'Thanos wirbt an',
    caption: 'THANOS WIRBT AN',
    tag: (card, star, n) => `KARTE ${card}${star ? ' ★' : ''} · GIBT ${n} ZURÜCK`,
    speech: (column, row) => `DIE ${column}. KARTE DER ${ROW[row]} REIHE GEHÖRT MIR.`,
    speechEmpty: (slot) => `${slot} IST LEER? DANN DIE ERSTE KARTE DIESER REIHE.`,
    plain: (level, column) =>
      `Stufe ${level}, ${column}. Feld von links. Hat er die Farbe schon, nimmt er die erste Karte dieser Reihe in einer Farbe, die ihm fehlt.`,
    plainEmpty: 'Deine Auslegung: erste Karte der Reihe, von links. Die Farbregel gilt weiter.',
    returns: 'ER GIBT ZURÜCK',
    returnsNothing: 'GIBT NICHTS ZURÜCK',
    takesNothingSub: 'er nimmt nichts',
    oldestFirst: 'älteste zuerst',
    onlyOf: (have, n) => `älteste zuerst · nur ${have} von ${n}`,
    nonePrinted: 'keine Zahl gedruckt',
    pilesEmpty: 'seine Stapel sind leer',
    supply: 'VORRAT',
    returningTipTitle: 'Chips zurückgeben',
    returningTip:
      'Chips gehen von unten aus seinen Stapeln zurück, die ältesten zuerst. Er nimmt die Karte auch, wenn er nicht alle oder gar keine zurückgeben kann.',
    alreadyHas: (stone) => `${stone.toUpperCase()} HAT ER SCHON!`,
    scanRow: (row) =>
      `Suche Reihe ${row} von links ab: Er nimmt die erste Karte in einer Farbe, die ihm fehlt.`,
    insteadLabel: 'Farbe der Karte, die Thanos stattdessen nimmt',
    noSuchCard: (target) =>
      `Keine solche Karte in der Reihe – er nimmt trotzdem ${target ?? 'diese Karte'}`,
    nothingNotice: 'Thanos nimmt in diesem Zug nichts und gibt keine Chips zurück.',
    question: 'WELCHER STEIN IST DARAUF?',
    questionEmpty: (row) => `WELCHER STEIN IST AUF DER ERSTEN KARTE VON REIHE ${row}?`,
    substitutionTipTitle: 'Farbersatz',
    substitutionTip: (allCount) =>
      `Hat er schon eine Karte dieser Farbe, nimmt er die erste Karte derselben Reihe (von links nach rechts) in einer Farbe, die ihm fehlt – gibt es keine, die ursprüngliche Karte. ${allCount ? 'Alle seine Karten zählen (Klarstellung von Shamus).' : 'Nur seine Karten mit Punkten oder Avengers-Symbolen zählen.'}`,
    colourLabel: (slot) => `Farbe der Karte in ${slot}`,
    colourLabelEmpty: (row) => `Farbe der ersten Karte in Reihe ${row}`,
    rowEmpty: (row) => `Auch Reihe ${row} ist leer – er nimmt nichts und gibt nichts zurück`,
    slotEmpty: (slot) => `Feld ${slot} ist leer`,
    emptySlotTipTitle: 'Leeres Feld',
    emptySlotTip: (firstInRow) =>
      `Das PDF regelt das nicht, darum ist es eine Auslegung: ${firstInRow ? 'Er nimmt stattdessen die erste Karte dieser Reihe von links.' : 'Er nimmt nichts und gibt keine Chips zurück.'}`,
    points: 'Punkte',
    avengers: 'Avengers',
    cta: 'ER NIMMT SIE',
    ctaNothing: 'BESTÄTIGEN · ER NIMMT NICHTS',
  },
  table: {
    label: 'Dein Zug',
    caption: 'AM TISCH',
    yourMove: 'DEIN ZUG',
    recruited: 'ANGEWORBEN',
    recruitedSub: 'Karte eintragen',
    location: 'ORT GENOMMEN',
    locationSub: '+3 Punkte',
    locationTaken: 'ORT EINGETRAGEN',
    locationTakenSub: '+3 · einer pro Zug',
    logged: (items) => `Eingetragen: ${items.join(' · ')}`,
    locationLogged: 'Ort +3',
    tileToYou: 'Du hast mehr Avengers-Symbole – das Avengers-Plättchen geht an dich (+3).',
    after:
      'Chips genommen oder reserviert? Nichts einzutragen. Danach prüft die App bei beiden den Handschuh.',
    tipTitle: 'Rundenende',
    ties: (thanosWins) =>
      thanosWins
        ? 'Vollenden beide den Handschuh in derselben Runde, gewinnt Thanos (deine Auslegung).'
        : 'Vollenden beide den Handschuh: mehr Punkte gewinnen, dann das Avengers-Plättchen, dann weniger Karten – jeden restlichen Gleichstand gewinnt Thanos.',
    cta: (round) => `RUNDE ${round} BEENDEN`,
  },
  over: {
    label: 'Spielende',
    tiebreaker: 'TIEBREAKER',
    thanos: 'THANOS',
    you: 'DU',
    pts: (n) => `${n} PKT.`,
    meta: (colours, time, tile) =>
      `${colours} von 5 Farben${time ? ' + Zeit' : ''}${tile ? ' · Avengers-Plättchen' : ''}`,
    newGame: 'NEUES SPIEL',
    undo: 'LETZTEN SCHRITT ZURÜCK',
    home: 'Zum Start',
  },
  result: {
    win: 'DU GEWINNST!',
    snap: 'SCHNIPP.',
    thanosWins: 'THANOS GEWINNT',
    titleWin: 'Du gewinnst!',
    titleThanos: 'Thanos gewinnt',
    gauntlet: (you, round) =>
      `${you ? 'Du hast' : 'Thanos hat'} den Infinity-Handschuh in Runde ${round} vollendet.`,
    morePoints: (you, round) =>
      `Ihr habt beide den Handschuh in Runde ${round} vollendet. ${you ? 'Du hattest' : 'Thanos hatte'} mehr Punkte.`,
    avengersTile: (you) =>
      `Beide haben den Handschuh mit gleich vielen Punkten vollendet. ${you ? 'Du hast' : 'Thanos hat'} das Avengers-Plättchen.`,
    fewerCards: (you) =>
      `Beide haben den Handschuh mit gleich vielen Punkten vollendet, das Plättchen hat nicht entschieden. ${you ? 'Du hast' : 'Thanos hat'} weniger Karten.`,
    thanosWinsTies: (round) =>
      `Beide haben den Handschuh in Runde ${round} vollendet, und Thanos gewinnt bei Gleichstand.`,
    roundLimit: (round) => `Runde ${round} endete ohne deinen Infinity-Handschuh.`,
  },
  checklist: {
    put: (stones) => `Auf seine Stapel: ${stones}`,
    tookNone: 'Diesmal hat er keine Chips genommen',
    skipped: (stones) => `Stapel leer: ${stones} – übersprungen`,
    cap: 'Chip-Limit: in den Vorrat zurück',
    nothing: 'Thanos hat in diesem Zug nichts genommen',
    returnTo: 'In den Vorrat zurück',
    refillSlot: (slot, level) => `Feld ${slot} aus dem Stapel für Stufe ${level} auffüllen`,
    refillMarket: (level) => `Markt aus dem Stapel für Stufe ${level} auffüllen`,
    time: 'Gib Thanos einen grünen Zeit-Chip',
    tile: 'Gib Thanos das Avengers-Plättchen',
  },
  log: {
    took: (stones) => `Thanos nahm ${stones}`,
    tookNothing: 'Thanos nahm nichts',
    empty: (stones) => `leer: ${stones}`,
    capReturned: (stones) => `Limit gab ${stones} zurück`,
    gainNothing: (slot) => `Thanos nahm nichts (${slot} leer)`,
    gain: (card, slot, how) =>
      `Thanos nahm ${card} für ${slot}${how === 'substituted' ? ' stattdessen (Farbersatz)' : how === 'slotEmpty' ? ' (Feld leer)' : ''}`,
    returned: (stones) => `gab ${stones} zurück`,
    timeToken: 'Zeit-Chip',
    tileMiddle: 'Avengers-Plättchen zurück in der Mitte',
    tileTo: (who, manual) =>
      `Avengers-Plättchen → ${who === 'thanos' ? 'Thanos' : 'du'}${manual ? ' (manuell)' : ''}`,
    youRecruited: (card) => `Du hast ${card} angeworben`,
    youLocation: 'Du hast einen Ort genommen (+3)',
    stackFix: (added, stone) =>
      `Stapel korrigiert: ${stone}-Chip ${added ? 'hinzugefügt' : 'entfernt'}`,
    cardFix: (added, yours, card) =>
      `Karte korrigiert: ${yours ? 'deine' : 'Thanos’'} ${card} ${added ? 'hinzugefügt' : 'entfernt'}`,
    phase: (phase) => `Phase ${phase} beginnt: Deck gemischt`,
  },

  hoard: {
    title: 'THANOS’ BEUTE',
    tokens: (n) => `CHIPS · ${n}`,
    fix: 'KORRIGIEREN',
    done: 'FERTIG',
    cards: (n) => `KARTEN · ${n}`,
    noCards: 'Noch keine Karten.',
    removeCard: (card) => `${card} entfernen`,
    tile: '„Avengers Assemble“-Plättchen',
    tileOptions: { none: 'MITTE', thanos: 'THANOS', player: 'DU' },
    noteFix:
      'Korrigiere nur, wenn Tisch und App nicht übereinstimmen – für die letzten Schritte ist Rückgängig einfacher.',
    note: 'Halte seine Chips nach Farben gestapelt auf dem Tisch – die App merkt sich, welche zuerst zurückgehen.',
  },
  logSheet: {
    title: 'SPIELPROTOKOLL',
    empty: 'Noch nichts – decke Thanos’ erste Karte auf.',
    round: (r) => `Runde ${r}`,
    roundTitle: (r, now) => `RUNDE ${r}${now ? ' · JETZT' : ''}`,
  },
  menu: {
    title: 'MENÜ',
    home: 'ZUM START · GESPEICHERT',
    end: 'DIESES SPIEL BEENDEN',
    rules: 'REGELN',
    settings: 'EINSTELLUNGEN',
    wake: 'Bildschirm anlassen',
    wakeSub: 'während des Spiels, damit das Handy nicht sperrt',
    rulingsTitle: 'AUSLEGUNGEN DIESES SPIELS',
    rulingLength: (lengths, cap) =>
      `${lengths.join(' / ')} Runden je Phase${cap ? ` · Chip-Limit ${cap}` : ''}`,
    rulingCounted: (all) =>
      `Zählende Karten von Thanos: ${all ? 'alle (Klarstellung von Shamus)' : 'nur mit Punkten oder Avengers'}`,
    rulingCard12: (n) => `Karte 12, Rückgabe in Phase 3: ${n}`,
    rulingEmpty: (firstInRow) =>
      `Leeres Feld: ${firstInRow ? 'erste Karte der Reihe' : 'er nimmt nichts'}`,
    rulingTies: (thanosWins) =>
      `Beide vollenden den Handschuh: ${thanosWins ? 'Thanos gewinnt' : 'Tiebreaker, dann Thanos'}`,
  },
  rules: [
    {
      title: 'Thanos’ Zug',
      text: 'Thanos beginnt jede Runde: Decke die nächste Automa-Karte auf und führe die Aktion im Abschnitt der aktuellen Phase aus (grün in den Runden 1–10, gelb in 11–20, rot in 21–30). Zwischen den Phasen wird das Deck gemischt.',
    },
    {
      title: 'Chips nehmen',
      text: 'Er nimmt die gezeigten Chips in gedruckter Reihenfolge (1 Macht, 2 Gedanken, 3 Raum, 4 Realität, 5 Seele) auf seine Stapel. Farben mit leerem Stapel werden übersprungen. Er hat kein 10-Chip-Limit.',
    },
    {
      title: 'Anwerben & Farbersatz',
      text: 'Er nimmt die Karte im genannten Feld (Reihe A = Stufe 3 oben, C = Stufe 1 unten; Spalten von links). Hat er diese Farbe schon, nimmt er die erste Karte der Reihe in einer Farbe, die ihm fehlt; gibt es keine, die ursprüngliche.',
    },
    {
      title: 'Chips zurückgeben (älteste zuerst)',
      text: 'Wenn er anwirbt, gibt er die gedruckte Zahl an Chips zurück, die ältesten zuerst. Er nimmt die Karte auch, wenn er nicht alle oder gar keine zurückgeben kann.',
    },
    {
      title: 'Avengers-Plättchen & Orte',
      text: 'Wer zuerst 3+ Avengers-Symbole hat, nimmt das „Avengers Assemble“-Plättchen (+3); abnehmen kann es nur, wer mehr Symbole hat. Thanos nimmt nie Orte.',
    },
    {
      title: 'Sieg & Tiebreaker',
      text: 'Am Ende einer Runde vollenden 16+ Punkte, ein Bonus jeder Farbe und der grüne Zeit-Chip den Handschuh. Gleichstand: mehr Punkte, dann das Avengers-Plättchen, dann weniger Karten; dann Thanos. Hast du nach der letzten Runde keinen Handschuh, verlierst du.',
    },
  ],
  logCard: {
    title: 'KARTE EINTRAGEN',
    level: 'Stufe',
    colour: 'BONUSFARBE',
    colourLabel: 'Bonusfarbe',
    points: 'Punkte',
    avengers: 'Avengers',
    note: 'Karten der Stufe 3 geben dir auch den grünen Zeit-Chip.',
    add: 'KARTE HINZUFÜGEN',
  },

  dialogs: {
    endTitle: 'DIESES SPIEL BEENDEN?',
    endBody: (round) =>
      `Du bist in Runde ${round}. Beenden löscht das gespeicherte Spiel – Rückgängig holt es nicht zurück.`,
    end: 'BEENDEN',
    abandonTitle: 'DIESES SPIEL ABBRECHEN?',
    abandonBody: (round) =>
      `Du bist in Runde ${round}. Ein Neustart löscht es – Rückgängig holt es nicht zurück.`,
    startOver: 'NEU ANFANGEN',
  },
  toasts: {
    undone: 'Rückgängig gemacht – ein Schritt zurück.',
    undoMore: 'NOCH EINEN',
    ended: 'Spiel beendet.',
    update: 'Eine neue Version ist da. Dein Spiel ist gespeichert.',
    reload: 'NEU LADEN',
    offline: 'Du bist offline – alles funktioniert weiter.',
  },
  pwa: {
    cardLabel: 'Thanos Automa installieren',
    cardTitle: 'THANOS AUTOMA INSTALLIEREN',
    cardSub: 'Vollbild, offline, Bildschirm bleibt an.',
    install: 'INSTALLIEREN',
    sheetTitle: 'APP INSTALLIEREN',
    benefits: ['Funktioniert offline', 'Vollbild', 'Bildschirm bleibt an'],
    steps: [
      'Tippe in Safari auf „Teilen“',
      'Wähle „Zum Home-Bildschirm“',
      'Öffne Thanos Automa auf dem Home-Bildschirm',
    ],
    gotIt: 'VERSTANDEN',
    splashSub: 'Splendor Marvel · Solo-Begleiter',
  },
  credits: {
    label: 'Credits und Urheberrecht',
    title: 'Credits',
    game: {
      name: 'Splendor Marvel',
      text: 'Spiel von Marc André, erschienen bei Space Cowboys (2020).',
    },
    automa: { name: 'Solo-Automa', before: 'entworfen von', after: 'auf BoardGameGeek.' },
    retheme: { name: 'Marvel-Fassung des Automa', before: 'von', after: 'auf BoardGameGeek.' },
    copyrightTitle: 'Urheberrecht & Marken',
    notices: [
      'Splendor und das Splendor-Logo sind Marken von Space Cowboys (Asmodee). Spielregeln und Schachtelgrafik © 2020 Space Cowboys.',
      'MARVEL, das MARVEL-Logo und alle zugehörigen Figuren und Namen sind ™ & © MARVEL.',
      'Die Logos und die Rückseite der Automa-Karten (Schachtelgrafik © Space Cowboys und © MARVEL, Kartendesign von Shamus) werden nur privat und nicht kommerziell genutzt.',
      'Inoffizielles Fan-Tool, weder verbunden mit noch unterstützt von Space Cowboys, Asmodee oder Marvel. Zum Spielen brauchst du das echte Spiel.',
    ],
  },
}

import type { Phase, Row } from '../../engine/index.ts'
import type { Messages } from './en.ts'
import { pluralizer } from './plural.ts'

const p = pluralizer('sr-Latn')
const points = (n: number) =>
  p(n, { one: '# poen', few: '# poena', many: '# poena', other: '# poena' })
/** Section colour, by case: „zeleni odeljak“, „iz zelenog odeljka“. */
const COLOUR: Record<Phase, { nom: string; gen: string }> = {
  1: { nom: 'zeleni', gen: 'zelenog' },
  2: { nom: 'žuti', gen: 'žutog' },
  3: { nom: 'crveni', gen: 'crvenog' },
}
const ROW: Record<Row, string> = { A: 'GORNJEG', B: 'SREDNJEG', C: 'DONJEG' }

/** Serbian in Latin script (#54): formal „Vi“; „automa“ declines as a feminine noun. */
export const sr: Messages = {
  common: {
    thanos: 'Tanos',
    close: 'Zatvori',
    closeTitle: (title) => `Zatvori: ${title}`,
    dismiss: 'Odbaci',
    back: 'Nazad',
    rule: (title) => `Pravilo: ${title}`,
    keepPlaying: 'NASTAVI IGRU',
    level: (level) => `N${level}`,
    points,
    tags: (n) =>
      p(n, {
        one: '# simbol Osvetnika',
        few: '# simbola Osvetnika',
        many: '# simbola Osvetnika',
        other: '# simbola Osvetnika',
      }),
    time: 'Vreme',
    list: (items) => items.join(', '),
  },
  stone: {
    power: 'Moć',
    mind: 'Um',
    space: 'Prostor',
    reality: 'Stvarnost',
    soul: 'Duša',
  },
  language: {
    title: 'JEZIK',
    label: 'Jezik',
    change: (name) => `Jezik: ${name}`,
  },

  hud: {
    thanos: 'TANOS',
    you: 'VI',
    points: (n, goal) => `${n}/${goal} POENA`,
    round: (n) => `RUNDA ${n}`,
    left: (n) => `JOŠ ${n}`,
    lastRound: 'POSLEDNJA RUNDA',
    gameOver: 'KRAJ IGRE',
    summary: (s) =>
      `Runda ${s.round} od ${s.limit}. Tanos: ${points(s.thanos.points)}, boja: ${s.thanos.colours}${s.thanos.time ? ', ima Vreme' : ''}. ` +
      `Vi: ${points(s.you.points)}, boja: ${s.you.colours}${s.you.time ? ', imate Vreme' : ''}.`,
  },
  dock: {
    nav: 'Meni igre',
    undo: 'Poništi',
    hoard: (n) => `Plen · ${n}`,
    log: 'Dnevnik',
    menu: 'Meni',
  },
  cards: {
    flip: 'Otkrij Tanosovu kartu',
    tapToReveal: 'OTKRIJ!',
    mini: (id, phase) => `Karta autome ${id}, odeljak faze ${phase}`,
    market: (slot, empty) => `Tržište, polje ${slot}${empty ? ' (prazno)' : ''}`,
    pile: (n, stone) => `${stone}: ${n}`,
    piles: (summary) => `Tanosovi žetoni: ${summary}`,
    pilesNone: 'nema',
    remove: (stone) => `Ukloni žeton „${stone}“`,
    add: (stone) => `Dodaj žeton „${stone}“`,
    noTokens: 'Još nema žetona',
    returnOrder: 'Redosled vraćanja, najstariji prvo',
    returnedFirst: 'Prvi se vraćaju →',
  },

  home: {
    tagline:
      'Igrajte Splendor Marvel sami. Igra je na vašem stolu – aplikacija vodi Tanosa: njegov špil, njegove žetone i njegovu trku do Rukavice.',
    steps: [
      'Postavite igru za dvoje',
      'Svake runde otkrijte njegovu kartu',
      'Pobedite ga u trci do Rukavice',
    ],
    corruptSave: 'Sačuvanu igru nije bilo moguće pročitati, pa je obrisana.',
    lastGame: 'Poslednja igra:',
    lastGameRound: (round) => `u rundi ${round}.`,
    continue: (round) => `NASTAVI · RUNDA ${round}`,
    newGame: 'NOVA IGRA',
    firstGame: 'ZAPOČNITE PRVU IGRU',
    endGame: 'Završi ovu igru',
  },
  setup: {
    title: 'NOVA IGRA',
    tableCaption: '1 · POSTAVITE STO',
    table: [
      'Podelite po 4 karte svakog nivoa, nivo 1 dole',
      'Zadržite po 4 žetona svake boje, 2 zelena i svih 5 sivih',
      '2 nasumične lokacije + pločice Osvetnika i Rukavice',
      'Ostavite mesta za Tanosove gomile po bojama',
    ],
    difficulty: '2 · TEŽINA',
    length: 'Dužina igre',
    lengthOptions: {
      standard: { label: '30 RUNDI', hint: 'kao u PDF-u' },
      shorter: { label: '27', hint: 'teže' },
      shortest: { label: '24', hint: 'najteže' },
    },
    lengthTip: {
      title: 'Dužina igre',
      body: 'Varijanta zajednice sa BGG-a: 10/9/8 (27 rundi) bilo je „i dalje prelako“, a 8/8/8 (24) „prilično teško“.',
    },
    cap: 'Tanosov limit žetona',
    capOptions: {
      none: { label: 'BEZ LIMITA', hint: 'kao u PDF-u' },
      twelve: { label: '12 ŽETONA', hint: 'varijanta zajednice' },
    },
    capTip: {
      title: 'Limit žetona',
      body: 'Predlog zajednice: najviše 12 žetona; najstariji preko limita vraćaju se u zalihu.',
    },
    rulingsRow: 'Odluke za praznine u automi',
    customised: 'izmenjeno',
    defaults: 'podrazumevano ✓',
    start: 'ZAPOČNI IGRU',
  },
  rulings: {
    title: 'ODLUKE',
    intro:
      'PDF autome ostavlja nekoliko praznina. Podrazumevane vrednosti prate pojašnjenja sa BGG-a – promenite ih ako se za vašim stolom igra drugačije.',
    counted: 'Koje Tanosove karte se računaju',
    countedOptions: {
      all: { label: 'SVE', hint: 'Shamusovo pojašnjenje' },
      scoringOnly: { label: 'POENI / OSVETNICI', hint: 'kao u PDF-u' },
    },
    countedTip: {
      title: 'Koje karte se računaju',
      body: 'PDF sklanja njegove karte bez poena ili simbola Osvetnika, što krši njegovo sopstveno pravilo boja. Shamus je pojasnio na BGG-u (2021): zadržite svaku kartu u boji koja mu treba – praktično se računa svaka boja.',
    },
    card12: 'Karta 12 · vraćanje u fazi 3',
    card12Options: {
      zero: { label: '0', hint: 'nema broja' },
      three: { label: '3', hint: 'kao ostale' },
    },
    card12Tip: {
      title: 'Karta 12',
      body: 'Njen odeljak za fazu 3 („C1“) nema broj. Originalna karta iz osnovne igre je ista, pa je to verovatno namerno.',
    },
    emptySlot: 'Ciljano polje je prazno',
    emptySlotOptions: {
      firstInRow: { label: 'PRVA U REDU', hint: 'sleva nadesno' },
      nothing: { label: 'NE UZIMA NIŠTA', hint: '' },
    },
    emptySlotTip: {
      title: 'Prazno polje',
      body: 'Ni PDF ni BGG to ne pokrivaju. „Prva u redu“ prati pregled sleva nadesno iz pravila boja.',
    },
    ties: 'Oboje kompletiraju Rukavicu',
    tiesOptions: {
      tiebreakers: { label: 'TAJBREJK', hint: 'pa Tanos' },
      thanosWins: { label: 'TANOS POBEĐUJE', hint: '' },
    },
    tiesTip: {
      title: 'Nerešeno',
      body: 'PDF kaže da važe uobičajeni uslovi pobede i da Tanos dobija nerešeno: prvo zvanični tajbrejk (poeni, pločica Osvetnika, manje karata), pa Tanos.',
    },
    save: 'SAČUVAJ ODLUKE',
  },

  reveal: {
    label: 'Tanosov potez',
    caption: (phase) => `FAZA ${phase} · ${COLOUR[phase].nom.toUpperCase()} ODELJAK`,
    headline: 'TANOS POVLAČI POTEZ',
    hint: 'On uvek igra prvi – zatim ste vi na potezu.',
    tipTitle: 'Tanosov potez',
    tip: (phase) =>
      `Svake runde Tanos otkriva sledeću kartu autome i izvodi akciju iz ${COLOUR[phase].gen} odeljka. Zatim igrate svoj potez za stolom kao i obično.`,
    cta: 'OTKRIJ NJEGOVU KARTU',
  },
  phaseChange: {
    label: 'Promena faze',
    title: 'ŠPIL PROMEŠAN!',
    begins: (phase) => `POČINJE FAZA ${phase}`,
    hint: (from, to, phase) =>
      `Runde ${from}–${to}: Tanos sada čita ${COLOUR[phase].nom} odeljak svake karte autome. Svaka karta se koristi jednom po fazi.`,
  },
  take: {
    label: 'Tanos uzima žetone',
    caption: 'TANOS UZIMA ŽETONE',
    tag: (card, phase) => `KARTA ${card} · FAZA ${phase}`,
    speech: (stones) => `${stones.join('. ')}. MOJE.`,
    plain: 'Štampanim redosledom na njegove gomile. Nema limit od 10 žetona.',
    question: 'NEMA ŽETONA U ZALIHI? DODIRNITE GA',
    tipTitle: 'Uzimanje žetona',
    tip: 'Brojevi su tabla žetona: 1 Moć, 2 Um, 3 Prostor, 4 Stvarnost, 5 Duša. Uzima ih štampanim redosledom i preskače boje kojih nema u zalihi.',
    group: 'Žetoni koje uzima',
    takeIt: 'UZIMA',
    pileEmpty: 'NEMA IH',
    cta: (n) => (n ? `GOTOVO · +${n} U NJEGOV PLEN` : 'GOTOVO · NEMA ŠTA DA UZME'),
  },
  recruit: {
    label: 'Tanos uzima kartu',
    caption: 'TANOS UZIMA KARTU',
    tag: (card, star, n) => `KARTA ${card}${star ? ' ★' : ''} · VRAĆA ${n}`,
    speech: (column, row) => `${column}. KARTA ${ROW[row]} REDA JE MOJA.`,
    speechEmpty: (slot) => `${slot} JE PRAZNO? ONDA PRVA KARTA TOG REDA.`,
    plain: (level, column) =>
      `Nivo ${level}, ${column}. polje sleva. Ako već ima tu boju, uzima prvu kartu tog reda u boji koja mu nedostaje.`,
    plainEmpty: 'Vaša odluka: prva karta u redu, sleva. Pravilo boja i dalje važi.',
    returns: 'VRAĆA',
    returnsNothing: 'NE VRAĆA NIŠTA',
    takesNothingSub: 'ne uzima ništa',
    oldestFirst: 'najstariji prvo',
    onlyOf: (have, n) => `najstariji prvo · samo ${have} od ${n}`,
    nonePrinted: 'nema broja',
    pilesEmpty: 'njegove gomile su prazne',
    supply: 'ZALIHA',
    returningTipTitle: 'Vraćanje žetona',
    returningTip:
      'Žetoni se vraćaju sa dna njegovih gomila, najstariji prvo. Kartu uzima i ako ne može da vrati sve žetone, ili nijedan.',
    alreadyHas: (stone) => `${stone.toUpperCase()} VEĆ IMA!`,
    scanRow: (row) => `Pregledajte red ${row} sleva: uzima prvu kartu u boji koja mu nedostaje.`,
    insteadLabel: 'Boja karte koju Tanos uzima umesto toga',
    noSuchCard: (target) => `Takve karte nema u redu – ipak uzima ${target ?? 'tu kartu'}`,
    nothingNotice: 'Tanos ovog poteza ne uzima ništa i ne vraća žetone.',
    question: 'KOJI KAMEN JE NA NJOJ?',
    questionEmpty: (row) => `KOJI KAMEN JE NA PRVOJ KARTI REDA ${row}?`,
    substitutionTipTitle: 'Zamena boje',
    substitutionTip: (allCount) =>
      `Ako već ima kartu te boje, uzima prvu kartu istog reda (sleva nadesno) u boji koja mu nedostaje – ako takve nema, prvobitnu kartu. ${allCount ? 'Računaju se sve njegove karte (Shamusovo pojašnjenje).' : 'Računaju se samo njegove karte sa poenima ili simbolima Osvetnika.'}`,
    colourLabel: (slot) => `Boja karte na polju ${slot}`,
    colourLabelEmpty: (row) => `Boja prve karte u redu ${row}`,
    rowEmpty: (row) => `I red ${row} je prazan – ne uzima ništa i ne vraća ništa`,
    slotEmpty: (slot) => `Polje ${slot} je prazno`,
    emptySlotTipTitle: 'Prazno polje',
    emptySlotTip: (firstInRow) =>
      `PDF to ne pokriva, pa je ovo odluka: ${firstInRow ? 'umesto toga uzima prvu kartu tog reda sleva.' : 'ne uzima ništa i ne vraća žetone.'}`,
    points: 'Poeni',
    avengers: 'Osvetnici',
    cta: 'UZIMA JE',
    ctaNothing: 'POTVRDI · NE UZIMA NIŠTA',
  },
  table: {
    label: 'Vaš potez',
    caption: 'ZA STOLOM',
    yourMove: 'VAŠ POTEZ',
    recruited: 'UZETA KARTA',
    recruitedSub: 'upišite je',
    location: 'UZETA LOKACIJA',
    locationSub: '+3 poena',
    locationTaken: 'LOKACIJA UPISANA',
    locationTakenSub: '+3 · jedna po potezu',
    logged: (items) => `Upisano: ${items.join(' · ')}`,
    locationLogged: 'Lokacija +3',
    tileToYou: 'Imate više simbola Osvetnika – pločica Osvetnika prelazi kod vas (+3).',
    after:
      'Uzeli ste žetone ili rezervisali kartu? Nema šta da se upiše. Zatim aplikacija proverava Rukavicu kod oboje.',
    tipTitle: 'Kraj runde',
    ties: (thanosWins) =>
      thanosWins
        ? 'Ako oboje kompletiraju Rukavicu iste runde, pobeđuje Tanos (vaša odluka).'
        : 'Ako oboje kompletiraju Rukavicu: pobeđuje onaj sa više poena, zatim onaj sa pločicom Osvetnika, zatim onaj sa manje karata – svako preostalo nerešeno dobija Tanos.',
    cta: (round) => `ZAVRŠI RUNDU ${round}`,
  },
  over: {
    label: 'Kraj igre',
    tiebreaker: 'TAJBREJK',
    thanos: 'TANOS',
    you: 'VI',
    pts: (n) => `${n} ${p(n, { one: 'POEN', few: 'POENA', many: 'POENA', other: 'POENA' })}`,
    meta: (colours, time, tile) =>
      `${colours} od 5 boja${time ? ' + Vreme' : ''}${tile ? ' · pločica Osvetnika' : ''}`,
    newGame: 'NOVA IGRA',
    undo: 'PONIŠTI POSLEDNJI KORAK',
    home: 'Na početni ekran',
  },
  result: {
    win: 'POBEDILI STE!',
    snap: 'PUC!',
    thanosWins: 'TANOS JE POBEDIO',
    titleWin: 'Pobedili ste!',
    titleThanos: 'Tanos je pobedio',
    gauntlet: (you, round) =>
      `${you ? 'Kompletirali ste' : 'Tanos je kompletirao'} Rukavicu beskonačnosti u rundi ${round}.`,
    morePoints: (you, round) =>
      `Oboje ste kompletirali Rukavicu u rundi ${round}. ${you ? 'Vi ste imali' : 'Tanos je imao'} više poena.`,
    avengersTile: (you) =>
      `Oboje ste kompletirali Rukavicu sa istim brojem poena. Pločica Osvetnika je ${you ? 'kod vas' : 'kod Tanosa'}.`,
    fewerCards: (you) =>
      `Oboje ste kompletirali Rukavicu sa istim brojem poena, a pločica nije odlučila. ${you ? 'Vi imate' : 'Tanos ima'} manje karata.`,
    thanosWinsTies: (round) =>
      `Oboje ste kompletirali Rukavicu u rundi ${round}, a Tanos dobija nerešeno.`,
    roundLimit: (round) => `Runda ${round} se završila bez vaše Rukavice beskonačnosti.`,
  },
  checklist: {
    put: (stones) => `Na njegove gomile: ${stones}`,
    tookNone: 'Ovog puta nije uzeo žetone',
    skipped: (stones) => `Nema u zalihi: ${stones} – preskočeno`,
    cap: 'Limit žetona: vratite u zalihu',
    nothing: 'Tanos ovog poteza nije uzeo ništa',
    returnTo: 'Vratite u zalihu',
    refillSlot: (slot, level) => `Dopunite polje ${slot} iz špila nivoa ${level}`,
    refillMarket: (level) => `Dopunite tržište iz špila nivoa ${level}`,
    time: 'Dajte Tanosu zeleni žeton Vremena',
    tile: 'Prebacite pločicu Osvetnika kod Tanosa',
  },
  log: {
    took: (stones) => `Tanos je uzeo: ${stones}`,
    tookNothing: 'Tanos nije uzeo ništa',
    empty: (stones) => `nema u zalihi: ${stones}`,
    capReturned: (stones) => `vraćeno zbog limita: ${stones}`,
    gainNothing: (slot) => `Tanos nije uzeo ništa (${slot} prazno)`,
    gain: (card, slot, how) =>
      `Tanos je uzeo (${slot}${how === 'substituted' ? ', zamena boje' : how === 'slotEmpty' ? ', polje prazno' : ''}): ${card}`,
    returned: (stones) => `vratio: ${stones}`,
    timeToken: 'žeton Vremena',
    tileMiddle: 'Pločica Osvetnika vraćena je u sredinu',
    tileTo: (who, manual) =>
      `Pločica Osvetnika → ${who === 'thanos' ? 'Tanos' : 'vi'}${manual ? ' (ručno)' : ''}`,
    youRecruited: (card) => `Uzeli ste: ${card}`,
    youLocation: 'Uzeli ste lokaciju (+3)',
    stackFix: (added, stone) => `Ispravka gomila: ${added ? 'dodat' : 'uklonjen'} žeton „${stone}“`,
    cardFix: (added, yours, card) =>
      `Ispravka karata: ${added ? 'dodata' : 'uklonjena'} ${yours ? 'vaša karta' : 'Tanosova karta'} ${card}`,
    phase: (phase) => `Počinje faza ${phase}: špil promešan`,
  },

  hoard: {
    title: 'TANOSOV PLEN',
    tokens: (n) => `ŽETONI · ${n}`,
    fix: 'ISPRAVI',
    done: 'GOTOVO',
    cards: (n) => `KARTE · ${n}`,
    noCards: 'Još nema karata.',
    removeCard: (card) => `Ukloni ${card}`,
    tile: 'Pločica „Osvetnici, okupite se!“',
    tileOptions: { none: 'SREDINA', thanos: 'TANOS', player: 'VI' },
    noteFix:
      'Ispravljajte samo kada se sto i aplikacija ne slažu – za poslednjih nekoliko koraka lakše je poništiti.',
    note: 'Držite njegove žetone na stolu u gomilama po bojama – aplikacija pamti koji se prvi vraćaju.',
  },
  logSheet: {
    title: 'DNEVNIK IGRE',
    empty: 'Još ništa – otkrijte Tanosovu prvu kartu.',
    round: (r) => `Runda ${r}`,
    roundTitle: (r, now) => `RUNDA ${r}${now ? ' · SADA' : ''}`,
  },
  menu: {
    title: 'MENI',
    home: 'NA POČETNU · IGRA SAČUVANA',
    end: 'ZAVRŠI OVU IGRU',
    rules: 'PRAVILA',
    settings: 'PODEŠAVANJA',
    wake: 'Ekran ostaje uključen',
    wakeSub: 'tokom igre, da se telefon ne zaključa',
    rulingsTitle: 'ODLUKE OVE IGRE',
    rulingLength: (lengths, cap) =>
      `${lengths.join(' / ')} rundi po fazi${cap ? ` · limit žetona ${cap}` : ''}`,
    rulingCounted: (all) =>
      `Tanosove karte koje se računaju: ${all ? 'sve (Shamusovo pojašnjenje)' : 'samo sa poenima ili Osvetnicima'}`,
    rulingCard12: (n) => `Karta 12, vraćanje u fazi 3: ${n}`,
    rulingEmpty: (firstInRow) =>
      `Prazno polje: ${firstInRow ? 'prva karta u redu' : 'ne uzima ništa'}`,
    rulingTies: (thanosWins) =>
      `Oboje kompletiraju Rukavicu: ${thanosWins ? 'Tanos pobeđuje' : 'tajbrejk, pa Tanos'}`,
  },
  rules: [
    {
      title: 'Tanosov potez',
      text: 'Tanos igra prvi svake runde: otkrijte sledeću kartu autome i izvedite akciju iz odeljka trenutne faze (zeleni u rundama 1–10, žuti u 11–20, crveni u 21–30). Između faza špil se meša.',
    },
    {
      title: 'Uzimanje žetona',
      text: 'Uzima prikazane žetone štampanim redosledom (1 Moć, 2 Um, 3 Prostor, 4 Stvarnost, 5 Duša) na svoje gomile. Preskočite boje kojih nema u zalihi. Nema limit od 10 žetona.',
    },
    {
      title: 'Uzimanje karte i zamena boje',
      text: 'Uzima kartu sa navedenog polja (red A = nivo 3 gore, C = nivo 1 dole; kolone se broje sleva). Ako već ima tu boju, uzima prvu kartu reda u boji koja mu nedostaje; ako takve nema, prvobitnu.',
    },
    {
      title: 'Vraćanje žetona (najstariji prvo)',
      text: 'Kada uzme kartu, vraća štampani broj žetona, najstarije prvo. Kartu uzima i ako ne može da vrati sve, ili nijedan.',
    },
    {
      title: 'Pločica Osvetnika i lokacije',
      text: 'Prvi sa 3+ simbola Osvetnika uzima pločicu „Osvetnici, okupite se!“ (+3); oduzeti je može samo onaj sa više simbola. Tanos nikad ne uzima lokacije.',
    },
    {
      title: 'Pobeda i tajbrejk',
      text: 'Na kraju runde Rukavicu kompletiraju 16+ poena, bonus svake boje i zeleni žeton Vremena. Nerešeno: više poena, zatim pločica Osvetnika, zatim manje karata; zatim Tanos. Ako posle poslednje runde nemate Rukavicu, gubite.',
    },
  ],
  logCard: {
    title: 'UPIŠITE KARTU',
    level: 'Nivo',
    colour: 'BOJA BONUSA',
    colourLabel: 'Boja bonusa',
    points: 'Poeni',
    avengers: 'Osvetnici',
    note: 'Karte nivoa 3 vam daju i zeleni žeton Vremena.',
    add: 'DODAJ KARTU',
  },

  dialogs: {
    endTitle: 'ZAVRŠITI OVU IGRU?',
    endBody: (round) =>
      `Igra je u rundi ${round}. Završavanje briše sačuvanu igru – poništavanje je neće vratiti.`,
    end: 'ZAVRŠI',
    abandonTitle: 'NAPUSTITI OVU IGRU?',
    abandonBody: (round) =>
      `Igra je u rundi ${round}. Nova igra je briše – poništavanje je neće vratiti.`,
    startOver: 'POČNI ISPOČETKA',
  },
  toasts: {
    undone: 'Poništeno – korak unazad.',
    undoMore: 'JOŠ',
    ended: 'Igra je završena.',
    update: 'Nova verzija je spremna. Vaša igra je sačuvana.',
    reload: 'OSVEŽI',
    offline: 'Niste na mreži – sve i dalje radi.',
  },
  pwa: {
    cardLabel: 'Instaliraj Thanos Automa',
    cardTitle: 'INSTALIRAJ THANOS AUTOMA',
    cardSub: 'Ceo ekran, bez mreže, ekran ostaje uključen.',
    install: 'INSTALIRAJ',
    sheetTitle: 'INSTALIRAJTE APLIKACIJU',
    benefits: ['Radi bez mreže', 'Ceo ekran', 'Ekran ostaje uključen'],
    steps: [
      'Dodirnite Deli na traci Safarija',
      'Izaberite „Dodaj na početni ekran“',
      'Otvorite Thanos Automa sa početnog ekrana',
    ],
    gotIt: 'RAZUMEM',
    splashSub: 'Splendor Marvel · solo pomoćnik',
  },
  credits: {
    label: 'Zasluge i autorska prava',
    title: 'Zasluge',
    game: {
      name: 'Splendor Marvel',
      text: 'igra Marka Andrea, izdavač Space Cowboys (2020).',
    },
    automa: { name: 'Solo automa', before: 'autor:', after: 'na BoardGameGeek-u.' },
    retheme: { name: 'Marvel verzija autome', before: 'autor:', after: 'na BoardGameGeek-u.' },
    copyrightTitle: 'Autorska prava i žigovi',
    notices: [
      'Splendor i logo Splendor su žigovi kompanije Space Cowboys (Asmodee). Pravila igre i ilustracije kutije © 2020 Space Cowboys.',
      'MARVEL, logo MARVEL i svi povezani likovi i imena su ™ i © MARVEL.',
      'Logotipi i poleđina karata autome (ilustracija kutije © Space Cowboys i © MARVEL, dizajn karte: Shamus) koriste se samo za ličnu, nekomercijalnu upotrebu.',
      'Nezvanični alat koji su napravili fanovi; nije povezan sa kompanijama Space Cowboys, Asmodee i Marvel niti ga one podržavaju. Za igru vam je potrebna fizička igra.',
    ],
  },
}

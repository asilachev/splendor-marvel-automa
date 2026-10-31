import type { Phase, Row } from '../../engine/index.ts'
import type { Messages } from './en.ts'
import { pluralizer } from './plural.ts'

const p = pluralizer('es')
const points = (n: number) => p(n, { one: '# punto', other: '# puntos' })
const COLOUR: Record<Phase, string> = { 1: 'verde', 2: 'amarilla', 3: 'roja' }
const ROW: Record<Row, string> = { A: 'DE ARRIBA', B: 'DEL MEDIO', C: 'DE ABAJO' }

/** Spanish (#54): informal «tú», neutral vocabulary; the stones are «Gemas». */
export const es: Messages = {
  common: {
    thanos: 'Thanos',
    close: 'Cerrar',
    closeTitle: (title) => `Cerrar ${title}`,
    dismiss: 'Descartar',
    back: 'Atrás',
    rule: (title) => `Regla: ${title}`,
    keepPlaying: 'SEGUIR JUGANDO',
    level: (level) => `N${level}`,
    points: (n) => p(n, { one: '# pt', other: '# pts' }),
    tags: (n) => p(n, { one: '# símbolo de Vengadores', other: '# símbolos de Vengadores' }),
    time: 'Tiempo',
    list: (items) => items.join(', '),
  },
  stone: {
    power: 'Poder',
    mind: 'Mente',
    space: 'Espacio',
    reality: 'Realidad',
    soul: 'Alma',
  },
  language: {
    title: 'IDIOMA',
    label: 'Idioma',
    change: (name) => `Idioma: ${name}`,
  },

  hud: {
    thanos: 'THANOS',
    you: 'TÚ',
    points: (n, goal) => `${n} / ${goal} PTS`,
    round: (n) => `RONDA ${n}`,
    left: (n) => `QUEDAN ${n}`,
    lastRound: 'ÚLTIMA RONDA',
    gameOver: 'FIN',
    summary: (s) =>
      `Ronda ${s.round} de ${s.limit}. Thanos: ${points(s.thanos.points)}, ${s.thanos.colours} colores${s.thanos.time ? ' y Tiempo' : ''}. ` +
      `Tú: ${points(s.you.points)}, ${s.you.colours} colores${s.you.time ? ' y Tiempo' : ''}.`,
  },
  dock: {
    nav: 'Menú de la partida',
    undo: 'Deshacer',
    hoard: (n) => `Botín · ${n}`,
    log: 'Registro',
    menu: 'Menú',
  },
  cards: {
    flip: 'Revelar la carta de Thanos',
    tapToReveal: '¡REVÉLALA!',
    mini: (id, phase) => `Carta de automa ${id}, sección de la fase ${phase}`,
    market: (slot, empty) => `Mercado, hueco ${slot}${empty ? ' (vacío)' : ''}`,
    pile: (n, stone) => `${stone}: ${n}`,
    piles: (summary) => `Fichas de Thanos: ${summary}`,
    pilesNone: 'ninguna',
    remove: (stone) => `Quitar una ficha de ${stone}`,
    add: (stone) => `Añadir una ficha de ${stone}`,
    noTokens: 'Aún no tiene fichas',
    returnOrder: 'Orden de devolución: primero las más antiguas',
    returnedFirst: 'Se devuelven primero →',
  },

  home: {
    tagline:
      'Juega a Splendor Marvel en solitario. Tu mesa tiene el juego; esta app mueve a Thanos: su mazo, sus fichas y su carrera hacia el Guantelete.',
    steps: [
      'Prepara una partida para 2',
      'Revela su carta cada ronda',
      'Gánale la carrera al Guantelete',
    ],
    corruptSave: 'No se pudo leer tu partida guardada, así que se ha borrado.',
    lastGame: 'Última partida:',
    lastGameRound: (round) => `en la ronda ${round}.`,
    continue: (round) => `CONTINUAR · RONDA ${round}`,
    newGame: 'NUEVA PARTIDA',
    firstGame: 'EMPIEZA TU PRIMERA PARTIDA',
    endGame: 'Terminar esta partida',
  },
  setup: {
    title: 'NUEVA PARTIDA',
    tableCaption: '1 · PREPARA LA MESA',
    table: [
      'Reparte 4 cartas por nivel, con el nivel 1 abajo',
      'Deja 4 fichas de cada color, 2 verdes y las 5 grises',
      '2 Ubicaciones al azar + losetas de Vengadores y Guantelete',
      'Deja sitio para los montones de Thanos por color',
    ],
    difficulty: '2 · DIFICULTAD',
    length: 'Duración',
    lengthOptions: {
      standard: { label: '30 RONDAS', hint: 'como en el PDF' },
      shorter: { label: '27', hint: 'más difícil' },
      shortest: { label: '24', hint: 'lo más difícil' },
    },
    lengthTip: {
      title: 'Duración',
      body: 'Un ajuste de la comunidad de BGG: 10/9/8 (27 rondas) seguía siendo «demasiado fácil»; 8/8/8 (24), «bastante difícil».',
    },
    cap: 'Límite de fichas de Thanos',
    capOptions: {
      none: { label: 'SIN LÍMITE', hint: 'como en el PDF' },
      twelve: { label: '12 FICHAS', hint: 'ajuste de la comunidad' },
    },
    capTip: {
      title: 'Límite de fichas',
      body: 'Una propuesta de la comunidad: como máximo 12 fichas; las más antiguas por encima del límite vuelven a la reserva.',
    },
    rulingsRow: 'Decisiones para los huecos del automa',
    customised: 'personalizadas',
    defaults: 'por defecto ✓',
    start: 'EMPEZAR PARTIDA',
  },
  rulings: {
    title: 'DECISIONES',
    intro:
      'El PDF del automa deja algunos huecos. Por defecto se siguen las aclaraciones de BGG; cámbialas si en tu mesa se juega de otra forma.',
    counted: 'Qué cartas de Thanos cuentan',
    countedOptions: {
      all: { label: 'TODAS', hint: 'aclaración de Shamus' },
      scoringOnly: { label: 'PUNTOS / VENGADORES', hint: 'como en el PDF' },
    },
    countedTip: {
      title: 'Qué cartas cuentan',
      body: 'El PDF aparta sus cartas sin puntos ni símbolos de Vengadores, lo que rompe su propia regla de color. Shamus aclaró en BGG (2021): conservar cualquier carta de un color que necesite, así que en la práctica cuentan todos los colores.',
    },
    card12: 'Carta 12 · devolución en la fase 3',
    card12Options: {
      zero: { label: '0', hint: 'sin número' },
      three: { label: '3', hint: 'como las demás' },
    },
    card12Tip: {
      title: 'Carta 12',
      body: 'Su sección de la fase 3 («C1») no lleva número. La carta original del juego base es igual, así que probablemente sea intencionado.',
    },
    emptySlot: 'El hueco indicado está vacío',
    emptySlotOptions: {
      firstInRow: { label: 'PRIMERA DE LA FILA', hint: 'de izquierda a derecha' },
      nothing: { label: 'NO TOMA NADA', hint: '' },
    },
    emptySlotTip: {
      title: 'Hueco vacío',
      body: 'Ni el PDF ni BGG lo cubren. «Primera de la fila» sigue el recorrido de izquierda a derecha de la regla de color.',
    },
    ties: 'Ambos completan el Guantelete',
    tiesOptions: {
      tiebreakers: { label: 'DESEMPATES', hint: 'luego Thanos' },
      thanosWins: { label: 'GANA THANOS', hint: '' },
    },
    tiesTip: {
      title: 'Empates',
      body: 'El PDF dice que se apliquen las condiciones normales de victoria y que Thanos gana los empates: primero los desempates oficiales (puntos, loseta de los Vengadores, menos cartas) y después Thanos.',
    },
    save: 'GUARDAR DECISIONES',
  },

  reveal: {
    label: 'Turno de Thanos',
    caption: (phase) => `FASE ${phase} · SECCIÓN ${COLOUR[phase].toUpperCase()}`,
    headline: 'THANOS HACE SU JUGADA',
    hint: 'Él siempre juega primero; luego te toca a ti.',
    tipTitle: 'Turno de Thanos',
    tip: (phase) =>
      `Cada ronda Thanos revela la siguiente carta del automa y hace la acción de la sección ${COLOUR[phase]}. Después juegas tu turno en la mesa como siempre.`,
    cta: 'REVELAR SU CARTA',
  },
  phaseChange: {
    label: 'Cambio de fase',
    title: '¡MAZO BARAJADO!',
    begins: (phase) => `EMPIEZA LA FASE ${phase}`,
    hint: (from, to, phase) =>
      `Rondas ${from}–${to}: ahora Thanos lee la sección ${COLOUR[phase]} de cada carta del automa. Cada carta se usa una vez por fase.`,
  },
  take: {
    label: 'Thanos toma fichas',
    caption: 'THANOS TOMA FICHAS',
    tag: (card, phase) => `CARTA ${card} · FASE ${phase}`,
    speech: (stones) => `${stones.join('. ')}. MÍAS.`,
    plain: 'En el orden impreso, a sus montones. No tiene límite de 10 fichas.',
    question: '¿SE AGOTÓ UN COLOR? TOCA SU FICHA',
    tipTitle: 'Tomar fichas',
    tip: 'Los números son el tablero de fichas: 1 Poder, 2 Mente, 3 Espacio, 4 Realidad, 5 Alma. Las toma en el orden impreso y se salta los colores agotados en la reserva.',
    group: 'Fichas que toma',
    takeIt: 'LA TOMA',
    pileEmpty: 'AGOTADA',
    cta: (n) => (n ? `HECHO · +${n} A SU BOTÍN` : 'HECHO · NO TOMA NADA'),
  },
  recruit: {
    label: 'Thanos recluta',
    caption: 'THANOS RECLUTA',
    tag: (card, star, n) => `CARTA ${card}${star ? ' ★' : ''} · DEVUELVE ${n}`,
    speech: (column, row) => `LA ${column}.ª CARTA DE LA FILA ${ROW[row]} ES MÍA.`,
    speechEmpty: (slot) => `¿${slot} VACÍO? ENTONCES LA PRIMERA CARTA DE ESA FILA.`,
    plain: (level, column) =>
      `Nivel ${level}, hueco ${column} desde la izquierda. Si ya tiene su color, toma la primera carta de esa fila de un color que le falte.`,
    plainEmpty:
      'Tu decisión: la primera carta de la fila, desde la izquierda. La regla de color sigue valiendo.',
    returns: 'DEVUELVE',
    returnsNothing: 'NO DEVUELVE NADA',
    takesNothingSub: 'no toma nada',
    oldestFirst: 'primero las más antiguas',
    onlyOf: (have, n) => `las más antiguas · solo ${have} de ${n}`,
    nonePrinted: 'sin número impreso',
    pilesEmpty: 'sus montones están vacíos',
    supply: 'RESERVA',
    returningTipTitle: 'Devolver fichas',
    returningTip:
      'Las fichas salen de la base de sus montones, primero las más antiguas. Toma la carta aunque no pueda devolverlas todas, o ninguna.',
    alreadyHas: (stone) => `¡YA TIENE ${stone.toUpperCase()}!`,
    scanRow: (row) =>
      `Recorre la fila ${row} desde la izquierda: toma la primera carta de un color que le falte.`,
    insteadLabel: 'Color de la carta que Thanos toma en su lugar',
    noSuchCard: (target) =>
      `No hay tal carta en la fila; toma ${target ?? 'esa carta'} de todos modos`,
    nothingNotice: 'Thanos no toma nada este turno y no devuelve fichas.',
    question: '¿QUÉ GEMA TIENE?',
    questionEmpty: (row) => `¿QUÉ GEMA TIENE LA PRIMERA CARTA DE LA FILA ${row}?`,
    substitutionTipTitle: 'Sustitución de color',
    substitutionTip: (allCount) =>
      `Si ya tiene una carta de ese color, toma la primera carta de la misma fila (de izquierda a derecha) de un color que le falte; si no la hay, la carta original. ${allCount ? 'Cuentan todas sus cartas (aclaración de Shamus).' : 'Solo cuentan sus cartas con puntos o símbolos de Vengadores.'}`,
    colourLabel: (slot) => `Color de la carta de ${slot}`,
    colourLabelEmpty: (row) => `Color de la primera carta de la fila ${row}`,
    rowEmpty: (row) => `La fila ${row} también está vacía: no toma ni devuelve nada`,
    slotEmpty: (slot) => `El hueco ${slot} está vacío`,
    emptySlotTipTitle: 'Hueco vacío',
    emptySlotTip: (firstInRow) =>
      `El PDF no lo cubre, así que es una decisión: ${firstInRow ? 'en su lugar toma la primera carta de esa fila desde la izquierda.' : 'no toma nada ni devuelve fichas.'}`,
    points: 'Puntos',
    avengers: 'Vengadores',
    cta: 'LA TOMA',
    ctaNothing: 'CONFIRMAR · NO TOMA NADA',
  },
  table: {
    label: 'Tu turno',
    caption: 'EN LA MESA',
    yourMove: 'TU JUGADA',
    recruited: 'RECLUTÉ',
    recruitedSub: 'anota la carta',
    location: 'TOMÉ UNA UBICACIÓN',
    locationSub: '+3 puntos',
    locationTaken: 'UBICACIÓN ANOTADA',
    locationTakenSub: '+3 · una por turno',
    logged: (items) => `Anotado: ${items.join(' · ')}`,
    locationLogged: 'Ubicación +3',
    tileToYou: 'Tienes más símbolos de Vengadores: la loseta de los Vengadores pasa a ti (+3).',
    after:
      '¿Tomaste fichas o reservaste? No hay nada que anotar. Luego la app comprueba el Guantelete de los dos.',
    tipTitle: 'Fin de ronda',
    ties: (thanosWins) =>
      thanosWins
        ? 'Si los dos completan el Guantelete en la misma ronda, gana Thanos (tu decisión).'
        : 'Si los dos completan el Guantelete: gana quien tenga más puntos, luego la loseta de los Vengadores, luego menos cartas; cualquier empate restante lo gana Thanos.',
    cta: (round) => `TERMINAR RONDA ${round}`,
  },
  over: {
    label: 'Fin de la partida',
    tiebreaker: 'DESEMPATE',
    thanos: 'THANOS',
    you: 'TÚ',
    pts: (n) => `${n} PTS`,
    meta: (colours, time, tile) =>
      `${colours} de 5 colores${time ? ' + Tiempo' : ''}${tile ? ' · loseta Vengadores' : ''}`,
    newGame: 'NUEVA PARTIDA',
    undo: 'DESHACER EL ÚLTIMO PASO',
    home: 'Volver al inicio',
  },
  result: {
    win: '¡VICTORIA!',
    snap: '¡CHAS!',
    thanosWins: 'GANA THANOS',
    titleWin: '¡Victoria!',
    titleThanos: 'Gana Thanos',
    gauntlet: (you, round) =>
      `${you ? 'Completaste' : 'Thanos completó'} el Guantelete del Infinito en la ronda ${round}.`,
    morePoints: (you, round) =>
      `Los dos completaron el Guantelete en la ronda ${round}. ${you ? 'Tú tenías' : 'Thanos tenía'} más puntos.`,
    avengersTile: (you) =>
      `Los dos completaron el Guantelete con los mismos puntos. ${you ? 'Tú tienes' : 'Thanos tiene'} la loseta de los Vengadores.`,
    fewerCards: (you) =>
      `Los dos completaron el Guantelete con los mismos puntos y la loseta no decidió. ${you ? 'Tú tienes' : 'Thanos tiene'} menos cartas.`,
    thanosWinsTies: (round) =>
      `Los dos completaron el Guantelete en la ronda ${round}, y Thanos gana los empates.`,
    roundLimit: (round) => `La ronda ${round} terminó sin tu Guantelete del Infinito.`,
  },
  checklist: {
    put: (stones) => `A sus montones: ${stones}`,
    tookNone: 'Esta vez no tomó fichas',
    skipped: (stones, n) => `${n === 1 ? 'Agotada' : 'Agotadas'}: ${stones} — se salta`,
    cap: 'Límite de fichas: devuelve a la reserva',
    nothing: 'Thanos no tomó nada este turno',
    returnTo: 'Devuelve a la reserva',
    refillSlot: (slot, level) => `Repón el hueco ${slot} con el mazo de nivel ${level}`,
    refillMarket: (level) => `Repón el mercado con el mazo de nivel ${level}`,
    time: 'Dale a Thanos una ficha verde de Tiempo',
    tile: 'Pasa la loseta de los Vengadores a Thanos',
  },
  log: {
    took: (stones) => `Thanos tomó ${stones}`,
    tookNothing: 'Thanos no tomó nada',
    empty: (stones) => `agotadas: ${stones}`,
    capReturned: (stones) => `el límite devolvió ${stones}`,
    gainNothing: (slot) => `Thanos no tomó nada (${slot} vacío)`,
    gain: (card, slot, how) =>
      `Thanos tomó ${card} por ${slot}${how === 'substituted' ? ' en su lugar (sustitución)' : how === 'slotEmpty' ? ' (hueco vacío)' : ''}`,
    returned: (stones) => `devolvió ${stones}`,
    timeToken: 'ficha de Tiempo',
    tileMiddle: 'La loseta de los Vengadores vuelve al centro',
    tileTo: (who, manual) =>
      `Loseta de los Vengadores → ${who === 'thanos' ? 'Thanos' : 'tú'}${manual ? ' (manual)' : ''}`,
    youRecruited: (card) => `Reclutaste ${card}`,
    youLocation: 'Tomaste una Ubicación (+3)',
    stackFix: (added, stone) =>
      `Corrección de montones: ${added ? 'añadida' : 'quitada'} una ficha de ${stone}`,
    cardFix: (added, yours, card) =>
      `Corrección de cartas: ${added ? 'añadida' : 'quitada'} ${yours ? 'tu carta' : 'la carta de Thanos'} ${card}`,
    phase: (phase) => `Empieza la fase ${phase}: mazo barajado`,
  },

  hoard: {
    title: 'BOTÍN DE THANOS',
    tokens: (n) => `FICHAS · ${n}`,
    fix: 'CORREGIR',
    done: 'HECHO',
    cards: (n) => `CARTAS · ${n}`,
    noCards: 'Aún no tiene cartas.',
    removeCard: (card) => `Quitar ${card}`,
    tile: 'Loseta «¡Vengadores, reuníos!»',
    tileOptions: { none: 'CENTRO', thanos: 'THANOS', player: 'TÚ' },
    noteFix:
      'Corrige solo si la mesa y la app no coinciden; para los últimos pasos es más fácil deshacer.',
    note: 'Ten sus fichas en montones por color en la mesa; la app recuerda cuáles se devuelven primero.',
  },
  logSheet: {
    title: 'REGISTRO',
    empty: 'Aún no hay nada: revela la primera carta de Thanos.',
    round: (r) => `Ronda ${r}`,
    roundTitle: (r, now) => `RONDA ${r}${now ? ' · AHORA' : ''}`,
  },
  menu: {
    title: 'MENÚ',
    home: 'VOLVER AL INICIO · GUARDADA',
    end: 'TERMINAR ESTA PARTIDA',
    rules: 'REGLAS',
    settings: 'AJUSTES',
    wake: 'Pantalla siempre encendida',
    wakeSub: 'durante la partida, para que el móvil no se bloquee',
    rulingsTitle: 'DECISIONES DE ESTA PARTIDA',
    rulingLength: (lengths, cap) =>
      `${lengths.join(' / ')} rondas por fase${cap ? ` · límite de ${cap} fichas` : ''}`,
    rulingCounted: (all) =>
      `Cartas de Thanos que cuentan: ${all ? 'todas (aclaración de Shamus)' : 'solo con puntos o Vengadores'}`,
    rulingCard12: (n) => `Carta 12, devolución en la fase 3: ${n}`,
    rulingEmpty: (firstInRow) =>
      `Hueco vacío: ${firstInRow ? 'primera carta de la fila' : 'no toma nada'}`,
    rulingTies: (thanosWins) =>
      `Ambos completan el Guantelete: ${thanosWins ? 'gana Thanos' : 'desempates, luego Thanos'}`,
  },
  rules: [
    {
      title: 'Turno de Thanos',
      text: 'Thanos juega primero cada ronda: revela la siguiente carta del automa y haz la acción de la sección de la fase actual (verde en las rondas 1–10, amarilla en 11–20, roja en 21–30). El mazo se baraja entre fases.',
    },
    {
      title: 'Tomar fichas',
      text: 'Toma las fichas indicadas, en el orden impreso (1 Poder, 2 Mente, 3 Espacio, 4 Realidad, 5 Alma), a sus montones. Sáltate los colores agotados. No tiene límite de 10 fichas.',
    },
    {
      title: 'Reclutar y sustitución de color',
      text: 'Toma la carta del hueco indicado (fila A = nivel 3 arriba, C = nivel 1 abajo; columnas desde la izquierda). Si ya tiene ese color, toma la primera carta de la fila de un color que le falte; si no la hay, la original.',
    },
    {
      title: 'Devolver fichas (las más antiguas primero)',
      text: 'Al reclutar devuelve el número impreso de fichas, empezando por las más antiguas. Toma la carta aunque no pueda devolverlas todas, o ninguna.',
    },
    {
      title: 'Loseta de los Vengadores y Ubicaciones',
      text: 'El primero con 3 o más símbolos de Vengadores toma la loseta «¡Vengadores, reuníos!» (+3); solo se la quita quien tenga más símbolos. Thanos nunca toma Ubicaciones.',
    },
    {
      title: 'Victoria y desempates',
      text: 'Al final de una ronda, 16 o más puntos, una bonificación de cada color y la ficha verde de Tiempo completan el Guantelete. Empates: más puntos, luego la loseta de los Vengadores, luego menos cartas; después, Thanos. Si tras la última ronda no tienes el Guantelete, pierdes.',
    },
  ],
  logCard: {
    title: 'ANOTA TU CARTA',
    level: 'Nivel',
    colour: 'COLOR DE BONIFICACIÓN',
    colourLabel: 'Color de bonificación',
    points: 'Puntos',
    avengers: 'Vengadores',
    note: 'Las cartas de nivel 3 también te dan la ficha verde de Tiempo.',
    add: 'AÑADIR CARTA',
  },

  dialogs: {
    endTitle: '¿TERMINAR ESTA PARTIDA?',
    endBody: (round) =>
      `Vas por la ronda ${round}. Terminarla borra la partida guardada y Deshacer no la recupera.`,
    end: 'TERMINAR',
    abandonTitle: '¿ABANDONAR ESTA PARTIDA?',
    abandonBody: (round) =>
      `Vas por la ronda ${round}. Empezar de nuevo la borra y Deshacer no la recupera.`,
    startOver: 'EMPEZAR DE NUEVO',
  },
  toasts: {
    undone: 'Deshecho: un paso atrás.',
    undoMore: 'DESHACER MÁS',
    ended: 'Partida terminada.',
    update: 'Hay una versión nueva. Tu partida está guardada.',
    reload: 'RECARGAR',
    offline: 'Sin conexión: todo sigue funcionando.',
  },
  pwa: {
    cardLabel: 'Instalar Thanos Automa',
    cardTitle: 'INSTALA THANOS AUTOMA',
    cardSub: 'Pantalla completa, sin conexión, pantalla encendida.',
    install: 'INSTALAR',
    sheetTitle: 'INSTALA LA APP',
    benefits: ['Funciona sin conexión', 'Pantalla completa', 'Pantalla encendida'],
    steps: [
      'Toca Compartir en la barra de Safari',
      'Elige «Añadir a pantalla de inicio»',
      'Abre Thanos Automa desde tu pantalla de inicio',
    ],
    gotIt: 'ENTENDIDO',
    splashSub: 'Splendor Marvel · compañero en solitario',
  },
  credits: {
    label: 'Créditos y derechos de autor',
    title: 'Créditos',
    game: {
      name: 'Splendor Marvel',
      text: 'juego de Marc André, publicado por Space Cowboys (2020).',
    },
    automa: { name: 'Automa en solitario', before: 'diseñado por', after: 'en BoardGameGeek.' },
    retheme: { name: 'Versión Marvel del automa', before: 'de', after: 'en BoardGameGeek.' },
    copyrightTitle: 'Derechos de autor y marcas',
    notices: [
      'Splendor y el logotipo de Splendor son marcas de Space Cowboys (Asmodee). Reglas del juego e ilustraciones de la caja © 2020 Space Cowboys.',
      'MARVEL, el logotipo de MARVEL y todos los personajes y nombres relacionados son ™ y © MARVEL.',
      'Los logotipos y el reverso de las cartas del automa (ilustración de la caja © Space Cowboys y © MARVEL, diseño de la carta de Shamus) se usan solo de forma personal y no comercial.',
      'Herramienta no oficial hecha por fans, sin relación con Space Cowboys, Asmodee ni Marvel ni avalada por ellos. Necesitas el juego físico para jugar.',
    ],
  },
}

import { WeatherInformationType } from './airport-weather.model';

export type AtisRunwayReading = {
  arrival: string[];
  departure: string[];
  settled: boolean;
};

type Use = 'arrival' | 'departure';

type Cue = Use | 'inUse';

type Token = {
  text: string;
  designator: string | null;
  sided: boolean;
};

type Run = {
  start: number;
  end: number;
  designators: string[];
  excluded: boolean;
  uses: Use[];
};

const RUNWAY_WORDS = new Set(['RWY', 'RWYS', 'RY', 'RUNWAY', 'RUNWAYS']);

const ARRIVAL_WORDS = new Set([
  'ARR',
  'ARRS',
  'ARRIVAL',
  'ARRIVALS',
  'ARRIVING',
  'APCH',
  'APCHS',
  'APP',
  'APPS',
  'APPR',
  'APPROACH',
  'APPROACHES',
  'LDG',
  'LNDG',
  'LAND',
  'LANDING',
  'LANDINGS',
  'ILS',
  'LOC',
  'RNAV',
  'RNP',
  'GLS',
  'VOR',
  'NDB',
  'VISUAL',
  'VIS',
  'VISA',
  'VA',
  'APR',
]);

const DEPARTURE_WORDS = new Set([
  'DEP',
  'DEPS',
  'DEPG',
  'DEPARTURE',
  'DEPARTURES',
  'DEPARTING',
  'DEPART',
  'DEPARTS',
  'DEPTS',
  'TKOF',
  'TAKEOFF',
]);

const IN_USE_WORDS = new Set(['USE', 'ACTIVE']);

const FILLER_WORDS = new Set([
  ...RUNWAY_WORDS,
  'AND',
  'OR',
  'IN',
  'IS',
  'ARE',
  'TO',
  'FOR',
  'OF',
  'ON',
  'THE',
  'EXPECT',
  'EXP',
  'EXPT',
  'XPC',
  'MAIN',
  'PRIMARY',
  'SIMUL',
  'SIMULTANEOUS',
  'PARALLEL',
  'PARL',
  'DEPENDENT',
  'INDEPENDENT',
  'CONVERGING',
  'CNVGING',
  'VECTORS',
  'ACFT',
  'AIRCRAFT',
]);

const NAVIGATION_WORDS = new Set(['RNAV', 'RNP', 'GLS', 'VOR', 'NDB', 'LOC']);

const ANCHOR_GAP_WORDS = new Set(['IN', 'USE', 'IS', 'ARE', 'FOR', 'TO']);

const JOINER_WORDS = new Set(['AND', 'OR']);

const CLOSED_WORDS = new Set([
  'CLSD',
  'CLOSED',
  'CLOSURE',
  'OTS',
  'UNSERVICEABLE',
  'UNAVAILABLE',
  'UNAVBL',
  'INOP',
  'CONDITION',
  'CONDITIONS',
  'RCC',
  'BRAKING',
]);

const EQUIPMENT_WORDS = new Set([
  'ILS',
  'LOC',
  'GS',
  'GP',
  'PAPI',
  'PAPIS',
  'VASI',
  'IM',
  'MM',
  'OM',
  'DME',
  'ALS',
  'ALSF',
  'MALS',
  'MALSR',
  'ODALS',
  'SFL',
  'REIL',
  'REILS',
  'RVR',
  'RAIL',
  'LIGHTS',
  'LGT',
  'LGTS',
  'EDGE',
  'CL',
  'TDZ',
  'MIDPOINT',
  'THRESHOLD',
  'THR',
]);

const EXCLUDING_WORDS = new Set([
  'HOLD',
  'HLDG',
  'CROSS',
  'CROSSING',
  'VACATE',
  'VACATING',
  'MISTAKE',
  'WIND',
  'TORA',
  'TODA',
  'ASDA',
  'LDA',
  'BTN',
  'BETWEEN',
]);

const UNIT_WORDS = new Set([
  'KM',
  'SM',
  'M',
  'MTR',
  'METERS',
  'METRES',
  'KILOMETERS',
  'KILOMETRES',
  'MILES',
  'MI',
  'NM',
  'FT',
  'FEET',
  'KT',
  'KTS',
  'KNOTS',
  'DEG',
  'DEGREES',
  'MPS',
  'HPA',
  'PERCENT',
]);

const SIDES: Record<string, string> = {
  L: 'L',
  LEFT: 'L',
  C: 'C',
  CENTER: 'C',
  CENTRE: 'C',
  R: 'R',
  RIGHT: 'R',
};

const NOTAM_SECTION = /\bNOTICES? TO AIR ?MEN\b|\bNOTAMS?\b/;
const CLAUSE_BREAK = /\.{2,}|\.(?=\s|$)|[;=]/;
const RUNWAY_NUMBER = /^(\d{1,2})([LCR])?$/;

const CUE_SEARCH_LIMIT = 4;
const EQUIPMENT_REACH = 3;
const EXCLUDING_REACH = 5;

export function readAtisRunways(
  content: string,
  informationType: WeatherInformationType,
  designators: string[],
): AtisRunwayReading {
  const known = new Set(designators);

  if (known.size === 0) {
    return { arrival: [], departure: [], settled: true };
  }

  const arrival = new Set<string>();
  const departure = new Set<string>();
  let settled = true;
  let sawRunwayWord = false;
  let foundRunway = false;

  for (const clause of clausesOf(content)) {
    const tokens = tokenize(clause);
    const { runs, unknown } = findRuns(tokens, known);

    sawRunwayWord ||= tokens.some((token) => RUNWAY_WORDS.has(token.text));
    foundRunway ||= runs.length > 0;
    settled &&= !unknown;

    runs.forEach((run, index) => {
      const previous = runs[index - 1];
      const next = runs[index + 1];

      run.excluded = isExcluded(tokens, run, previous, next);

      const uses = usesOf(tokens, run, previous, next, informationType);
      run.uses = uses ?? usesOfAtis(informationType);

      if (
        !run.excluded &&
        !uses &&
        informationType === WeatherInformationType.Atis
      ) {
        settled = false;
      }

      if (run.excluded) {
        return;
      }

      for (const designator of run.designators) {
        if (run.uses.includes('arrival')) {
          arrival.add(designator);
        }

        if (run.uses.includes('departure')) {
          departure.add(designator);
        }
      }
    });
  }

  if (sawRunwayWord && !foundRunway) {
    settled = false;
  }

  return { arrival: [...arrival], departure: [...departure], settled };
}

function clausesOf(content: string): string[] {
  const text = content.toUpperCase();
  const notams = text.search(NOTAM_SECTION);
  const operational = notams === -1 ? text : text.slice(0, notams);

  return operational.split(CLAUSE_BREAK);
}

function tokenize(clause: string): Token[] {
  const words = clause
    .replace(/\bU\/S\b/g, ' UNSERVICEABLE ')
    .replace(/\b(RWYS?|RY|RUNWAYS?)(?=\d)/g, '$1 ')
    .split(/[^A-Z0-9]+/)
    .filter((word) => word.length > 0);
  const tokens: Token[] = [];

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const match = word.match(RUNWAY_NUMBER);
    const number = match ? Number(match[1]) : 0;

    if (
      !match ||
      number < 1 ||
      number > 36 ||
      UNIT_WORDS.has(words[i + 1] ?? '')
    ) {
      tokens.push({ text: word, designator: null, sided: false });
      continue;
    }

    let side = match[2] ?? '';

    if (!side && SIDES[words[i + 1] ?? '']) {
      side = SIDES[words[i + 1]];
      i++;
    }

    tokens.push({
      text: word,
      designator: `${String(number).padStart(2, '0')}${side}`,
      sided: side !== '',
    });
  }

  return tokens;
}

function findRuns(
  tokens: Token[],
  known: Set<string>,
): { runs: Run[]; unknown: boolean } {
  const runs: Run[] = [];
  let unknown = false;
  let i = 0;

  while (i < tokens.length) {
    const anchor = tokens[i].designator ? anchorOf(tokens, i) : null;

    if (!tokens[i].designator || !(tokens[i].sided || anchor)) {
      i++;
      continue;
    }

    const run: Run = {
      start: i,
      end: i,
      designators: [],
      excluded: false,
      uses: [],
    };
    let j = i;

    while (j < tokens.length) {
      const designator = tokens[j].designator;

      if (designator) {
        if (known.has(designator)) {
          if (!run.designators.includes(designator)) {
            run.designators.push(designator);
          }
        } else if (anchor && RUNWAY_WORDS.has(anchor)) {
          unknown = true;
        }

        run.end = j;
        j++;
        continue;
      }

      if (JOINER_WORDS.has(tokens[j].text) && tokens[j + 1]?.designator) {
        j++;
        continue;
      }

      break;
    }

    if (run.designators.length > 0) {
      runs.push(run);
    }

    i = j;
  }

  return { runs, unknown };
}

function anchorOf(tokens: Token[], index: number): string | null {
  for (let k = index - 1; k >= 0; k--) {
    const text = tokens[k].text;

    if (ANCHOR_GAP_WORDS.has(text)) {
      continue;
    }

    const anchors =
      RUNWAY_WORDS.has(text) ||
      DEPARTURE_WORDS.has(text) ||
      (ARRIVAL_WORDS.has(text) && !NAVIGATION_WORDS.has(text));

    return anchors ? text : null;
  }

  return null;
}

function isExcluded(
  tokens: Token[],
  run: Run,
  previous: Run | undefined,
  next: Run | undefined,
): boolean {
  const nextStart = next?.start ?? tokens.length;

  for (
    let k = run.end + 1;
    k < nextStart && k <= run.end + EQUIPMENT_REACH + 1;
    k++
  ) {
    if (CLOSED_WORDS.has(tokens[k].text)) {
      return true;
    }

    if (!EQUIPMENT_WORDS.has(tokens[k].text)) {
      break;
    }
  }

  const previousEnd = previous?.end ?? -1;

  for (
    let k = run.start - 1;
    k > previousEnd && k >= run.start - EXCLUDING_REACH;
    k--
  ) {
    if (EXCLUDING_WORDS.has(tokens[k].text)) {
      return true;
    }
  }

  return false;
}

function usesOf(
  tokens: Token[],
  run: Run,
  previous: Run | undefined,
  next: Run | undefined,
  informationType: WeatherInformationType,
): Use[] | null {
  const before = cuesAlong(tokens, run.start - 1, -1, previous?.end ?? -1);
  const usesBefore = usesOfCues(before.cues, informationType);

  if (usesBefore) {
    return usesBefore;
  }

  if (previous && before.clear) {
    return previous.uses;
  }

  const after = cuesAlong(tokens, run.end + 1, 1, next?.start ?? tokens.length);

  return usesOfCues(after.cues, informationType);
}

function cuesAlong(
  tokens: Token[],
  from: number,
  step: 1 | -1,
  stop: number,
): { cues: Set<Cue>; clear: boolean } {
  const cues = new Set<Cue>();
  let skipped = 0;

  for (let k = from; k !== stop; k += step) {
    const cue = cueOf(tokens[k].text);

    if (cue) {
      cues.add(cue);
      continue;
    }

    if (isFiller(tokens[k])) {
      continue;
    }

    skipped++;

    if (cues.size > 0 || skipped > CUE_SEARCH_LIMIT) {
      return { cues, clear: false };
    }
  }

  return { cues, clear: skipped === 0 };
}

function cueOf(text: string): Cue | null {
  if (ARRIVAL_WORDS.has(text)) {
    return 'arrival';
  }

  if (DEPARTURE_WORDS.has(text)) {
    return 'departure';
  }

  return IN_USE_WORDS.has(text) ? 'inUse' : null;
}

function isFiller(token: Token): boolean {
  return (
    !token.designator &&
    (FILLER_WORDS.has(token.text) || /^[A-Z]$/.test(token.text))
  );
}

function usesOfCues(
  cues: Set<Cue>,
  informationType: WeatherInformationType,
): Use[] | null {
  const uses: Use[] = [];

  if (cues.has('arrival')) {
    uses.push('arrival');
  }

  if (cues.has('departure')) {
    uses.push('departure');
  }

  if (uses.length > 0) {
    return uses;
  }

  return cues.has('inUse') ? usesOfAtis(informationType) : null;
}

function usesOfAtis(informationType: WeatherInformationType): Use[] {
  switch (informationType) {
    case WeatherInformationType.AtisArrival:
      return ['arrival'];
    case WeatherInformationType.AtisDeparture:
      return ['departure'];
    default:
      return ['arrival', 'departure'];
  }
}

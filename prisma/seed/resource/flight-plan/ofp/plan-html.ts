import {
  NotamSection,
  Ofp,
  OfpAirport,
  OfpFix,
  WeatherReport,
  WindLevel,
} from './model';
import {
  banner,
  clock,
  compactDate,
  dayHour,
  dayHourMinute,
  dayMonth,
  duration,
  escapeHtml,
  heading,
  left,
  localClock,
  longDate,
  minutes,
  PAGE_WIDTH,
  right,
  RULE,
  shortDate,
  signed,
  titleDate,
  tonnes,
  wrapHtmlWords,
  wrapWords,
  latitude,
  longitude,
  zero,
} from './text';

const PAGE_BREAK = '<h2 style="page-break-after: always;"> </h2>';
const PAGE_LINES = 55;
const SECTION_HEADING_LINES = 2;
const RIGHT_BLOCK = 18;
const ROUTE_VIA_WIDTH = 28;
const WEATHER_INDENT = 14;
const NOTAM_WIDTH = 66;
const AFTN_ADDRESSES_PER_LINE = 6;
const AFTN_ORIGINATOR = 'CYULSBFP';
const DISPATCH_PHONE = '+1 800 555 0199';
const NOTAM_SECTIONS: NotamSection[] = [
  'AIRPORT',
  'RUNWAY',
  'SID',
  'STAR',
  'APPROACH PROCEDURES',
];
const CLIMB_LEVELS = [35000, 31000, 20000, 15000, 10000];
const WIND_COLUMNS = 4;
const WIND_COLUMN_WIDTH = 17;

const COMPANY_NOTAMS = [
  '<b>==========',
  'CREW ALERT',
  '==========</b>',
  '',
  '<b>SB007/14   </b>',
  '  SUBJECT: AUTO COST INDEXES',
  '  WHEN PLANNING A COST INDEX, 2 OPTIONS ARE AVAILABLE. PILOTS MAY',
  '  EITHER SELECT A SPECIFIC COST INDEX NUMBER FROM THE LIST, OR THEY',
  '  MAY SELECT "AUTO". WHEN PLANNING AN "AUTO" COST INDEX, THE SYSTEM',
  '  WILL REFERENCE THE SCHEDULED "TIME ENROUTE" OPTION AND ATTEMPT TO',
  '  CHOOSE A COST INDEX WHICH CLOSELY MATCHES THIS VALUE. NOTE THAT',
  '  THE "TIME ENROUTE" OPTION IS MEANT AS A GATE TO GATE TIME (AS',
  "  INDICATED ON AN AIRLINE'S FLIGHT SCHEDULE, FOR EXAMPLE). IF A",
  '  "TIME ENROUTE" OF 2:30 IS SELECTED, THE SYSTEM WILL SUBTRACT THE',
  '  TAXI TIMES FROM THIS VALUE TO DETERMINE THE SCHEDULED AIR TIME. IT',
  '  WILL THEN DETERMINE AND USE THE COST INDEX WHICH MATCHES THIS AIR',
  '  TIME.',
  '',
  '<b>SB003/13   </b>',
  '  SUBJECT: FLIGHT RELEASE UNITS',
  '  ALL FLIGHT CREW: PLEASE PAY SPECIAL ATTENTION TO THE UNITS',
  '  SELECTION WHEN GENERATING A FLIGHT PLAN. FAILURE TO IDENTIFY THE',
  '  CORRECT UNITS WHEN REFUELING PRIOR TO FLIGHT CAN RESULT IN',
  '  DEPARTING WITH INSUFFICIENT FUEL AND/OR AN ERRONEOUS PAYLOAD.',
  '',
  '<b>=============',
  'CREW BULLETIN',
  '=============</b>',
  '',
  'NIL',
  '',
  '',
  '==================== END OF LIDO-NOTAM-BULLETIN ====================',
];

type Section = {
  bookmark: string;
  level: 0 | 1;
  title?: string;
  html: string;
};

function bookmark(name: string, level: 0 | 1): string {
  return `<!--BKMK///${name}///${level}-->`;
}

function heading68(title: string): string {
  return `<b>${escapeHtml(`[ ${title} ]`)}\n${RULE}</b>\n`;
}

function text(lines: string[]): string {
  return lines.map(escapeHtml).join('\n');
}

type BreakStyle = 'newline' | 'inline';

const REMOVED = '\u0000';

function paginate(
  lines: string[],
  firstPageUsed = 0,
  style: BreakStyle = 'newline',
): string {
  const output = [...lines];
  let pageStart = -firstPageUsed;
  let candidate: number | null = null;

  for (let index = 0; index < output.length; index++) {
    if (index - pageStart > PAGE_LINES && candidate !== null) {
      const following = output[candidate + 1];

      if (style === 'inline' && following !== undefined) {
        output[candidate - 1] =
          `${output[candidate - 1]}${PAGE_BREAK}${following}`;
        output[candidate + 1] = REMOVED;
      } else {
        output[candidate - 1] = `${output[candidate - 1]}${PAGE_BREAK}`;
      }

      output[candidate] = REMOVED;
      pageStart = candidate + 1;
      candidate = null;
    }

    if (output[index] === '' && index > pageStart && index > 0) {
      candidate = index;
    }
  }

  return output.filter((line) => line !== REMOVED).join('\n');
}

function block(label: string, value: string | number): string {
  return `${label}${right(value, RIGHT_BLOCK - label.length)}`;
}

function upper(name: string): string {
  return name.toUpperCase();
}

function displayName(fix: OfpFix): string {
  if (fix.ident === 'TOC') {
    return 'T O C';
  }

  if (fix.ident === 'TOD') {
    return 'T O D';
  }

  return upper(fix.name).slice(0, 11);
}

function displayIdent(fix: OfpFix): string {
  return fix.type === 'ltlg' && (fix.ident === 'TOC' || fix.ident === 'TOD')
    ? ''
    : fix.ident;
}

function shortIdent(fix: OfpFix): string {
  return fix.ident === 'TOC' || fix.ident === 'TOD'
    ? fix.ident
    : displayIdent(fix);
}

function mach(value: number): string {
  return value.toFixed(2).replace(/^0/, '');
}

function oat(value: number): string {
  return value < 0 ? `M${zero(value, 2)}` : zero(value, 2);
}

function windText(direction: number, speed: number): string {
  return `${heading(direction)}/${zero(speed, 3)}`;
}

function fuelRow(
  label: string,
  airport: string,
  fuel: number | string,
  time?: number,
): string {
  const head = left(`${left(label, 16)}${airport}`, 19);

  return `${head}${right(fuel, 7)}${time === undefined ? '' : right(duration(time), 7)}`;
}

function summary(ofp: Ofp): string {
  const { general, fuel, times, weights, origin, destination } = ofp;
  const alternate = ofp.alternates[0] ?? null;
  const generated = ofp.generated;
  const prognosis = new Date(generated);
  prognosis.setUTCHours(Math.floor(generated.getUTCHours() / 3) * 3, 0, 0, 0);
  const observation = new Date(generated);
  observation.setUTCHours(Math.floor(generated.getUTCHours() / 6) * 6, 0, 0, 0);
  const prognoses = [0, 3, 6].map((hours) =>
    dayHour(new Date(prognosis.getTime() + hours * 3600_000)),
  );
  const observed = dayHour(observation);
  const alternateTime = alternate?.ete ?? 0;
  const minimumFuel =
    fuel.trip + fuel.contingency + fuel.alternate + fuel.reserve;
  const minimumTime =
    times.enroute + times.contingency + alternateTime + times.reserve;

  const lines = [
    `${left(ofp.callsign, 10)}${left(longDate(times.scheduledOut), 13)}${left(`${origin.icao}-${destination.icao}`, 12)}${ofp.aircraft.icao} ${ofp.registration}  RELEASE ${clock(generated)} ${shortDate(generated)}`,
    `OFP 1   ${upper(origin.name)}-${upper(destination.name)}`,
    `${' '.repeat(25)}WX PROG ${prognoses.join(' ')}   OBS ${observed} ${observed} ${observed}`,
    '\t',
    `  ATC C/S   ${left(ofp.atc.callsign, 13)}${left(`${origin.icao}/${origin.iata}`, 11)}${left(`${destination.icao}/${destination.iata}`, 14)}${block('CRZ SYS', `CI ${general.costIndex}`)}`,
    `${left(longDate(times.scheduledOut), 12)}${left(ofp.registration, 13)}${left(`${clock(times.estimatedOut)}/${clock(times.estimatedOff)}`, 11)}${left(`${clock(times.estimatedOn)}/${clock(times.estimatedIn)}`, 14)}${block('GND DIST', general.routeDistance)}`,
    `${left(`${ofp.aircraft.name} / ${ofp.aircraft.engines}`, 36)}${left(`STA  ${clock(times.scheduledIn)}`, 14)}${block('AIR DIST', general.airDistance)}`,
    `${' '.repeat(25)}${left('CTOT:....', 25)}${block('G/C DIST', general.greatCircleDistance)}`,
    `${' '.repeat(50)}${block('AVG WIND', windText(general.averageWindDirection, general.averageWindSpeed))}`,
    `${left(`MAXIMUM    TOW ${right(weights.maxTakeoffStructural, 6)}  LAW ${right(weights.maxLanding, 6)}  ZFW ${right(weights.maxZeroFuel, 6)}`, 50)}${block('AVG W/C', signed(general.averageWindComponent, 3))}`,
    `${left(`ESTIMATED  TOW ${right(weights.takeoff, 6)}  LAW ${right(weights.landing, 6)}  ZFW ${right(weights.zeroFuel, 6)}`, 50)}${block('AVG ISA', signed(general.averageIsaDeviation, 3))}`,
    `${' '.repeat(50)}${block('AVG FF KGS/HR', general.averageFuelFlow)}`,
    `${' '.repeat(50)}${block('FUEL BIAS', 'P00.0')}`,
    `${left(`ALTN ${alternate?.icao ?? 'NIL'}`, 50)}${block('TKOF ALTN', '.......')}`,
    `FL STEPS ${general.steps}/`,
    RULE,
    'DISP RMKS   NIL',
    '',
    RULE,
    '         PLANNED FUEL',
    '-'.repeat(33),
    'FUEL           ARPT   FUEL   TIME',
    '-'.repeat(33),
    fuelRow('TRIP', destination.iata, fuel.trip, times.enroute),
    fuelRow(
      `CONT ${fuel.contingencyRule}`,
      '',
      fuel.contingency,
      times.contingency,
    ),
    fuelRow('ALTN', alternate?.iata ?? '', fuel.alternate, alternateTime),
    fuelRow('FINRES', '', fuel.reserve, times.reserve),
    '-'.repeat(33),
    fuelRow('MINIMUM T/OFF FUEL', '', minimumFuel, minimumTime),
    '-'.repeat(33),
    fuelRow('EXTRA', '', fuel.extra, times.extra),
    '-'.repeat(33),
    fuelRow('T/OFF FUEL', '', fuel.takeoff, minimumTime + times.extra),
    fuelRow('TAXI', origin.iata, fuel.taxi, times.taxiOut),
    '-'.repeat(33),
    fuelRow('BLOCK FUEL', origin.iata, fuel.ramp),
    fuelRow('PIC EXTRA', '', '.....'),
    fuelRow('TOTAL FUEL', '', '.....'),
    'REASON FOR PIC EXTRA ............',
    RULE,
    'FMC INFO:',
    fuelRow('FINRES+ALTN', '', fuel.reserve + fuel.alternate),
    fuelRow('TRIP+TAXI', '', fuel.trip + fuel.taxi),
    RULE,
    'NO TANKERING RECOMMENDED (P)',
    RULE,
    'I HEREWITH CONFIRM THAT I HAVE PERFORMED A THOROUGH SELF BRIEFING',
    'ABOUT THE DESTINATION AND ALTERNATE AIRPORTS OF THIS FLIGHT ',
    'INCLUDING THE APPLICABLE INSTRUMENT APPROACH PROCEDURES, AIRPORT ',
    'FACILITIES, NOTAMS AND ALL OTHER RELEVANT PARTICULAR INFORMATION.',
    '',
    `${left(`DISPATCHER: ${ofp.dispatcher}`, 40)}PIC NAME: ....., .....`,
    '',
    `${left(`TEL: ${DISPATCH_PHONE}`, 35)}PIC SIGNATURE: ...............`,
  ];

  return `${heading68('OFP')}${text(lines)}`;
}

function impactSign(value: number): string {
  return value < 0 || Object.is(value, -0) ? 'M' : 'P';
}

function routing(ofp: Ofp): string {
  const { origin, destination } = ofp;
  const alternates = ofp.alternates.flatMap((alternate, index) => {
    const via = wrapWords(alternate.route, ROUTE_VIA_WIDTH);
    const first = `${left(`${alternate.icao}/${alternate.runway}`, 9)}${heading(alternate.trackTrue)}${right(alternate.distance, 4)}  ${left(via[0] ?? 'DCT', 31)}${zero(alternate.cruiseAltitude / 100, 3)} ${signed(alternate.windComponent, 3)} ${duration(alternate.ete)}${right(alternate.burn, 6)}`;
    const rest = via
      .slice(1)
      .map((line) => `${' '.repeat(18)}${left(line, 50)}`);

    return [...(index === 0 ? [] : ['']), first, ...rest];
  });
  const impacts = ofp.impacts.map((impact) =>
    impact.fuel === null || impact.time === null
      ? `${left(impact.label, 37)}NOT AVAILABLE`
      : `${left(impact.label, 30)}TRIP  ${impactSign(impact.fuel)} ${zero(impact.fuel, 4)} KGS   TIME ${impactSign(impact.time)} ${duration(Math.abs(impact.time))}`,
  );
  const lines = [
    '',
    `${left('ALTERNATE ROUTE TO:', 55)}FINRES${right(ofp.fuel.reserve, 7)}`,
    'APT      TRK DST              VIA                 FL  WC  TIME  FUEL',
    RULE,
    ...alternates,
    RULE,
    '',
    'MEL/CDL ITEMS DESCRIPTION',
    '------------- -----------',
    '',
    RULE,
    '',
    'ROUTING:',
    '',
    'ROUTE ID: DEFRTE',
    ...wrapWords(
      `${origin.icao}/${origin.runway} ${ofp.general.route} ${destination.icao}/${destination.runway}`,
      PAGE_WIDTH,
    ),
    '',
    RULE,
    'DEPARTURE ATC CLEARANCE:',
    '.',
    '.',
    '.',
    RULE,
    '                         OPERATIONAL IMPACTS',
    '                         -------------------',
    ...impacts,
    RULE,
  ];

  return text(lines);
}

function timeRow(
  label: string,
  estimated: Date,
  scheduled: Date,
  timezone: string,
): string {
  return `${left(label, 15)}${left(`${clock(estimated)}Z/${localClock(estimated, timezone)}L`, 17)}${left(`${clock(scheduled)}Z/${localClock(scheduled, timezone)}L`, 18)}......Z`;
}

function weightRow(
  label: string,
  estimated: string,
  maximum: string,
  tail = '     ......',
): string {
  return `${left(label, 14)}${right(estimated, 5)}${right(maximum, 9)}${tail}`;
}

function timesAndWeights(ofp: Ofp): string {
  const { times, weights, fuel, origin, destination } = ofp;
  const maximumFuel = Math.min(
    weights.maxTakeoff - weights.zeroFuel + fuel.taxi,
    ofp.weights.maxTakeoffStructural,
  );
  const lines = [
    RULE,
    'ATIS:',
    '.',
    '.',
    '--------- --------- --------- --------- --------- --------- --------',
    'RVSM: ALT SYS  LEFT:             STBY:             RIGHT:',
    '',
    '--------- --------- --------- --------- --------- --------- --------',
    RULE,
    '                                TIMES',
    '                                -----',
    '\t\t\t\t    ',
    '               ESTIMATED        SKED              ACTUAL',
    '',
    timeRow('OUT', times.estimatedOut, times.scheduledOut, origin.timezone),
    '',
    timeRow('OFF', times.estimatedOff, times.scheduledOff, origin.timezone),
    '',
    timeRow('ON', times.estimatedOn, times.scheduledOn, destination.timezone),
    '',
    timeRow('IN', times.estimatedIn, times.scheduledIn, destination.timezone),
    '',
    `${left('BLOCK TIME', 15)}${left(duration((times.estimatedIn.getTime() - times.estimatedOut.getTime()) / 1000), 17)}${left(duration((times.scheduledIn.getTime() - times.scheduledOut.getTime()) / 1000), 18)}......`,
    '',
    RULE,
    '                               WEIGHTS',
    '                               -------',
    '',
    '                EST      MAX     ACTUAL',
    '',
    weightRow('PAX', String(weights.passengers), ''),
    '',
    weightRow('BAG/CARGO', tonnes(weights.cargo), ''),
    '',
    weightRow('PAYLOAD', tonnes(weights.payload), ''),
    '',
    weightRow('ZFW', tonnes(weights.zeroFuel), tonnes(weights.maxZeroFuel)),
    '',
    weightRow(
      'FUEL',
      tonnes(fuel.ramp),
      tonnes(maximumFuel),
      `     ......  POSS EXTRA ${tonnes(Math.max(0, maximumFuel - fuel.ramp))}`,
    ),
    '',
    weightRow(
      'TOW',
      tonnes(weights.takeoff),
      tonnes(weights.maxTakeoff),
      '  LDG......',
    ),
    '',
    weightRow('STAB TRIM', '', ''),
    '',
    weightRow('LAW', tonnes(weights.landing), tonnes(weights.maxLanding)),
    '',
    RULE,
    '                       TERRAIN CLEARANCE CHECK',
    '                       -----------------------',
    'DD CHECK - TERRAIN CLEARANCE CHECK DISABLED',
    '',
    'DP CHECK - TERRAIN CLEARANCE CHECK DISABLED',
    RULE,
  ];

  return text(lines);
}

function logLine1(cells: {
  airway?: string;
  level?: string;
  trackMag?: string;
  mach?: string;
  wind?: string;
  oat?: string;
  fuelOnBoard: string;
  burnoff: string;
}): string {
  return `${left(cells.airway ?? '', 29)}${left(cells.level ?? '', 3)}${right(cells.trackMag ?? '', 6)}${right(cells.mach ?? '', 5)}${right(cells.wind ?? '', 8)}${right(cells.oat ?? '', 5)}${right(cells.fuelOnBoard, 6)}${right(cells.burnoff, 6)}`;
}

function logLine2(cells: {
  position: string;
  latitude: string;
  leg?: string;
  mora?: string;
  trackTrue?: string;
  trueAirspeed?: string;
  component?: string;
  deviation?: string;
}): string {
  return `${left(cells.position, 12)}${cells.latitude}${right(cells.leg ?? '', 5)} ...${right(cells.mora ?? '', 4)}${right(cells.trackTrue ?? '', 6)}${right(cells.trueAirspeed ?? '', 5)}${right(cells.component ?? '', 8)}${right(cells.deviation ?? '', 5)}`;
}

function logLine3(cells: {
  ident: string;
  longitude: string;
  total: string;
  distance?: string;
  remaining?: string;
  groundSpeed?: string;
  shear?: string;
  tropopause?: string;
}): string {
  return `${left(cells.ident, 11)}${cells.longitude}${right(cells.total, 5)} ...${right(cells.distance ?? '', 4)}${right(cells.remaining ?? '', 6)}${right(cells.groundSpeed ?? '', 5)}${right(cells.shear ?? '', 8)}${right(cells.tropopause ?? '', 5)}  ....  ....`;
}

function flightLog(ofp: Ofp): string {
  const { navlog, origin, fuel } = ofp;
  const first = navlog[0];
  const total = ofp.general.routeDistance;
  const rows: { ident: string; mora: number }[] = [
    { ident: origin.icao, mora: first.mora },
    ...navlog.map((fix, index) => ({
      ident: shortIdent(fix),
      mora: navlog[index + 1]?.mora ?? 0,
    })),
  ];
  const critical = rows.reduce((best, row) =>
    row.mora > best.mora ? row : best,
  );
  const shear = navlog.reduce((best, fix) =>
    fix.shear > best.shear ? fix : best,
  );
  const lines = [
    '                             FLIGHT LOG                             ',
    '                             ----------                             ',
    '',
    `MOST CRITICAL MORA ${zero(critical.mora, 5)} FEET AT ${critical.ident}///MXSHR ${zero(shear.shear, 2)} AT ${shortIdent(shear)}`,
    RULE,
    'AWY                           FL   IMT   MN    WIND  OAT  EFOB  PBRN',
    'POSITION    LAT      EET ETO MORA  ITT  TAS    COMP  TDV',
    'IDENT       LONG    TTLT ATO DIS  RDIS   GS     SHR  TRP  AFOB  ABRN',
    'FREQ',
    RULE,
    logLine1({
      trackMag: heading(first.trackMag),
      fuelOnBoard: tonnes(fuel.takeoff),
      burnoff: tonnes(fuel.taxi),
    }),
    logLine2({
      position: upper(origin.name).slice(0, 11),
      latitude: latitude(origin.latitude),
      mora: String(Math.round(first.mora / 100)),
      trackTrue: heading(first.trackTrue),
      component: signed(first.windComponent, 3),
    }),
    logLine3({
      ident: origin.icao,
      longitude: longitude(origin.longitude),
      total: duration(0),
      remaining: String(total),
      groundSpeed: String(first.groundSpeed),
    }),
    '',
  ];
  let covered = 0;
  let previousTotal = 0;

  navlog.forEach((fix, index) => {
    const next = navlog[index + 1] ?? null;
    const isLast = next === null;
    const descending = fix.stage === 'DSC';
    const elapsed = minutes(fix.elapsedSeconds);
    const remainingBefore = total - covered;

    if (fix.firCrossing !== null) {
      lines.push(
        left(fix.firCrossing.name, PAGE_WIDTH),
        `${left(`-${fix.firCrossing.code}`, 12)}${latitude(fix.firCrossing.latitude)} 0000 ...`,
        `${' '.repeat(11)}${longitude(fix.firCrossing.longitude)}${right(duration(previousTotal * 60), 5)} ...${right(0, 4)}${right(remainingBefore, 6)}`,
        '',
      );
    }

    covered += fix.distance;

    lines.push(
      isLast
        ? logLine1({
            airway: fix.airway,
            fuelOnBoard: tonnes(fix.fuelOnBoard),
            burnoff: tonnes(fix.fuelUsed + fuel.taxi),
          })
        : logLine1({
            airway: fix.airway,
            level: zero(fix.altitude / 100, 3),
            trackMag: heading(next.trackMag),
            mach: mach(fix.mach),
            wind: windText(fix.windDirection, fix.windSpeed),
            oat: oat(fix.oat),
            fuelOnBoard: tonnes(fix.fuelOnBoard),
            burnoff: tonnes(fix.fuelUsed + fuel.taxi),
          }),
      isLast
        ? logLine2({
            position: displayName(fix),
            latitude: latitude(fix.latitude),
            leg: duration((elapsed - previousTotal) * 60),
          })
        : logLine2({
            position: displayName(fix),
            latitude: latitude(fix.latitude),
            leg: duration((elapsed - previousTotal) * 60),
            mora: String(Math.round(next.mora / 100)),
            trackTrue: heading(next.trackTrue),
            trueAirspeed: descending ? '' : String(fix.trueAirspeed),
            component: signed(fix.windComponent, 3),
            deviation: signed(fix.isaDeviation, 2),
          }),
      isLast
        ? logLine3({
            ident: displayIdent(fix),
            longitude: longitude(fix.longitude),
            total: duration(elapsed * 60),
            distance: String(fix.distance),
          })
        : logLine3({
            ident: displayIdent(fix),
            longitude: longitude(fix.longitude),
            total: duration(elapsed * 60),
            distance: String(fix.distance),
            remaining: String(total - covered),
            groundSpeed: String(fix.groundSpeed),
            shear: descending ? '' : String(fix.shear),
            tropopause: String(Math.round(fix.tropopause / 100)),
          }),
    );

    if (fix.frequency !== null) {
      lines.push(fix.frequency);
    }

    lines.push('');
    previousTotal = elapsed;
  });

  return `${paginate(lines.slice(0, -1).map(escapeHtml))}\n\n\n\n`;
}

function windAt(levels: WindLevel[], altitude: number): WindLevel | null {
  const sorted = [...levels].sort((a, b) => a.altitude - b.altitude);

  if (sorted.length === 0) {
    return null;
  }

  const exact = sorted.find((level) => level.altitude === altitude);

  if (exact !== undefined) {
    return exact;
  }

  const above = sorted.find((level) => level.altitude > altitude);
  const below = [...sorted]
    .reverse()
    .find((level) => level.altitude < altitude);

  if (above === undefined || below === undefined) {
    return { ...(above ?? below)!, altitude };
  }

  const ratio = (altitude - below.altitude) / (above.altitude - below.altitude);
  const vector = (level: WindLevel) => {
    const radians = (level.direction * Math.PI) / 180;

    return [level.speed * Math.sin(radians), level.speed * Math.cos(radians)];
  };
  const [lowX, lowY] = vector(below);
  const [highX, highY] = vector(above);
  const x = lowX + (highX - lowX) * ratio;
  const y = lowY + (highY - lowY) * ratio;
  const direction = ((Math.atan2(x, y) * 180) / Math.PI + 360) % 360;

  return {
    altitude,
    direction: Math.round(direction) === 0 ? 360 : Math.round(direction),
    speed: Math.round(Math.hypot(x, y)),
    oat: below.oat + (above.oat - below.oat) * ratio,
  };
}

function windEntry(level: WindLevel | null, altitude: number): string {
  if (level === null) {
    return `${zero(altitude / 100, 3)} .../... ...`;
  }

  const temperature = Math.round(level.oat);
  const sign = level.oat < 0 || Object.is(temperature, -0) ? '-' : '+';

  return `${zero(altitude / 100, 3)} ${windText(level.direction, level.speed)} ${sign}${zero(temperature, 2)}`;
}

function windInformation(ofp: Ofp): string {
  const { navlog } = ofp;
  const enroute = navlog.filter(
    (fix) => fix.ident === 'TOC' || fix.stage === 'CRZ',
  );
  const columns = [
    {
      label: 'CLIMB',
      entries: CLIMB_LEVELS.map((altitude) =>
        windEntry(windAt(navlog[0].winds, altitude), altitude),
      ),
    },
    ...enroute.map((fix) => {
      const cruise = Math.round(fix.altitude / 1000) * 1000;

      return {
        label:
          displayName(fix) === 'T O C' || displayName(fix) === 'T O D'
            ? displayName(fix)
            : fix.ident,
        entries: [4000, 2000, 0, -2000, -4000].map((offset) =>
          windEntry(windAt(fix.winds, cruise + offset), cruise + offset),
        ),
      };
    }),
    {
      label: 'DESCENT',
      entries: CLIMB_LEVELS.map((altitude) =>
        windEntry(windAt(navlog[navlog.length - 1].winds, altitude), altitude),
      ),
    },
  ];
  const lines = [
    RULE,
    '                          WIND INFORMATION                          ',
    '                          ----------------                          ',
    '',
  ];

  for (let start = 0; start < columns.length; start += WIND_COLUMNS) {
    const group = columns.slice(start, start + WIND_COLUMNS);
    const last = group.length - 1;

    lines.push(
      group
        .map((column, index) =>
          index === last ? column.label : left(column.label, WIND_COLUMN_WIDTH),
        )
        .join(''),
    );

    for (let row = 0; row < 5; row++) {
      lines.push(group.map((column) => column.entries[row]).join('  '));
    }

    lines.push('');
  }

  lines.push(RULE);

  return paginate(lines.map(escapeHtml));
}

function aftnAddresses(firs: string[]): string[] {
  const addresses = firs.map((fir) => `${fir}ZQZX`);
  const lines: string[] = [];

  for (
    let start = 0;
    start < addresses.length;
    start += AFTN_ADDRESSES_PER_LINE
  ) {
    const chunk = addresses
      .slice(start, start + AFTN_ADDRESSES_PER_LINE)
      .join(' ');
    lines.push(start === 0 ? `FF ${chunk}` : `   ${chunk}`);
  }

  return lines;
}

function atcFlightPlan(ofp: Ofp): string {
  const { atc, aircraft, origin, destination, times } = ofp;
  const estimates = atc.firEstimates
    .map(({ fir, elapsedSeconds }) => `${fir}${duration(elapsedSeconds)}`)
    .join(' ');
  const section18 = [
    `PBN/${aircraft.pbn}`,
    `DOF/${compactDate(times.scheduledOut)}`,
    `REG/${ofp.registration.replace(/-/g, '')}`,
    ...(estimates === '' ? [] : [`EET/${estimates}`]),
    ...(aircraft.selcal === null
      ? []
      : [`SEL/${aircraft.selcal.replace(/-/g, '')}`]),
    `PER/${aircraft.approachCategory}`,
    'RMK/TCAS)',
  ].join(' ');
  const lines = [
    '                          ICAO FLIGHT PLAN                           ',
    '                          ----------------                           ',
    '',
    ...aftnAddresses(atc.firs),
    `${dayHourMinute(ofp.generated)} ${AFTN_ORIGINATOR}`,
    `(FPL-${atc.callsign}-IS`,
    `-${aircraft.icao}/${aircraft.equipment}`,
    `-${origin.icao}${clock(times.scheduledOut)}`,
    ...wrapWords(`-${atc.route}`, PAGE_WIDTH),
    `-${[`${destination.icao}${duration(times.enroute)}`, ...ofp.alternates.slice(0, 2).map((alternate) => alternate.icao)].join(' ')}`,
    ...wrapWords(`-${section18}`, PAGE_WIDTH),
  ];

  return text(lines);
}

function additionalInfo(ofp: Ofp): string {
  return text([
    `D I S P A T C H  B R I E F I N G  I N F O    ${ofp.callsign}    ${ofp.origin.icao}/${ofp.destination.icao}`,
    '',
    '',
    '',
  ]);
}

function runwayAnalysisSection(ofp: Ofp): string {
  return paginate(
    ['', ...ofp.runwayAnalysis.split('\n'), '', ''].map(escapeHtml),
    SECTION_HEADING_LINES,
  );
}

function reportStamp(report: WeatherReport): string {
  return report.text.match(/\b(\d{6})Z\b/)?.[1] ?? dayHourMinute(report.issued);
}

function reportLines(label: string, report: WeatherReport, body: string[]) {
  const indent = ' '.repeat(WEATHER_INDENT);

  return body.flatMap((group, index) =>
    wrapWords(group, PAGE_WIDTH - WEATHER_INDENT).map((line, lineIndex) =>
      index === 0 && lineIndex === 0
        ? `  ${label}  ${reportStamp(report)}  ${line}`
        : `${indent}${line}`,
    ),
  );
}

function metarBody(text: string): string[] {
  return [
    text
      .replace(/^(METAR|SPECI)\s+/, '')
      .replace(/^[A-Z]{4}\s+\d{6}Z\s+/, '')
      .trim(),
  ];
}

function tafBody(text: string): string[] {
  const body = text
    .replace(/\s+/g, ' ')
    .replace(/^TAF\s+(AMD\s+|COR\s+)?/, '')
    .replace(/^[A-Z]{4}\s+\d{6}Z\s+/, '')
    .trim();

  return body
    .split(/ (?=FM\d{6}|BECMG |PROB\d{2} |(?<!PROB\d{2} )TEMPO )/)
    .map((group) => group.trim());
}

function airportWeather(airport: OfpAirport): string[] {
  const reports = [
    ...(airport.metar === null
      ? []
      : reportLines('SA', airport.metar, metarBody(airport.metar.text))),
    ...(airport.taf === null
      ? []
      : reportLines('FT', airport.taf, tafBody(airport.taf.text))),
  ];

  return [
    `${airport.icao}/${airport.iata}  ${upper(airport.name)}`,
    ...(reports.length === 0 ? ['  No Wx data available'] : reports),
  ];
}

function weatherList(ofp: Ofp): string {
  const { origin, destination, alternates } = ofp;
  const isAlternate = (airport: OfpAirport) =>
    alternates.some((alternate) => alternate.icao === airport.icao);
  const otherAlternates = alternates.filter(
    (alternate) =>
      alternate.icao !== origin.icao && alternate.icao !== destination.icao,
  );
  const lines = [
    `${left(`${origin.icao} --> ${destination.icao}`, 19)}${ofp.callsign} / ${longDate(ofp.times.scheduledOut)}`,
    `LIDO/WEATHER SERVICE       DATE : ${titleDate(ofp.generated)}   TIME : ${clock(ofp.generated).slice(0, 2)}:${clock(ofp.generated).slice(2)} UTC`,
    '',
    'AIRMETs:',
    '  No Wx data available',
    '',
    'SIGMETs:',
    '  No Wx data available',
    '',
    'Tropical Cyclone SIGMETs:',
    '  No Wx data available',
    '',
    'Volcanic Ash SIGMETs:',
    '  No Wx data available',
    '',
    `${isAlternate(origin) ? 'Departure / Destination Alternate' : 'Departure'}:`,
    ...airportWeather(origin),
    '',
    `${isAlternate(destination) ? 'Destination / Destination Alternate' : 'Destination'}:`,
    ...airportWeather(destination),
    ...(otherAlternates.length === 0
      ? []
      : [
          '',
          'Destination Alternates:',
          ...otherAlternates.flatMap((alternate, index) => [
            ...(index === 0 ? [] : ['']),
            ...airportWeather(alternate),
          ]),
        ]),
    '',
    '',
    '  AIRPORTLIST ENDED',
  ];

  return paginate(lines.map(escapeHtml), SECTION_HEADING_LINES, 'inline');
}

function notamGroupTitle(title: string): string[] {
  const rule = '='.repeat(title.length);

  return [`<b>${rule}`, title, `${rule}</b>`];
}

function notamAirport(airport: OfpAirport): string[] {
  const title = `${airport.icao}/${airport.iata}     ${upper(airport.name)}`;
  const sections = NOTAM_SECTIONS.flatMap((section) => {
    const notams = airport.notams.filter((notam) => notam.section === section);

    if (notams.length === 0) {
      return [];
    }

    return [
      '',
      banner(section, '+'),
      '',
      ...notams.flatMap((notam) => [
        `<b>${escapeHtml(notam.id)}   </b>`,
        ...wrapHtmlWords(notam.html, NOTAM_WIDTH).map((line) => `  ${line}`),
      ]),
    ];
  });

  return [
    `<b>${escapeHtml(title)}`,
    `${'-'.repeat(title.length)}</b>`,
    ...(sections.length === 0 ? ['', 'NIL'] : sections),
    '',
  ];
}

function notamBulletin(ofp: Ofp): string {
  const { origin, destination, alternates, times, fuel } = ofp;
  const isAlternate = (airport: OfpAirport) =>
    alternates.some((alternate) => alternate.icao === airport.icao);
  const otherAlternates = alternates.filter(
    (alternate) =>
      alternate.icao !== origin.icao && alternate.icao !== destination.icao,
  );
  const validUntil = new Date(
    times.scheduledOut.getTime() +
      (3 * 3600 +
        times.enroute +
        times.contingency +
        (alternates[0]?.ete ?? 0) +
        times.reserve) *
        1000,
  );
  const stamp = (date: Date) => `${compactDate(date)}${clock(date)}`;
  const alternateList =
    alternates.length === 0
      ? 'NIL'
      : alternates.map((alternate) => alternate.icao).join(' ');

  void fuel;

  const lines = [
    'LIDO-NOTAM-BULLETIN INCLUDES NOTAM, COMP NOTAM AND AIP-REGULATION',
    `<b>VALID: ${stamp(times.scheduledOut)} - ${stamp(validUntil)}</b>  STD(EOBT)+TRIP+ALTN+3HRS`,
    escapeHtml(
      `${left(` ${ofp.callsign} /${dayMonth(times.scheduledOut)}`, 20)}OFP-NR: 1`,
    ),
    escapeHtml(
      `ROUTE:    ${origin.icao} - ${destination.icao}   ALTN: ${alternateList}`,
    ),
    ...wrapWords(ofp.atc.route, PAGE_WIDTH).map(escapeHtml),
    '',
    '',
    ...notamGroupTitle(
      isAlternate(origin)
        ? 'DEPARTURE / ALTERNATE AIRPORT - DETAILED INFO'
        : 'DEPARTURE AIRPORT - DETAILED INFO',
    ),
    '',
    ...notamAirport(origin),
    ...notamGroupTitle(
      isAlternate(destination)
        ? 'DESTINATION / ALTERNATE AIRPORT - DETAILED INFO'
        : 'DESTINATION AIRPORT - DETAILED INFO',
    ),
    '',
    ...notamAirport(destination),
    ...(otherAlternates.length === 0
      ? []
      : [
          ...notamGroupTitle('DESTINATION ALTERNATE AIRPORT(S)'),
          '',
          ...otherAlternates.flatMap(notamAirport),
        ]),
  ];

  return paginate(lines, SECTION_HEADING_LINES, 'inline');
}

function sections(ofp: Ofp): Section[] {
  return [
    { bookmark: 'Summary and Fuel', level: 1, html: summary(ofp) },
    { bookmark: 'Routing and Impacts', level: 1, html: routing(ofp) },
    { bookmark: 'Times and Weights', level: 1, html: timesAndWeights(ofp) },
    { bookmark: 'Flight Log', level: 1, html: flightLog(ofp) },
    { bookmark: 'Wind Information', level: 1, html: windInformation(ofp) },
    {
      bookmark: 'ATC Flight Plan',
      level: 0,
      title: 'ATC Flight Plan',
      html: atcFlightPlan(ofp),
    },
    {
      bookmark: 'Additional Info',
      level: 0,
      title: 'Additional Info',
      html: additionalInfo(ofp),
    },
    {
      bookmark: 'Runway Analysis',
      level: 0,
      title: 'Runway Analysis',
      html: runwayAnalysisSection(ofp),
    },
    {
      bookmark: 'Airport WX List',
      level: 0,
      title: 'Airport WX List',
      html: weatherList(ofp),
    },
    {
      bookmark: 'NOTAM',
      level: 0,
      title: 'NOTAM',
      html: notamBulletin(ofp),
    },
    {
      bookmark: 'Company NOTAM',
      level: 0,
      title: 'Company NOTAM',
      html: COMPANY_NOTAMS.join('\n'),
    },
  ];
}

export function planHtml(ofp: Ofp): string {
  const body = sections(ofp)
    .map((section, index) => {
      const marker = `${index === 0 ? bookmark('OFP', 0) : ''}${bookmark(section.bookmark, section.level)}`;
      const heading =
        section.title === undefined ? '' : heading68(section.title);

      return `${index === 0 ? '' : PAGE_BREAK}${marker}${heading}${section.html}`;
    })
    .join('');

  return `<div style="line-height:14px;font-size:13px"><pre>${body}</pre></div>`;
}

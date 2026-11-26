import {
  banner,
  clock,
  heading,
  hundreds,
  left,
  right,
  shortDate,
  zero,
} from './text';

export type TlrRunway = {
  designator: string;
  length: number;
  maxWeight: number;
  notes: string;
};

export type TakeoffResult = {
  designator: string;
  maxWeight: number;
  flexTemperature: number;
  flap: string;
  v1: number;
  vr: number;
  v2: number;
  limit: 'AFM' | 'FLD';
};

export type TakeoffTable = {
  title: string;
  rows: TakeoffResult[];
};

export type LandingLimit = {
  weight: number;
  code: 'A' | 'F';
};

export type LandingGridRunway = {
  designator: string;
  length: number;
  dry: LandingLimit;
  wet: LandingLimit;
  headwind: { dry: number; wet: number };
  tailwind: { dry: number; wet: number };
};

export type LandingDistance = {
  weight: number;
  vref: number;
  actualDry: number;
  actualWet: number;
  factoredDry: number;
  factoredWet: number;
};

export type DistanceCorrection = {
  actualDry: number;
  actualWet: number;
  factoredDry: number;
  factoredWet: number;
};

export type Conditions = {
  airport: string;
  runway: string;
  temperature: number;
  windDirection: number;
  windSpeed: number;
  altimeter: string;
};

export type TlrReport = {
  callsign: string;
  origin: string;
  destination: string;
  generated: Date;
  sequence: string;
  registration: string;
  aircraftName: string;
  engines: string;
  operatingEmpty: number;
  takeoff: Conditions & {
    maxRunwayWeight: number;
    flap: string;
    flexTemperature: number;
    v1: number;
    vr: number;
    v2: number;
    plannedWeight: number;
    maxPerformanceWeight: number;
    limit: string;
    thrust: string;
    bleeds: string;
    runways: TlrRunway[];
    tables: TakeoffTable[];
  };
  landing: Conditions & {
    maxRunwayWeight: number;
    flap: string;
    plannedWeight: number;
    limit: string;
    surface: 'DRY' | 'WET';
    configuration: string;
    runways: TlrRunway[];
    oats: number[];
    plannedOat: number;
    grid: LandingGridRunway[];
    distances: LandingDistance[];
    plannedDistance: number;
    headwindPerKnot: DistanceCorrection;
    tailwindPerKnot: DistanceCorrection;
  };
};

const ACARS_RUNWAYS =
  '--------------------------- ACARS RUNWAYS --------------------------';
const GRID_COLUMNS = 4;
const GRID_WIDTH = 15;

function speed(value: number): string {
  return zero(value % 100, 2);
}

function windText(conditions: Conditions): string {
  return `${heading(conditions.windDirection)}M${zero(conditions.windSpeed, 2)}`;
}

function conditionColumns(conditions: Conditions): string {
  return `${left(conditions.airport, 6)}${left(conditions.runway, 6)}${left(conditions.temperature.toFixed(1), 5)}${left(windText(conditions), 7)}${left(conditions.altimeter, 6)}`;
}

function runwayRows(runways: TlrRunway[]): string[] {
  return runways.map(
    (runway) =>
      `${left(runway.designator, 13)}${' '.repeat(5)}${right(runway.length, 8)}${right(hundreds(runway.maxWeight), 6)}${runway.notes === '' ? '' : ` ${runway.notes}`}`,
  );
}

function takeoffTable(table: TakeoffTable, config: string): string[] {
  return [
    banner(table.title, '-'),
    'RWY          MTOW MT CONFIG                   FLP  V1  VR  V2  LIMIT',
    ...table.rows.map(
      (row) =>
        `${left(row.designator, 13)}${right(hundreds(row.maxWeight), 4)} ${zero(row.flexTemperature, 2)} ${left(config, 25)}${right(row.flap, 3)} ${zero(row.v1, 3)} ${zero(row.vr, 3)} ${zero(row.v2, 3)}  ${row.limit}`,
    ),
    '',
  ];
}

function joinColumns(cells: string[]): string {
  return cells
    .map((cell, index) =>
      index === cells.length - 1 ? cell : left(cell, GRID_WIDTH),
    )
    .join('');
}

function limit(value: LandingLimit): string {
  return `${hundreds(value.weight)}${value.code}`;
}

function landingGrid(report: TlrReport['landing']): string[] {
  const lines: string[] = [];

  for (let start = 0; start < report.grid.length; start += GRID_COLUMNS) {
    const group = report.grid.slice(start, start + GRID_COLUMNS);

    lines.push(
      `${' '.repeat(12)}${joinColumns(group.map((runway) => runway.designator))}`,
      `  OAT       ${joinColumns(group.map((runway) => `${runway.length} FT`))}`,
      ...report.oats.map(
        (oat) =>
          `${oat === report.plannedOat ? ' / ' : '   '}${left(oat < 0 ? `-${zero(oat, 1)}` : zero(oat, 2), 2)}       ${joinColumns(group.map((runway) => `${limit(runway.dry)}/${limit(runway.wet)}`))}`,
      ),
      `HW/10KT     ${group.map((runway) => `${right(runway.headwind.dry, 5)}/${right(runway.headwind.wet, 5)}`).join('    ')}`,
      `TW/10KT     ${group.map((runway) => `${right(runway.tailwind.dry, 5)}/${right(runway.tailwind.wet, 5)}`).join('    ')}`,
      '',
    );
  }

  return lines;
}

function distanceRows(report: TlrReport['landing']): string[] {
  const correction = (label: string, values: DistanceCorrection) =>
    `${label}${right(values.actualDry, 17)}${right(values.actualWet, 9)}${right(values.factoredDry, 9)}${right(values.factoredWet, 9)}`;

  return [
    banner(`LANDING DISTANCE - FLAPS ${report.flap} - MAX MANUAL BRAKING`, '-'),
    '                   ACTUAL            FACTORED',
    '  LDW     VREF     DRY      WET      DRY      WET',
    ...report.distances.map(
      (row) =>
        `${row.weight === report.plannedDistance ? '/ ' : '  '}${hundreds(row.weight)}${right(row.vref, 7)}${right(row.actualDry, 9)}${right(row.actualWet, 9)}${right(row.factoredDry, 9)}${right(row.factoredWet, 9)}`,
    ),
    correction('HW/KT', report.headwindPerKnot),
    correction('TW/KT', report.tailwindPerKnot),
  ];
}

export function renderTlr(report: TlrReport): string {
  const { takeoff, landing } = report;
  const route = `${report.origin}-${report.destination}`;
  const date = shortDate(report.generated);
  const config = `${takeoff.thrust} - ${takeoff.bleeds}`;

  return [
    `TAKEOFF AND LANDING REPORT ${report.callsign} ${route} ${date}`,
    `TLR-1 SEQ-${report.sequence} ${date} ${clock(report.generated)}Z`,
    `A/C ${report.registration}  ${report.aircraftName} ${report.engines}  BEW/CG ${report.operatingEmpty}/.....`,
    '',
    '/// TAKEOFF DATA ///',
    '',
    'APT   PRWY  POAT PWIND  PQNH  PMRTW FLP MT V1 VR V2 PTOW MFPTW LIMIT',
    `${conditionColumns(takeoff)}${left(hundreds(takeoff.maxRunwayWeight), 6)}${left(takeoff.flap, 4)}${left(zero(takeoff.flexTemperature, 2), 3)}${left(speed(takeoff.v1), 3)}${left(speed(takeoff.vr), 3)}${left(speed(takeoff.v2), 3)}${left(hundreds(takeoff.plannedWeight), 5)}${left(hundreds(takeoff.maxPerformanceWeight), 6)}${takeoff.limit}`,
    '',
    `RMKS ${takeoff.thrust} - SEL TEMP ${zero(takeoff.flexTemperature, 2)}`,
    `     ${takeoff.bleeds}`,
    '',
    '---- ---- ------ ----- ------- --- --- --- --- --- -----------------',
    'RWY  OAT  WIND   QNH   MRTW    FLP V1  VR  V2  PWR CONFIG/CONDITION',
    '',
    ACARS_RUNWAYS,
    'RWY          ACARS  LENGTH PMTOW NOTES',
    ...runwayRows(takeoff.runways),
    '',
    ...takeoff.tables.flatMap((table) => takeoffTable(table, config)),
    '/// LANDING DATA ///',
    '',
    'APT   PRWY  POAT PWIND  PQNH  PMRLW FLP  PLDW  LIMIT',
    `${conditionColumns(landing)}${left(hundreds(landing.maxRunwayWeight), 6)}${left(landing.flap, 5)}${left(hundreds(landing.plannedWeight), 6)}${landing.limit}`,
    '',
    `RMKS ${landing.surface} RUNWAY`,
    '',
    '-------- ---- ------ ----- ------- --- ----- --- -------------------',
    'RWY      OAT  WIND   QNH   MRLW    FLP VREF  PWR CONFIG/CONDITION',
    '',
    ACARS_RUNWAYS,
    'RWY          ACARS  LENGTH PMRLW NOTES',
    ...runwayRows(landing.runways),
    '',
    banner(landing.configuration, '-'),
    'DRY RWY / WET RWY',
    ...landingGrid(landing),
    ...distanceRows(landing),
    '',
    `END TAKEOFF AND LANDING REPORT ${report.callsign} ${route} ${date}`,
  ].join('\n');
}

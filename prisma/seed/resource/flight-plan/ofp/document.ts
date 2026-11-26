import { SeededRouteFix, SeededWindLevel } from '../../planned-routes.seed';
import {
  FirCrossing,
  Ofp,
  OfpAirport,
  OfpAlternate,
  OfpFix,
  OfpFuel,
  OfpImpact,
  OfpNotam,
  WeatherReport,
  WindLevel,
} from './model';
import { AircraftPerformance, performanceOf } from './performance';
import {
  LandingDistance,
  LandingGridRunway,
  LandingLimit,
  TakeoffResult,
  TlrReport,
  TlrRunway,
} from './tlr';
import { hashOf, zero } from './text';

export type OfpRunwayInput = {
  designator: string;
  length: number;
  trueHeading: number | null;
  magneticHeading: number;
};

export type OfpAirportInput = {
  icao: string;
  iata: string;
  name: string;
  timezone: string;
  latitude: number;
  longitude: number;
  runways: OfpRunwayInput[];
  metar: WeatherReport | null;
  taf: WeatherReport | null;
  notams: OfpNotam[];
};

export type OfpSchedule = {
  out: Date;
  off: Date;
  on: Date;
  in: Date;
};

export type OfpLoad = {
  passengers: number;
  cargo: number;
};

export type OfpFuelPlan = {
  taxi: number;
  contingency: number;
  contingencyRule: string;
  alternate: number;
  reserve: number;
};

export type OfpInput = {
  requestId: string;
  callsign: string;
  atcCallsign: string;
  registration: string;
  aircraftType: string;
  selcal: string | null;
  departure: OfpAirportInput;
  destination: OfpAirportInput;
  alternates: OfpAirportInput[];
  departureRunway: string | null;
  arrivalRunway: string | null;
  schedule: OfpSchedule;
  estimate: OfpSchedule | null;
  generated: Date | null;
  route: string;
  atcRoute: string;
  fixes: SeededRouteFix[];
  load: OfpLoad | null;
  fuel: OfpFuelPlan | null;
};

export type OfpDocument = {
  ofp: Ofp;
  tlr: TlrReport;
};

type Conditions = {
  temperature: number;
  windDirection: number;
  windSpeed: number;
  qnh: number;
  inches: boolean;
  wet: boolean;
};

const FEET_PER_METRE = 3.28084;
const EARTH_RADIUS_NM = 3440.065;
const PASSENGER_MASS = 79.4;
const BAG_MASS = 25;
const RELEASE_LEAD_SECONDS = 90 * 60;
const RESERVE_SECONDS = 30 * 60;
const STANDARD_LEVELS = [
  0, 5000, 10000, 14000, 18000, 24000, 30000, 34000, 39000, 45000,
];
const LONG_HAUL_SECONDS = 4 * 3600;
const FACTOR_DRY = 1.371;
const FACTOR_WET = 1.321;
const WET_TAKEOFF_FACTOR = 1.0253;
const FLEX_PER_MARGIN = 196;
const DISPATCHER = 'OPS CONTROL';

const FIR_NAMES: Record<string, string> = {
  BIRD: 'REYKJAVIK FIR',
  CZQM: 'MONCTON FIR/UIR',
  CZQX: 'GANDER OCEANIC',
  CZUL: 'MONTREAL FIR/UIR',
  EDGG: 'LANGEN FIR',
  EDMM: 'MUENCHEN FIR',
  EDUU: 'RHEIN UIR',
  EDVV: 'HANNOVER UIR',
  EDWW: 'BREMEN FIR',
  EGGX: 'SHANWICK OCEANIC',
  EGPX: 'SCOTTISH FIR/UIR',
  EGTT: 'LONDON FIR/UIR',
  EHAA: 'AMSTERDAM FIR',
  EISN: 'SHANNON FIR/UIR',
  EPWW: 'WARSZAWA FIR',
  KZBW: 'BOSTON FIR/UIR',
  KZDC: 'WASHINGTON FIR/UIR',
  KZNY: 'NEW YORK FIR/UIR',
};

const AIRPORT_FIRS: Record<string, string> = {
  EDDF: 'EDGG',
  EDDW: 'EDWW',
  EPWA: 'EPWW',
  EPMO: 'EPWW',
  KBOS: 'KZBW',
  KJFK: 'KZNY',
  KPHL: 'KZDC',
  CYYR: 'CZUL',
  CYYT: 'CZQX',
  BIKF: 'BIRD',
};

function radians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function degrees(value: number): number {
  return (value * 180) / Math.PI;
}

function normalise(heading: number): number {
  const value = Math.round(((heading % 360) + 360) % 360);

  return value === 0 ? 360 : value;
}

function distanceBetween(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number },
): number {
  const dLat = radians(to.latitude - from.latitude);
  const dLon = radians(to.longitude - from.longitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radians(from.latitude)) *
      Math.cos(radians(to.latitude)) *
      Math.sin(dLon / 2) ** 2;

  return 2 * EARTH_RADIUS_NM * Math.asin(Math.sqrt(a));
}

function bearingBetween(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number },
): number {
  const y =
    Math.sin(radians(to.longitude - from.longitude)) *
    Math.cos(radians(to.latitude));
  const x =
    Math.cos(radians(from.latitude)) * Math.sin(radians(to.latitude)) -
    Math.sin(radians(from.latitude)) *
      Math.cos(radians(to.latitude)) *
      Math.cos(radians(to.longitude - from.longitude));

  return normalise(degrees(Math.atan2(y, x)));
}

function isaTemperature(altitude: number): number {
  return Math.max(-56.5, 15 - 1.98 * (altitude / 1000));
}

function speedOfSound(temperature: number): number {
  return 38.967854 * Math.sqrt(temperature + 273.15);
}

function headwind(windDirection: number, windSpeed: number, track: number) {
  return windSpeed * Math.cos(radians(windDirection - track));
}

function syntheticWind(seed: number, altitude: number): SeededWindLevel {
  return {
    altitude,
    direction: normalise(255 + (seed % 31)),
    speed: Math.round(8 + (altitude / 1000) * 1.7 + ((seed >>> 5) % 9)),
    oat: Math.round(isaTemperature(altitude) + 4 + ((seed >>> 9) % 5)),
  };
}

function windLevelsOf(fix: SeededRouteFix, seed: number): WindLevel[] {
  const levels =
    fix.windLevels.length > 0
      ? fix.windLevels
      : STANDARD_LEVELS.map((altitude) => syntheticWind(seed, altitude));

  return levels.map((level) => ({ ...level }));
}

function shearAt(levels: WindLevel[], altitude: number): number {
  const sorted = [...levels].sort((a, b) => a.altitude - b.altitude);
  const above = sorted.find((level) => level.altitude > altitude);
  const below = [...sorted]
    .reverse()
    .find((level) => level.altitude <= altitude);

  if (above === undefined || below === undefined) {
    return 1;
  }

  const vector = (level: WindLevel) => [
    level.speed * Math.sin(radians(level.direction)),
    level.speed * Math.cos(radians(level.direction)),
  ];
  const [ax, ay] = vector(above);
  const [bx, by] = vector(below);
  const span = (above.altitude - below.altitude) / 1000;

  return Math.min(
    9,
    Math.max(1, Math.round(Math.hypot(ax - bx, ay - by) / span)),
  );
}

function stageOf(stage: string): string {
  return stage === 'DES' ? 'DSC' : stage;
}

function typeOf(ident: string, index: number, last: number): string {
  if (index === last) {
    return 'apt';
  }

  if (ident === 'TOC' || ident === 'TOD' || /\d/.test(ident.slice(0, 2))) {
    return 'ltlg';
  }

  return ident.length === 3 ? 'vor' : 'wpt';
}

function nameOf(ident: string, type: string, destination: OfpAirportInput) {
  if (ident === 'TOC') {
    return 'TOP OF CLIMB';
  }

  if (ident === 'TOD') {
    return 'TOP OF DESCENT';
  }

  return type === 'apt' ? destination.name : ident;
}

function trueAirspeed(
  stage: string,
  altitude: number,
  temperature: number,
  performance: AircraftPerformance,
): number {
  const indicated =
    altitude < 10000
      ? 250
      : stage === 'CLB'
        ? 300
        : stage === 'DSC'
          ? 290
          : 285;
  const fromIndicated = indicated * (1 + 0.02 * (altitude / 1000));
  const fromMach = performance.cruiseMach * speedOfSound(temperature);

  return Math.round(Math.min(fromIndicated, fromMach));
}

function completeFuel(fixes: SeededRouteFix[]): {
  used: number[];
  onBoard: number[];
  takeoff: number;
} {
  const used: number[] = [];

  fixes.forEach((fix, index) => {
    if (index === 0) {
      used.push(0);
      return;
    }

    const previous = used[index - 1];
    const leg =
      fix.fuelLeg ??
      (fix.fuelFlow === null
        ? 0
        : Math.round(
            (fix.fuelFlow *
              (fix.elapsedSeconds - fixes[index - 1].elapsedSeconds)) /
              3600,
          ));

    used.push(fix.fuelUsed ?? previous + leg);
  });

  const reference = fixes.findIndex(
    (fix, index) => index > 0 && fix.fuelPlannedOnBoard !== null,
  );
  const takeoff =
    reference === -1
      ? Math.round(used[used.length - 1] * 1.25)
      : fixes[reference].fuelPlannedOnBoard! + used[reference];

  return { used, onBoard: used.map((value) => takeoff - value), takeoff };
}

function navlogOf(
  input: OfpInput,
  performance: AircraftPerformance,
  used: number[],
  onBoard: number[],
): OfpFix[] {
  const fixes = input.fixes;
  const last = fixes.length - 1;
  const seed = hashOf(input.callsign + input.route);
  const fallbackFirs = [
    AIRPORT_FIRS[input.departure.icao] ?? '',
    AIRPORT_FIRS[input.destination.icao] ?? '',
  ];

  return fixes.slice(1).map((fix, offset) => {
    const index = offset + 1;
    const previous = fixes[index - 1];
    const fixSeed = seed + index * 7919;
    const winds = windLevelsOf(fix, fixSeed);
    const synthetic = syntheticWind(fixSeed, fix.altitude);
    const temperature = fix.oat ?? synthetic.oat;
    const windDirection = fix.windDirection ?? synthetic.direction;
    const windSpeed = fix.windSpeed ?? synthetic.speed;
    const trackTrue =
      fix.trackTrue ??
      bearingBetween(
        { latitude: previous.posLat, longitude: previous.posLong },
        { latitude: fix.posLat, longitude: fix.posLong },
      );
    const trackMag = fix.trackMag ?? trackTrue;
    const stage = stageOf(fix.stage);
    const component = -Math.round(
      headwind(windDirection, windSpeed, trackTrue),
    );
    const tas = trueAirspeed(stage, fix.altitude, temperature, performance);
    const type = typeOf(fix.ident, index, last);
    const fir =
      fix.fir ?? (index < fixes.length / 2 ? fallbackFirs[0] : fallbackFirs[1]);

    return {
      ident: fix.ident,
      name: nameOf(fix.ident, type, input.destination),
      type,
      frequency: null,
      latitude: fix.posLat,
      longitude: fix.posLong,
      stage,
      airway: fix.viaAirway ?? 'DCT',
      distance: fix.distanceNm ?? 0,
      trackTrue,
      trackMag,
      altitude: fix.altitude,
      mach: Math.round((tas / speedOfSound(temperature)) * 100) / 100,
      trueAirspeed: tas,
      groundSpeed: Math.max(80, tas + component),
      windComponent: component,
      elapsedSeconds: fix.elapsedSeconds,
      fuelUsed: used[index],
      fuelOnBoard: onBoard[index],
      oat: temperature,
      isaDeviation:
        fix.isaDeviation ??
        Math.round(temperature - isaTemperature(fix.altitude)),
      windDirection,
      windSpeed,
      shear: shearAt(winds, fix.altitude),
      tropopause: fix.tropopause ?? 36000 + ((fixSeed >>> 3) % 40) * 100,
      mora: fix.mora ?? 2000 + ((fixSeed >>> 4) % 22) * 100,
      fir,
      firCrossing: null,
      winds,
    };
  });
}

function withFirCrossings(navlog: OfpFix[]): OfpFix[] {
  return navlog.map((fix, index) => {
    const previous = navlog[index - 1];

    if (
      previous === undefined ||
      fix.fir === '' ||
      previous.fir === '' ||
      fix.fir === previous.fir
    ) {
      return fix;
    }

    const crossing: FirCrossing = {
      code: fix.fir,
      name: FIR_NAMES[fix.fir] ?? `${fix.fir} FIR`,
      latitude: (previous.latitude + fix.latitude) / 2,
      longitude: (previous.longitude + fix.longitude) / 2,
    };

    return { ...fix, firCrossing: crossing };
  });
}

function parseMetar(metar: WeatherReport | null): Partial<Conditions> {
  if (metar === null) {
    return {};
  }

  const text = metar.text;
  const wind = text.match(/\b(\d{3}|VRB)(\d{2,3})(?:G\d{2,3})?KT\b/);
  const temperature = text.match(/\s(M?\d{2})\/(M?\d{2})?\s/);
  const hectopascal = text.match(/\bQ(\d{4})\b/);
  const inches = text.match(/\bA(\d{4})\b/);
  const parsed = (value: string) =>
    value.startsWith('M') ? -Number(value.slice(1)) : Number(value);

  return {
    ...(wind === null || wind[1] === 'VRB'
      ? {}
      : { windDirection: Number(wind[1]), windSpeed: Number(wind[2]) }),
    ...(temperature === null ? {} : { temperature: parsed(temperature[1]) }),
    ...(hectopascal !== null
      ? { qnh: Number(hectopascal[1]), inches: false }
      : inches !== null
        ? { qnh: Number(inches[1]) / 100, inches: true }
        : {}),
    wet: /(^|\s)[-+]?(RA|DZ|SN|SHRA|TSRA|FZRA)\b/.test(text),
  };
}

function usesInches(icao: string): boolean {
  return /^[KCP]/.test(icao);
}

function variationOf(runway: OfpRunwayInput): number {
  return runway.trueHeading === null
    ? 0
    : runway.trueHeading - runway.magneticHeading;
}

function conditionsAt(
  airport: OfpAirportInput,
  runway: OfpRunwayInput,
  when: Date,
): Conditions {
  const seed = hashOf(`${airport.icao}${when.toISOString().slice(0, 10)}`);
  const month = when.getUTCMonth();
  const season =
    -8 *
    Math.cos(((month + 0.5) / 12) * 2 * Math.PI) *
    (airport.latitude < 0 ? -1 : 1);
  const synthetic: Conditions = {
    temperature: Math.round(
      18 - 0.4 * (Math.abs(airport.latitude) - 30) + season + ((seed % 5) - 2),
    ),
    windDirection: normalise(runway.magneticHeading + ((seed >>> 3) % 41) - 20),
    windSpeed: 4 + ((seed >>> 9) % 11),
    qnh: usesInches(airport.icao)
      ? (2980 + ((seed >>> 13) % 60)) / 100
      : 1003 + ((seed >>> 13) % 25),
    inches: usesInches(airport.icao),
    wet: false,
  };
  const reported = parseMetar(airport.metar);

  return {
    ...synthetic,
    ...reported,
    windDirection:
      reported.windDirection === undefined
        ? synthetic.windDirection
        : normalise(reported.windDirection - variationOf(runway)),
  };
}

function longestRunway(runways: OfpRunwayInput[]): OfpRunwayInput {
  return [...runways].sort(
    (a, b) => b.length - a.length || a.designator.localeCompare(b.designator),
  )[0];
}

function plannedRunway(
  airport: OfpAirportInput,
  requested: string | null,
): OfpRunwayInput {
  const exact = airport.runways.find(
    (runway) => runway.designator === requested,
  );

  if (exact !== undefined) {
    return exact;
  }

  const reported = parseMetar(airport.metar);

  if (
    reported.windDirection !== undefined &&
    reported.windSpeed !== undefined
  ) {
    const into = [...airport.runways].sort(
      (a, b) =>
        headwind(
          reported.windDirection!,
          reported.windSpeed!,
          b.trueHeading ?? b.magneticHeading,
        ) -
          headwind(
            reported.windDirection!,
            reported.windSpeed!,
            a.trueHeading ?? a.magneticHeading,
          ) || b.length - a.length,
    );

    return into[0];
  }

  return longestRunway(airport.runways);
}

function feet(metres: number): number {
  return Math.round(metres * FEET_PER_METRE);
}

function airportOf(
  input: OfpAirportInput,
  runway: string,
  elevation: number,
): OfpAirport {
  return {
    icao: input.icao,
    iata: input.iata,
    name: input.name,
    timezone: input.timezone,
    latitude: input.latitude,
    longitude: input.longitude,
    elevation,
    runway,
    metar: input.metar,
    taf: input.taf,
    notams: input.notams,
  };
}

function alternateOf(
  input: OfpAirportInput,
  destination: OfpAirportInput,
  performance: AircraftPerformance,
  arrivalWind: { direction: number; speed: number },
): OfpAlternate {
  const distance = Math.round(distanceBetween(destination, input) * 1.08 + 12);
  const trackTrue = bearingBetween(destination, input);
  const cruiseAltitude = Math.min(
    37000,
    Math.max(10000, Math.round((distance * 1.6) / 10) * 1000),
  );
  const windComponent = -Math.round(
    headwind(arrivalWind.direction, arrivalWind.speed * 0.6, trackTrue),
  );
  const ete = Math.round(
    (distance / Math.max(180, 280 + cruiseAltitude / 200 + windComponent)) *
      3600 +
      480,
  );
  const runway =
    input.runways.length === 0 ? null : longestRunway(input.runways);

  return {
    ...airportOf(input, runway?.designator ?? '', 0),
    distance,
    trackTrue,
    route: 'DCT',
    cruiseAltitude,
    windComponent,
    ete,
    burn: Math.round((performance.alternateFuelFlow * ete) / 3600 / 10) * 10,
  };
}

function fuelPlan(
  input: OfpInput,
  performance: AircraftPerformance,
  trip: number,
  takeoff: number,
  enroute: number,
  alternateBurn: number,
): OfpFuel {
  if (input.fuel !== null) {
    const { contingency, alternate, reserve } = input.fuel;

    return {
      ...input.fuel,
      trip,
      extra: Math.max(0, takeoff - trip - contingency - alternate - reserve),
      takeoff,
      ramp: takeoff + input.fuel.taxi,
      landing: takeoff - trip,
    };
  }

  const available = takeoff - trip;
  const holding = performance.holdingFuelFlow / 60;
  const fiveMinutes = Math.round(holding * 5);
  const longHaul = enroute > LONG_HAUL_SECONDS;
  const percentage = Math.round(trip * (longHaul ? 0.03 : 0.05));
  const rule = longHaul ? '3%' : percentage >= fiveMinutes ? '5%' : '5 MIN';
  let contingency = rule === '5 MIN' ? fiveMinutes : percentage;
  let reserve = Math.round(performance.holdingFuelFlow / 2 / 10) * 10;
  let alternate = alternateBurn;

  if (contingency + alternate + reserve > available) {
    alternate = Math.max(0, available - contingency - reserve);
  }

  if (contingency + alternate + reserve > available) {
    reserve = Math.max(0, Math.min(reserve, available - contingency));
    contingency = Math.max(0, available - reserve);
  }

  return {
    taxi: performance.taxiFuel,
    trip,
    contingency,
    contingencyRule: rule,
    alternate,
    reserve,
    extra: available - contingency - alternate - reserve,
    takeoff,
    ramp: takeoff + performance.taxiFuel,
    landing: available,
  };
}

function steps(input: OfpInput, navlog: OfpFix[]): string {
  const cruise = navlog.filter(
    (fix) => fix.stage === 'CRZ' || fix.ident === 'TOC',
  );
  const parts: string[] = [];
  let level = 0;

  for (const fix of cruise) {
    if (fix.altitude > level) {
      parts.push(
        parts.length === 0 ? input.departure.icao : fix.ident,
        zero(fix.altitude / 100, 4),
      );
      level = fix.altitude;
    }
  }

  return parts.join('/');
}

function averages(navlog: OfpFix[]) {
  let seconds = 0;
  let x = 0;
  let y = 0;
  let component = 0;
  let deviation = 0;
  let air = 0;
  let previous = 0;

  for (const fix of navlog) {
    const leg = Math.max(1, fix.elapsedSeconds - previous);
    previous = fix.elapsedSeconds;
    seconds += leg;
    x += fix.windSpeed * Math.sin(radians(fix.windDirection)) * leg;
    y += fix.windSpeed * Math.cos(radians(fix.windDirection)) * leg;
    component += fix.windComponent * leg;
    deviation += fix.isaDeviation * leg;
    air +=
      fix.groundSpeed > 0
        ? (fix.distance * fix.trueAirspeed) / fix.groundSpeed
        : fix.distance;
  }

  return {
    windDirection: normalise(degrees(Math.atan2(x, y))),
    windSpeed: Math.round(Math.hypot(x, y) / seconds),
    windComponent: Math.round(component / seconds),
    isaDeviation: Math.round(deviation / seconds),
    airDistance: Math.round(air),
  };
}

function impacts(
  trip: number,
  enroute: number,
  cruise: number,
  performance: AircraftPerformance,
): OfpImpact[] {
  const hours = enroute / 3600;
  const percent = (value: number) => Math.round(trip * value);

  return [
    {
      label: 'WEIGHT CHANGE UP 1.0',
      fuel: Math.round(35 * hours),
      time: -0,
    },
    {
      label: 'WEIGHT CHANGE DN 1.0',
      fuel: -Math.round(33 * hours),
      time: 0,
    },
    cruise + 2000 > performance.ceiling
      ? { label: 'FL CHANGE     UP FL1', fuel: null, time: null }
      : { label: 'FL CHANGE     UP FL1', fuel: -percent(0.004), time: 0 },
    { label: 'FL CHANGE     DN FL1', fuel: percent(0.006), time: -0 },
    { label: 'FL CHANGE     DN FL2', fuel: percent(0.014), time: -0 },
    {
      label: 'SPD CHANGE    CI 0',
      fuel: -percent(0.02),
      time: Math.round(enroute * 0.015),
    },
    {
      label: 'SPD CHANGE    CI 100',
      fuel: percent(0.012),
      time: -Math.round(enroute * 0.008),
    },
  ];
}

function takeoffLimit(
  performance: AircraftPerformance,
  lengthFeet: number,
  wet: boolean,
): { weight: number; limited: boolean } {
  const required = performance.takeoffDistance * (wet ? WET_TAKEOFF_FACTOR : 1);
  const weight = performance.maxTakeoff * Math.sqrt(lengthFeet / required);

  return weight >= performance.maxTakeoff
    ? { weight: performance.maxTakeoff, limited: false }
    : { weight: Math.round(weight / 100) * 100, limited: true };
}

function rotationSpeed(performance: AircraftPerformance, weight: number) {
  const { rotation } = performance;

  return Math.round(
    rotation.speed + rotation.perTonne * (weight / 1000 - rotation.weight),
  );
}

function flexTemperature(
  performance: AircraftPerformance,
  weight: number,
  limit: number,
  temperature: number,
): number {
  return Math.max(
    Math.round(temperature) + 1,
    Math.min(
      performance.maxFlex,
      Math.round(temperature + (1 - weight / limit) * FLEX_PER_MARGIN),
    ),
  );
}

function takeoffResult(
  performance: AircraftPerformance,
  runway: OfpRunwayInput,
  weight: number,
  temperature: number,
  wet: boolean,
  heavier: boolean,
): TakeoffResult {
  const limit = takeoffLimit(performance, feet(runway.length), wet);
  const vr =
    rotationSpeed(performance, weight) + (heavier ? 3 : 0) + (wet ? 1 : 0);
  const reduction = limit.limited ? (wet ? 8 : 3) : 0;

  return {
    designator: runway.designator,
    maxWeight: limit.weight,
    flexTemperature: flexTemperature(
      performance,
      weight,
      limit.weight,
      temperature,
    ),
    flap: performance.takeoffFlap,
    v1: vr - reduction,
    vr,
    v2: vr + 4,
    limit: limit.limited ? 'FLD' : 'AFM',
  };
}

function landingActual(performance: AircraftPerformance, weight: number) {
  const { landingDistance } = performance;

  return Math.round(
    landingDistance.dry +
      landingDistance.perTonne * (weight / 1000 - landingDistance.weight),
  );
}

function landingFieldWeight(
  performance: AircraftPerformance,
  lengthFeet: number,
  wet: boolean,
): number {
  const { landingDistance } = performance;
  const actual = wet
    ? lengthFeet / FACTOR_WET / landingDistance.wetFactor
    : lengthFeet / FACTOR_DRY;

  return (
    (landingDistance.weight +
      (actual - landingDistance.dry) / landingDistance.perTonne) *
    1000
  );
}

function landingLimit(
  performance: AircraftPerformance,
  field: number,
): LandingLimit {
  return field >= performance.maxLanding
    ? { weight: performance.maxLanding, code: 'A' }
    : { weight: Math.round(field / 100) * 100, code: 'F' };
}

function gridRunway(
  performance: AircraftPerformance,
  runway: OfpRunwayInput,
): LandingGridRunway {
  const length = feet(runway.length);
  const cap = (weight: number) => Math.min(weight, performance.maxLanding);
  const dryField = landingFieldWeight(performance, length, false);
  const wetField = landingFieldWeight(performance, length, true);
  const dry = landingLimit(performance, dryField);
  const wet = landingLimit(performance, wetField);
  const correction = (field: number, factor: number) =>
    Math.round(cap(field * factor) - cap(field));

  return {
    designator: runway.designator,
    length,
    dry,
    wet,
    headwind: {
      dry: correction(dryField, 1.0071),
      wet: correction(wetField, 1.0071),
    },
    tailwind: {
      dry: correction(dryField, 0.9757),
      wet: correction(wetField, 0.9757),
    },
  };
}

function landingDistances(
  performance: AircraftPerformance,
  planned: number,
): LandingDistance[] {
  const { reference, landingDistance } = performance;

  return [-2000, -1000, 0, 1000, 2000].map((offset) => {
    const weight = planned + offset;
    const actualDry = landingActual(performance, weight);
    const actualWet = Math.round(actualDry * landingDistance.wetFactor);

    return {
      weight,
      vref: Math.round(
        reference.speed +
          reference.perTonne * (weight / 1000 - reference.weight),
      ),
      actualDry,
      actualWet,
      factoredDry: Math.round(actualDry * FACTOR_DRY),
      factoredWet: Math.round(actualWet * FACTOR_WET),
    };
  });
}

function altimeter(conditions: Conditions): string {
  return conditions.inches
    ? conditions.qnh.toFixed(2)
    : String(Math.round(conditions.qnh));
}

function byDesignator(runways: OfpRunwayInput[]): OfpRunwayInput[] {
  return [...runways].sort((a, b) => a.designator.localeCompare(b.designator));
}

function tlrReport(
  input: OfpInput,
  performance: AircraftPerformance,
  generated: Date,
  takeoffWeight: number,
  landingWeight: number,
  maxPerformanceWeight: number,
  departure: { runway: OfpRunwayInput; conditions: Conditions },
  arrival: { runway: OfpRunwayInput; conditions: Conditions },
): TlrReport {
  const plusTwo = takeoffWeight + 2000;
  const departureRunways = byDesignator(input.departure.runways);
  const arrivalRunways = byDesignator(input.destination.runways);
  const oat = departure.conditions.temperature;
  const table = (
    title: string,
    weight: number,
    wet: boolean,
    heavier: boolean,
  ) => ({
    title,
    rows: departureRunways.map((runway) =>
      takeoffResult(performance, runway, weight, oat, wet, heavier),
    ),
  });
  const planned = takeoffResult(
    performance,
    departure.runway,
    takeoffWeight,
    oat,
    departure.conditions.wet,
    false,
  );
  const runwayRow = (runway: OfpRunwayInput, maxWeight: number): TlrRunway => ({
    designator: runway.designator,
    length: feet(runway.length),
    maxWeight,
    notes: '',
  });
  const landingOat = Math.round(arrival.conditions.temperature);
  const plannedDistance = Math.ceil(landingWeight / 1000) * 1000;

  return {
    callsign: input.callsign,
    origin: input.departure.icao,
    destination: input.destination.icao,
    generated,
    sequence: input.requestId,
    registration: input.registration,
    aircraftName: performance.name,
    engines: performance.engines,
    operatingEmpty: performance.operatingEmpty,
    takeoff: {
      airport: input.departure.icao,
      runway: departure.runway.designator,
      temperature: departure.conditions.temperature,
      windDirection: departure.conditions.windDirection,
      windSpeed: departure.conditions.windSpeed,
      altimeter: altimeter(departure.conditions),
      maxRunwayWeight: takeoffLimit(
        performance,
        feet(departure.runway.length),
        false,
      ).weight,
      flap: performance.takeoffFlap,
      flexTemperature: planned.flexTemperature,
      v1: planned.v1,
      vr: planned.vr,
      v2: planned.v2,
      plannedWeight: takeoffWeight,
      maxPerformanceWeight,
      limit: planned.limit,
      thrust: performance.thrust,
      bleeds: performance.bleeds,
      runways: departureRunways.map((runway) =>
        runwayRow(
          runway,
          takeoffLimit(performance, feet(runway.length), false).weight,
        ),
      ),
      tables: [
        table('DRY RWY - PTOW - CALM WIND', takeoffWeight, false, false),
        table('DRY RWY - PTOW PLUS 2000 - CALM WIND', plusTwo, false, true),
        table(
          'WET RWY - PTOW - CALM WIND - ENG A/I ON',
          takeoffWeight,
          true,
          false,
        ),
        table(
          'WET RWY - PTOW PLUS 2000 - CALM WIND - ENG A/I ON',
          plusTwo,
          true,
          true,
        ),
      ],
    },
    landing: {
      airport: input.destination.icao,
      runway: arrival.runway.designator,
      temperature: arrival.conditions.temperature,
      windDirection: arrival.conditions.windDirection,
      windSpeed: arrival.conditions.windSpeed,
      altimeter: altimeter(arrival.conditions),
      maxRunwayWeight: gridRunway(performance, arrival.runway).dry.weight,
      flap: performance.landingFlap,
      plannedWeight: landingWeight,
      limit: 'AFM',
      surface: arrival.conditions.wet ? 'WET' : 'DRY',
      configuration: `FLAPS ${performance.landingFlap} - PACKS ON - NO ENROUTE ICING`,
      runways: arrivalRunways.map((runway) =>
        runwayRow(runway, gridRunway(performance, runway).dry.weight),
      ),
      oats: [landingOat - 5, landingOat, landingOat + 5],
      plannedOat: landingOat,
      grid: arrivalRunways.map((runway) => gridRunway(performance, runway)),
      distances: landingDistances(performance, plannedDistance),
      plannedDistance,
      headwindPerKnot: {
        actualDry: -Math.round(
          landingActual(performance, plannedDistance) * 0.0058,
        ),
        actualWet: -Math.round(
          landingActual(performance, plannedDistance) *
            performance.landingDistance.wetFactor *
            0.0058,
        ),
        factoredDry: -Math.round(
          landingActual(performance, plannedDistance) * FACTOR_DRY * 0.005,
        ),
        factoredWet: -Math.round(
          landingActual(performance, plannedDistance) *
            performance.landingDistance.wetFactor *
            FACTOR_WET *
            0.0052,
        ),
      },
      tailwindPerKnot: {
        actualDry: Math.round(
          landingActual(performance, plannedDistance) * 0.018,
        ),
        actualWet: Math.round(
          landingActual(performance, plannedDistance) *
            performance.landingDistance.wetFactor *
            0.018,
        ),
        factoredDry: Math.round(
          landingActual(performance, plannedDistance) * FACTOR_DRY * 0.02,
        ),
        factoredWet: Math.round(
          landingActual(performance, plannedDistance) *
            performance.landingDistance.wetFactor *
            FACTOR_WET *
            0.0197,
        ),
      },
    },
  };
}

function firsOf(input: OfpInput, navlog: OfpFix[]): string[] {
  const firs = [
    AIRPORT_FIRS[input.departure.icao] ?? '',
    ...navlog.map((fix) => fix.fir),
    AIRPORT_FIRS[input.destination.icao] ?? '',
  ].filter((fir) => fir !== '');

  return firs.filter((fir, index) => firs.indexOf(fir) === index);
}

export function ofpDocument(input: OfpInput): OfpDocument {
  const performance = performanceOf(input.aircraftType);
  const { used, onBoard, takeoff } = completeFuel(input.fixes);
  const trip = used[used.length - 1];
  const navlog = withFirCrossings(navlogOf(input, performance, used, onBoard));
  const enroute = input.fixes[input.fixes.length - 1].elapsedSeconds;
  const generated =
    input.generated ??
    new Date(
      Math.floor(
        (input.schedule.out.getTime() / 1000 - RELEASE_LEAD_SECONDS) / 60,
      ) *
        60 *
        1000,
    );
  const departureRunway = plannedRunway(input.departure, input.departureRunway);
  const arrivalRunway = plannedRunway(input.destination, input.arrivalRunway);
  const departureConditions = conditionsAt(
    input.departure,
    departureRunway,
    input.schedule.off,
  );
  const arrivalConditions = conditionsAt(
    input.destination,
    arrivalRunway,
    input.schedule.on,
  );
  const lastCruise =
    [...navlog].reverse().find((fix) => fix.stage === 'CRZ') ?? navlog[0];
  const alternates = input.alternates.map((alternate) =>
    alternateOf(alternate, input.destination, performance, {
      direction: lastCruise.windDirection,
      speed: lastCruise.windSpeed,
    }),
  );
  const fuel = fuelPlan(
    input,
    performance,
    trip,
    takeoff,
    enroute,
    alternates[0]?.burn ?? 0,
  );

  if (alternates[0] !== undefined) {
    alternates[0] = { ...alternates[0], burn: fuel.alternate };
  }

  const seed = hashOf(input.callsign + input.registration);
  const passengers =
    input.load?.passengers ??
    Math.round(performance.seats * (0.78 + (seed % 15) / 100));
  const cargo =
    input.load?.cargo ??
    Math.round(
      (passengers * BAG_MASS +
        (performance.freight * ((seed >>> 4) % 10)) / 10) /
        10,
    ) * 10;
  const payload = Math.round(passengers * PASSENGER_MASS + cargo);
  const zeroFuel = performance.operatingEmpty + payload;
  const takeoffWeight = zeroFuel + fuel.takeoff;
  const landingWeight = takeoffWeight - trip;
  const runwayLimit = takeoffLimit(
    performance,
    feet(departureRunway.length),
    departureConditions.wet,
  ).weight;
  const maxTakeoff = Math.min(
    performance.maxTakeoff,
    performance.maxLanding + trip,
    runwayLimit,
  );
  const scheduledTaxiIn =
    input.schedule.in.getTime() - input.schedule.on.getTime();
  const estimate = input.estimate ?? {
    out: input.schedule.out,
    off: input.schedule.off,
    on: new Date(input.schedule.off.getTime() + enroute * 1000),
    in: new Date(
      input.schedule.off.getTime() + enroute * 1000 + scheduledTaxiIn,
    ),
  };
  const average = averages(navlog);
  const holdingPerSecond = performance.holdingFuelFlow / 3600;
  const cruise = Math.max(...navlog.map((fix) => fix.altitude));
  const firs = firsOf(input, navlog);
  const crossings = navlog
    .map((fix, index) => ({ fix, index }))
    .filter(({ fix }) => fix.firCrossing !== null)
    .map(({ fix, index }) => ({
      fir: fix.fir,
      elapsedSeconds: navlog[index - 1]?.elapsedSeconds ?? 0,
    }));
  const firEstimates =
    crossings.length > 0 || firs.length < 2
      ? crossings
      : firs.slice(1).map((fir) => ({
          fir,
          elapsedSeconds: Math.round(enroute / 2),
        }));

  const ofp: Ofp = {
    callsign: input.callsign,
    registration: input.registration,
    generated,
    requestId: input.requestId,
    dispatcher: DISPATCHER,
    aircraft: {
      icao: input.aircraftType,
      name: performance.name,
      engines: performance.engines,
      equipment: performance.equipment,
      selcal: input.selcal,
      pbn: performance.pbn,
      approachCategory: performance.approachCategory,
    },
    origin: airportOf(
      input.departure,
      departureRunway.designator,
      input.fixes[0].altitude,
    ),
    destination: airportOf(
      input.destination,
      arrivalRunway.designator,
      input.fixes[input.fixes.length - 1].altitude,
    ),
    alternates,
    general: {
      costIndex: performance.costIndex,
      steps: steps(input, navlog),
      routeDistance: navlog.reduce((sum, fix) => sum + fix.distance, 0),
      airDistance: average.airDistance,
      greatCircleDistance: Math.round(
        distanceBetween(input.departure, input.destination),
      ),
      averageWindDirection: average.windDirection,
      averageWindSpeed: average.windSpeed,
      averageWindComponent: average.windComponent,
      averageIsaDeviation: average.isaDeviation,
      averageFuelFlow: Math.round(trip / (enroute / 3600)),
      route: input.route,
    },
    fuel,
    times: {
      enroute,
      scheduledOut: input.schedule.out,
      scheduledOff: input.schedule.off,
      scheduledOn: input.schedule.on,
      scheduledIn: input.schedule.in,
      estimatedOut: estimate.out,
      estimatedOff: estimate.off,
      estimatedOn: estimate.on,
      estimatedIn: estimate.in,
      taxiOut: Math.round(
        (input.schedule.off.getTime() - input.schedule.out.getTime()) / 1000,
      ),
      reserve: RESERVE_SECONDS,
      contingency: Math.round(fuel.contingency / holdingPerSecond),
      extra: Math.round(fuel.extra / holdingPerSecond),
    },
    weights: {
      operatingEmpty: performance.operatingEmpty,
      passengers,
      cargo,
      payload,
      zeroFuel,
      maxZeroFuel: performance.maxZeroFuel,
      takeoff: takeoffWeight,
      maxTakeoff,
      maxTakeoffStructural: performance.maxTakeoff,
      landing: landingWeight,
      maxLanding: performance.maxLanding,
    },
    impacts: impacts(trip, enroute, cruise, performance),
    navlog,
    atc: {
      callsign: input.atcCallsign,
      route: input.atcRoute,
      departureFir: firs[0] ?? '',
      destinationFir: firs[firs.length - 1] ?? '',
      firs,
      firEstimates,
    },
    runwayAnalysis: '',
  };
  const tlr = tlrReport(
    input,
    performance,
    generated,
    takeoffWeight,
    landingWeight,
    maxTakeoff,
    { runway: departureRunway, conditions: departureConditions },
    { runway: arrivalRunway, conditions: arrivalConditions },
  );

  return { ofp, tlr };
}

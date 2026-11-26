import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaService } from '../../src/core/provider/prisma/prisma.service';
import {
  notamSectionOf,
  OfpAirportInput,
  OfpInput,
  OfpNotam,
  ofpTexts,
  WeatherReport,
} from './resource/flight-plan/ofp';
import {
  SeededRouteFix,
  SeededWindLevel,
} from './resource/planned-routes.seed';

const MOCK_DIRECTORY = join(__dirname, '../../docker/mock/simbrief');
const MOCK_FILE = /^xml\.fetcher-\d+-2\.json$/;
const DIRECT_CRUISE = 36000;
const DIRECT_SPEED = 'N0450';
const CLIMB_SECONDS = 20 * 60;
const CLIMB_DISTANCE = 115;
const DESCENT_SECONDS = 22 * 60;
const DESCENT_DISTANCE = 105;
const CLIMB_BURN = 0.3;
const DESCENT_BURN = 0.88;

type Json = Record<string, any>;
type Location = { latitude: number; longitude: number };

const AIRPORTS_OUTSIDE_SEED: Record<string, OfpAirportInput> = {
  EPMO: {
    icao: 'EPMO',
    iata: 'WMI',
    name: 'Warsaw Modlin',
    timezone: 'Europe/Warsaw',
    latitude: 52.4511,
    longitude: 20.6518,
    runways: [
      {
        designator: '08',
        length: 2500,
        trueHeading: 82,
        magneticHeading: 76,
      },
      {
        designator: '26',
        length: 2500,
        trueHeading: 262,
        magneticHeading: 256,
      },
    ],
    metar: null,
    taf: null,
    notams: [],
  },
};

function text(value: unknown): string | null {
  return typeof value === 'string' && value !== '' ? value : null;
}

function number(value: unknown): number | null {
  const parsed = text(value);

  return parsed === null ? null : Number(parsed);
}

function list<T>(value: T | T[] | undefined): T[] {
  return value === undefined ? [] : Array.isArray(value) ? value : [value];
}

function date(seconds: unknown): Date {
  return new Date(Number(seconds) * 1000);
}

function notamsOf(source: Json): OfpNotam[] {
  return list<Json>(source.notam).map((notam) => ({
    id: notam.notam_id,
    section: notamSectionOf(text(notam.notam_qcode) ?? ''),
    html: text(notam.notam_html) ?? text(notam.notam_text) ?? '',
  }));
}

async function airportOf(
  prisma: PrismaService,
  source: Json,
): Promise<OfpAirportInput | null> {
  const icao = source.icao_code as string;
  const airport = await prisma.airport.findUnique({
    where: { icaoCode: icao },
    include: { runways: true, weather: true },
  });

  if (airport === null) {
    const outside = AIRPORTS_OUTSIDE_SEED[icao];

    return outside === undefined
      ? null
      : { ...outside, notams: notamsOf(source) };
  }

  const location = airport.location as Location;
  const report = (type: 'metar' | 'taf'): WeatherReport | null => {
    const own = text(source[type]);

    if (own !== null) {
      return {
        issued: new Date(source[`${type}_time`] ?? Date.now()),
        text: own,
      };
    }

    const reports = airport.weather.filter(
      (entry) => entry.informationType === type,
    );
    const stored =
      reports.find((entry) => entry.source === 'aviation_weather_gov') ??
      reports[0];

    return stored === undefined
      ? null
      : {
          issued: stored.publishedAt ?? stored.lastFetched,
          text: stored.content,
        };
  };

  return {
    icao: airport.icaoCode,
    iata: airport.iataCode,
    name: airport.name,
    timezone: airport.timezone,
    latitude: location.latitude,
    longitude: location.longitude,
    runways: airport.runways.map((runway) => ({
      designator: runway.designator,
      length: runway.length,
      trueHeading: runway.trueHeading,
      magneticHeading: runway.magneticHeading,
    })),
    metar: report('metar'),
    taf: report('taf'),
    notams: notamsOf(source),
  };
}

function windLevels(fix: Json): SeededWindLevel[] {
  return list<Json>(fix.wind_data?.level).map((level) => ({
    altitude: Number(level.altitude),
    direction: Number(level.wind_dir),
    speed: Number(level.wind_spd),
    oat: Number(level.oat),
  }));
}

function filedFix(fix: Json): SeededRouteFix {
  return {
    ident: fix.ident,
    posLat: Number(fix.pos_lat),
    posLong: Number(fix.pos_long),
    altitude: Number(fix.altitude_feet),
    elapsedSeconds: Number(fix.time_total),
    distanceNm: number(fix.distance),
    trackTrue: number(fix.track_true),
    trackMag: number(fix.track_mag),
    viaAirway: text(fix.via_airway),
    stage: fix.stage,
    fuelFlow: number(fix.fuel_flow),
    fuelLeg: number(fix.fuel_leg),
    fuelUsed: number(fix.fuel_totalused),
    fuelMinimumOnBoard: number(fix.fuel_min_onboard),
    fuelPlannedOnBoard: number(fix.fuel_plan_onboard),
    oat: number(fix.oat),
    isaDeviation: number(fix.oat_isa_dev),
    tropopause: number(fix.tropopause_feet),
    mora: number(fix.mora),
    fir: text(fix.fir),
    windDirection: number(fix.wind_dir),
    windSpeed: number(fix.wind_spd),
    windLevels: windLevels(fix),
  };
}

function interpolate(from: Location, to: Location, fraction: number) {
  return {
    posLat: from.latitude + (to.latitude - from.latitude) * fraction,
    posLong: from.longitude + (to.longitude - from.longitude) * fraction,
  };
}

function directFixes(
  ofp: Json,
  departure: OfpAirportInput,
  destination: OfpAirportInput,
): SeededRouteFix[] {
  const distance = Number(ofp.general.gc_distance);
  const enroute = Number(ofp.times.sched_on) - Number(ofp.times.sched_off);
  const trip = Number(ofp.fuel.enroute_burn);
  const takeoff = Number(ofp.fuel.plan_takeoff);
  const blank = {
    trackTrue: null,
    trackMag: null,
    viaAirway: 'DCT',
    fuelFlow: null,
    fuelLeg: null,
    fuelMinimumOnBoard: null,
    oat: null,
    isaDeviation: null,
    tropopause: null,
    mora: null,
    fir: null,
    windDirection: null,
    windSpeed: null,
    windLevels: [],
  };
  const point = (
    ident: string,
    fraction: number,
    altitude: number,
    elapsedSeconds: number,
    distanceNm: number,
    stage: string,
    used: number,
  ): SeededRouteFix => ({
    ...blank,
    ident,
    ...interpolate(departure, destination, fraction),
    altitude,
    elapsedSeconds,
    distanceNm,
    stage,
    fuelUsed: used,
    fuelPlannedOnBoard: takeoff - used,
  });
  const descentStart = distance - DESCENT_DISTANCE;

  return [
    point(departure.icao, 0, 0, 0, 0, 'CLB', 0),
    point(
      'TOC',
      CLIMB_DISTANCE / distance,
      DIRECT_CRUISE,
      CLIMB_SECONDS,
      CLIMB_DISTANCE,
      'CLB',
      Math.round(trip * CLIMB_BURN),
    ),
    point(
      'TOD',
      descentStart / distance,
      DIRECT_CRUISE,
      enroute - DESCENT_SECONDS,
      descentStart - CLIMB_DISTANCE,
      'CRZ',
      Math.round(trip * DESCENT_BURN),
    ),
    point(destination.icao, 1, 0, enroute, DESCENT_DISTANCE, 'DSC', trip),
  ];
}

function estimateOf(times: Json) {
  return times.est_out === undefined
    ? null
    : {
        out: date(times.est_out),
        off: date(times.est_off),
        on: date(times.est_on),
        in: date(times.est_in),
      };
}

async function inputOf(
  prisma: PrismaService,
  ofp: Json,
  navlogSource: Json,
): Promise<OfpInput> {
  const departure = await airportOf(prisma, ofp.origin);
  const destination = await airportOf(prisma, ofp.destination);

  if (departure === null || destination === null) {
    throw new Error(
      `${ofp.origin.icao_code}-${ofp.destination.icao_code} is not seeded`,
    );
  }

  const alternates = (
    await Promise.all(
      list<Json>(ofp.alternate).map((alternate) =>
        airportOf(prisma, alternate),
      ),
    )
  ).filter((airport): airport is OfpAirportInput => airport !== null);
  const sameRoute =
    navlogSource.origin.icao_code === departure.icao &&
    navlogSource.destination.icao_code === destination.icao;
  const fixes = list<Json>(ofp.navlog?.fix);
  const filed = fixes.length > 0 ? ofp : sameRoute ? navlogSource : null;
  const route = filed === null ? 'DCT' : (filed.general.route as string);
  const callsign = `${ofp.general.icao_airline}${ofp.general.flight_number}`;

  return {
    requestId: ofp.params.request_id,
    callsign,
    atcCallsign: text(ofp.atc?.callsign) ?? callsign,
    registration: ofp.aircraft.reg,
    aircraftType: ofp.aircraft.icaocode,
    selcal: text(ofp.aircraft.selcal),
    departure,
    destination,
    alternates,
    departureRunway: text(ofp.origin.plan_rwy),
    arrivalRunway: text(ofp.destination.plan_rwy),
    schedule: {
      out: date(ofp.times.sched_out),
      off: date(ofp.times.sched_off),
      on: date(ofp.times.sched_on),
      in: date(ofp.times.sched_in),
    },
    estimate: estimateOf(ofp.times),
    generated:
      ofp.params.time_generated === undefined
        ? null
        : date(ofp.params.time_generated),
    route,
    atcRoute:
      text(ofp.atc?.route) ??
      text(filed?.atc?.route) ??
      `${DIRECT_SPEED}F${DIRECT_CRUISE / 100} ${route}`,
    fixes:
      filed === null
        ? directFixes(ofp, departure, destination)
        : list<Json>(filed.navlog.fix).map(filedFix),
    load: {
      passengers: Number(ofp.weights.pax_count),
      cargo: Number(ofp.weights.cargo),
    },
    fuel: {
      taxi: Number(ofp.fuel.taxi),
      contingency: Number(ofp.fuel.contingency),
      contingencyRule: text(ofp.general.cont_rule) ?? '5%',
      alternate: Number(ofp.fuel.alternate_burn),
      reserve: Number(ofp.fuel.reserve),
    },
  };
}

function replaceText(raw: string, key: string, from: string, to: string) {
  const needle = `"${key}": ${JSON.stringify(from)}`;

  if (raw.split(needle).length !== 2) {
    throw new Error(`expected exactly one ${key}`);
  }

  return raw.replace(needle, () => `"${key}": ${JSON.stringify(to)}`);
}

async function writeMocks(): Promise<void> {
  const prisma = new PrismaService();
  const files = readdirSync(MOCK_DIRECTORY).filter((file) =>
    MOCK_FILE.test(file),
  );
  const mocks = files.map((file) => {
    const raw = readFileSync(join(MOCK_DIRECTORY, file), 'utf8');

    return { file, raw, ofp: JSON.parse(raw) as Json };
  });
  const navlogSource =
    mocks.find(({ ofp }) => list(ofp.navlog?.fix).length > 0)?.ofp ?? {};

  for (const { file, raw, ofp } of mocks) {
    const texts = ofpTexts(await inputOf(prisma, ofp, navlogSource));
    const written = replaceText(
      replaceText(raw, 'plan_html', ofp.text.plan_html, texts.ofpContent),
      'tlr_section',
      ofp.text.tlr_section,
      texts.runwayAnalysis,
    );

    writeFileSync(join(MOCK_DIRECTORY, file), written);
    console.log(`Wrote ${file}`);
  }

  await prisma.$disconnect();
}

writeMocks().catch((error) => {
  console.error(error);
  process.exit(1);
});

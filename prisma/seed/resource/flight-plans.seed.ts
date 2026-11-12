import {
  FlightSource,
  FlightStatus,
} from '../../../src/modules/flights/model/flight.model';
import { AirportType } from '../../../src/modules/airports/model/airport.model';
import { Prisma } from '../../client/client';
import {
  BOSTON_PHILADELPHIA,
  FRANKFURT_NEW_YORK,
  Navlog,
  NEW_YORK_FRANKFURT,
} from './flight-plan/navlog';
import { ofpContent, runwayAnalysis } from './flight-plan/ofp';
import {
  distanceNm,
  divertedPath,
  greatCirclePath,
  LevelHold,
  PathPoint,
  recordedTrack,
} from './flight-plan/track';

type PlannedFlight = {
  flightId: string;
  navlog: Navlog | null;
};

const BOS_PHL_FLIGHTS = [
  '23952e79-6b38-49ed-a1db-bd4d9b3cedab',
  'e91e13a9-09d8-48bf-8453-283cef467b88',
  'b3899775-278e-4496-add1-21385a13d93e',
  '05986dd3-ff01-4112-ad35-ecd85db05c77',
  'f14a2141-4737-4622-a387-40513ff3baf1',
  '7105891a-8008-4b47-b473-c81c97615ad7',
  '2d1c92f6-8ed1-4921-9a70-f71b1ed2e72d',
  '04be266c-df78-4bec-9f50-281cc02ce7f2',
  '17d2f703-957d-4ad1-a620-3c187a70c26a',
  '5aada8ba-60c1-4e93-bcee-b59a7c555fdd',
  '38644393-deee-434d-bfd1-7242abdbc4e1',
  'd085c107-308d-48e6-9c93-beca6552a8a3',
  '5f2c6e3d-9b4a-4d18-8e72-1a3c9f5b8d04',
  '7d8a3c91-5e62-4b41-9c08-2f6b1d7e3a45',
];

const FRA_JFK_FLIGHTS = [
  '3c8ba7a7-1085-423c-8cc3-d51f5ab0cd05',
  '48760636-9520-4863-b32f-f3618556feb7',
  '11087d20-ead0-4b7e-97ee-f1ef0ea29e4f',
  '6d1a7c4b-95e2-4f38-b7a0-c3e8f1d24a56',
  '7e2b8d5c-a6f3-4049-98b1-d4f9a2e35b67',
  'd5e8f1a2-3b4c-4d5e-9f6a-7b8c9d0e1f2a',
];

const JFK_FRA_FLIGHTS = [
  'e8e17e59-67d7-4a6c-a0bd-425ffa6bed66',
  '006f0754-1ed7-4ae1-9f91-fae2d446a6e7',
  'd4a25ef2-39cf-484c-af00-a548999e8699',
  '1e9f4176-188f-41a5-a9d1-25a96579f46d',
];

const MANUAL_FLIGHTS = [
  '23da8bc9-a21b-4678-b2e9-1151d3bd15ab',
  'b88f1c0d-3a55-4ce0-9f7b-1c2d3e4f5a6b',
];

export const LIVE_STATUSES = new Set<string>([
  FlightStatus.TaxiingOut,
  FlightStatus.InCruise,
  FlightStatus.TaxiingIn,
]);

export const PLANNED_FLIGHTS: PlannedFlight[] = [
  ...BOS_PHL_FLIGHTS.map((flightId) => ({
    flightId,
    navlog: BOSTON_PHILADELPHIA,
  })),
  ...FRA_JFK_FLIGHTS.map((flightId) => ({
    flightId,
    navlog: FRANKFURT_NEW_YORK,
  })),
  ...JFK_FRA_FLIGHTS.map((flightId) => ({
    flightId,
    navlog: NEW_YORK_FRANKFURT,
  })),
  ...MANUAL_FLIGHTS.map((flightId) => ({ flightId, navlog: null })),
];

const CRUISE_PROGRESS = 0.45;
const TAXI_OUT_PROGRESS_MS = 6 * 60 * 1000;
const TAXI_IN_PROGRESS_MS = 4 * 60 * 1000;
const CRUISE_SPEED_KT = 450;
const SHORT_HAUL_NM = 500;
const SHORT_HAUL_CRUISE = 28000;
const LONG_HAUL_CRUISE = 35000;
const DIVERSION_SPEED_KT = 420;

const AIRBORNE_OR_LATER = new Set<string>([
  FlightStatus.TaxiingOut,
  FlightStatus.InCruise,
  FlightStatus.TaxiingIn,
  FlightStatus.OnBlock,
  FlightStatus.OffboardingStarted,
  FlightStatus.OffboardingFinished,
  FlightStatus.Closed,
]);

type Location = { latitude: number; longitude: number };

export const flightWithContext = {
  airports: { include: { airport: true } },
  aircraft: true,
  departureRunway: true,
  diversion: { include: { airport: true } },
} satisfies Prisma.FlightInclude;

export type FlightWithContext = Prisma.FlightGetPayload<{
  include: typeof flightWithContext;
}>;

function locationOf(flight: FlightWithContext, type: AirportType): Location {
  const link = flight.airports.find(({ airportType }) => airportType === type);

  if (link === undefined) {
    throw new Error(`Flight ${flight.flightNumber} has no ${type} airport`);
  }

  return link.airport.location as Location;
}

function icaoOf(flight: FlightWithContext, type: AirportType): string {
  return (
    flight.airports.find(({ airportType }) => airportType === type)?.airport
      .icaoCode ?? ''
  );
}

function plannedPath(
  navlog: Navlog | null,
  departure: Location,
  destination: Location,
): PathPoint[] {
  if (navlog === null) {
    const from: [number, number] = [departure.latitude, departure.longitude];
    const to: [number, number] = [destination.latitude, destination.longitude];
    const cruise =
      distanceNm(from, to) < SHORT_HAUL_NM
        ? SHORT_HAUL_CRUISE
        : LONG_HAUL_CRUISE;

    return greatCirclePath(from, to, cruise, CRUISE_SPEED_KT);
  }

  return navlog.fixes.map((fix) => ({
    latitude: fix.posLat,
    longitude: fix.posLong,
    altitude: fix.altitude,
    elapsedSeconds: fix.elapsedSeconds,
  }));
}

function flownPath(flight: FlightWithContext, path: PathPoint[]): PathPoint[] {
  const diversion = flight.diversion[0];
  const takeoff = flight.actualTakeoffTime;

  if (diversion === undefined || takeoff === null) {
    return path;
  }

  const target = diversion.airport.location as Location;
  const afterSeconds = Math.max(
    600,
    (diversion.decisionTime.getTime() - takeoff.getTime()) / 1000,
  );

  return divertedPath(
    path,
    afterSeconds,
    [target.latitude, target.longitude],
    0,
    DIVERSION_SPEED_KT,
  );
}

function progressCutOff(
  flight: FlightWithContext,
  path: PathPoint[],
): Date | null {
  const plannedSeconds = path[path.length - 1].elapsedSeconds;

  switch (flight.status) {
    case FlightStatus.TaxiingOut:
      return flight.actualOffBlockTime === null
        ? null
        : new Date(flight.actualOffBlockTime.getTime() + TAXI_OUT_PROGRESS_MS);
    case FlightStatus.InCruise:
      return flight.actualTakeoffTime === null
        ? null
        : new Date(
            flight.actualTakeoffTime.getTime() +
              plannedSeconds * CRUISE_PROGRESS * 1000,
          );
    case FlightStatus.TaxiingIn:
      return flight.actualArrivalTime === null
        ? null
        : new Date(flight.actualArrivalTime.getTime() + TAXI_IN_PROGRESS_MS);
    default:
      return null;
  }
}

const LEVEL_HOLDS: (LevelHold | null)[] = [
  null,
  { below: 2000, untilFraction: 0.55 },
  { below: 1000, untilFraction: 0.8 },
];

function levelHoldFor(callsign: string): LevelHold | null {
  const hash = [...callsign].reduce(
    (sum, character) => sum + character.charCodeAt(0),
    0,
  );

  return LEVEL_HOLDS[hash % LEVEL_HOLDS.length];
}

export function trackOf(flight: FlightWithContext, navlog: Navlog | null) {
  if (
    !AIRBORNE_OR_LATER.has(flight.status) ||
    flight.actualOffBlockTime === null
  ) {
    return [];
  }

  const path = flownPath(
    flight,
    plannedPath(
      navlog,
      locationOf(flight, AirportType.Departure),
      locationOf(flight, AirportType.Destination),
    ),
  );

  return recordedTrack({
    callsign: flight.callsign,
    path,
    offBlock: flight.actualOffBlockTime,
    takeoff: flight.actualTakeoffTime,
    arrival: flight.actualArrivalTime,
    onBlock: flight.actualOnBlockTime,
    until: progressCutOff(flight, path),
    levelHold: levelHoldFor(flight.callsign),
  });
}

async function fileNavlog(
  tx: Prisma.TransactionClient,
  flight: FlightWithContext,
  navlog: Navlog,
): Promise<void> {
  const ofpFlight = {
    callsign: flight.callsign,
    flightNumber: flight.flightNumber,
    departure: icaoOf(flight, AirportType.Departure),
    destination: icaoOf(flight, AirportType.Destination),
    registration: flight.aircraft.registration,
    aircraftType: flight.aircraft.type,
    scheduledOffBlock: flight.scheduledOffBlockTime ?? flight.createdAt,
  };

  const briefing =
    flight.source === FlightSource.Simbrief
      ? {}
      : {
          ofpContent: ofpContent(ofpFlight, navlog),
          runwayAnalysis:
            flight.departureRunway === null
              ? null
              : runwayAnalysis(
                  ofpFlight,
                  flight.departureRunway.designator,
                  flight.departureRunway.length,
                ),
        };

  await tx.flight.update({
    where: { id: flight.id },
    data: {
      source: FlightSource.Simbrief,
      route: navlog.route,
      atcRoute: flight.atcRoute ?? navlog.atcRoute,
      ...briefing,
    },
  });

  const filed = await tx.flightRouteFix.count({
    where: { flightId: flight.id },
  });

  if (filed > 0) {
    return;
  }

  await tx.flightRouteFix.createMany({
    data: navlog.fixes.map(({ windLevels, ...fix }, ordinal) => ({
      flightId: flight.id,
      ordinal,
      ...fix,
      windLevels: windLevels as unknown as Prisma.InputJsonValue,
    })),
  });
}

export async function loadFlightPlans(
  tx: Prisma.TransactionClient,
): Promise<void> {
  for (const { flightId, navlog } of PLANNED_FLIGHTS) {
    const flight = await tx.flight.findUniqueOrThrow({
      where: { id: flightId },
      include: flightWithContext,
    });

    if (navlog !== null) {
      await fileNavlog(tx, flight, navlog);
    }

    const track =
      flight.actualTakeoffTime === null ? [] : trackOf(flight, navlog);

    if (track.length > 0) {
      await tx.flight.update({
        where: { id: flightId },
        data: {
          positionReports: track as unknown as Prisma.InputJsonValue,
          isPathAvailable: true,
        },
      });
    }
  }
}

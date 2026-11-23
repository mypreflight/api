import { AirportType, Continent } from '../../airports/model/airport.model';
import { NotocHeader } from './notoc.model';
import { resolvePassengerLocale, staffNameFactory } from './passenger-name';
import { stableSeed } from './stable-random';

export type NotocHeaderContext = {
  flightId: string;
  flightNumber: string;
  scheduledOffBlock: Date | null;
  operatorName: string;
  operatorIataCode: string;
  departure: {
    iataCode: string;
    city: string;
    country: string;
    continent: Continent;
  };
  aircraftRegistration: string;
  aircraftType: string;
};

const FICTIONAL_LINE_PREFIX = '+44 20 7946 0';
const FICTIONAL_LINE_COUNT = 1000;

export function notocHeaderFor(
  context: NotocHeaderContext,
  issuedAt: Date,
): NotocHeader {
  const { departure } = context;
  const locale = resolvePassengerLocale(departure.country, departure.continent);
  const nextName = staffNameFactory(locale, stableSeed(context.flightId));
  const preparedBy = nextName();
  let loadingSupervisor = nextName();

  while (loadingSupervisor === preparedBy) {
    loadingSupervisor = nextName();
  }

  return {
    operatorName: context.operatorName,
    flightNumber: context.flightNumber,
    flightDate: (context.scheduledOffBlock ?? issuedAt)
      .toISOString()
      .slice(0, 10),
    stationOfLoading: departure.iataCode,
    stationOfLoadingCity: departure.city,
    aircraftRegistration: context.aircraftRegistration,
    aircraftType: context.aircraftType,
    preparedBy,
    loadingSupervisor,
    emergencyTelephone: emergencyTelephoneOf(context.operatorIataCode),
  };
}

export function emergencyTelephoneOf(operatorIataCode: string): string {
  const line = stableSeed(operatorIataCode) % FICTIONAL_LINE_COUNT;

  return `${FICTIONAL_LINE_PREFIX}${String(line).padStart(3, '0')}`;
}

export type NotocFlightFacts = {
  id: string;
  flightNumber: string;
  timesheet: { scheduled?: { offBlockTime: Date | string | null } | null };
  operator: { fullName: string; iataCode: string };
  aircraft: { registration: string; airframe: { type: string } };
  airports: {
    type: AirportType;
    iataCode: string;
    city: { name: string };
    country: { code: string };
    continent: Continent;
  }[];
};

export function notocHeaderContextOf(
  flight: NotocFlightFacts,
): NotocHeaderContext | null {
  const departure = flight.airports.find(
    (airport) => airport.type === AirportType.Departure,
  );

  if (!departure) {
    return null;
  }

  const offBlock = flight.timesheet.scheduled?.offBlockTime ?? null;

  return {
    flightId: flight.id,
    flightNumber: flight.flightNumber,
    scheduledOffBlock: offBlock ? new Date(offBlock) : null,
    operatorName: flight.operator.fullName,
    operatorIataCode: flight.operator.iataCode,
    departure: {
      iataCode: departure.iataCode,
      city: departure.city.name,
      country: departure.country.code,
      continent: departure.continent,
    },
    aircraftRegistration: flight.aircraft.registration,
    aircraftType: flight.aircraft.airframe.type,
  };
}

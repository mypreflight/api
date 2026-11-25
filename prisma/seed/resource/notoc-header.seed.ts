import { Continent } from '../../../src/modules/airports/model/airport.model';
import { notocHeaderFor } from '../../../src/modules/manifest/model/notoc-header';
import { NotocHeader } from '../../../src/modules/manifest/model/notoc.model';

type SeededFlight = {
  id: string;
  flightNumber: string;
  scheduledOffBlockTime: Date | null;
  operator: { fullName: string; iataCode: string };
  aircraft: { registration: string; type: string };
};

type SeededAirport = {
  iataCode: string;
  city: { name: string };
  country: string;
  continent: string;
};

export function seededNotocHeader(
  flight: SeededFlight,
  departure: SeededAirport,
  issuedAt: Date,
): NotocHeader {
  return notocHeaderFor(
    {
      flightId: flight.id,
      flightNumber: flight.flightNumber,
      scheduledOffBlock: flight.scheduledOffBlockTime,
      operatorName: flight.operator.fullName,
      operatorIataCode: flight.operator.iataCode,
      departure: {
        iataCode: departure.iataCode,
        city: departure.city.name,
        country: departure.country,
        continent: departure.continent as Continent,
      },
      aircraftRegistration: flight.aircraft.registration,
      aircraftType: flight.aircraft.type,
    },
    issuedAt,
  );
}

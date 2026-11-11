import {
  FlightServiceType,
  FlightSource,
  FlightStatus,
  FlightTracking,
} from '../../model/flight.model';
import { QueryHandler, Query, IQueryHandler, QueryBus } from '@nestjs/cqrs';
import { FlightsRepository } from '../../infra/database/repository/flights.repository';
import { FlightDoesNotExistError } from '../../model/error/flight.error';
import { GetPilotQuery } from '../../../users/application/query/get-pilot.query';
import { FlightPilotDto } from '../../../users/infra/http/request/get-user.dto';
import {
  AirportType,
  AirportWithType,
  Continent,
  Coordinates,
  DataQuality,
} from '../../../airports/model/airport.model';
import { GetFlightResponse } from '../../infra/http/request/flight.dto';
import { FlightsWithNotocQuery } from '../../../manifest/application/query/has-flight-notoc.query';
import { toCountryRef } from '../../../countries/model/country.model';

export class GetFlightQuery extends Query<GetFlightResponse> {
  constructor(public readonly flightId: string) {
    super();
  }
}

@QueryHandler(GetFlightQuery)
export class GetFlightHandler implements IQueryHandler<GetFlightQuery> {
  constructor(
    private repository: FlightsRepository,
    private readonly queryBus: QueryBus,
  ) {}

  async execute(query: GetFlightQuery) {
    const flight = await this.repository.findOneBy({
      id: query.flightId,
    });

    if (!flight) {
      throw new FlightDoesNotExistError();
    }

    const { captainId, actualFuelBurned, ...rest } = flight;

    return {
      ...rest,
      status: flight.status as FlightStatus,
      actualFuelBurned:
        actualFuelBurned === null ? null : actualFuelBurned.toNumber(),
      airports: flight.airports.map(
        (airportOnFlight): AirportWithType => ({
          ...airportOnFlight.airport,
          location: airportOnFlight.airport.location as unknown as Coordinates,
          country: toCountryRef(airportOnFlight.airport.country),
          continent: airportOnFlight.airport.continent as Continent,
          dataQuality: airportOnFlight.airport.dataQuality as DataQuality,
          shape: airportOnFlight.airport.shape as unknown as
            | Coordinates[]
            | null,
          type: airportOnFlight.airportType as AirportType,
        }),
      ),
      departureParkingPositionId: flight.departureParkingPositionId,
      departureRunwayId: flight.departureRunwayId,
      arrivalParkingPositionId: flight.arrivalParkingPositionId,
      arrivalRunwayId: flight.arrivalRunwayId,
      source: flight.source as FlightSource,
      tracking: flight.tracking as FlightTracking,
      serviceType: flight.serviceType as FlightServiceType,
      pilot: await this.resolvePilot(captainId),
      hasNotoc: await this.resolveHasNotoc(query.flightId),
    };
  }

  private async resolveHasNotoc(flightId: string): Promise<boolean> {
    const notocQuery = new FlightsWithNotocQuery([flightId]);
    const issued: Set<string> = await this.queryBus.execute(notocQuery);

    return issued.has(flightId);
  }

  private async resolvePilot(
    captainId: string | null,
  ): Promise<FlightPilotDto | null> {
    if (!captainId) {
      return null;
    }

    const pilotQuery = new GetPilotQuery(captainId);
    return this.queryBus.execute(pilotQuery);
  }
}

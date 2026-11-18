import { IQueryHandler, Query, QueryBus, QueryHandler } from '@nestjs/cqrs';
import { SimbriefClient } from '../../../../core/provider/simbrief/client/simbrief.client';
import { SimbriefUserNotFoundError } from '../../../../core/provider/simbrief/error/simbrief.error';
import {
  EmptyElement,
  OperationalFlightPlan,
} from '../../../../core/provider/simbrief/type/simbrief.types';
import {
  SimbriefAccount,
  SimbriefAircraft,
  SimbriefAirport,
  SimbriefFlight,
} from '../../model/simbrief-account.model';
import { GetAirportByIcaoCodeQuery } from '../../../airports/application/query/get-airport-by-icao-code.query';
import { AirportByIcaoCodeNotFoundError } from '../../../airports/model/error/airport.error';

type KnownAirport = { iataCode: string; city: string };

export class VerifySimbriefUserQuery extends Query<SimbriefAccount> {
  constructor(public readonly simbriefUserId: string) {
    super();
  }
}

@QueryHandler(VerifySimbriefUserQuery)
export class VerifySimbriefUserHandler implements IQueryHandler<VerifySimbriefUserQuery> {
  constructor(
    private readonly simbriefClient: SimbriefClient,
    private readonly queryBus: QueryBus,
  ) {}

  async execute(query: VerifySimbriefUserQuery): Promise<SimbriefAccount> {
    const ofp = await this.simbriefClient.findOperationalFlightPlan(
      query.simbriefUserId,
    );

    if (ofp === null) {
      throw new SimbriefUserNotFoundError();
    }

    return {
      simbriefUserId: query.simbriefUserId,
      latestFlight: await this.toFlight(ofp),
    };
  }

  private async toFlight(ofp: OperationalFlightPlan): Promise<SimbriefFlight> {
    const [origin, destination] = await Promise.all([
      this.toAirport(ofp.origin),
      this.toAirport(ofp.destination),
    ]);

    return {
      callsign: `${ofp.general.icao_airline ?? ''}${ofp.general.flight_number ?? ''}`,
      origin,
      destination,
      aircraft: this.toAircraft(ofp.aircraft),
      scheduledOffBlockTime: this.toDate(ofp.times?.sched_out),
      scheduledOnBlockTime: this.toDate(ofp.times?.sched_in),
      generatedAt: this.toDate(ofp.params?.time_generated),
    };
  }

  private async toAirport(
    airport: OperationalFlightPlan['origin'],
  ): Promise<SimbriefAirport> {
    const known = await this.findKnownAirport(airport.icao_code);

    return {
      icaoCode: airport.icao_code,
      iataCode: known?.iataCode ?? this.readText(airport.iata_code),
      city: known?.city ?? null,
      name: this.readText(airport.name),
    };
  }

  private async findKnownAirport(
    icaoCode: string,
  ): Promise<KnownAirport | null> {
    try {
      const airport = await this.queryBus.execute(
        new GetAirportByIcaoCodeQuery(icaoCode),
      );

      return { iataCode: airport.iataCode, city: airport.city.name };
    } catch (error) {
      if (error instanceof AirportByIcaoCodeNotFoundError) {
        return null;
      }

      throw error;
    }
  }

  private toAircraft(
    aircraft: OperationalFlightPlan['aircraft'],
  ): SimbriefAircraft {
    return {
      registration: this.readText(aircraft.reg),
      type: this.readText(aircraft.icaocode),
      name: this.readText(aircraft.name),
    };
  }

  private readText(value: string | EmptyElement | undefined): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const text = value.trim();

    return text.length === 0 ? null : text;
  }

  private toDate(value: string | undefined): Date | null {
    const seconds = Number(value);

    if (!value || !Number.isFinite(seconds)) {
      return null;
    }

    return new Date(seconds * 1000);
  }
}

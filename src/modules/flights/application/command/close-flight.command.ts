import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { FlightsRepository } from '../../infra/database/repository/flights.repository';
import { FlightEventScope } from '../../model/event.model';
import { DomainEventEmitter } from '../../../../core/domain/events/domain-event-emitter';
import { IsFlightDelayClearedQuery } from '../query/delay/is-flight-delay-cleared.query';

export class CloseFlightCommand {
  constructor(
    public readonly flightId: string,
    public readonly initiatorId: string,
    public readonly actualFuelBurned: number | null = null,
  ) {}
}

@CommandHandler(CloseFlightCommand)
export class CloseFlightHandler implements ICommandHandler<CloseFlightCommand> {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly flightsRepository: FlightsRepository,
    private readonly domainEvents: DomainEventEmitter,
  ) {}

  async execute(command: CloseFlightCommand): Promise<void> {
    const { flightId, initiatorId, actualFuelBurned } = command;
    const flight = await this.flightsRepository.load(flightId);

    const hasUnresolvedEmergency =
      await this.flightsRepository.hasUnresolvedEmergency(flightId);
    const isDelayCleared = await this.queryBus.execute(
      new IsFlightDelayClearedQuery(flightId),
    );

    flight.close(
      { id: initiatorId, scope: FlightEventScope.User },
      { actualFuelBurned, hasUnresolvedEmergency, isDelayCleared },
    );

    await this.flightsRepository.save(flight);
    await this.domainEvents.emitRecordedAsync(flight);
  }
}

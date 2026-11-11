import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { FlightsRepository } from '../../infra/database/repository/flights.repository';
import { DiversionRepository } from '../../infra/database/repository/diversion.repository';
import { FlightEventScope } from '../../model/event.model';
import { DomainEventEmitter } from '../../../../core/domain/events/domain-event-emitter';

export class ReportOnBlockCommand {
  constructor(
    public readonly flightId: string,
    public readonly initiatorId: string,
  ) {}
}

@CommandHandler(ReportOnBlockCommand)
export class ReportOnBlockHandler implements ICommandHandler<ReportOnBlockCommand> {
  constructor(
    private readonly flightsRepository: FlightsRepository,
    private readonly diversionRepository: DiversionRepository,
    private readonly domainEvents: DomainEventEmitter,
  ) {}

  async execute(command: ReportOnBlockCommand): Promise<void> {
    const { flightId, initiatorId } = command;
    const flight = await this.flightsRepository.load(flightId);

    const diversionAirportId = flight.isDiverted
      ? (await this.diversionRepository.get(flightId)).airport.id
      : null;

    flight.reportOnBlock(
      { id: initiatorId, scope: FlightEventScope.User },
      new Date(),
      diversionAirportId,
    );

    await this.flightsRepository.save(flight);
    await this.domainEvents.emitRecordedAsync(flight);
  }
}

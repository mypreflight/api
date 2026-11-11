import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { FlightEventScope } from '../../model/event.model';
import { FlightsRepository } from '../../infra/database/repository/flights.repository';
import { FlightLoadsheetsRepository } from '../../infra/database/repository/flight-loadsheets.repository';
import { LoadsheetKind } from '../../model/loadsheet.model';
import { DomainEventEmitter } from '../../../../core/domain/events/domain-event-emitter';

export class MarkAsReadyCommand {
  constructor(
    public readonly flightId: string,
    public readonly initiatorId: string,
  ) {}
}

@CommandHandler(MarkAsReadyCommand)
export class MarkFlightAsReadyHandler implements ICommandHandler<MarkAsReadyCommand> {
  constructor(
    private readonly flightsRepository: FlightsRepository,
    private readonly loadsheetsRepository: FlightLoadsheetsRepository,
    private readonly domainEvents: DomainEventEmitter,
  ) {}

  async execute(command: MarkAsReadyCommand): Promise<void> {
    const { flightId, initiatorId } = command;
    const flight = await this.flightsRepository.load(flightId);

    const hasPreliminaryLoadsheet = await this.loadsheetsRepository.hasAny(
      flightId,
      LoadsheetKind.Preliminary,
    );

    flight.markAsReady(
      { id: initiatorId, scope: FlightEventScope.User },
      hasPreliminaryLoadsheet,
    );

    await this.flightsRepository.save(flight);
    await this.domainEvents.emitRecordedAsync(flight);
  }
}

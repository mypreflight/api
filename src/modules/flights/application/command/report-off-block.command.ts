import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { FlightsRepository } from '../../infra/database/repository/flights.repository';
import { FlightEventScope } from '../../model/event.model';
import { DomainEventEmitter } from '../../../../core/domain/events/domain-event-emitter';

export class ReportOffBlockCommand {
  constructor(
    public readonly flightId: string,
    public readonly initiatorId: string | null = null,
    public readonly offBlockTime: Date = new Date(),
    public readonly automaticallyDetected: boolean = false,
  ) {}
}

@CommandHandler(ReportOffBlockCommand)
export class ReportOffBlockHandler implements ICommandHandler<ReportOffBlockCommand> {
  constructor(
    private readonly flightsRepository: FlightsRepository,
    private readonly domainEvents: DomainEventEmitter,
  ) {}

  async execute(command: ReportOffBlockCommand): Promise<void> {
    const { flightId, initiatorId, offBlockTime, automaticallyDetected } =
      command;
    const flight = await this.flightsRepository.load(flightId);

    flight.reportOffBlock(
      { id: initiatorId, scope: FlightEventScope.User },
      offBlockTime,
      automaticallyDetected,
    );

    await this.flightsRepository.save(flight);
    this.domainEvents.emitRecorded(flight);
  }
}

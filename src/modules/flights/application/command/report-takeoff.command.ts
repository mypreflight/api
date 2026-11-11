import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { FlightsRepository } from '../../infra/database/repository/flights.repository';
import { FlightEventScope } from '../../model/event.model';
import { DomainEventEmitter } from '../../../../core/domain/events/domain-event-emitter';

export class ReportTakeoffCommand {
  constructor(
    public readonly flightId: string,
    public readonly initiatorId: string | null = null,
    public readonly takeoffTime: Date = new Date(),
    public readonly automaticallyDetected: boolean = false,
  ) {}
}

@CommandHandler(ReportTakeoffCommand)
export class ReportTakeoffHandler implements ICommandHandler<ReportTakeoffCommand> {
  constructor(
    private readonly flightsRepository: FlightsRepository,
    private readonly domainEvents: DomainEventEmitter,
  ) {}

  async execute(command: ReportTakeoffCommand): Promise<void> {
    const { flightId, initiatorId, takeoffTime, automaticallyDetected } =
      command;
    const flight = await this.flightsRepository.load(flightId);

    flight.reportTakeoff(
      { id: initiatorId, scope: FlightEventScope.User },
      takeoffTime,
      automaticallyDetected,
    );

    await this.flightsRepository.save(flight);
    await this.domainEvents.emitRecordedAsync(flight);
  }
}

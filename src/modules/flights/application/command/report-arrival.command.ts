import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { FlightsRepository } from '../../infra/database/repository/flights.repository';
import { FlightEventScope } from '../../model/event.model';
import { DomainEventEmitter } from '../../../../core/domain/events/domain-event-emitter';

export class ReportArrivalCommand {
  constructor(
    public readonly flightId: string,
    public readonly initiatorId: string | null = null,
    public readonly arrivalTime: Date = new Date(),
    public readonly automaticallyDetected: boolean = false,
  ) {}
}

@CommandHandler(ReportArrivalCommand)
export class ReportArrivalHandler implements ICommandHandler<ReportArrivalCommand> {
  constructor(
    private readonly flightsRepository: FlightsRepository,
    private readonly domainEvents: DomainEventEmitter,
  ) {}

  async execute(command: ReportArrivalCommand): Promise<void> {
    const { flightId, initiatorId, arrivalTime, automaticallyDetected } =
      command;
    const flight = await this.flightsRepository.load(flightId);

    flight.reportArrival(
      { id: initiatorId, scope: FlightEventScope.User },
      arrivalTime,
      automaticallyDetected,
    );

    await this.flightsRepository.save(flight);
    await this.domainEvents.emitRecordedAsync(flight);
  }
}

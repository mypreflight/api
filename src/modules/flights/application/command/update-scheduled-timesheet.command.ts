import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { FlightsRepository } from '../../infra/database/repository/flights.repository';
import { FlightEventScope } from '../../model/event.model';
import { DomainEventEmitter } from '../../../../core/domain/events/domain-event-emitter';
import { Schedule } from '../../model/timesheet.model';

export class UpdateScheduledTimesheetCommand {
  constructor(
    public readonly flightId: string,
    public readonly initiatorId: string,
    public readonly schedule: Schedule,
  ) {}
}

@CommandHandler(UpdateScheduledTimesheetCommand)
export class UpdateScheduledTimesheetHandler implements ICommandHandler<UpdateScheduledTimesheetCommand> {
  constructor(
    private readonly flightsRepository: FlightsRepository,
    private readonly domainEvents: DomainEventEmitter,
  ) {}

  async execute(command: UpdateScheduledTimesheetCommand): Promise<void> {
    const { flightId, initiatorId, schedule } = command;
    const flight = await this.flightsRepository.load(flightId);

    flight.reschedule(
      { id: initiatorId, scope: FlightEventScope.Operations },
      schedule,
    );

    await this.flightsRepository.save(flight);
    await this.domainEvents.emitRecordedAsync(flight);
  }
}

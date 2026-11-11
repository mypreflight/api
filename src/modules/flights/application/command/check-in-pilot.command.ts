import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { FlightsRepository } from '../../infra/database/repository/flights.repository';
import { DomainEventEmitter } from '../../../../core/domain/events/domain-event-emitter';
import { Schedule } from '../../model/timesheet.model';
import { AcknowledgeNotocCommand } from '../../../manifest/application/command/acknowledge-notoc.command';
import { NotocStageName } from '../../../manifest/model/notoc.model';

export class CheckInPilotCommand {
  constructor(
    public readonly flightId: string,
    public readonly initiatorId: string,
    public readonly estimatedSchedule: Schedule,
  ) {}
}

@CommandHandler(CheckInPilotCommand)
export class CheckInPilotForFlightHandler implements ICommandHandler<CheckInPilotCommand> {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly flightsRepository: FlightsRepository,
    private readonly domainEvents: DomainEventEmitter,
  ) {}

  async execute(command: CheckInPilotCommand): Promise<void> {
    const { flightId, initiatorId, estimatedSchedule } = command;
    const flight = await this.flightsRepository.load(flightId);

    flight.checkIn(initiatorId, estimatedSchedule);

    const acknowledgeNotoc = new AcknowledgeNotocCommand(
      flightId,
      NotocStageName.Preliminary,
      initiatorId,
      new Date(),
    );
    await this.commandBus.execute(acknowledgeNotoc);

    await this.flightsRepository.save(flight);
    await this.domainEvents.emitRecordedAsync(flight);
  }
}

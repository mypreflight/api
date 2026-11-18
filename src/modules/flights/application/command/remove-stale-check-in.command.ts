import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { FlightsRepository } from '../../infra/database/repository/flights.repository';
import { DomainEventEmitter } from '../../../../core/domain/events/domain-event-emitter';

export class RemoveStaleCheckInCommand {
  constructor(public readonly flightId: string) {}
}

@CommandHandler(RemoveStaleCheckInCommand)
export class RemoveStaleCheckInHandler implements ICommandHandler<RemoveStaleCheckInCommand> {
  constructor(
    private readonly flightsRepository: FlightsRepository,
    private readonly domainEvents: DomainEventEmitter,
  ) {}

  async execute(command: RemoveStaleCheckInCommand): Promise<void> {
    const flight = await this.flightsRepository.load(command.flightId);

    flight.removeStaleCheckIn();

    await this.domainEvents.emitRecordedAsync(flight);
    await this.flightsRepository.remove(command.flightId);
  }
}

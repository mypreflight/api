import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DomainEventEmitter } from '../../../../core/domain/events/domain-event-emitter';
import { FlightsRepository } from '../../infra/database/repository/flights.repository';
import { flightActorFor } from '../../model/event.model';
import { JwtUser } from '../../../auth/infra/http/request/jwt-user.dto';

export class UpdateDepartureParkingPositionCommand {
  constructor(
    public readonly flightId: string,
    public readonly actor: JwtUser,
    public readonly departureParkingPositionId: string,
  ) {}
}

@CommandHandler(UpdateDepartureParkingPositionCommand)
export class UpdateDepartureParkingPositionHandler implements ICommandHandler<UpdateDepartureParkingPositionCommand> {
  constructor(
    private readonly flightsRepository: FlightsRepository,
    private readonly domainEvents: DomainEventEmitter,
  ) {}

  async execute(command: UpdateDepartureParkingPositionCommand): Promise<void> {
    const { flightId, actor, departureParkingPositionId } = command;
    const flight = await this.flightsRepository.load(flightId);

    flight.changeDepartureParkingPosition(
      flightActorFor(actor),
      departureParkingPositionId,
    );

    await this.flightsRepository.save(flight);
    await this.domainEvents.emitRecordedAsync(flight);
  }
}

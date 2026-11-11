import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DomainEventEmitter } from '../../../../core/domain/events/domain-event-emitter';
import { FlightsRepository } from '../../infra/database/repository/flights.repository';
import { flightActorFor } from '../../model/event.model';
import { JwtUser } from '../../../auth/infra/http/request/jwt-user.dto';

export class UpdateArrivalParkingPositionCommand {
  constructor(
    public readonly flightId: string,
    public readonly actor: JwtUser,
    public readonly arrivalParkingPositionId: string,
  ) {}
}

@CommandHandler(UpdateArrivalParkingPositionCommand)
export class UpdateArrivalParkingPositionHandler implements ICommandHandler<UpdateArrivalParkingPositionCommand> {
  constructor(
    private readonly flightsRepository: FlightsRepository,
    private readonly domainEvents: DomainEventEmitter,
  ) {}

  async execute(command: UpdateArrivalParkingPositionCommand): Promise<void> {
    const { flightId, actor, arrivalParkingPositionId } = command;
    const flight = await this.flightsRepository.load(flightId);

    flight.changeArrivalParkingPosition(
      flightActorFor(actor),
      arrivalParkingPositionId,
    );

    await this.flightsRepository.save(flight);
    await this.domainEvents.emitRecordedAsync(flight);
  }
}

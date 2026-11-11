import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DomainEventEmitter } from '../../../../core/domain/events/domain-event-emitter';
import { FlightsRepository } from '../../infra/database/repository/flights.repository';
import { flightActorFor } from '../../model/event.model';
import { JwtUser } from '../../../auth/infra/http/request/jwt-user.dto';

export class UpdateArrivalRunwayCommand {
  constructor(
    public readonly flightId: string,
    public readonly actor: JwtUser,
    public readonly arrivalRunwayId: string,
  ) {}
}

@CommandHandler(UpdateArrivalRunwayCommand)
export class UpdateArrivalRunwayHandler implements ICommandHandler<UpdateArrivalRunwayCommand> {
  constructor(
    private readonly flightsRepository: FlightsRepository,
    private readonly domainEvents: DomainEventEmitter,
  ) {}

  async execute(command: UpdateArrivalRunwayCommand): Promise<void> {
    const { flightId, actor, arrivalRunwayId } = command;
    const flight = await this.flightsRepository.load(flightId);

    flight.changeArrivalRunway(flightActorFor(actor), arrivalRunwayId);

    await this.flightsRepository.save(flight);
    await this.domainEvents.emitRecordedAsync(flight);
  }
}

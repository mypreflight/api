import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DomainEventEmitter } from '../../../../core/domain/events/domain-event-emitter';
import { FlightsRepository } from '../../infra/database/repository/flights.repository';
import { flightActorFor } from '../../model/event.model';
import { JwtUser } from '../../../auth/infra/http/request/jwt-user.dto';

export class UpdateDepartureRunwayCommand {
  constructor(
    public readonly flightId: string,
    public readonly actor: JwtUser,
    public readonly departureRunwayId: string,
  ) {}
}

@CommandHandler(UpdateDepartureRunwayCommand)
export class UpdateDepartureRunwayHandler implements ICommandHandler<UpdateDepartureRunwayCommand> {
  constructor(
    private readonly flightsRepository: FlightsRepository,
    private readonly domainEvents: DomainEventEmitter,
  ) {}

  async execute(command: UpdateDepartureRunwayCommand): Promise<void> {
    const { flightId, actor, departureRunwayId } = command;
    const flight = await this.flightsRepository.load(flightId);

    flight.changeDepartureRunway(flightActorFor(actor), departureRunwayId);

    await this.flightsRepository.save(flight);
    await this.domainEvents.emitRecordedAsync(flight);
  }
}

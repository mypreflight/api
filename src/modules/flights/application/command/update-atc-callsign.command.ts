import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DomainEventEmitter } from '../../../../core/domain/events/domain-event-emitter';
import { FlightsRepository } from '../../infra/database/repository/flights.repository';
import { flightActorFor } from '../../model/event.model';
import { JwtUser } from '../../../auth/infra/http/request/jwt-user.dto';

export class UpdateAtcCallsignCommand {
  constructor(
    public readonly flightId: string,
    public readonly actor: JwtUser,
    public readonly atcCallsign: string | null,
  ) {}
}

@CommandHandler(UpdateAtcCallsignCommand)
export class UpdateAtcCallsignHandler implements ICommandHandler<UpdateAtcCallsignCommand> {
  constructor(
    private readonly flightsRepository: FlightsRepository,
    private readonly domainEvents: DomainEventEmitter,
  ) {}

  async execute(command: UpdateAtcCallsignCommand): Promise<void> {
    const { flightId, actor, atcCallsign } = command;
    const flight = await this.flightsRepository.load(flightId);

    flight.changeAtcCallsign(flightActorFor(actor), atcCallsign);

    await this.flightsRepository.save(flight);
    await this.domainEvents.emitRecordedAsync(flight);
  }
}

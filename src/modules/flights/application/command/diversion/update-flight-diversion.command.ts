import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DomainEventEmitter } from '../../../../../core/domain/events/domain-event-emitter';

import { DiversionRepository } from '../../../infra/database/repository/diversion.repository';
import { UpdateDiversionRequest } from '../../../infra/http/request/diversion.dto';
import { JwtUser } from '../../../../auth/infra/http/request/jwt-user.dto';
import { FlightsRepository } from '../../../infra/database/repository/flights.repository';
import { DiversionNotFoundError } from '../../../model/error/diversion.error';
import { DiversionWasUpdatedEvent } from '../../../../../core/domain/events/dto/flight.events';
import { scopeForActor } from '../../../model/event.model';

export class UpdateFlightDiversionCommand {
  constructor(
    public readonly flightId: string,
    public readonly actor: JwtUser,
    public readonly payload: UpdateDiversionRequest,
  ) {}
}

@CommandHandler(UpdateFlightDiversionCommand)
export class UpdateFlightDiversionHandler implements ICommandHandler<UpdateFlightDiversionCommand> {
  constructor(
    private readonly flightsRepository: FlightsRepository,
    private readonly diversionRepository: DiversionRepository,
    private readonly domainEvents: DomainEventEmitter,
  ) {}

  async execute(command: UpdateFlightDiversionCommand): Promise<void> {
    const { flightId, actor, payload } = command;

    const flight = await this.flightsRepository.load(flightId);

    const hasDiversion =
      await this.diversionRepository.existsActiveDiversion(flightId);
    if (!hasDiversion) {
      throw new DiversionNotFoundError();
    }

    flight.assertCanReportDiversion();

    await this.diversionRepository.update(flightId, payload);

    await this.domainEvents.emitAsync(
      new DiversionWasUpdatedEvent({
        flightId,
        scope: scopeForActor(actor),
        actorId: actor.sub,
      }),
    );
  }
}

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DomainEventEmitter } from '../../../../core/domain/events/domain-event-emitter';
import { FlightsRepository } from '../../infra/database/repository/flights.repository';
import { flightActorFor } from '../../model/event.model';
import { JwtUser } from '../../../auth/infra/http/request/jwt-user.dto';
import { UpdatePredictedTimesheetRequest } from '../../infra/http/request/flight.dto';

export class UpdatePredictedTimesheetCommand {
  constructor(
    public readonly flightId: string,
    public readonly actor: JwtUser,
    public readonly patch: UpdatePredictedTimesheetRequest,
  ) {}
}

@CommandHandler(UpdatePredictedTimesheetCommand)
export class UpdatePredictedTimesheetHandler implements ICommandHandler<UpdatePredictedTimesheetCommand> {
  constructor(
    private readonly flightsRepository: FlightsRepository,
    private readonly domainEvents: DomainEventEmitter,
  ) {}

  async execute(command: UpdatePredictedTimesheetCommand): Promise<void> {
    const { flightId, actor, patch } = command;
    const flight = await this.flightsRepository.load(flightId);

    flight.predict(flightActorFor(actor), patch);

    await this.flightsRepository.save(flight);
    await this.domainEvents.emitRecordedAsync(flight);
  }
}

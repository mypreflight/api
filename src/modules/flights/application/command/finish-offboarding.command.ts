import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { FlightsRepository } from '../../infra/database/repository/flights.repository';
import { FlightEventScope } from '../../model/event.model';
import { DomainEventEmitter } from '../../../../core/domain/events/domain-event-emitter';
import { GetUserGsxSettingsQuery } from '../../../users/application/query/get-user-gsx-settings.query';
import { resolveGroundServiceSource } from '../../model/ground-service-source';

export class FinishOffboardingCommand {
  constructor(
    public readonly flightId: string,
    public readonly initiatorId: string,
    public readonly requestedByGsx: boolean = false,
  ) {}
}

@CommandHandler(FinishOffboardingCommand)
export class FinishOffboardingHandler implements ICommandHandler<FinishOffboardingCommand> {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly flightsRepository: FlightsRepository,
    private readonly domainEvents: DomainEventEmitter,
  ) {}

  async execute(command: FinishOffboardingCommand): Promise<void> {
    const { flightId, initiatorId, requestedByGsx } = command;
    const flight = await this.flightsRepository.load(flightId);

    const settingsQuery = new GetUserGsxSettingsQuery(initiatorId);
    const settings = await this.queryBus.execute(settingsQuery);
    const source = resolveGroundServiceSource(
      requestedByGsx,
      settings.integrationEnabled && settings.autoDeboardingEnabled,
    );

    flight.finishOffboarding(
      { id: initiatorId, scope: FlightEventScope.User },
      source,
    );

    await this.flightsRepository.save(flight);
    await this.domainEvents.emitRecordedAsync(flight);
  }
}

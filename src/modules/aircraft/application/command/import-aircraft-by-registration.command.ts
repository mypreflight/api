import {
  Command,
  CommandHandler,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';
import { v4 } from 'uuid';
import { AircraftRepository } from '../../infra/database/repository/aircraft.repository';
import { AircraftTypeMismatchError } from '../../model/error/aircraft.error';
import { findAirframeByType } from '../../../airframes/data/airframes';
import { AirframeNotFoundError } from '../../../airframes/model/error/airframe.error';
import { GetOperatorByIdQuery } from '../../../operators/application/query/get-operator-by-id.query';
import { DomainEventEmitter } from '../../../../core/domain/events/domain-event-emitter';
import { AircraftCreatedEvent } from '../../../../core/domain/events/dto/aircraft.event';

export class ImportAircraftByRegistrationCommand extends Command<string> {
  constructor(
    public readonly registration: string,
    public readonly type: string,
    public readonly operatorId: string,
  ) {
    super();
  }
}

@CommandHandler(ImportAircraftByRegistrationCommand)
export class ImportAircraftByRegistrationHandler implements ICommandHandler<
  ImportAircraftByRegistrationCommand,
  string
> {
  constructor(
    private readonly aircraftRepository: AircraftRepository,
    private readonly domainEvents: DomainEventEmitter,
    private readonly queryBus: QueryBus,
  ) {}

  async execute(command: ImportAircraftByRegistrationCommand): Promise<string> {
    const { registration, type, operatorId } = command;

    const existing = await this.aircraftRepository.findOneBy({
      registration,
    });

    if (existing) {
      if (existing.type !== type) {
        throw new AircraftTypeMismatchError(registration, existing.type, type);
      }

      return existing.id;
    }

    if (!findAirframeByType(type)) {
      throw new AirframeNotFoundError();
    }

    const operator = await this.queryBus.execute(
      new GetOperatorByIdQuery(operatorId),
    );

    const aircraftId = v4();

    await this.aircraftRepository.createUnconfirmed(aircraftId, operatorId, {
      type,
      registration,
      livery: `${operator.shortName} ${new Date().getFullYear()}`,
    });
    await this.domainEvents.emitAsync(
      new AircraftCreatedEvent({ aircraftId, operatorId }),
    );

    return aircraftId;
  }
}

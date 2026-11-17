import { QueryBus } from '@nestjs/cqrs';
import {
  ImportAircraftByRegistrationCommand,
  ImportAircraftByRegistrationHandler,
} from './import-aircraft-by-registration.command';
import { AircraftRepository } from '../../infra/database/repository/aircraft.repository';
import { DomainEventEmitter } from '../../../../core/domain/events/domain-event-emitter';
import { AircraftTypeMismatchError } from '../../model/error/aircraft.error';
import { AirframeNotFoundError } from '../../../airframes/model/error/airframe.error';
import { AircraftCreatedEvent } from '../../../../core/domain/events/dto/aircraft.event';

const OPERATOR_ID = '40b1b34e-aea1-4cec-acbe-f2bf97c06d7d';

function setUp(existing: { id: string; type: string } | null) {
  const repository = {
    findOneBy: jest.fn().mockResolvedValue(existing),
    createUnconfirmed: jest.fn().mockResolvedValue(undefined),
  };
  const domainEvents = { emitAsync: jest.fn().mockResolvedValue([]) };
  const queryBus = {
    execute: jest.fn().mockResolvedValue({ shortName: 'Lufthansa' }),
  };

  const handler = new ImportAircraftByRegistrationHandler(
    repository as unknown as AircraftRepository,
    domainEvents as unknown as DomainEventEmitter,
    queryBus as unknown as QueryBus,
  );

  return { handler, repository, domainEvents };
}

describe('ImportAircraftByRegistrationHandler', () => {
  it('returns the aircraft in the fleet when its type matches the plan', async () => {
    const { handler, repository } = setUp({ id: 'aircraft-1', type: 'A339' });

    await expect(
      handler.execute(
        new ImportAircraftByRegistrationCommand('D-AIMC', 'A339', OPERATOR_ID),
      ),
    ).resolves.toBe('aircraft-1');
    expect(repository.createUnconfirmed).not.toHaveBeenCalled();
  });

  it('refuses a plan that flies a fleet aircraft as a different type', async () => {
    const { handler, repository } = setUp({ id: 'aircraft-1', type: 'A339' });

    await expect(
      handler.execute(
        new ImportAircraftByRegistrationCommand('D-AIMC', 'B77W', OPERATOR_ID),
      ),
    ).rejects.toThrow(new AircraftTypeMismatchError('D-AIMC', 'A339', 'B77W'));
    expect(repository.createUnconfirmed).not.toHaveBeenCalled();
  });

  it('creates an unknown registration as an unconfirmed aircraft of the operator', async () => {
    const { handler, repository, domainEvents } = setUp(null);

    const aircraftId = await handler.execute(
      new ImportAircraftByRegistrationCommand('D-AIXP', 'A359', OPERATOR_ID),
    );

    expect(repository.createUnconfirmed).toHaveBeenCalledWith(
      aircraftId,
      OPERATOR_ID,
      {
        type: 'A359',
        registration: 'D-AIXP',
        livery: `Lufthansa ${new Date().getFullYear()}`,
      },
    );
    expect(domainEvents.emitAsync).toHaveBeenCalledWith(
      expect.any(AircraftCreatedEvent),
    );
    expect(domainEvents.emitAsync.mock.calls[0][0]).toMatchObject({
      payload: { aircraftId, operatorId: OPERATOR_ID },
    });
  });

  it('refuses to create an unknown registration of a type that is not a known airframe', async () => {
    const { handler, repository } = setUp(null);

    await expect(
      handler.execute(
        new ImportAircraftByRegistrationCommand('D-AIXP', 'ZZZZ', OPERATOR_ID),
      ),
    ).rejects.toThrow(AirframeNotFoundError);
    expect(repository.createUnconfirmed).not.toHaveBeenCalled();
  });
});

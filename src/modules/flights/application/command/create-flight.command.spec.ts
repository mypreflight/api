import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  CreateFlightCommand,
  CreateFlightHandler,
} from './create-flight.command';
import {
  FlightEventType,
  FlightWasCreatedEvent,
} from '../../../../core/domain/events/dto/flight.events';
import { DomainEventEmitter } from '../../../../core/domain/events/domain-event-emitter';
import { CreateFlightRequest } from '../../infra/http/request/flight.dto';

describe('CreateFlightHandler', () => {
  it('finishes only after the listeners of the created flight have', async () => {
    const emitter = new EventEmitter2();
    const handled: string[] = [];
    emitter.on(
      FlightEventType.FlightWasCreated,
      async (event: FlightWasCreatedEvent) => {
        await new Promise((resolve) => setImmediate(resolve));
        handled.push(event.payload.aircraftId);
      },
    );
    const handler = new CreateFlightHandler(
      { execute: jest.fn().mockResolvedValue(true) } as never,
      { create: jest.fn() } as never,
      { issuePreliminary: jest.fn() } as never,
      new DomainEventEmitter(emitter),
    );

    await handler.execute(
      new CreateFlightCommand(
        'flight-1',
        {
          aircraftId: 'aircraft-1',
          operatorId: 'operator-1',
          departureAirportId: 'departure-1',
          destinationAirportId: 'destination-1',
          loadsheet: null,
        } as unknown as CreateFlightRequest,
        'operations-1',
      ),
    );

    expect(handled).toEqual(['aircraft-1']);
  });
});

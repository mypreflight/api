import {
  FlightChangedConcurrentlyError,
  InvalidStatusToReportOffBlockError,
} from '../../model/error/flight.error';
import {
  ReportOffBlockCommand,
  ReportOffBlockHandler,
} from './report-off-block.command';
import { FlightStatus } from '../../model/flight.model';
import {
  FlightEventScope,
  OffBlockWasReportedEvent,
} from '../../../../core/domain/events/dto/flight.events';
import { DomainEventEmitter } from '../../../../core/domain/events/domain-event-emitter';
import { Flight } from '../../model/flight';
import {
  FIXTURE_AIRCRAFT_ID,
  FIXTURE_FLIGHT_ID,
  flightIn,
} from '../../model/flight.fixture';

describe('ReportOffBlockHandler', () => {
  let flightsRepository: { load: jest.Mock; save: jest.Mock };
  let emitter: { emit: jest.Mock };
  let handler: ReportOffBlockHandler;

  const saved = (): Flight => flightsRepository.save.mock.calls[0][0];
  const emitted = () =>
    emitter.emit.mock.calls[0][1] as OffBlockWasReportedEvent;

  beforeEach(() => {
    flightsRepository = {
      load: jest
        .fn()
        .mockResolvedValue(flightIn(FlightStatus.BoardingFinished)),
      save: jest.fn(),
    };
    emitter = { emit: jest.fn() };
    handler = new ReportOffBlockHandler(
      flightsRepository as never,
      new DomainEventEmitter(emitter as never),
    );
  });

  it('reports a manual off-block as a user-scoped event flagged not automatic', async () => {
    await handler.execute(
      new ReportOffBlockCommand(FIXTURE_FLIGHT_ID, 'actor-1'),
    );

    expect(saved().status).toBe(FlightStatus.TaxiingOut);
    const event = emitted();
    expect(event).toBeInstanceOf(OffBlockWasReportedEvent);
    expect(event.payload.scope).toBe(FlightEventScope.User);
    expect(event.payload.actorId).toBe('actor-1');
    expect(event.payload.aircraftId).toBe(FIXTURE_AIRCRAFT_ID);
    expect(event.payload.payload).toEqual({ automaticallyDetected: false });
  });

  it('reports an automatic off-block as a user-scoped event with no actor and the backdated time', async () => {
    const offBlockTime = new Date('2025-01-01T13:02:00.000Z');
    const command = new ReportOffBlockCommand(
      FIXTURE_FLIGHT_ID,
      null,
      offBlockTime,
      true,
    );

    await handler.execute(command);

    expect(saved().snapshot().timesheet.actual).toEqual({
      offBlockTime,
      takeoffTime: null,
      arrivalTime: null,
      onBlockTime: null,
    });
    const event = emitted();
    expect(event.payload.scope).toBe(FlightEventScope.User);
    expect(event.payload.actorId).toBeNull();
    expect(event.payload.payload).toEqual({ automaticallyDetected: true });
  });

  it('emits nothing when another request changed the flight first', async () => {
    flightsRepository.save.mockRejectedValue(
      new FlightChangedConcurrentlyError(),
    );

    await expect(
      handler.execute(new ReportOffBlockCommand(FIXTURE_FLIGHT_ID, 'actor-1')),
    ).rejects.toBeInstanceOf(FlightChangedConcurrentlyError);
    expect(emitter.emit).not.toHaveBeenCalled();
  });

  it('rejects off-block when the flight has not finished boarding', async () => {
    flightsRepository.load.mockResolvedValue(
      flightIn(FlightStatus.BoardingStarted),
    );

    await expect(
      handler.execute(new ReportOffBlockCommand(FIXTURE_FLIGHT_ID, 'actor-1')),
    ).rejects.toBeInstanceOf(InvalidStatusToReportOffBlockError);
    expect(flightsRepository.save).not.toHaveBeenCalled();
    expect(emitter.emit).not.toHaveBeenCalled();
  });
});

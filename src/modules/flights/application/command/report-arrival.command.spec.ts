import { InvalidStatusToReportArrivedError } from '../../model/error/flight.error';
import {
  ReportArrivalCommand,
  ReportArrivalHandler,
} from './report-arrival.command';
import { FlightStatus } from '../../model/flight.model';
import {
  ArrivalWasReportedEvent,
  FlightEventScope,
} from '../../../../core/domain/events/dto/flight.events';
import { DomainEventEmitter } from '../../../../core/domain/events/domain-event-emitter';
import { Flight } from '../../model/flight';
import {
  FIXTURE_FLIGHT_ID,
  flightIn,
  flightSnapshot,
} from '../../model/flight.fixture';

const OFF_BLOCK_TIME = new Date('2025-01-01T13:10:00.000Z');
const TAKEOFF_TIME = new Date('2025-01-01T13:25:00.000Z');

function inCruiseFlight(): Flight {
  return flightIn(FlightStatus.InCruise, {
    timesheet: {
      ...flightSnapshot().timesheet,
      actual: {
        offBlockTime: OFF_BLOCK_TIME,
        takeoffTime: TAKEOFF_TIME,
        arrivalTime: null,
        onBlockTime: null,
      },
    },
  });
}

describe('ReportArrivalHandler', () => {
  let flightsRepository: { load: jest.Mock; save: jest.Mock };
  let emitter: { emitAsync: jest.Mock };
  let handler: ReportArrivalHandler;

  const saved = (): Flight => flightsRepository.save.mock.calls[0][0];
  const emitted = () =>
    emitter.emitAsync.mock.calls[0][1] as ArrivalWasReportedEvent;

  beforeEach(() => {
    flightsRepository = {
      load: jest.fn().mockResolvedValue(inCruiseFlight()),
      save: jest.fn(),
    };
    emitter = { emitAsync: jest.fn() };
    handler = new ReportArrivalHandler(
      flightsRepository as never,
      new DomainEventEmitter(emitter as never),
    );
  });

  it('reports a manual arrival as a user-scoped event flagged not automatic', async () => {
    const before = Date.now();

    await handler.execute(
      new ReportArrivalCommand(FIXTURE_FLIGHT_ID, 'actor-1'),
    );

    const flight = saved();
    expect(flight.status).toBe(FlightStatus.TaxiingIn);
    const arrivalTime = flight.snapshot().timesheet.actual.arrivalTime;
    expect(arrivalTime?.getTime()).toBeGreaterThanOrEqual(before);

    const event = emitted();
    expect(event).toBeInstanceOf(ArrivalWasReportedEvent);
    expect(event.payload.scope).toBe(FlightEventScope.User);
    expect(event.payload.actorId).toBe('actor-1');
    expect(event.payload.payload).toEqual({ automaticallyDetected: false });
  });

  it('reports an automatic arrival as a user-scoped event with no actor and the backdated time', async () => {
    const arrivalTime = new Date('2025-01-01T15:50:00.000Z');
    const command = new ReportArrivalCommand(
      FIXTURE_FLIGHT_ID,
      null,
      arrivalTime,
      true,
    );

    await handler.execute(command);

    expect(saved().snapshot().timesheet.actual).toEqual({
      offBlockTime: OFF_BLOCK_TIME,
      takeoffTime: TAKEOFF_TIME,
      arrivalTime,
      onBlockTime: null,
    });
    const event = emitted();
    expect(event.payload.scope).toBe(FlightEventScope.User);
    expect(event.payload.actorId).toBeNull();
    expect(event.payload.payload).toEqual({ automaticallyDetected: true });
  });

  it('rejects arrival when the flight is not in cruise', async () => {
    flightsRepository.load.mockResolvedValue(flightIn(FlightStatus.TaxiingOut));

    await expect(
      handler.execute(new ReportArrivalCommand(FIXTURE_FLIGHT_ID, 'actor-1')),
    ).rejects.toBeInstanceOf(InvalidStatusToReportArrivedError);
    expect(flightsRepository.save).not.toHaveBeenCalled();
    expect(emitter.emitAsync).not.toHaveBeenCalled();
  });
});

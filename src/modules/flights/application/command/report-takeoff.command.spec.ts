import { InvalidStatusToReportTakenOffError } from '../../model/error/flight.error';
import {
  ReportTakeoffCommand,
  ReportTakeoffHandler,
} from './report-takeoff.command';
import { FlightStatus } from '../../model/flight.model';
import {
  FlightEventScope,
  TakeoffWasReportedEvent,
} from '../../../../core/domain/events/dto/flight.events';
import { DomainEventEmitter } from '../../../../core/domain/events/domain-event-emitter';
import { Flight } from '../../model/flight';
import {
  FIXTURE_FLIGHT_ID,
  flightIn,
  flightSnapshot,
} from '../../model/flight.fixture';

const OFF_BLOCK_TIME = new Date('2025-01-01T13:10:00.000Z');

function taxiingOutFlight(): Flight {
  return flightIn(FlightStatus.TaxiingOut, {
    timesheet: {
      ...flightSnapshot().timesheet,
      actual: {
        offBlockTime: OFF_BLOCK_TIME,
        takeoffTime: null,
        arrivalTime: null,
        onBlockTime: null,
      },
    },
  });
}

describe('ReportTakeoffHandler', () => {
  let flightsRepository: { load: jest.Mock; save: jest.Mock };
  let emitter: { emitAsync: jest.Mock };
  let handler: ReportTakeoffHandler;

  const saved = (): Flight => flightsRepository.save.mock.calls[0][0];
  const emitted = () =>
    emitter.emitAsync.mock.calls[0][1] as TakeoffWasReportedEvent;

  beforeEach(() => {
    flightsRepository = {
      load: jest.fn().mockResolvedValue(taxiingOutFlight()),
      save: jest.fn(),
    };
    emitter = { emitAsync: jest.fn() };
    handler = new ReportTakeoffHandler(
      flightsRepository as never,
      new DomainEventEmitter(emitter as never),
    );
  });

  it('reports a manual takeoff as a user-scoped event flagged not automatic', async () => {
    await handler.execute(
      new ReportTakeoffCommand(FIXTURE_FLIGHT_ID, 'actor-1'),
    );

    expect(saved().status).toBe(FlightStatus.InCruise);
    const event = emitted();
    expect(event).toBeInstanceOf(TakeoffWasReportedEvent);
    expect(event.payload.scope).toBe(FlightEventScope.User);
    expect(event.payload.actorId).toBe('actor-1');
    expect(event.payload.payload).toEqual({ automaticallyDetected: false });
  });

  it('reports an automatic takeoff as a user-scoped event with no actor and the backdated time', async () => {
    const takeoffTime = new Date('2025-01-01T13:14:00.000Z');
    const command = new ReportTakeoffCommand(
      FIXTURE_FLIGHT_ID,
      null,
      takeoffTime,
      true,
    );

    await handler.execute(command);

    expect(saved().snapshot().timesheet.actual).toEqual({
      offBlockTime: OFF_BLOCK_TIME,
      takeoffTime,
      arrivalTime: null,
      onBlockTime: null,
    });
    const event = emitted();
    expect(event.payload.scope).toBe(FlightEventScope.User);
    expect(event.payload.actorId).toBeNull();
    expect(event.payload.payload).toEqual({ automaticallyDetected: true });
  });

  it('rejects takeoff when the flight is not taxiing out', async () => {
    flightsRepository.load.mockResolvedValue(flightIn(FlightStatus.InCruise));

    await expect(
      handler.execute(new ReportTakeoffCommand(FIXTURE_FLIGHT_ID, 'actor-1')),
    ).rejects.toBeInstanceOf(InvalidStatusToReportTakenOffError);
    expect(flightsRepository.save).not.toHaveBeenCalled();
    expect(emitter.emitAsync).not.toHaveBeenCalled();
  });
});

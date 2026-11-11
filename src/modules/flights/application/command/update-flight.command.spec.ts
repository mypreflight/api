import {
  FlightDoesNotExistError,
  InvalidStatusToChangeServiceTypeError,
} from '../../model/error/flight.error';
import {
  UpdateFlightCommand,
  UpdateFlightHandler,
} from './update-flight.command';
import { FlightServiceType, FlightStatus } from '../../model/flight.model';
import { Flight } from '../../model/flight';
import { FIXTURE_FLIGHT_ID, flightIn } from '../../model/flight.fixture';

describe('UpdateFlightHandler', () => {
  let flightsRepository: { load: jest.Mock; save: jest.Mock };
  let cacheManager: { del: jest.Mock };
  let handler: UpdateFlightHandler;

  const saved = (): Flight => flightsRepository.save.mock.calls[0][0];

  beforeEach(() => {
    flightsRepository = {
      load: jest.fn().mockResolvedValue(flightIn(FlightStatus.Created)),
      save: jest.fn(),
    };
    cacheManager = { del: jest.fn() };
    handler = new UpdateFlightHandler(
      flightsRepository as never,
      cacheManager as never,
    );
  });

  it('changes the service type of a flight in created status', async () => {
    const command = new UpdateFlightCommand(
      FIXTURE_FLIGHT_ID,
      FlightServiceType.Cargo,
    );

    await handler.execute(command);

    expect(saved().snapshot().serviceType).toBe(FlightServiceType.Cargo);
  });

  it('evicts the cached flight body after the write', async () => {
    const command = new UpdateFlightCommand(
      FIXTURE_FLIGHT_ID,
      FlightServiceType.Cargo,
    );

    await handler.execute(command);

    expect(cacheManager.del).toHaveBeenCalled();
    expect(
      cacheManager.del.mock.calls.every(([key]) =>
        String(key).includes(FIXTURE_FLIGHT_ID),
      ),
    ).toBe(true);
  });

  it('rejects a service type change once the flight left created status', async () => {
    flightsRepository.load.mockResolvedValue(flightIn(FlightStatus.Ready));

    await expect(
      handler.execute(
        new UpdateFlightCommand(FIXTURE_FLIGHT_ID, FlightServiceType.Cargo),
      ),
    ).rejects.toBeInstanceOf(InvalidStatusToChangeServiceTypeError);
    expect(flightsRepository.save).not.toHaveBeenCalled();
    expect(cacheManager.del).not.toHaveBeenCalled();
  });

  it('rejects an update for a flight that does not exist', async () => {
    flightsRepository.load.mockRejectedValue(new FlightDoesNotExistError());

    await expect(
      handler.execute(
        new UpdateFlightCommand(FIXTURE_FLIGHT_ID, FlightServiceType.Cargo),
      ),
    ).rejects.toBeInstanceOf(FlightDoesNotExistError);
    expect(flightsRepository.save).not.toHaveBeenCalled();
  });

  it('writes nothing when no attribute is supplied', async () => {
    await handler.execute(new UpdateFlightCommand(FIXTURE_FLIGHT_ID));

    expect(flightsRepository.save).not.toHaveBeenCalled();
    expect(cacheManager.del).not.toHaveBeenCalled();
  });

  it('accepts an empty update for a flight that already left created status', async () => {
    flightsRepository.load.mockResolvedValue(flightIn(FlightStatus.Closed));

    await expect(
      handler.execute(new UpdateFlightCommand(FIXTURE_FLIGHT_ID)),
    ).resolves.toBeUndefined();
    expect(flightsRepository.save).not.toHaveBeenCalled();
  });
});

import { FlightsRepository } from './flights.repository';
import { flightAggregateRow } from './flight-aggregate.fixture';
import { FlightAggregateRow } from './flight-aggregate.mapper';
import {
  FlightChangedConcurrentlyError,
  FlightDoesNotExistError,
} from '../../../model/error/flight.error';
import { ConflictError } from '../../../../../core/errors/domain-error';
import { FlightActor } from '../../../model/flight';
import { FlightEventScope } from '../../../model/event.model';
import { FlightStatus, FlightTracking } from '../../../model/flight.model';
import { FIXTURE_FLIGHT_ID, flightIn } from '../../../model/flight.fixture';

const PILOT: FlightActor = { id: 'pilot-1', scope: FlightEventScope.User };
const DETECTOR: FlightActor = { id: null, scope: FlightEventScope.User };
const PILOT_TIME = new Date('2025-01-01T13:02:00.000Z');
const DETECTED_TIME = new Date('2025-01-01T13:03:00.000Z');

type Where = { id: string; status?: string };

function databaseHolding(stored: FlightAggregateRow) {
  const row = { ...stored };

  return {
    row,
    flight: {
      findUnique: jest.fn(async ({ where }: { where: Where }) =>
        where.id === row.id ? { ...row, airports: [...row.airports] } : null,
      ),
      updateMany: jest.fn(
        async ({
          where,
          data,
        }: {
          where: Where;
          data: Partial<FlightAggregateRow>;
        }) => {
          if (where.id !== row.id || where.status !== row.status) {
            return { count: 0 };
          }

          Object.assign(row, data);

          return { count: 1 };
        },
      ),
    },
  };
}

async function conflictOf(save: Promise<void>): Promise<unknown> {
  return save.then(
    () => null,
    (error: unknown) => error,
  );
}

describe('FlightsRepository', () => {
  describe('two requests changing the same flight', () => {
    it('refuses the later of two off-block reports with a 409 and keeps the first', async () => {
      const database = databaseHolding(
        flightAggregateRow({ status: FlightStatus.BoardingFinished }),
      );
      const repository = new FlightsRepository(database as never);
      const pilot = await repository.load(FIXTURE_FLIGHT_ID);
      const detector = await repository.load(FIXTURE_FLIGHT_ID);

      pilot.reportOffBlock(PILOT, PILOT_TIME, false);
      detector.reportOffBlock(DETECTOR, DETECTED_TIME, true);
      await repository.save(pilot);
      const error = await conflictOf(repository.save(detector));

      expect(error).toBeInstanceOf(FlightChangedConcurrentlyError);
      expect(error).toBeInstanceOf(ConflictError);
      expect(error).toMatchObject({
        status: 409,
        message:
          'Flight was changed by another request. Reload it and try again.',
      });
      expect(database.row.status).toBe(FlightStatus.TaxiingOut);
      expect(database.row.actualOffBlockTime).toEqual(PILOT_TIME);
    });

    it('refuses an edit whose status rule stopped holding before it was saved', async () => {
      const database = databaseHolding(
        flightAggregateRow({ status: FlightStatus.TaxiingOut }),
      );
      const repository = new FlightsRepository(database as never);
      const pilot = await repository.load(FIXTURE_FLIGHT_ID);
      const detector = await repository.load(FIXTURE_FLIGHT_ID);

      pilot.changeAtcCallsign(PILOT, 'DLH5PJ');
      detector.reportTakeoff(DETECTOR, DETECTED_TIME, true);
      await repository.save(detector);
      const error = await conflictOf(repository.save(pilot));

      expect(error).toBeInstanceOf(FlightChangedConcurrentlyError);
      expect(database.row.status).toBe(FlightStatus.InCruise);
      expect(database.row.atcCallsign).toBeNull();
    });
  });

  describe('save', () => {
    it('writes only the changed columns, conditioned on the status it loaded', async () => {
      const database = databaseHolding(
        flightAggregateRow({ status: FlightStatus.BoardingFinished }),
      );
      const repository = new FlightsRepository(database as never);
      const flight = await repository.load(FIXTURE_FLIGHT_ID);

      flight.reportOffBlock(PILOT, PILOT_TIME, false);
      await repository.save(flight);

      expect(database.flight.updateMany).toHaveBeenCalledWith({
        where: { id: FIXTURE_FLIGHT_ID, status: FlightStatus.BoardingFinished },
        data: {
          status: FlightStatus.TaxiingOut,
          actualOffBlockTime: PILOT_TIME,
        },
      });
    });

    it('conditions the next save on the status it last wrote', async () => {
      const database = databaseHolding(
        flightAggregateRow({ status: FlightStatus.BoardingFinished }),
      );
      const repository = new FlightsRepository(database as never);
      const flight = await repository.load(FIXTURE_FLIGHT_ID);

      flight.reportOffBlock(PILOT, PILOT_TIME, false);
      await repository.save(flight);
      flight.reportTakeoff(PILOT, DETECTED_TIME, false);
      await repository.save(flight);

      const [, second] = database.flight.updateMany.mock.calls;
      expect(second[0].where).toEqual({
        id: FIXTURE_FLIGHT_ID,
        status: FlightStatus.TaxiingOut,
      });
      expect(database.row.status).toBe(FlightStatus.InCruise);
    });

    it('writes nothing when nothing changed', async () => {
      const database = databaseHolding(
        flightAggregateRow({ tracking: FlightTracking.Private }),
      );
      const repository = new FlightsRepository(database as never);
      const flight = await repository.load(FIXTURE_FLIGHT_ID);

      flight.changeTracking(FlightTracking.Private);
      await repository.save(flight);

      expect(database.flight.updateMany).not.toHaveBeenCalled();
    });

    it('refuses a flight it did not load', async () => {
      const database = databaseHolding(flightAggregateRow());
      const repository = new FlightsRepository(database as never);

      await expect(
        repository.save(flightIn(FlightStatus.Created)),
      ).rejects.toThrow('was not loaded by this repository');
      expect(database.flight.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('load', () => {
    it('answers that a missing flight does not exist', async () => {
      const database = databaseHolding(flightAggregateRow());
      const repository = new FlightsRepository(database as never);

      await expect(
        repository.load('3f1c0a52-6c1e-4e8e-9a51-1b2a3c4d5e6f'),
      ).rejects.toBeInstanceOf(FlightDoesNotExistError);
    });
  });
});

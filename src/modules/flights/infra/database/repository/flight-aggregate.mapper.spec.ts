import { Prisma } from '../../../../../../prisma/client/client';
import {
  FlightAggregateRow,
  toFlightChanges,
  toFlightSnapshot,
} from './flight-aggregate.mapper';
import { flightSnapshot } from '../../../model/flight.fixture';
import { FlightStatus } from '../../../model/flight.model';
import { AirportType } from '../../../../airports/model/airport.model';

const AT = new Date('2025-01-01T13:00:00.000Z');

function row(overrides: Partial<FlightAggregateRow> = {}): FlightAggregateRow {
  return {
    id: 'flight-1',
    status: 'in_cruise',
    aircraftId: 'aircraft-1',
    captainId: 'captain-1',
    tracking: 'public',
    serviceType: 'cargo',
    atcCallsign: 'DLH5PJ',
    departureParkingPositionId: 'stand-1',
    departureRunwayId: 'runway-1',
    arrivalParkingPositionId: null,
    arrivalRunwayId: null,
    isDiversionDeclared: true,
    actualFuelBurned: new Prisma.Decimal('12.345'),
    actualAirborneMinutes: null,
    actualBlockMinutes: null,
    completedAt: null,
    scheduledOffBlockTime: AT,
    scheduledTakeoffTime: null,
    scheduledArrivalTime: null,
    scheduledOnBlockTime: null,
    estimatedOffBlockTime: null,
    estimatedTakeoffTime: null,
    estimatedArrivalTime: null,
    estimatedOnBlockTime: null,
    actualOffBlockTime: null,
    actualTakeoffTime: AT,
    actualArrivalTime: null,
    actualOnBlockTime: null,
    predictedOffBlockTime: null,
    predictedTakeoffTime: null,
    predictedArrivalTime: null,
    predictedOnBlockTime: AT,
    airports: [
      { airportId: 'airport-1', airportType: 'departure' },
      { airportId: 'airport-2', airportType: 'destination' },
    ],
    ...overrides,
  };
}

describe('toFlightSnapshot', () => {
  it('reads every timesheet column into its schedule and the fuel as a number', () => {
    const snapshot = toFlightSnapshot(row());

    expect(snapshot.status).toBe(FlightStatus.InCruise);
    expect(snapshot.actualFuelBurned).toBe(12.345);
    expect(snapshot.airports).toEqual([
      { id: 'airport-1', type: AirportType.Departure },
      { id: 'airport-2', type: AirportType.Destination },
    ]);
    expect(snapshot.timesheet.scheduled.offBlockTime).toBe(AT);
    expect(snapshot.timesheet.actual.takeoffTime).toBe(AT);
    expect(snapshot.timesheet.predicted.onBlockTime).toBe(AT);
    expect(snapshot.timesheet.estimated).toEqual({
      offBlockTime: null,
      takeoffTime: null,
      arrivalTime: null,
      onBlockTime: null,
    });
  });
});

describe('toFlightChanges', () => {
  it('writes nothing for an unchanged flight', () => {
    const snapshot = toFlightSnapshot(row());

    expect(toFlightChanges(snapshot, toFlightSnapshot(row()))).toEqual({});
  });

  it('treats equal times held in different Date objects as unchanged', () => {
    const before = flightSnapshot();
    const after = flightSnapshot();
    before.timesheet.actual.offBlockTime = new Date(AT);
    after.timesheet.actual.offBlockTime = new Date(AT);

    expect(toFlightChanges(before, after)).toEqual({});
  });

  it('writes only the columns that changed', () => {
    const before = flightSnapshot();
    const after = flightSnapshot({
      status: FlightStatus.TaxiingOut,
      atcCallsign: 'DLH5PJ',
    });
    after.timesheet.actual.offBlockTime = AT;

    expect(toFlightChanges(before, after)).toEqual({
      status: FlightStatus.TaxiingOut,
      atcCallsign: 'DLH5PJ',
      actualOffBlockTime: AT,
    });
  });

  it('writes a value cleared to null', () => {
    const before = flightSnapshot({ captainId: 'captain-1' });
    const after = flightSnapshot();

    expect(toFlightChanges(before, after)).toEqual({ captainId: null });
  });
});

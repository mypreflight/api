import { FlightAggregateRow } from './flight-aggregate.mapper';
import {
  TIMESHEET_COLUMN_NAMES,
  TimesheetRow,
} from '../../../model/timesheet.mapper';
import {
  FIXTURE_AIRCRAFT_ID,
  FIXTURE_DEPARTURE_ID,
  FIXTURE_DESTINATION_ID,
  FIXTURE_FLIGHT_ID,
} from '../../../model/flight.fixture';

const noTimes = (): TimesheetRow =>
  Object.fromEntries(
    TIMESHEET_COLUMN_NAMES.map((column) => [column, null]),
  ) as TimesheetRow;

export function flightAggregateRow(
  overrides: Partial<FlightAggregateRow> = {},
): FlightAggregateRow {
  return {
    id: FIXTURE_FLIGHT_ID,
    status: 'created',
    aircraftId: FIXTURE_AIRCRAFT_ID,
    captainId: null,
    tracking: 'private',
    serviceType: 'passenger',
    atcCallsign: null,
    departureParkingPositionId: null,
    departureRunwayId: null,
    arrivalParkingPositionId: null,
    arrivalRunwayId: null,
    isDiversionDeclared: false,
    actualFuelBurned: null,
    actualAirborneMinutes: null,
    actualBlockMinutes: null,
    completedAt: null,
    ...noTimes(),
    airports: [
      { airportId: FIXTURE_DEPARTURE_ID, airportType: 'departure' },
      { airportId: FIXTURE_DESTINATION_ID, airportType: 'destination' },
    ],
    ...overrides,
  };
}

import { Prisma } from '../../../../../../prisma/client/client';
import {
  FlightServiceType,
  FlightStatus,
  FlightTracking,
} from '../../../model/flight.model';
import {
  FlightSnapshot,
  FlightTimes,
  FlightTimesheet,
} from '../../../model/flight';
import {
  TIMESHEET_COLUMNS,
  TIMESHEET_COLUMN_NAMES,
  TimesheetColumn,
  TimesheetRow,
  TimesheetScheduleName,
  toTimesheetData,
} from '../../../model/timesheet.mapper';
import { AirportType } from '../../../../airports/model/airport.model';

const timesheetFields = Object.fromEntries(
  TIMESHEET_COLUMN_NAMES.map((column) => [column, true]),
) as Record<TimesheetColumn, true>;

export const flightAggregateFields = {
  id: true,
  status: true,
  aircraftId: true,
  captainId: true,
  tracking: true,
  serviceType: true,
  atcCallsign: true,
  departureParkingPositionId: true,
  departureRunwayId: true,
  arrivalParkingPositionId: true,
  arrivalRunwayId: true,
  isDiversionDeclared: true,
  actualFuelBurned: true,
  actualAirborneMinutes: true,
  actualBlockMinutes: true,
  completedAt: true,
  ...timesheetFields,
  airports: {
    orderBy: [{ airportType: 'asc' }, { airport: { icaoCode: 'asc' } }],
    select: { airportId: true, airportType: true },
  },
} as const satisfies Prisma.FlightSelect;

export type FlightAggregateRow = Prisma.FlightGetPayload<{
  select: typeof flightAggregateFields;
}>;

const SCHEDULES = Object.keys(TIMESHEET_COLUMNS) as TimesheetScheduleName[];

function toFlightTimes(
  row: TimesheetRow,
  schedule: TimesheetScheduleName,
): FlightTimes {
  const columns = TIMESHEET_COLUMNS[schedule];

  return {
    offBlockTime: row[columns.offBlockTime],
    takeoffTime: row[columns.takeoffTime],
    arrivalTime: row[columns.arrivalTime],
    onBlockTime: row[columns.onBlockTime],
  };
}

function toFlightTimesheet(row: TimesheetRow): FlightTimesheet {
  return Object.fromEntries(
    SCHEDULES.map((schedule) => [schedule, toFlightTimes(row, schedule)]),
  ) as FlightTimesheet;
}

export function toFlightSnapshot(row: FlightAggregateRow): FlightSnapshot {
  return {
    id: row.id,
    status: row.status as FlightStatus,
    aircraftId: row.aircraftId,
    airports: row.airports.map((airport) => ({
      id: airport.airportId,
      type: airport.airportType as AirportType,
    })),
    captainId: row.captainId,
    tracking: row.tracking as FlightTracking,
    serviceType: row.serviceType as FlightServiceType,
    atcCallsign: row.atcCallsign,
    departureParkingPositionId: row.departureParkingPositionId,
    departureRunwayId: row.departureRunwayId,
    arrivalParkingPositionId: row.arrivalParkingPositionId,
    arrivalRunwayId: row.arrivalRunwayId,
    isDiversionDeclared: row.isDiversionDeclared,
    timesheet: toFlightTimesheet(row),
    actualFuelBurned:
      row.actualFuelBurned === null ? null : row.actualFuelBurned.toNumber(),
    completion: {
      actualAirborneMinutes: row.actualAirborneMinutes,
      actualBlockMinutes: row.actualBlockMinutes,
      completedAt: row.completedAt,
    },
  };
}

function toFlightColumns(
  snapshot: FlightSnapshot,
): Prisma.FlightUncheckedUpdateManyInput {
  return {
    status: snapshot.status,
    captainId: snapshot.captainId,
    tracking: snapshot.tracking,
    serviceType: snapshot.serviceType,
    atcCallsign: snapshot.atcCallsign,
    departureParkingPositionId: snapshot.departureParkingPositionId,
    departureRunwayId: snapshot.departureRunwayId,
    arrivalParkingPositionId: snapshot.arrivalParkingPositionId,
    arrivalRunwayId: snapshot.arrivalRunwayId,
    actualFuelBurned: snapshot.actualFuelBurned,
    actualAirborneMinutes: snapshot.completion.actualAirborneMinutes,
    actualBlockMinutes: snapshot.completion.actualBlockMinutes,
    completedAt: snapshot.completion.completedAt,
    ...toTimesheetData(snapshot.timesheet),
  };
}

function isSameValue(before: unknown, after: unknown): boolean {
  if (before instanceof Date && after instanceof Date) {
    return before.getTime() === after.getTime();
  }

  return before === after;
}

export function toFlightChanges(
  before: FlightSnapshot,
  after: FlightSnapshot,
): Prisma.FlightUncheckedUpdateManyInput {
  const previous: Record<string, unknown> = toFlightColumns(before);

  return Object.fromEntries(
    Object.entries(toFlightColumns(after)).filter(
      ([column, value]) => !isSameValue(previous[column], value),
    ),
  );
}

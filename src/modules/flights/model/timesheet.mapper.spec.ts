import {
  TIMESHEET_COLUMN_NAMES,
  TimesheetRow,
  toTimesheet,
  toTimesheetColumns,
  toTimesheetData,
  withTimesheet,
} from './timesheet.mapper';

const OFF_BLOCK = new Date('2025-01-01T13:00:00.000Z');
const TAKEOFF = new Date('2025-01-01T13:15:00.000Z');
const ARRIVAL = new Date('2025-01-01T16:00:00.000Z');
const ON_BLOCK = new Date('2025-01-01T16:18:00.000Z');

function row(overrides: Partial<TimesheetRow> = {}): TimesheetRow {
  const empty = Object.fromEntries(
    TIMESHEET_COLUMN_NAMES.map((column) => [column, null]),
  ) as TimesheetRow;

  return { ...empty, ...overrides };
}

describe('timesheet mapper', () => {
  it('maps a flight with no times to an empty timesheet', () => {
    expect(toTimesheet(row())).toEqual({});
  });

  it('maps every schedule that has a time, showing its missing times as null', () => {
    const timesheet = toTimesheet(
      row({
        scheduledOffBlockTime: OFF_BLOCK,
        scheduledTakeoffTime: TAKEOFF,
        scheduledArrivalTime: ARRIVAL,
        scheduledOnBlockTime: ON_BLOCK,
        actualOffBlockTime: OFF_BLOCK,
        predictedArrivalTime: ARRIVAL,
      }),
    );

    expect(timesheet).toEqual({
      scheduled: {
        offBlockTime: OFF_BLOCK,
        takeoffTime: TAKEOFF,
        arrivalTime: ARRIVAL,
        onBlockTime: ON_BLOCK,
      },
      actual: {
        offBlockTime: OFF_BLOCK,
        takeoffTime: null,
        arrivalTime: null,
        onBlockTime: null,
      },
      predicted: {
        offBlockTime: null,
        takeoffTime: null,
        arrivalTime: ARRIVAL,
        onBlockTime: null,
      },
    });
  });

  it('replaces the time columns of a row with its timesheet and keeps everything else', () => {
    const flight = withTimesheet({
      ...row({ actualTakeoffTime: TAKEOFF }),
      id: 'ed247c36-58f0-43ff-81fd-ffae548a73e2',
      status: 'in_cruise',
    });

    expect(flight).toEqual({
      id: 'ed247c36-58f0-43ff-81fd-ffae548a73e2',
      status: 'in_cruise',
      timesheet: {
        actual: {
          offBlockTime: null,
          takeoffTime: TAKEOFF,
          arrivalTime: null,
          onBlockTime: null,
        },
      },
    });
  });

  it('writes only the times a patch carries, clearing those sent as null', () => {
    expect(
      toTimesheetColumns('predicted', {
        arrivalTime: ARRIVAL,
        onBlockTime: null,
        takeoffTime: undefined,
      }),
    ).toEqual({ predictedArrivalTime: ARRIVAL, predictedOnBlockTime: null });
  });

  it('writes each schedule of a timesheet to its own columns', () => {
    expect(
      toTimesheetData({
        scheduled: {
          offBlockTime: OFF_BLOCK,
          takeoffTime: TAKEOFF,
          arrivalTime: ARRIVAL,
          onBlockTime: ON_BLOCK,
        },
        estimated: { offBlockTime: OFF_BLOCK },
      }),
    ).toEqual({
      scheduledOffBlockTime: OFF_BLOCK,
      scheduledTakeoffTime: TAKEOFF,
      scheduledArrivalTime: ARRIVAL,
      scheduledOnBlockTime: ON_BLOCK,
      estimatedOffBlockTime: OFF_BLOCK,
    });
  });
});

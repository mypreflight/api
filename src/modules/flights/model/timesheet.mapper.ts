import { FullTimesheet, Schedule, SchedulePatch } from './timesheet.model';

export const TIMESHEET_COLUMNS = {
  scheduled: {
    offBlockTime: 'scheduledOffBlockTime',
    takeoffTime: 'scheduledTakeoffTime',
    arrivalTime: 'scheduledArrivalTime',
    onBlockTime: 'scheduledOnBlockTime',
  },
  estimated: {
    offBlockTime: 'estimatedOffBlockTime',
    takeoffTime: 'estimatedTakeoffTime',
    arrivalTime: 'estimatedArrivalTime',
    onBlockTime: 'estimatedOnBlockTime',
  },
  actual: {
    offBlockTime: 'actualOffBlockTime',
    takeoffTime: 'actualTakeoffTime',
    arrivalTime: 'actualArrivalTime',
    onBlockTime: 'actualOnBlockTime',
  },
  predicted: {
    offBlockTime: 'predictedOffBlockTime',
    takeoffTime: 'predictedTakeoffTime',
    arrivalTime: 'predictedArrivalTime',
    onBlockTime: 'predictedOnBlockTime',
  },
} as const satisfies Record<
  keyof FullTimesheet,
  Record<keyof Schedule, string>
>;

export type TimesheetScheduleName = keyof typeof TIMESHEET_COLUMNS;

export type TimesheetColumn =
  (typeof TIMESHEET_COLUMNS)[TimesheetScheduleName][keyof Schedule];

export type TimesheetRow = Record<TimesheetColumn, Date | null>;

export type TimesheetPatch = Partial<
  Record<TimesheetScheduleName, SchedulePatch>
>;

const SCHEDULES = Object.keys(TIMESHEET_COLUMNS) as TimesheetScheduleName[];

const TIMES = Object.keys(TIMESHEET_COLUMNS.scheduled) as (keyof Schedule)[];

export const TIMESHEET_COLUMN_NAMES: TimesheetColumn[] = SCHEDULES.flatMap(
  (schedule) => TIMES.map((time) => TIMESHEET_COLUMNS[schedule][time]),
);

const COLUMN_NAMES = new Set<string>(TIMESHEET_COLUMN_NAMES);

function toSchedule(
  row: TimesheetRow,
  name: TimesheetScheduleName,
): Schedule | null {
  const columns = TIMESHEET_COLUMNS[name];
  const schedule: Schedule = {
    offBlockTime: row[columns.offBlockTime],
    takeoffTime: row[columns.takeoffTime],
    arrivalTime: row[columns.arrivalTime],
    onBlockTime: row[columns.onBlockTime],
  };

  return TIMES.some((time) => schedule[time] !== null) ? schedule : null;
}

export function toTimesheet(row: TimesheetRow): FullTimesheet {
  const timesheet: FullTimesheet = {};

  for (const name of SCHEDULES) {
    const schedule = toSchedule(row, name);

    if (schedule) {
      timesheet[name] = schedule;
    }
  }

  return timesheet;
}

export function withTimesheet<T extends TimesheetRow>(
  row: T,
): Omit<T, TimesheetColumn> & { timesheet: FullTimesheet } {
  const rest = Object.fromEntries(
    Object.entries(row).filter(([key]) => !COLUMN_NAMES.has(key)),
  ) as Omit<T, TimesheetColumn>;

  return { ...rest, timesheet: toTimesheet(row) };
}

export function toTimesheetColumns(
  name: TimesheetScheduleName,
  patch: SchedulePatch,
): Partial<TimesheetRow> {
  const columns = TIMESHEET_COLUMNS[name];
  const data: Partial<TimesheetRow> = {};

  for (const time of TIMES) {
    const value = patch[time];

    if (value !== undefined) {
      data[columns[time]] = value;
    }
  }

  return data;
}

export function toTimesheetData(
  timesheet: TimesheetPatch,
): Partial<TimesheetRow> {
  return SCHEDULES.reduce<Partial<TimesheetRow>>(
    (data, name) => ({
      ...data,
      ...toTimesheetColumns(name, timesheet[name] ?? {}),
    }),
    {},
  );
}

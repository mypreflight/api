import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsDate, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class Schedule {
  @ApiProperty({
    description: 'Time when the aircraft lands',
    example: '2021-07-01T12:00:00Z',
    type: 'string',
  })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  arrivalTime!: Date | null;

  @ApiProperty({
    description: 'Time when aircraft parks at the gates',
    type: Date,
    example: '2021-07-01T12:00:00Z',
  })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  onBlockTime!: Date | null;

  @ApiProperty({
    description: 'Time when the aircraft takes off',
    type: Date,
    example: '2021-07-01T12:00:00Z',
  })
  @Type(() => Date)
  @IsNotEmpty()
  @IsDate()
  takeoffTime!: Date | null;

  @ApiProperty({
    description: 'Time when the aircraft leaves the gates',
    type: Date,
    example: '2021-07-01T12:00:00Z',
  })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  offBlockTime!: Date | null;
}

type NonNullable<T> = T extends null | undefined ? never : T;

export type FilledSchedule = {
  [K in keyof Schedule]: NonNullable<Schedule[K]>;
};

export class ScheduledTimesheet {
  @ApiProperty({
    description: 'Flight plan timesheet reported to air traffic services',
    type: Schedule,
  })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => Schedule)
  scheduled!: Schedule;
}

export class EstimatedTimesheet extends ScheduledTimesheet {
  @ApiProperty({
    description: 'Flight plan timesheet with values estimated by the crew',
    type: Schedule,
  })
  estimated?: Schedule;
}

export class FullTimesheet extends PartialType(EstimatedTimesheet) {
  @ApiProperty({
    description: 'Actual timesheet completed by the crew during the flight',
    type: Schedule,
  })
  actual?: Partial<Schedule>;

  @ApiProperty({
    description:
      'Predicted timesheet reported by the crew based on FMC readouts or ATC advisories',
    type: Schedule,
    required: false,
  })
  predicted?: Partial<Schedule>;
}

export type SchedulePatch = {
  [K in keyof Schedule]?: Date | null;
};

export const DEFAULT_FLIGHT_HOURS = 8;

export const scheduledFlightHours = (
  schedule: Partial<Schedule> | undefined,
): number => {
  if (!schedule?.offBlockTime || !schedule.onBlockTime) {
    return DEFAULT_FLIGHT_HOURS;
  }

  const minutes =
    (new Date(schedule.onBlockTime).getTime() -
      new Date(schedule.offBlockTime).getTime()) /
    60000;

  return minutes > 0
    ? Math.round((minutes / 60) * 10) / 10
    : DEFAULT_FLIGHT_HOURS;
};

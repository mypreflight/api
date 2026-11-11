import { ApiProperty } from '@nestjs/swagger';

export enum FlightStatus {
  Created = 'created',
  Ready = 'ready',
  CheckedIn = 'checked_in',
  BoardingStarted = 'boarding_started',
  BoardingFinished = 'boarding_finished',
  TaxiingOut = 'taxiing_out',
  InCruise = 'in_cruise',
  TaxiingIn = 'taxiing_in',
  OnBlock = 'on_block',
  OffboardingStarted = 'offboarding_started',
  OffboardingFinished = 'offboarding_finished',
  Closed = 'closed',
}

export enum FlightPhase {
  Upcoming = 'upcoming',
  Ongoing = 'ongoing',
  Finished = 'finished',
  Emergency = 'emergency',
}

export enum FlightListSort {
  CreatedAt = 'createdAt',
  ScheduledOffBlockTime = 'scheduledOffBlockTime',
  ActualOnBlockTime = 'actualOnBlockTime',
}

export enum FlightListOrder {
  Ascending = 'asc',
  Descending = 'desc',
}

export enum FlightSource {
  Manual = 'manual',
  Simbrief = 'simbrief',
}

export enum FlightTracking {
  Public = 'public',
  Private = 'private',
  Disabled = 'disabled',
}

export enum FlightServiceType {
  Passenger = 'passenger',
  Cargo = 'cargo',
}

export class FlightOfpDetails {
  @ApiProperty({
    description: 'HTML content of the operational flight plan',
    example: '<div>OFP content</div>',
  })
  ofpContent!: string;

  @ApiProperty({
    description: 'URL to external OFP PDF document',
    example: 'https://example.com/ofp/document.pdf',
  })
  ofpDocumentUrl!: string;

  @ApiProperty({
    description: 'Takeoff and landing runway analysis content',
    example: 'TAKEOFF RUNWAY 25C: ... LANDING RUNWAY 07L: ...',
  })
  runwayAnalysis!: string;
}

export class FlightPathElement {
  @ApiProperty({
    description: 'Callsign used by air traffic services, without spaces',
    example: 'DLH450',
  })
  callsign!: string;

  @ApiProperty({
    description: 'Timestamp of the flight event',
    example: '2023-10-01T12:00:00Z',
  })
  date!: Date;

  @ApiProperty({
    description: 'Latitude of the flight event',
    example: 52.52,
    minimum: -90,
    maximum: 90,
  })
  latitude!: number;

  @ApiProperty({
    description: 'Longitude of the flight event',
    example: 13.405,
    minimum: -180,
    maximum: 180,
  })
  longitude!: number;

  @ApiProperty({
    description: 'The vertical rate of the aircraft in fpm (feet per minute)',
    example: 1500,
    required: false,
  })
  verticalRate?: number;

  @ApiProperty({
    description: 'The squawk code of the aircraft (4 digits, each 0-7)',
    example: '1234',
    required: false,
  })
  squawk?: string;

  @ApiProperty({
    description: 'The ground speed of the aircraft in knots',
    example: 250,
    required: false,
  })
  groundSpeed?: number;

  @ApiProperty({
    description: 'The track angle of the aircraft in degrees',
    example: 180,
    required: false,
  })
  track?: number;

  @ApiProperty({
    description: 'Indicates if the aircraft is alerting',
    example: false,
    required: false,
  })
  alert?: boolean;

  @ApiProperty({
    description: 'Indicates if the aircraft is in an emergency state',
    example: false,
    required: false,
  })
  emergency?: boolean;

  @ApiProperty({
    description:
      'Indicates if the aircraft has special position identification (IDENT)',
    example: true,
    required: false,
  })
  spi?: boolean;

  @ApiProperty({
    description: 'Indicates if the aircraft is on the ground',
    example: true,
    required: false,
  })
  isOnGround?: boolean;

  @ApiProperty({
    description: 'Aircraft altitude in feet',
    example: 29000,
    required: false,
  })
  altitude?: number;
}

export function trimCallsign(callsign: string): string {
  return callsign.replace(/\s+/g, '').toUpperCase();
}

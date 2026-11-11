import {
  FullTimesheet,
  ScheduledTimesheet,
} from '../../../model/timesheet.model';
import {
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
  PartialType,
  PickType,
} from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Loadsheet } from '../../../model/loadsheet.model';
import { Type } from 'class-transformer';
import {
  FlightListOrder,
  FlightListSort,
  FlightPhase,
  FlightServiceType,
  FlightSource,
  FlightStatus,
  FlightTracking,
} from '../../../model/flight.model';
import {
  AirportType,
  AirportWithType,
} from '../../../../airports/model/airport.model';
import { Operator } from '../../../../operators/model/operator.model';
import { LegacyCreateAircraftResponse } from '../../../../aircraft/infra/http/request/aircraft.request';
import { ShortOperatorResponse } from './operator.request';
import { FlightPilotDto } from '../../../../users/infra/http/request/get-user.dto';

export class FlightDto {
  @ApiProperty({
    description: 'Flight unique system identifier',
    example: 'bd8f2d64-a647-42da-be63-c6589915e6c9',
  })
  id!: string;

  @ApiProperty({
    description: 'Flight number used by ticketing systems',
    example: 'LH450',
  })
  @IsNotEmpty()
  @IsString()
  flightNumber!: string;

  @ApiProperty({
    description: 'Callsign used by airline internal systems',
    example: 'DLH450',
  })
  @IsNotEmpty()
  @IsString()
  callsign!: string;

  @ApiProperty({
    description: 'Callsign used by air traffic services',
    example: 'DLH5PJ',
    required: false,
    nullable: true,
    default: null,
    type: String,
  })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  atcCallsign?: string | null = null;

  @ApiProperty({
    description: 'Flag whether flight covered by ETOPS procedures',
    example: false,
    required: false,
    default: false,
  })
  @IsBoolean()
  isEtops: boolean = false;

  @ApiProperty({
    description: 'Flight status',
    example: FlightStatus.Created,
    enum: FlightStatus,
  })
  status!: FlightStatus;

  @ApiProperty({
    description: 'Aircraft system unique identifier',
    example: 'fe75ec7d-afbe-4514-a935-40c54f475278',
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID(4)
  aircraftId!: string;

  @ApiProperty({
    description: 'Aircraft reported for flight',
  })
  aircraft!: LegacyCreateAircraftResponse;

  @ApiProperty({
    description: 'Airports related to the flight',
  })
  airports!: AirportWithType[];

  @ApiProperty({
    description: 'Timesheet',
  })
  timesheet!: FullTimesheet;

  @ApiProperty({
    description: 'Operator system unique identifier',
    example: 'fe75ec7d-afbe-4514-a935-40c54f475278',
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID(4)
  operatorId!: string;

  @ApiProperty({
    description: 'Flight operator',
    type: Operator,
  })
  operator!: ShortOperatorResponse;

  @ApiProperty({
    description: 'Source how flight was created',
    type: 'string',
    enum: FlightSource,
  })
  source!: FlightSource;

  @ApiProperty({
    description:
      'Flight tracking settings <br />' +
      '**public**: flight can be tracked by anyone and will be listed. <br>' +
      '**private**: flight can be tracked by people having a dedicated link, flight will not be listed.<br>' +
      '**disabled**: flight cannot be tracked online.',
    enum: FlightTracking,
    example: FlightTracking.Private,
  })
  @IsEnum(FlightTracking)
  @IsString()
  tracking: FlightTracking = FlightTracking.Private;

  @ApiProperty({
    description:
      'Kind of service the flight operates <br />' +
      '**passenger**: flight carries passengers.<br />' +
      '**cargo**: flight carries freight only.',
    enum: FlightServiceType,
    example: FlightServiceType.Passenger,
    default: FlightServiceType.Passenger,
  })
  @IsEnum(FlightServiceType)
  @IsString()
  serviceType: FlightServiceType = FlightServiceType.Passenger;

  @ApiProperty({
    description: 'Departure parking position unique identifier',
    example: 'ad5a6ebd-dad8-4400-8bb4-b7cee3b00fa9',
    required: false,
    nullable: true,
    default: null,
    type: String,
  })
  departureParkingPositionId!: string | null;

  @ApiProperty({
    description: 'Departure runway unique identifier',
    example: '32121288-2550-4b81-a558-9a7193ef6c97',
    required: false,
    nullable: true,
    default: null,
    type: String,
  })
  departureRunwayId!: string | null;

  @ApiProperty({
    description: 'Arrival parking position unique identifier',
    example: 'ad5a6ebd-dad8-4400-8bb4-b7cee3b00fa9',
    required: false,
    nullable: true,
    default: null,
    type: String,
  })
  arrivalParkingPositionId!: string | null;

  @ApiProperty({
    description: 'Arrival runway unique identifier',
    example: '32121288-2550-4b81-a558-9a7193ef6c97',
    required: false,
    nullable: true,
    default: null,
    type: String,
  })
  arrivalRunwayId!: string | null;

  @ApiProperty({
    description: 'Flag if flight was diverted',
    example: false,
  })
  isFlightDiverted!: boolean;

  @ApiProperty({
    description:
      'Flag if any emergency was declared on this flight during its lifecycle',
    example: false,
  })
  isEmergencyDeclared!: boolean;

  @ApiProperty({
    description:
      'Flag if a flight path has been recorded for this flight and can be retrieved from the flight path endpoint',
    example: false,
  })
  hasFlightPath!: boolean;

  @ApiProperty({
    description:
      'Flag if an off-block delay has been recorded for this flight and can be retrieved from the flight delay endpoint',
    example: false,
  })
  isOffBlockDelayed!: boolean;

  @ApiProperty({
    description:
      'Flag if a notification to captain has been issued for this flight and can be retrieved from the flight notoc endpoint',
    example: false,
  })
  hasNotoc!: boolean;

  @ApiProperty({
    description: 'Timestamp when the flight record was created',
    example: '2025-01-01T00:00:00.000Z',
    type: 'string',
  })
  createdAt!: Date;
}

export class AlternateAirportRequest {
  @ApiProperty({
    description: 'System unique identifier of the alternate airport',
    example: 'fe75ec7d-afbe-4514-a935-40c54f475278',
  })
  @IsUUID()
  airportId!: string;

  @ApiProperty({
    description: 'Alternate airport type',
    enum: AirportType,
    example: AirportType.DestinationAlternate,
  })
  @IsEnum(AirportType)
  type!: AirportType;
}

export class CreateFlightRequest extends OmitType(FlightDto, [
  'id',
  'status',
  'aircraft',
  'airports',
  'timesheet',
  'operator',
  'source',
  'isFlightDiverted',
  'isEmergencyDeclared',
  'hasFlightPath',
  'isOffBlockDelayed',
  'hasNotoc',
  'createdAt',
  'departureParkingPositionId',
  'departureRunwayId',
  'arrivalParkingPositionId',
  'arrivalRunwayId',
]) {
  @ApiProperty({
    description:
      'System unique identifier of the airport where the flight is departing',
    example: 'fe75ec7d-afbe-4514-a935-40c54f475278',
  })
  @IsUUID()
  @IsString()
  departureAirportId!: string;

  @ApiProperty({
    description:
      'System unique identifier of the airport where the flight is arriving',
    example: 'fe75ec7d-afbe-4514-a935-40c54f475278',
  })
  @IsUUID()
  @IsString()
  destinationAirportId!: string;

  @ApiProperty({
    description: 'Initial timesheet reported to air traffic control services',
    type: ScheduledTimesheet,
  })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => ScheduledTimesheet)
  timesheet!: ScheduledTimesheet;

  @ApiPropertyOptional({
    description:
      'Initial preliminary loadsheet filled by the operations team. Omit it to create the ' +
      'flight without one; it must be issued before the flight can be marked as ready.',
    type: Loadsheet,
    nullable: true,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => Loadsheet)
  loadsheet?: Loadsheet | null;

  @ApiProperty({
    description: 'Destination, ETOPS and enroute alternate airports',
    type: [AlternateAirportRequest],
    required: false,
    default: [],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AlternateAirportRequest)
  alternateAirports?: AlternateAirportRequest[];
}

export class GetFlightResponse extends OmitType(FlightDto, [
  'aircraftId',
  'operatorId',
]) {
  @ApiProperty({
    type: FlightPilotDto,
    nullable: true,
    description:
      'Pilot checked in for the flight, or null if none has checked in yet',
  })
  pilot!: FlightPilotDto | null;

  @ApiProperty({
    description:
      'Actual fuel burned in tons, captured when the flight is closed; null until then. The planned-vs-actual delta is derived against the loadsheet `fuel.trip`.',
    example: 51.2,
    type: 'number',
    nullable: true,
  })
  actualFuelBurned!: number | null;
}

export class CloseFlightRequest {
  @ApiProperty({
    description: 'Actual fuel burned during the flight in tons',
    example: 51.2,
    required: false,
    nullable: true,
    default: null,
    type: Number,
  })
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 3 })
  @Min(0)
  actualFuelBurned?: number | null;
}

export class FlightListFilters {
  @IsOptional()
  @IsEnum(FlightPhase)
  phase?: FlightPhase;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;

  @IsOptional()
  @IsEnum(FlightListSort)
  sort: FlightListSort = FlightListSort.CreatedAt;

  @IsOptional()
  @IsEnum(FlightListOrder)
  order: FlightListOrder = FlightListOrder.Descending;
}

export class UpdateFlightVisibilityRequest extends PickType(FlightDto, [
  'tracking',
]) {}

export class UpdateFlightRequest extends PartialType(
  PickType(FlightDto, ['serviceType']),
) {}

export class UpdateAtcCallsignRequest {
  @ApiProperty({
    description:
      'Callsign used by air traffic services. Send null to clear it and fall back to no ATC callsign.',
    example: 'DLH5PJ',
    type: String,
    nullable: true,
  })
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @IsNotEmpty()
  atcCallsign!: string | null;
}

export class UpdateDepartureParkingPositionRequest {
  @ApiProperty({
    description: 'Departure parking position unique identifier',
    example: 'ad5a6ebd-dad8-4400-8bb4-b7cee3b00fa9',
  })
  @IsUUID()
  departureParkingPositionId!: string;
}

export class UpdateDepartureRunwayRequest {
  @ApiProperty({
    description: 'Departure runway unique identifier',
    example: '32121288-2550-4b81-a558-9a7193ef6c97',
  })
  @IsUUID()
  departureRunwayId!: string;
}

export class UpdateArrivalParkingPositionRequest {
  @ApiProperty({
    description: 'Arrival parking position unique identifier',
    example: 'ad5a6ebd-dad8-4400-8bb4-b7cee3b00fa9',
  })
  @IsUUID()
  arrivalParkingPositionId!: string;
}

export class UpdateArrivalRunwayRequest {
  @ApiProperty({
    description: 'Arrival runway unique identifier',
    example: '32121288-2550-4b81-a558-9a7193ef6c97',
  })
  @IsUUID()
  arrivalRunwayId!: string;
}

export class UpdatePredictedTimesheetRequest {
  @ApiProperty({
    description:
      'Predicted time when the aircraft leaves the gates. ' +
      'Omit to preserve the current value, send null to clear it.',
    example: '2025-01-01T12:00:00.000Z',
    type: Date,
    required: false,
    nullable: true,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  offBlockTime?: Date | null;

  @ApiProperty({
    description:
      'Predicted time when the aircraft takes off. ' +
      'Omit to preserve the current value, send null to clear it.',
    example: '2025-01-01T12:15:00.000Z',
    type: Date,
    required: false,
    nullable: true,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  takeoffTime?: Date | null;

  @ApiProperty({
    description:
      'Predicted time when the aircraft lands. ' +
      'Omit to preserve the current value, send null to clear it.',
    example: '2025-01-01T21:00:00.000Z',
    type: Date,
    required: false,
    nullable: true,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  arrivalTime?: Date | null;

  @ApiProperty({
    description:
      'Predicted time when the aircraft parks at the gates. ' +
      'Omit to preserve the current value, send null to clear it.',
    example: '2025-01-01T21:10:00.000Z',
    type: Date,
    required: false,
    nullable: true,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  onBlockTime?: Date | null;
}

import { AirportType } from '../../airports/model/airport.model';
import { Flight, FlightSnapshot, FlightTimes } from './flight';
import {
  FlightServiceType,
  FlightStatus,
  FlightTracking,
} from './flight.model';

export const FIXTURE_FLIGHT_ID = '7105891a-8008-4b47-b473-c81c97615ad7';
export const FIXTURE_AIRCRAFT_ID = 'ffe14007-9147-40a1-a228-573c9c87a2e7';
export const FIXTURE_DEPARTURE_ID = '0b1a7a3e-3a43-4a8e-9a0f-4f3c2f5b1d01';
export const FIXTURE_DESTINATION_ID = '0b1a7a3e-3a43-4a8e-9a0f-4f3c2f5b1d02';

const noTimes = (): FlightTimes => ({
  offBlockTime: null,
  takeoffTime: null,
  arrivalTime: null,
  onBlockTime: null,
});

export function flightSnapshot(
  overrides: Partial<FlightSnapshot> = {},
): FlightSnapshot {
  return {
    id: FIXTURE_FLIGHT_ID,
    status: FlightStatus.Created,
    aircraftId: FIXTURE_AIRCRAFT_ID,
    airports: [
      { id: FIXTURE_DEPARTURE_ID, type: AirportType.Departure },
      { id: FIXTURE_DESTINATION_ID, type: AirportType.Destination },
    ],
    captainId: null,
    tracking: FlightTracking.Private,
    serviceType: FlightServiceType.Passenger,
    atcCallsign: null,
    departureParkingPositionId: null,
    departureRunwayId: null,
    arrivalParkingPositionId: null,
    arrivalRunwayId: null,
    isDiversionDeclared: false,
    timesheet: {
      scheduled: noTimes(),
      estimated: noTimes(),
      actual: noTimes(),
      predicted: noTimes(),
    },
    actualFuelBurned: null,
    completion: {
      actualAirborneMinutes: null,
      actualBlockMinutes: null,
      completedAt: null,
    },
    ...overrides,
  };
}

export function flightIn(
  status: FlightStatus,
  overrides: Partial<FlightSnapshot> = {},
): Flight {
  return Flight.restore(flightSnapshot({ ...overrides, status }));
}

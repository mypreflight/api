import {
  ArrivalParkingPositionWasChangedEvent,
  ArrivalRunwayWasChangedEvent,
  ArrivalWasReportedEvent,
  AtcCallsignWasChangedEvent,
  BoardingWasFinishedEvent,
  BoardingWasStartedEvent,
  DepartureParkingPositionWasChangedEvent,
  DepartureRunwayWasChangedEvent,
  FlightEventScope,
  FlightLifecycleEvent,
  FlightWasClosedEvent,
  FlightWasReleasedEvent,
  GroundServiceSource,
  OffBlockWasReportedEvent,
  OffboardingWasFinishedEvent,
  OffboardingWasStartedEvent,
  OnBlockWasReportedEvent,
  PilotCheckedInEvent,
  PredictedTimesheetWasUpdatedEvent,
  ScheduledTimesheetWasUpdatedEvent,
  TakeoffWasReportedEvent,
} from '../../../core/domain/events/dto/flight.events';
import { Flight, FlightActor } from './flight';
import {
  FIXTURE_AIRCRAFT_ID,
  FIXTURE_DEPARTURE_ID,
  FIXTURE_DESTINATION_ID,
  FIXTURE_FLIGHT_ID,
  flightIn,
  flightSnapshot,
} from './flight.fixture';
import {
  FlightServiceType,
  FlightStatus,
  FlightTracking,
} from './flight.model';
import {
  FixFuelReportedBeforeTakeoffError,
  InvalidStatusToChangeScheduleError,
  InvalidStatusToChangeServiceTypeError,
  InvalidStatusToCheckInError,
  InvalidStatusToCloseFlightError,
  InvalidStatusToFinishBoardingError,
  InvalidStatusToFinishOffboardingError,
  InvalidStatusToMarkAsReadyError,
  InvalidStatusToPredictArrivalError,
  InvalidStatusToPredictOffBlockError,
  InvalidStatusToPredictOnBlockError,
  InvalidStatusToPredictTakeoffError,
  InvalidStatusToReportArrivedError,
  InvalidStatusToReportFixFuelError,
  InvalidStatusToReportOffBlockError,
  InvalidStatusToReportOnBlockError,
  InvalidStatusToReportTakenOffError,
  InvalidStatusToStartBoardingError,
  InvalidStatusToStartOffboardingError,
  InvalidStatusToUpdateArrivalParkingPositionError,
  InvalidStatusToUpdateArrivalRunwayError,
  InvalidStatusToUpdateAtcCallsignError,
  InvalidStatusToUpdateDepartureParkingPositionError,
  InvalidStatusToUpdateDepartureRunwayError,
  InvalidStatusToUpdateLoadsheetError,
  PreliminaryLoadsheetMissingError,
  ScheduledFlightCannotBeRemovedError,
} from './error/flight.error';
import { UnresolvedEmergencyCannotCloseFlightError } from './error/emergency.error';
import { FlightHasUnacceptedDelayError } from './error/delay.error';
import { InvalidStatusToReportDiversionError } from './error/diversion.error';

const ACTOR: FlightActor = { id: 'actor-1', scope: FlightEventScope.User };
const AT = new Date('2025-01-01T13:00:00.000Z');
const LIFECYCLE = Object.values(FlightStatus);

const cleared = {
  actualFuelBurned: 12.5,
  hasUnresolvedEmergency: false,
  isDelayCleared: true,
};

function onlyEvent(flight: Flight): FlightLifecycleEvent {
  const events = flight.getUncommittedEvents();
  expect(events).toHaveLength(1);

  return events[0];
}

describe('Flight', () => {
  describe.each([
    {
      name: 'markAsReady',
      from: FlightStatus.Created,
      to: FlightStatus.Ready,
      act: (flight: Flight) => flight.markAsReady(ACTOR, true),
      error: InvalidStatusToMarkAsReadyError,
      event: FlightWasReleasedEvent,
    },
    {
      name: 'checkIn',
      from: FlightStatus.Ready,
      to: FlightStatus.CheckedIn,
      act: (flight: Flight) => flight.checkIn('captain-1', {}),
      error: InvalidStatusToCheckInError,
      event: PilotCheckedInEvent,
    },
    {
      name: 'startBoarding',
      from: FlightStatus.CheckedIn,
      to: FlightStatus.BoardingStarted,
      act: (flight: Flight) =>
        flight.startBoarding(ACTOR, GroundServiceSource.Manual),
      error: InvalidStatusToStartBoardingError,
      event: BoardingWasStartedEvent,
    },
    {
      name: 'finishBoarding',
      from: FlightStatus.BoardingStarted,
      to: FlightStatus.BoardingFinished,
      act: (flight: Flight) => flight.finishBoarding(ACTOR),
      error: InvalidStatusToFinishBoardingError,
      event: BoardingWasFinishedEvent,
    },
    {
      name: 'reportOffBlock',
      from: FlightStatus.BoardingFinished,
      to: FlightStatus.TaxiingOut,
      act: (flight: Flight) => flight.reportOffBlock(ACTOR, AT, false),
      error: InvalidStatusToReportOffBlockError,
      event: OffBlockWasReportedEvent,
    },
    {
      name: 'reportTakeoff',
      from: FlightStatus.TaxiingOut,
      to: FlightStatus.InCruise,
      act: (flight: Flight) => flight.reportTakeoff(ACTOR, AT, false),
      error: InvalidStatusToReportTakenOffError,
      event: TakeoffWasReportedEvent,
    },
    {
      name: 'reportArrival',
      from: FlightStatus.InCruise,
      to: FlightStatus.TaxiingIn,
      act: (flight: Flight) => flight.reportArrival(ACTOR, AT, false),
      error: InvalidStatusToReportArrivedError,
      event: ArrivalWasReportedEvent,
    },
    {
      name: 'reportOnBlock',
      from: FlightStatus.TaxiingIn,
      to: FlightStatus.OnBlock,
      act: (flight: Flight) => flight.reportOnBlock(ACTOR, AT, null),
      error: InvalidStatusToReportOnBlockError,
      event: OnBlockWasReportedEvent,
    },
    {
      name: 'startOffboarding',
      from: FlightStatus.OnBlock,
      to: FlightStatus.OffboardingStarted,
      act: (flight: Flight) =>
        flight.startOffboarding(ACTOR, GroundServiceSource.Manual),
      error: InvalidStatusToStartOffboardingError,
      event: OffboardingWasStartedEvent,
    },
    {
      name: 'finishOffboarding',
      from: FlightStatus.OffboardingStarted,
      to: FlightStatus.OffboardingFinished,
      act: (flight: Flight) =>
        flight.finishOffboarding(ACTOR, GroundServiceSource.Manual),
      error: InvalidStatusToFinishOffboardingError,
      event: OffboardingWasFinishedEvent,
    },
    {
      name: 'close',
      from: FlightStatus.OffboardingFinished,
      to: FlightStatus.Closed,
      act: (flight: Flight) => flight.close(ACTOR, cleared),
      error: InvalidStatusToCloseFlightError,
      event: FlightWasClosedEvent,
    },
  ])('$name', ({ from, to, act, error, event }) => {
    it(`moves a ${from} flight to ${to} and records the event`, () => {
      const flight = flightIn(from);

      act(flight);

      expect(flight.status).toBe(to);
      expect(onlyEvent(flight)).toBeInstanceOf(event);
      expect(onlyEvent(flight).payload.flightId).toBe(FIXTURE_FLIGHT_ID);
    });

    it.each(LIFECYCLE.filter((status) => status !== from))(
      'refuses a %s flight and records nothing',
      (status) => {
        const flight = flightIn(status);

        expect(() => act(flight)).toThrow(error);
        expect(flight.status).toBe(status);
        expect(flight.getUncommittedEvents()).toHaveLength(0);
      },
    );
  });

  describe('markAsReady', () => {
    it('refuses to release a flight without a preliminary loadsheet', () => {
      const flight = flightIn(FlightStatus.Created);

      expect(() => flight.markAsReady(ACTOR, false)).toThrow(
        PreliminaryLoadsheetMissingError,
      );
      expect(flight.status).toBe(FlightStatus.Created);
    });

    it('reports the wrong status before the missing loadsheet', () => {
      const flight = flightIn(FlightStatus.Ready);

      expect(() => flight.markAsReady(ACTOR, false)).toThrow(
        InvalidStatusToMarkAsReadyError,
      );
    });
  });

  describe('checkIn', () => {
    it('assigns the captain, keeps estimates the pilot left out and names every airport', () => {
      const offBlockTime = new Date('2025-01-01T12:50:00.000Z');
      const onBlockTime = new Date('2025-01-01T16:20:00.000Z');
      const flight = flightIn(FlightStatus.Ready, {
        timesheet: {
          ...flightSnapshot().timesheet,
          estimated: {
            offBlockTime: null,
            takeoffTime: null,
            arrivalTime: null,
            onBlockTime,
          },
        },
      });

      flight.checkIn('captain-1', { offBlockTime });

      const snapshot = flight.snapshot();
      expect(snapshot.captainId).toBe('captain-1');
      expect(snapshot.timesheet.estimated).toEqual({
        offBlockTime,
        takeoffTime: null,
        arrivalTime: null,
        onBlockTime,
      });
      const event = onlyEvent(flight) as PilotCheckedInEvent;
      expect(event.payload).toEqual({
        flightId: FIXTURE_FLIGHT_ID,
        scope: FlightEventScope.User,
        actorId: 'captain-1',
        aircraftId: FIXTURE_AIRCRAFT_ID,
        airportIds: [FIXTURE_DEPARTURE_ID, FIXTURE_DESTINATION_ID],
      });
    });
  });

  describe('reportOffBlock', () => {
    it('starts a fresh actual timesheet from the off-block time', () => {
      const stale = new Date('2024-12-31T10:00:00.000Z');
      const flight = flightIn(FlightStatus.BoardingFinished, {
        timesheet: {
          ...flightSnapshot().timesheet,
          actual: {
            offBlockTime: stale,
            takeoffTime: stale,
            arrivalTime: stale,
            onBlockTime: stale,
          },
        },
      });

      flight.reportOffBlock(
        { id: null, scope: FlightEventScope.User },
        AT,
        true,
      );

      expect(flight.snapshot().timesheet.actual).toEqual({
        offBlockTime: AT,
        takeoffTime: null,
        arrivalTime: null,
        onBlockTime: null,
      });
      const event = onlyEvent(flight) as OffBlockWasReportedEvent;
      expect(event.payload.actorId).toBeNull();
      expect(event.payload.aircraftId).toBe(FIXTURE_AIRCRAFT_ID);
      expect(event.payload.payload).toEqual({ automaticallyDetected: true });
    });
  });

  describe('reportTakeoff and reportArrival', () => {
    it('record their times without touching the off-block time', () => {
      const offBlockTime = new Date('2025-01-01T12:40:00.000Z');
      const arrivalTime = new Date('2025-01-01T16:00:00.000Z');
      const flight = flightIn(FlightStatus.TaxiingOut, {
        timesheet: {
          ...flightSnapshot().timesheet,
          actual: {
            offBlockTime,
            takeoffTime: null,
            arrivalTime: null,
            onBlockTime: null,
          },
        },
      });

      flight.reportTakeoff(ACTOR, AT, false);
      flight.reportArrival(ACTOR, arrivalTime, true);

      expect(flight.snapshot().timesheet.actual).toEqual({
        offBlockTime,
        takeoffTime: AT,
        arrivalTime,
        onBlockTime: null,
      });
      const [takeoff, arrival] = flight.getUncommittedEvents();
      expect(takeoff.payload.payload).toEqual({ automaticallyDetected: false });
      expect(arrival.payload.payload).toEqual({ automaticallyDetected: true });
    });
  });

  describe('reportOnBlock', () => {
    const taxiingIn = (isDiversionDeclared: boolean) =>
      flightIn(FlightStatus.TaxiingIn, {
        isDiversionDeclared,
        timesheet: {
          ...flightSnapshot().timesheet,
          actual: {
            offBlockTime: new Date('2025-01-01T09:00:00.000Z'),
            takeoffTime: new Date('2025-01-01T09:20:00.000Z'),
            arrivalTime: new Date('2025-01-01T12:50:30.000Z'),
            onBlockTime: null,
          },
        },
      });

    it('completes the flight with its airborne and block minutes', () => {
      const flight = taxiingIn(false);

      flight.reportOnBlock(ACTOR, AT, null);

      const snapshot = flight.snapshot();
      expect(snapshot.timesheet.actual.onBlockTime).toEqual(AT);
      expect(snapshot.completion).toEqual({
        actualAirborneMinutes: 211,
        actualBlockMinutes: 240,
        completedAt: AT,
      });
    });

    it('lands a flight at its destination', () => {
      const flight = taxiingIn(false);

      flight.reportOnBlock(ACTOR, AT, 'diversion-airport');

      const event = onlyEvent(flight) as OnBlockWasReportedEvent;
      expect(event.payload.landingAirportId).toBe(FIXTURE_DESTINATION_ID);
      expect(event.payload.aircraftId).toBe(FIXTURE_AIRCRAFT_ID);
      expect(event.payload.airportIds).toEqual([
        FIXTURE_DEPARTURE_ID,
        FIXTURE_DESTINATION_ID,
      ]);
    });

    it('lands a diverted flight at its diversion airport', () => {
      const flight = taxiingIn(true);

      flight.reportOnBlock(ACTOR, AT, 'diversion-airport');

      const event = onlyEvent(flight) as OnBlockWasReportedEvent;
      expect(event.payload.landingAirportId).toBe('diversion-airport');
    });
  });

  describe('close', () => {
    it('records the fuel burned', () => {
      const flight = flightIn(FlightStatus.OffboardingFinished);

      flight.close(ACTOR, cleared);

      expect(flight.snapshot().actualFuelBurned).toBe(12.5);
      const event = onlyEvent(flight) as FlightWasClosedEvent;
      expect(event.payload.aircraftId).toBe(FIXTURE_AIRCRAFT_ID);
    });

    it('refuses while an emergency is unresolved', () => {
      const flight = flightIn(FlightStatus.OffboardingFinished);

      expect(() =>
        flight.close(ACTOR, { ...cleared, hasUnresolvedEmergency: true }),
      ).toThrow(UnresolvedEmergencyCannotCloseFlightError);
      expect(flight.status).toBe(FlightStatus.OffboardingFinished);
    });

    it('refuses while the delay is not cleared', () => {
      const flight = flightIn(FlightStatus.OffboardingFinished);

      expect(() =>
        flight.close(ACTOR, { ...cleared, isDelayCleared: false }),
      ).toThrow(FlightHasUnacceptedDelayError);
    });

    it('reports an open emergency before an uncleared delay', () => {
      const flight = flightIn(FlightStatus.OffboardingFinished);

      expect(() =>
        flight.close(ACTOR, {
          ...cleared,
          hasUnresolvedEmergency: true,
          isDelayCleared: false,
        }),
      ).toThrow(UnresolvedEmergencyCannotCloseFlightError);
    });
  });

  describe('reschedule', () => {
    it('patches the scheduled times of a created flight', () => {
      const flight = flightIn(FlightStatus.Created);
      const actor = { id: 'ops-1', scope: FlightEventScope.Operations };

      flight.reschedule(actor, { offBlockTime: AT, onBlockTime: null });

      expect(flight.snapshot().timesheet.scheduled.offBlockTime).toEqual(AT);
      const event = onlyEvent(flight);
      expect(event).toBeInstanceOf(ScheduledTimesheetWasUpdatedEvent);
      expect(event.payload.scope).toBe(FlightEventScope.Operations);
    });

    it.each(LIFECYCLE.filter((status) => status !== FlightStatus.Created))(
      'refuses a %s flight',
      (status) => {
        expect(() =>
          flightIn(status).reschedule(ACTOR, { offBlockTime: AT }),
        ).toThrow(InvalidStatusToChangeScheduleError);
      },
    );
  });

  describe('predict', () => {
    it.each([
      [
        'offBlockTime',
        FlightStatus.TaxiingOut,
        InvalidStatusToPredictOffBlockError,
      ],
      [
        'takeoffTime',
        FlightStatus.InCruise,
        InvalidStatusToPredictTakeoffError,
      ],
      [
        'arrivalTime',
        FlightStatus.TaxiingIn,
        InvalidStatusToPredictArrivalError,
      ],
      ['onBlockTime', FlightStatus.OnBlock, InvalidStatusToPredictOnBlockError],
    ] as const)(
      'locks the predicted %s once the flight reaches %s',
      (time, lockedFrom, error) => {
        const lockIndex = LIFECYCLE.indexOf(lockedFrom);

        for (const status of LIFECYCLE.slice(0, lockIndex)) {
          expect(() =>
            flightIn(status).predict(ACTOR, { [time]: AT }),
          ).not.toThrow();
        }

        for (const status of LIFECYCLE.slice(lockIndex)) {
          expect(() => flightIn(status).predict(ACTOR, { [time]: AT })).toThrow(
            error,
          );
        }
      },
    );

    it('accepts a later prediction while an earlier one is locked', () => {
      const flight = flightIn(FlightStatus.InCruise);

      flight.predict(ACTOR, { arrivalTime: AT, onBlockTime: null });

      expect(flight.snapshot().timesheet.predicted.arrivalTime).toEqual(AT);
      expect(onlyEvent(flight)).toBeInstanceOf(
        PredictedTimesheetWasUpdatedEvent,
      );
    });
  });

  describe.each([
    {
      name: 'changeDepartureParkingPosition',
      firstForbidden: FlightStatus.CheckedIn,
      act: (flight: Flight) =>
        flight.changeDepartureParkingPosition(ACTOR, 'stand-1'),
      field: 'departureParkingPositionId',
      value: 'stand-1',
      error: InvalidStatusToUpdateDepartureParkingPositionError,
      event: DepartureParkingPositionWasChangedEvent,
    },
    {
      name: 'changeAtcCallsign',
      firstForbidden: FlightStatus.InCruise,
      act: (flight: Flight) => flight.changeAtcCallsign(ACTOR, 'DLH5PJ'),
      field: 'atcCallsign',
      value: 'DLH5PJ',
      error: InvalidStatusToUpdateAtcCallsignError,
      event: AtcCallsignWasChangedEvent,
    },
    {
      name: 'changeDepartureRunway',
      firstForbidden: FlightStatus.InCruise,
      act: (flight: Flight) => flight.changeDepartureRunway(ACTOR, 'runway-1'),
      field: 'departureRunwayId',
      value: 'runway-1',
      error: InvalidStatusToUpdateDepartureRunwayError,
      event: DepartureRunwayWasChangedEvent,
    },
    {
      name: 'changeArrivalRunway',
      firstForbidden: FlightStatus.TaxiingIn,
      act: (flight: Flight) => flight.changeArrivalRunway(ACTOR, 'runway-2'),
      field: 'arrivalRunwayId',
      value: 'runway-2',
      error: InvalidStatusToUpdateArrivalRunwayError,
      event: ArrivalRunwayWasChangedEvent,
    },
    {
      name: 'changeArrivalParkingPosition',
      firstForbidden: FlightStatus.OnBlock,
      act: (flight: Flight) =>
        flight.changeArrivalParkingPosition(ACTOR, 'stand-2'),
      field: 'arrivalParkingPositionId',
      value: 'stand-2',
      error: InvalidStatusToUpdateArrivalParkingPositionError,
      event: ArrivalParkingPositionWasChangedEvent,
    },
  ] as const)(
    '$name',
    ({ firstForbidden, act, field, value, error, event }) => {
      const cutoff = LIFECYCLE.indexOf(firstForbidden);

      it.each(LIFECYCLE.slice(0, cutoff))('changes a %s flight', (status) => {
        const flight = flightIn(status);

        act(flight);

        expect(flight.snapshot()[field]).toBe(value);
        expect(onlyEvent(flight)).toBeInstanceOf(event);
      });

      it.each(LIFECYCLE.slice(cutoff))('refuses a %s flight', (status) => {
        const flight = flightIn(status);

        expect(() => act(flight)).toThrow(error);
        expect(flight.snapshot()[field]).toBeNull();
      });
    },
  );

  describe('changeServiceType', () => {
    it('changes a created flight', () => {
      const flight = flightIn(FlightStatus.Created);

      flight.changeServiceType(FlightServiceType.Cargo);

      expect(flight.snapshot().serviceType).toBe(FlightServiceType.Cargo);
      expect(flight.getUncommittedEvents()).toHaveLength(0);
    });

    it('refuses a ready flight', () => {
      expect(() =>
        flightIn(FlightStatus.Ready).changeServiceType(FlightServiceType.Cargo),
      ).toThrow(InvalidStatusToChangeServiceTypeError);
    });
  });

  describe('changeTracking', () => {
    it.each(LIFECYCLE)('changes a %s flight', (status) => {
      const flight = flightIn(status);

      flight.changeTracking(FlightTracking.Public);

      expect(flight.snapshot().tracking).toBe(FlightTracking.Public);
    });
  });

  describe('guards for records outside the flight', () => {
    it('allows removing only a created flight', () => {
      expect(() =>
        flightIn(FlightStatus.Created).assertCanBeRemoved(),
      ).not.toThrow();
      expect(() => flightIn(FlightStatus.Ready).assertCanBeRemoved()).toThrow(
        ScheduledFlightCannotBeRemovedError,
      );
    });

    it('allows editing the preliminary loadsheet only of a created flight', () => {
      expect(() =>
        flightIn(FlightStatus.Created).assertCanUpdatePreliminaryLoadsheet(),
      ).not.toThrow();
      expect(() =>
        flightIn(FlightStatus.Ready).assertCanUpdatePreliminaryLoadsheet(),
      ).toThrow(InvalidStatusToUpdateLoadsheetError);
    });

    it('accepts fix fuel in cruise only from takeoff onwards', () => {
      const takeoffTime = new Date('2025-01-01T13:00:00.000Z');
      const flight = flightIn(FlightStatus.InCruise, {
        timesheet: {
          ...flightSnapshot().timesheet,
          actual: {
            offBlockTime: null,
            takeoffTime,
            arrivalTime: null,
            onBlockTime: null,
          },
        },
      });

      expect(() => flight.assertCanReportFixFuel(takeoffTime)).not.toThrow();
      expect(() =>
        flight.assertCanReportFixFuel(new Date('2025-01-01T12:59:59.000Z')),
      ).toThrow(FixFuelReportedBeforeTakeoffError);
      expect(() =>
        flightIn(FlightStatus.TaxiingIn).assertCanReportFixFuel(AT),
      ).toThrow(InvalidStatusToReportFixFuelError);
    });

    it.each(LIFECYCLE)('decides whether a %s flight can divert', (status) => {
      const divertible = [FlightStatus.TaxiingOut, FlightStatus.InCruise];
      const check = () => flightIn(status).assertCanReportDiversion();

      if (divertible.includes(status)) {
        expect(check).not.toThrow();
      } else {
        expect(check).toThrow(InvalidStatusToReportDiversionError);
      }
    });
  });

  describe('detection gates', () => {
    it.each([
      ['canReportOffBlock', FlightStatus.BoardingFinished],
      ['canReportTakeoff', FlightStatus.TaxiingOut],
      ['canReportArrival', FlightStatus.InCruise],
    ] as const)('%s only while the flight is %s', (gate, open) => {
      for (const status of LIFECYCLE) {
        expect(flightIn(status)[gate]()).toBe(status === open);
      }
    });
  });

  describe('snapshot', () => {
    it('is a copy the caller cannot use to change the flight', () => {
      const flight = flightIn(FlightStatus.Created);

      const snapshot = flight.snapshot();
      snapshot.status = FlightStatus.Closed;
      snapshot.timesheet.scheduled.offBlockTime = AT;

      expect(flight.status).toBe(FlightStatus.Created);
      expect(flight.snapshot().timesheet.scheduled.offBlockTime).toBeNull();
    });

    it('does not share state with the snapshot it was restored from', () => {
      const source = flightSnapshot();
      const flight = Flight.restore(source);

      flight.reschedule(ACTOR, { offBlockTime: AT });

      expect(source.timesheet.scheduled.offBlockTime).toBeNull();
    });
  });
});

import { AggregateRoot } from '@nestjs/cqrs';
import {
  ArrivalParkingPositionWasChangedEvent,
  ArrivalRunwayWasChangedEvent,
  ArrivalWasReportedEvent,
  AtcCallsignWasChangedEvent,
  BoardingWasFinishedEvent,
  BoardingWasStartedEvent,
  DepartureParkingPositionWasChangedEvent,
  DepartureRunwayWasChangedEvent,
  FlightEventPayload,
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
import { AirportType } from '../../airports/model/airport.model';
import {
  FlightServiceType,
  FlightStatus,
  FlightTracking,
} from './flight.model';
import { minutesBetween, SchedulePatch } from './timesheet.model';
import { TimesheetScheduleName } from './timesheet.mapper';
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

export type FlightActor = {
  id: string | null;
  scope: FlightEventScope;
};

export type FlightAirport = {
  id: string;
  type: AirportType;
};

export type FlightTimes = {
  offBlockTime: Date | null;
  takeoffTime: Date | null;
  arrivalTime: Date | null;
  onBlockTime: Date | null;
};

export type FlightTimesheet = Record<TimesheetScheduleName, FlightTimes>;

export type FlightCompletion = {
  actualAirborneMinutes: number | null;
  actualBlockMinutes: number | null;
  completedAt: Date | null;
};

export type FlightSnapshot = {
  id: string;
  status: FlightStatus;
  aircraftId: string;
  airports: FlightAirport[];
  captainId: string | null;
  tracking: FlightTracking;
  serviceType: FlightServiceType;
  atcCallsign: string | null;
  departureParkingPositionId: string | null;
  departureRunwayId: string | null;
  arrivalParkingPositionId: string | null;
  arrivalRunwayId: string | null;
  isDiversionDeclared: boolean;
  timesheet: FlightTimesheet;
  actualFuelBurned: number | null;
  completion: FlightCompletion;
};

export type FlightClosure = {
  actualFuelBurned: number | null;
  hasUnresolvedEmergency: boolean;
  isDelayCleared: boolean;
};

type StatusError = new () => Error;

const LIFECYCLE: readonly FlightStatus[] = [
  FlightStatus.Created,
  FlightStatus.Ready,
  FlightStatus.CheckedIn,
  FlightStatus.BoardingStarted,
  FlightStatus.BoardingFinished,
  FlightStatus.TaxiingOut,
  FlightStatus.InCruise,
  FlightStatus.TaxiingIn,
  FlightStatus.OnBlock,
  FlightStatus.OffboardingStarted,
  FlightStatus.OffboardingFinished,
  FlightStatus.Closed,
];

const PREDICTION_LOCKS: ReadonlyArray<{
  time: keyof FlightTimes;
  lockedFrom: FlightStatus;
  error: StatusError;
}> = [
  {
    time: 'offBlockTime',
    lockedFrom: FlightStatus.TaxiingOut,
    error: InvalidStatusToPredictOffBlockError,
  },
  {
    time: 'takeoffTime',
    lockedFrom: FlightStatus.InCruise,
    error: InvalidStatusToPredictTakeoffError,
  },
  {
    time: 'arrivalTime',
    lockedFrom: FlightStatus.TaxiingIn,
    error: InvalidStatusToPredictArrivalError,
  },
  {
    time: 'onBlockTime',
    lockedFrom: FlightStatus.OnBlock,
    error: InvalidStatusToPredictOnBlockError,
  },
];

const DIVERTIBLE: readonly FlightStatus[] = [
  FlightStatus.TaxiingOut,
  FlightStatus.InCruise,
];

export class Flight extends AggregateRoot<FlightLifecycleEvent> {
  private constructor(private readonly state: FlightSnapshot) {
    super();
  }

  static restore(snapshot: FlightSnapshot): Flight {
    return new Flight(structuredClone(snapshot));
  }

  get id(): string {
    return this.state.id;
  }

  get status(): FlightStatus {
    return this.state.status;
  }

  get aircraftId(): string {
    return this.state.aircraftId;
  }

  get isDiverted(): boolean {
    return this.state.isDiversionDeclared;
  }

  snapshot(): FlightSnapshot {
    return structuredClone(this.state);
  }

  markAsReady(actor: FlightActor, hasPreliminaryLoadsheet: boolean): void {
    this.expectStatus(FlightStatus.Created, InvalidStatusToMarkAsReadyError);

    if (!hasPreliminaryLoadsheet) {
      throw new PreliminaryLoadsheetMissingError();
    }

    this.state.status = FlightStatus.Ready;
    this.apply(new FlightWasReleasedEvent(this.eventFor(actor)));
  }

  checkIn(captainId: string, estimated: SchedulePatch): void {
    this.expectStatus(FlightStatus.Ready, InvalidStatusToCheckInError);

    this.state.status = FlightStatus.CheckedIn;
    this.state.captainId = captainId;
    this.patchTimes('estimated', estimated);
    this.apply(
      new PilotCheckedInEvent({
        ...this.eventFor({ id: captainId, scope: FlightEventScope.User }),
        aircraftId: this.state.aircraftId,
        airportIds: this.airportIds(),
      }),
    );
  }

  startBoarding(actor: FlightActor, source: GroundServiceSource): void {
    this.expectStatus(
      FlightStatus.CheckedIn,
      InvalidStatusToStartBoardingError,
    );

    this.state.status = FlightStatus.BoardingStarted;
    this.apply(
      new BoardingWasStartedEvent({
        ...this.eventFor(actor),
        payload: { source },
      }),
    );
  }

  finishBoarding(actor: FlightActor): void {
    this.expectStatus(
      FlightStatus.BoardingStarted,
      InvalidStatusToFinishBoardingError,
    );

    this.state.status = FlightStatus.BoardingFinished;
    this.apply(new BoardingWasFinishedEvent(this.eventFor(actor)));
  }

  canReportOffBlock(): boolean {
    return this.state.status === FlightStatus.BoardingFinished;
  }

  reportOffBlock(
    actor: FlightActor,
    offBlockTime: Date,
    automaticallyDetected: boolean,
  ): void {
    this.expectStatus(
      FlightStatus.BoardingFinished,
      InvalidStatusToReportOffBlockError,
    );

    this.state.status = FlightStatus.TaxiingOut;
    this.state.timesheet.actual = {
      offBlockTime,
      takeoffTime: null,
      arrivalTime: null,
      onBlockTime: null,
    };
    this.apply(
      new OffBlockWasReportedEvent({
        ...this.eventFor(actor),
        aircraftId: this.state.aircraftId,
        payload: { automaticallyDetected },
      }),
    );
  }

  canReportTakeoff(): boolean {
    return this.state.status === FlightStatus.TaxiingOut;
  }

  reportTakeoff(
    actor: FlightActor,
    takeoffTime: Date,
    automaticallyDetected: boolean,
  ): void {
    this.expectStatus(
      FlightStatus.TaxiingOut,
      InvalidStatusToReportTakenOffError,
    );

    this.state.status = FlightStatus.InCruise;
    this.state.timesheet.actual.takeoffTime = takeoffTime;
    this.apply(
      new TakeoffWasReportedEvent({
        ...this.eventFor(actor),
        payload: { automaticallyDetected },
      }),
    );
  }

  canReportArrival(): boolean {
    return this.state.status === FlightStatus.InCruise;
  }

  reportArrival(
    actor: FlightActor,
    arrivalTime: Date,
    automaticallyDetected: boolean,
  ): void {
    this.expectStatus(FlightStatus.InCruise, InvalidStatusToReportArrivedError);

    this.state.status = FlightStatus.TaxiingIn;
    this.state.timesheet.actual.arrivalTime = arrivalTime;
    this.apply(
      new ArrivalWasReportedEvent({
        ...this.eventFor(actor),
        payload: { automaticallyDetected },
      }),
    );
  }

  reportOnBlock(
    actor: FlightActor,
    onBlockTime: Date,
    diversionAirportId: string | null,
  ): void {
    this.expectStatus(
      FlightStatus.TaxiingIn,
      InvalidStatusToReportOnBlockError,
    );

    const actual = this.state.timesheet.actual;
    actual.onBlockTime = onBlockTime;

    this.state.status = FlightStatus.OnBlock;
    this.state.completion = {
      actualAirborneMinutes: minutesBetween(
        actual.takeoffTime,
        actual.arrivalTime,
      ),
      actualBlockMinutes: minutesBetween(actual.offBlockTime, onBlockTime),
      completedAt: onBlockTime,
    };
    this.apply(
      new OnBlockWasReportedEvent({
        ...this.eventFor(actor),
        aircraftId: this.state.aircraftId,
        landingAirportId:
          this.state.isDiversionDeclared && diversionAirportId !== null
            ? diversionAirportId
            : this.airportOfType(AirportType.Destination),
        airportIds: this.airportIds(),
      }),
    );
  }

  startOffboarding(actor: FlightActor, source: GroundServiceSource): void {
    this.expectStatus(
      FlightStatus.OnBlock,
      InvalidStatusToStartOffboardingError,
    );

    this.state.status = FlightStatus.OffboardingStarted;
    this.apply(
      new OffboardingWasStartedEvent({
        ...this.eventFor(actor),
        payload: { source },
      }),
    );
  }

  finishOffboarding(actor: FlightActor, source: GroundServiceSource): void {
    this.expectStatus(
      FlightStatus.OffboardingStarted,
      InvalidStatusToFinishOffboardingError,
    );

    this.state.status = FlightStatus.OffboardingFinished;
    this.apply(
      new OffboardingWasFinishedEvent({
        ...this.eventFor(actor),
        payload: { source },
      }),
    );
  }

  close(actor: FlightActor, closure: FlightClosure): void {
    this.expectStatus(
      FlightStatus.OffboardingFinished,
      InvalidStatusToCloseFlightError,
    );

    if (closure.hasUnresolvedEmergency) {
      throw new UnresolvedEmergencyCannotCloseFlightError();
    }

    if (!closure.isDelayCleared) {
      throw new FlightHasUnacceptedDelayError();
    }

    this.state.status = FlightStatus.Closed;
    this.state.actualFuelBurned = closure.actualFuelBurned;
    this.apply(
      new FlightWasClosedEvent({
        ...this.eventFor(actor),
        aircraftId: this.state.aircraftId,
      }),
    );
  }

  reschedule(actor: FlightActor, schedule: SchedulePatch): void {
    this.expectStatus(FlightStatus.Created, InvalidStatusToChangeScheduleError);

    this.patchTimes('scheduled', schedule);
    this.apply(new ScheduledTimesheetWasUpdatedEvent(this.eventFor(actor)));
  }

  predict(actor: FlightActor, prediction: SchedulePatch): void {
    for (const lock of PREDICTION_LOCKS) {
      if (
        prediction[lock.time] !== undefined &&
        this.hasReached(lock.lockedFrom)
      ) {
        throw new lock.error();
      }
    }

    this.patchTimes('predicted', prediction);
    this.apply(new PredictedTimesheetWasUpdatedEvent(this.eventFor(actor)));
  }

  changeAtcCallsign(actor: FlightActor, atcCallsign: string | null): void {
    this.expectBefore(
      FlightStatus.InCruise,
      InvalidStatusToUpdateAtcCallsignError,
    );

    this.state.atcCallsign = atcCallsign;
    this.apply(new AtcCallsignWasChangedEvent(this.eventFor(actor)));
  }

  changeDepartureRunway(actor: FlightActor, runwayId: string): void {
    this.expectBefore(
      FlightStatus.InCruise,
      InvalidStatusToUpdateDepartureRunwayError,
    );

    this.state.departureRunwayId = runwayId;
    this.apply(new DepartureRunwayWasChangedEvent(this.eventFor(actor)));
  }

  changeArrivalRunway(actor: FlightActor, runwayId: string): void {
    this.expectBefore(
      FlightStatus.TaxiingIn,
      InvalidStatusToUpdateArrivalRunwayError,
    );

    this.state.arrivalRunwayId = runwayId;
    this.apply(new ArrivalRunwayWasChangedEvent(this.eventFor(actor)));
  }

  changeDepartureParkingPosition(
    actor: FlightActor,
    parkingPositionId: string,
  ): void {
    this.expectBefore(
      FlightStatus.CheckedIn,
      InvalidStatusToUpdateDepartureParkingPositionError,
    );

    this.state.departureParkingPositionId = parkingPositionId;
    this.apply(
      new DepartureParkingPositionWasChangedEvent(this.eventFor(actor)),
    );
  }

  changeArrivalParkingPosition(
    actor: FlightActor,
    parkingPositionId: string,
  ): void {
    this.expectBefore(
      FlightStatus.OnBlock,
      InvalidStatusToUpdateArrivalParkingPositionError,
    );

    this.state.arrivalParkingPositionId = parkingPositionId;
    this.apply(new ArrivalParkingPositionWasChangedEvent(this.eventFor(actor)));
  }

  changeServiceType(serviceType: FlightServiceType): void {
    this.expectStatus(
      FlightStatus.Created,
      InvalidStatusToChangeServiceTypeError,
    );

    this.state.serviceType = serviceType;
  }

  changeTracking(tracking: FlightTracking): void {
    this.state.tracking = tracking;
  }

  assertCanBeRemoved(): void {
    this.expectStatus(
      FlightStatus.Created,
      ScheduledFlightCannotBeRemovedError,
    );
  }

  assertCanUpdatePreliminaryLoadsheet(): void {
    this.expectStatus(
      FlightStatus.Created,
      InvalidStatusToUpdateLoadsheetError,
    );
  }

  assertCanReportFixFuel(reportedAt: Date): void {
    this.expectStatus(FlightStatus.InCruise, InvalidStatusToReportFixFuelError);

    const takeoffTime = this.state.timesheet.actual.takeoffTime;

    if (takeoffTime && reportedAt < takeoffTime) {
      throw new FixFuelReportedBeforeTakeoffError();
    }
  }

  assertCanReportDiversion(): void {
    if (!DIVERTIBLE.includes(this.state.status)) {
      throw new InvalidStatusToReportDiversionError();
    }
  }

  private expectStatus(status: FlightStatus, error: StatusError): void {
    if (this.state.status !== status) {
      throw new error();
    }
  }

  private expectBefore(milestone: FlightStatus, error: StatusError): void {
    if (this.hasReached(milestone)) {
      throw new error();
    }
  }

  private hasReached(milestone: FlightStatus): boolean {
    return LIFECYCLE.indexOf(this.state.status) >= LIFECYCLE.indexOf(milestone);
  }

  private patchTimes(schedule: TimesheetScheduleName, patch: SchedulePatch) {
    const times = this.state.timesheet[schedule];

    for (const time of Object.keys(times) as (keyof FlightTimes)[]) {
      const value = patch[time];

      if (value !== undefined) {
        times[time] = value;
      }
    }
  }

  private airportIds(): string[] {
    return this.state.airports.map((airport) => airport.id);
  }

  private airportOfType(type: AirportType): string {
    const airport = this.state.airports.find(
      (candidate) => candidate.type === type,
    );

    if (!airport) {
      throw new Error(`Flight ${this.state.id} has no ${type} airport.`);
    }

    return airport.id;
  }

  private eventFor(actor: FlightActor): FlightEventPayload {
    return {
      flightId: this.state.id,
      scope: actor.scope,
      actorId: actor.id,
    };
  }
}

import {
  CargoContentClassName,
  FlightCargoManifest,
} from './cargo-manifest.model';
import { PassengerSpecialService, PassengerStatus } from './manifest.model';
import { NotocSpecialPassenger, SpecialPassengerRemark } from './notoc.model';

export type NotifiablePassenger = {
  designator: string;
  status: PassengerStatus;
  ssr: PassengerSpecialService | null;
};

const NOT_NOTIFIED: PassengerSpecialService[] = [
  PassengerSpecialService.MeetAndAssist,
];

const SEAT = /^(\d+)([A-Z]*)$/;

export function specialPassengersOf(
  passengers: NotifiablePassenger[],
  load: FlightCargoManifest | null,
): NotocSpecialPassenger[] {
  const hold = holdOfMobilityAids(load);

  return passengers
    .filter(
      (
        passenger,
      ): passenger is NotifiablePassenger & {
        ssr: PassengerSpecialService;
      } =>
        passenger.status === PassengerStatus.Boarded &&
        passenger.ssr !== null &&
        !NOT_NOTIFIED.includes(passenger.ssr),
    )
    .sort((one, other) => bySeat(one.designator, other.designator))
    .map((passenger) => ({
      seat: passenger.designator,
      ssr: passenger.ssr,
      remarks: remarksFor(passenger.ssr, passenger.designator, hold),
    }));
}

function remarksFor(
  ssr: PassengerSpecialService,
  seat: string,
  hold: string,
): string[] {
  switch (ssr) {
    case PassengerSpecialService.WheelchairDryBattery:
      return [
        SpecialPassengerRemark.NonSpillableBattery,
        `MOBILITY AID IN ${hold}`,
      ];
    case PassengerSpecialService.WheelchairWetBattery:
      return [
        SpecialPassengerRemark.SpillableBattery,
        `MOBILITY AID IN ${hold}`,
      ];
    case PassengerSpecialService.WheelchairLithiumBattery:
      return [
        `LITHIUM BATTERY REMOVED, IN CABIN AT ${seat}`,
        `MOBILITY AID IN ${hold}`,
      ];
    case PassengerSpecialService.Stretcher:
      return [SpecialPassengerRemark.MedicalEscort];
    case PassengerSpecialService.MedicalCase:
      return [SpecialPassengerRemark.MedicalClearance];
    case PassengerSpecialService.DeporteeEscorted:
      return [SpecialPassengerRemark.EscortsAlongside];
    case PassengerSpecialService.Inadmissible:
      return [SpecialPassengerRemark.DocumentsHeldByCrew];
    case PassengerSpecialService.UnaccompaniedMinor:
      return [SpecialPassengerRemark.CabinCrewCare];
    case PassengerSpecialService.Infant:
      return [SpecialPassengerRemark.OnLap];
    case PassengerSpecialService.PetInCabin:
      return [SpecialPassengerRemark.UnderSeat];
    default:
      return [];
  }
}

function holdOfMobilityAids(load: FlightCargoManifest | null): string {
  const compartments = (load?.units ?? [])
    .filter(
      (unit) =>
        unit.contentClass === CargoContentClassName.Baggage &&
        unit.compartment !== null,
    )
    .map((unit) => unit.compartment as number);

  return compartments.length === 0
    ? 'HOLD'
    : `HOLD, CPT ${Math.max(...compartments)}`;
}

function bySeat(one: string, other: string): number {
  const left = SEAT.exec(one);
  const right = SEAT.exec(other);

  if (!left || !right) {
    return one.localeCompare(other);
  }

  return Number(left[1]) - Number(right[1]) || left[2].localeCompare(right[2]);
}

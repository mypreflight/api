import {
  CargoContentClassName,
  FlightCargoManifest,
} from './cargo-manifest.model';
import { PassengerSpecialService, PassengerStatus } from './manifest.model';
import { NotocMobilityAid, NotocSpecialPassenger } from './notoc.model';

export type NotifiablePassenger = {
  designator: string;
  status: PassengerStatus;
  ssr: PassengerSpecialService | null;
};

const NOT_NOTIFIED: PassengerSpecialService[] = [
  PassengerSpecialService.MeetAndAssist,
];

const MOBILITY_AIDS_IN_HOLD: PassengerSpecialService[] = [
  PassengerSpecialService.WheelchairDryBattery,
  PassengerSpecialService.WheelchairWetBattery,
  PassengerSpecialService.WheelchairLithiumBattery,
];

const SEAT = /^(\d+)([A-Z]*)$/;

export function specialPassengersOf(
  passengers: NotifiablePassenger[],
  load: FlightCargoManifest | null,
): NotocSpecialPassenger[] {
  const compartment = baggageCompartmentOf(load);

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
      mobilityAid: mobilityAidOf(passenger.ssr, compartment),
    }));
}

function mobilityAidOf(
  ssr: PassengerSpecialService,
  compartment: number | null,
): NotocMobilityAid | null {
  return MOBILITY_AIDS_IN_HOLD.includes(ssr) ? { compartment } : null;
}

function baggageCompartmentOf(load: FlightCargoManifest | null): number | null {
  const compartments = (load?.units ?? [])
    .filter(
      (unit) =>
        unit.contentClass === CargoContentClassName.Baggage &&
        unit.compartment !== null,
    )
    .map((unit) => unit.compartment as number);

  return compartments.length === 0 ? null : Math.max(...compartments);
}

function bySeat(one: string, other: string): number {
  const left = SEAT.exec(one);
  const right = SEAT.exec(other);

  if (!left || !right) {
    return one.localeCompare(other);
  }

  return Number(left[1]) - Number(right[1]) || left[2].localeCompare(right[2]);
}

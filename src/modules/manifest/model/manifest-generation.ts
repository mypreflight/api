import { CabinDeckName } from '../../cabin-layouts/model/layout-version';
import { PassengerSpecialService, PassengerStatus } from './manifest.model';
import {
  CabinCapacityExceededError,
  UnknownCabinError,
} from './error/manifest.error';

export type AllocatableSeat = {
  designator: string;
  deck: CabinDeckName;
  cabin: string;
};

export type SeatedPassenger = {
  designator: string;
  cabin: string;
  status: PassengerStatus;
};

export type ReconciliationPlan = {
  noShows: string[];
  additions: AllocatableSeat[];
};

const PNR_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const PNR_LENGTH = 6;
const SHARED_PNR_CHANCE = 0.2;
const SPECIAL_SERVICE_CHANCE = 0.15;
const SPECIAL_SERVICE_WEIGHTS: Record<PassengerSpecialService, number> = {
  [PassengerSpecialService.Infant]: 30,
  [PassengerSpecialService.WheelchairRamp]: 20,
  [PassengerSpecialService.WheelchairSteps]: 6,
  [PassengerSpecialService.WheelchairCabin]: 3,
  [PassengerSpecialService.WheelchairDryBattery]: 1.5,
  [PassengerSpecialService.WheelchairWetBattery]: 0.5,
  [PassengerSpecialService.WheelchairLithiumBattery]: 1.5,
  [PassengerSpecialService.Stretcher]: 0.2,
  [PassengerSpecialService.MedicalCase]: 1,
  [PassengerSpecialService.UnaccompaniedMinor]: 6,
  [PassengerSpecialService.Blind]: 2,
  [PassengerSpecialService.Deaf]: 2,
  [PassengerSpecialService.MeetAndAssist]: 8,
  [PassengerSpecialService.PetInCabin]: 5,
  [PassengerSpecialService.DeporteeEscorted]: 0.5,
  [PassengerSpecialService.DeporteeUnescorted]: 0.5,
  [PassengerSpecialService.Inadmissible]: 0.3,
};
const SPECIAL_SERVICE_TOTAL = Object.values(SPECIAL_SERVICE_WEIGHTS).reduce(
  (sum, weight) => sum + weight,
  0,
);

export function cabinSizesOf(seats: AllocatableSeat[]): Record<string, number> {
  const sizes: Record<string, number> = {};

  for (const seat of seats) {
    sizes[seat.cabin] = (sizes[seat.cabin] ?? 0) + 1;
  }

  return sizes;
}

export function assertBreakdownFitsCabins(
  cabinSizes: Record<string, number>,
  breakdown: Record<string, number>,
): void {
  for (const [cabin, count] of Object.entries(breakdown)) {
    if (!Object.prototype.hasOwnProperty.call(cabinSizes, cabin)) {
      throw new UnknownCabinError(cabin);
    }

    if (count > cabinSizes[cabin]) {
      throw new CabinCapacityExceededError(cabin, count, cabinSizes[cabin]);
    }
  }
}

export function targetPerCabin(
  cabinSizes: Record<string, number>,
  passengers: number,
  breakdown?: Record<string, number> | null,
): Record<string, number> {
  if (!breakdown) {
    return distributePassengers(cabinSizes, passengers);
  }

  assertBreakdownFitsCabins(cabinSizes, breakdown);

  const target: Record<string, number> = {};
  for (const cabin of Object.keys(cabinSizes)) {
    target[cabin] = 0;
  }

  for (const [cabin, count] of Object.entries(breakdown)) {
    target[cabin] = count;
  }

  return target;
}

export function distributePassengers(
  cabinSizes: Record<string, number>,
  total: number,
): Record<string, number> {
  const cabins = Object.keys(cabinSizes);
  const capacity = cabins.reduce((sum, cabin) => sum + cabinSizes[cabin], 0);
  const wanted = Math.max(0, Math.min(total, capacity));

  const allocation: Record<string, number> = {};
  for (const cabin of cabins) {
    allocation[cabin] = Math.floor(
      (wanted * cabinSizes[cabin]) / capacity || 0,
    );
  }

  let remainder =
    wanted - cabins.reduce((sum, cabin) => sum + allocation[cabin], 0);

  const largestFirst = [...cabins].sort(
    (one, other) =>
      cabinSizes[other] - cabinSizes[one] || one.localeCompare(other),
  );

  while (remainder > 0) {
    const cabin = largestFirst.find(
      (candidate) => allocation[candidate] < cabinSizes[candidate],
    );

    if (!cabin) {
      break;
    }

    allocation[cabin] += 1;
    remainder -= 1;
  }

  return allocation;
}

export function allocateSeats(
  seats: AllocatableSeat[],
  target: Record<string, number>,
): AllocatableSeat[] {
  const allocated: AllocatableSeat[] = [];

  for (const [cabin, cabinSeats] of groupByCabin(seats)) {
    allocated.push(...shuffle(cabinSeats).slice(0, target[cabin] ?? 0));
  }

  return allocated;
}

export function planReconciliation(
  seats: AllocatableSeat[],
  manifest: SeatedPassenger[],
  target: Record<string, number>,
): ReconciliationPlan {
  const taken = new Set(manifest.map((passenger) => passenger.designator));
  const plan: ReconciliationPlan = { noShows: [], additions: [] };

  for (const [cabin, cabinSeats] of groupByCabin(seats)) {
    const boarded = manifest.filter(
      (passenger) =>
        passenger.cabin === cabin &&
        passenger.status === PassengerStatus.Boarded,
    );
    const wanted = target[cabin] ?? 0;

    if (boarded.length > wanted) {
      plan.noShows.push(
        ...shuffle(boarded)
          .slice(0, boarded.length - wanted)
          .map((passenger) => passenger.designator),
      );

      continue;
    }

    const free = cabinSeats.filter((seat) => !taken.has(seat.designator));
    plan.additions.push(...shuffle(free).slice(0, wanted - boarded.length));
  }

  return plan;
}

export function generatePnr(): string {
  let pnr = '';

  for (let position = 0; position < PNR_LENGTH; position++) {
    pnr += PNR_ALPHABET[Math.floor(Math.random() * PNR_ALPHABET.length)];
  }

  return pnr;
}

export function assignPnrs(count: number): string[] {
  const pnrs: string[] = [];

  for (let passenger = 0; passenger < count; passenger++) {
    const sharesBooking = passenger > 0 && Math.random() < SHARED_PNR_CHANCE;

    pnrs.push(sharesBooking ? pnrs[passenger - 1] : generatePnr());
  }

  return pnrs;
}

export function assignSpecialServices(
  count: number,
): (PassengerSpecialService | null)[] {
  return Array.from({ length: Math.max(0, count) }, () =>
    Math.random() < SPECIAL_SERVICE_CHANCE
      ? drawSpecialService(Math.random())
      : null,
  );
}

export function drawSpecialService(roll: number): PassengerSpecialService {
  let cursor = roll * SPECIAL_SERVICE_TOTAL;

  for (const [service, weight] of Object.entries(SPECIAL_SERVICE_WEIGHTS)) {
    cursor -= weight;

    if (cursor < 0) {
      return service as PassengerSpecialService;
    }
  }

  return PassengerSpecialService.Infant;
}

function groupByCabin(
  seats: AllocatableSeat[],
): Map<string, AllocatableSeat[]> {
  const byCabin = new Map<string, AllocatableSeat[]>();

  for (const seat of seats) {
    const cabinSeats = byCabin.get(seat.cabin) ?? [];
    cabinSeats.push(seat);
    byCabin.set(seat.cabin, cabinSeats);
  }

  return byCabin;
}

function shuffle<T>(items: T[]): T[] {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index--) {
    const swapWith = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapWith]] = [
      shuffled[swapWith],
      shuffled[index],
    ];
  }

  return shuffled;
}

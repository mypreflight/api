import {
  AAL4912_FIXES,
  DLH82_ATC_ROUTE,
  DLH82_FIXES,
  DLH82_ROUTE,
  SeededRouteFix,
} from '../planned-routes.seed';

export type Navlog = {
  route: string;
  atcRoute: string;
  cruiseLevel: number;
  fixes: SeededRouteFix[];
};

const EASTBOUND_TIME_FACTOR = 0.88;
const PROCEDURE = /^[A-Z]{3,5}\d[A-Z]?$/;

const REVERSED_STAGE: Record<string, string> = {
  CLB: 'DSC',
  DSC: 'CLB',
  DES: 'CLB',
  CRZ: 'CRZ',
};

function reverseHeading(heading: number | null): number | null {
  return heading === null ? null : (heading + 180) % 360;
}

function remaining(total: number | null, value: number | null): number | null {
  return total === null || value === null ? null : total - value;
}

function reverseFixes(fixes: SeededRouteFix[]): SeededRouteFix[] {
  const last = fixes[fixes.length - 1];
  const totalSeconds = last.elapsedSeconds;
  const totalUsed = last.fuelUsed;
  const startOnBoard =
    fixes.find((fix) => fix.fuelPlannedOnBoard !== null)?.fuelPlannedOnBoard ??
    null;

  return [...fixes].reverse().map((fix, index) => {
    const leg = fixes[fixes.length - index];
    const used = remaining(totalUsed, fix.fuelUsed);
    const airway = leg?.viaAirway ?? null;

    return {
      ...fix,
      elapsedSeconds: Math.round(
        (totalSeconds - fix.elapsedSeconds) * EASTBOUND_TIME_FACTOR,
      ),
      distanceNm: leg?.distanceNm ?? 0,
      trackTrue: reverseHeading(leg?.trackTrue ?? null),
      trackMag: reverseHeading(leg?.trackMag ?? null),
      viaAirway: airway !== null && PROCEDURE.test(airway) ? null : airway,
      stage: REVERSED_STAGE[leg?.stage ?? fix.stage] ?? fix.stage,
      fuelFlow: leg?.fuelFlow ?? null,
      fuelLeg: leg?.fuelLeg ?? null,
      fuelUsed: index === 0 ? null : used,
      fuelPlannedOnBoard: index === 0 ? null : remaining(startOnBoard, used),
      fuelMinimumOnBoard:
        index === 0 ? null : (fixes[index]?.fuelMinimumOnBoard ?? null),
    };
  });
}

function reverseRoute(route: string): string {
  const tokens = route.split(' ');
  const inner = tokens.filter(
    (token, index) =>
      !(PROCEDURE.test(token) && (index === 0 || index === tokens.length - 1)),
  );

  return inner.reverse().join(' ');
}

export const BOSTON_PHILADELPHIA: Navlog = {
  route: 'PUT DCT HFD DCT CMK DCT SAX DCT ARD',
  atcRoute: 'N0451F330 PUT DCT HFD DCT CMK DCT SAX DCT ARD',
  cruiseLevel: 33000,
  fixes: AAL4912_FIXES,
};

export const FRANKFURT_NEW_YORK: Navlog = {
  route: DLH82_ROUTE,
  atcRoute: DLH82_ATC_ROUTE,
  cruiseLevel: 36000,
  fixes: DLH82_FIXES,
};

const EASTBOUND_ROUTE = reverseRoute(DLH82_ROUTE);

export const NEW_YORK_FRANKFURT: Navlog = {
  route: EASTBOUND_ROUTE,
  atcRoute: `N0482F370 ${EASTBOUND_ROUTE}`,
  cruiseLevel: 37000,
  fixes: reverseFixes(DLH82_FIXES),
};

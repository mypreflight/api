import { Navlog } from './navlog';

export type OfpFlight = {
  callsign: string;
  flightNumber: string;
  departure: string;
  destination: string;
  registration: string;
  aircraftType: string;
  scheduledOffBlock: Date;
};

const MONTHS = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MAY',
  'JUN',
  'JUL',
  'AUG',
  'SEP',
  'OCT',
  'NOV',
  'DEC',
];

function pad(value: string | number, width: number): string {
  return String(value).padEnd(width, ' ');
}

function clock(seconds: number): string {
  const minutes = Math.round(seconds / 60);

  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}${String(minutes % 60).padStart(2, '0')}`;
}

function icaoDate(date: Date): string {
  return `${String(date.getUTCDate()).padStart(2, '0')}${MONTHS[date.getUTCMonth()]}${String(date.getUTCFullYear()).slice(2)}`;
}

function tonnes(kilograms: number | null): string {
  return kilograms === null ? '-' : (kilograms / 1000).toFixed(1);
}

function escape(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function ofpContent(flight: OfpFlight, navlog: Navlog): string {
  const last = navlog.fixes[navlog.fixes.length - 1];
  const header = [
    `[ OFP ]`,
    `${pad(flight.callsign, 9)}${flight.departure}-${flight.destination}  ${icaoDate(flight.scheduledOffBlock)}  ${flight.aircraftType} ${flight.registration}`,
    `FLIGHT ${flight.flightNumber}   CRZ FL${String(navlog.cruiseLevel / 100).padStart(3, '0')}   AIR TIME ${clock(last.elapsedSeconds)}   TRIP FUEL ${tonnes(last.fuelUsed)}T`,
    '',
    `ROUTE: ${flight.departure} ${navlog.route} ${flight.destination}`,
    '',
    `${pad('FIX', 13)}${pad('AWY', 9)}${pad('ALT', 7)}${pad('TRK', 5)}${pad('DIST', 6)}${pad('ELAP', 6)}${pad('USED', 7)}REM`,
  ];
  const rows = navlog.fixes.map((fix) =>
    [
      pad(fix.ident, 13),
      pad(fix.viaAirway ?? 'DCT', 9),
      pad(
        fix.altitude >= 18000
          ? `F${String(fix.altitude / 100).padStart(3, '0')}`
          : fix.altitude,
        7,
      ),
      pad(fix.trackTrue ?? '-', 5),
      pad(fix.distanceNm ?? '-', 6),
      pad(clock(fix.elapsedSeconds), 6),
      pad(tonnes(fix.fuelUsed), 7),
      tonnes(fix.fuelPlannedOnBoard),
    ].join(''),
  );

  return `<div><pre>${escape([...header, ...rows].join('\n'))}</pre></div>`;
}

export function runwayAnalysis(
  flight: OfpFlight,
  runway: string,
  length: number,
): string {
  return [
    `${flight.departure} RWY ${runway}  TORA ${length}M  ${flight.aircraftType}`,
    'CONF     FLEX   V1   VR   V2   MARGIN',
    'CONF 1+F  52    145  148  153  420M',
    'CONF 2    49    141  144  149  510M',
    'CONF 3    46    137  140  145  590M',
  ].join('\n');
}

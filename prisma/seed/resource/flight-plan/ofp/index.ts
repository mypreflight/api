import { ofpDocument, OfpInput } from './document';
import { NotamSection } from './model';
import { planHtml } from './plan-html';
import { renderTlr } from './tlr';

export type {
  OfpAirportInput,
  OfpFuelPlan,
  OfpInput,
  OfpLoad,
  OfpRunwayInput,
  OfpSchedule,
} from './document';
export type { NotamSection, OfpNotam, WeatherReport } from './model';

export function notamSectionOf(qcode: string): NotamSection {
  if (qcode.startsWith('QMR')) {
    return 'RUNWAY';
  }

  if (qcode.startsWith('QPD')) {
    return 'SID';
  }

  if (qcode.startsWith('QPA')) {
    return 'STAR';
  }

  if (qcode.startsWith('QI') || qcode.startsWith('QP')) {
    return 'APPROACH PROCEDURES';
  }

  return 'AIRPORT';
}

export type OfpTexts = {
  ofpContent: string;
  runwayAnalysis: string;
};

export type OfpDocumentFlight = {
  departure: string;
  destination: string;
  scheduledOffBlock: Date;
};

export function ofpTexts(input: OfpInput): OfpTexts {
  const { ofp, tlr } = ofpDocument(input);
  const runwayAnalysis = renderTlr(tlr);

  return {
    ofpContent: planHtml({ ...ofp, runwayAnalysis }),
    runwayAnalysis,
  };
}

export function ofpDocumentUrl(flight: OfpDocumentFlight): string {
  const generated = Math.floor(flight.scheduledOffBlock.getTime() / 1000);

  return `https://www.simbrief.com/ofp/flightplans/${flight.departure}${flight.destination}_PDF_${generated}.pdf`;
}

import {
  Commodity,
  SpecialHandlingCode,
  TemperatureProfile,
  TemperatureRegime,
  TemperatureSolution,
} from './commodity.model';
import { OfferedCommodity } from './commodity-selection';

export enum ColdChainRisk {
  Low = 'low',
  Elevated = 'elevated',
  High = 'high',
}

export const CRITICAL_AMBIENT_C = 30;
export const LONG_CONNECTION_HOURS = 8;
export const ACTIVE_ENDURANCE_HOURS = 100;
const AMBIENT_EXPOSURE_HOURS = 2;
const ELEVATED_MARGIN_FRACTION = 0.5;
const METAR_TEMPERATURE = /\s(M?\d{2})\/(M?\d{2})\s/;

export type ColdChainExposure = {
  buildUpHours: number;
  flightHours: number;
  connectionHours: number | null;
  onwardFlightHours: number | null;
  ambientC: number | null;
};

export enum ColdChainReasonKind {
  EnduranceExceeded = 'endurance_exceeded',
  HotTransfer = 'hot_transfer',
  LongConnection = 'long_connection',
  ThinMargin = 'thin_margin',
  WithinMargin = 'within_margin',
}

export type ColdChainReason =
  | { kind: ColdChainReasonKind.EnduranceExceeded }
  | { kind: ColdChainReasonKind.HotTransfer; ambientC: number }
  | { kind: ColdChainReasonKind.LongConnection; connectionHours: number }
  | { kind: ColdChainReasonKind.ThinMargin }
  | { kind: ColdChainReasonKind.WithinMargin };

export const RISK_BY_REASON: Record<ColdChainReasonKind, ColdChainRisk> = {
  [ColdChainReasonKind.EnduranceExceeded]: ColdChainRisk.High,
  [ColdChainReasonKind.HotTransfer]: ColdChainRisk.High,
  [ColdChainReasonKind.LongConnection]: ColdChainRisk.High,
  [ColdChainReasonKind.ThinMargin]: ColdChainRisk.Elevated,
  [ColdChainReasonKind.WithinMargin]: ColdChainRisk.Low,
};

export type ColdChainAssessment = {
  regime: TemperatureRegime;
  minC: number;
  maxC: number;
  solution: TemperatureSolution;
  setPointC: number | null;
  enduranceHours: number;
  exposureHours: number;
  marginHours: number;
  risk: ColdChainRisk;
  reason: ColdChainReason;
};

export function ambientFromMetar(metar: string | null): number | null {
  if (!metar) {
    return null;
  }

  const matched = METAR_TEMPERATURE.exec(metar);

  if (!matched) {
    return null;
  }

  const raw = matched[1];

  return raw.startsWith('M') ? -Number(raw.slice(1)) : Number(raw);
}

export function exposureHoursOf(exposure: ColdChainExposure): number {
  return round1(
    exposure.buildUpHours +
      exposure.flightHours +
      (exposure.connectionHours ?? 0) +
      (exposure.onwardFlightHours ?? 0),
  );
}

export function setPointOf(profile: TemperatureProfile): number | null {
  return profile.solution === TemperatureSolution.Active
    ? Math.round((profile.minC + profile.maxC) / 2)
    : null;
}

export function assessColdChain(
  profile: TemperatureProfile,
  exposure: ColdChainExposure,
): ColdChainAssessment {
  const exposureHours = exposureHoursOf(exposure);
  const marginHours = round1(profile.enduranceHours - exposureHours);
  const reason = reasonOf(profile, exposure, marginHours);

  return {
    regime: profile.regime,
    minC: profile.minC,
    maxC: profile.maxC,
    solution: profile.solution,
    setPointC: setPointOf(profile),
    enduranceHours: profile.enduranceHours,
    exposureHours,
    marginHours,
    risk: RISK_BY_REASON[reason.kind],
    reason,
  };
}

function reasonOf(
  profile: TemperatureProfile,
  exposure: ColdChainExposure,
  marginHours: number,
): ColdChainReason {
  const active = profile.solution === TemperatureSolution.Active;
  const connectionHours = exposure.connectionHours ?? 0;

  if (marginHours <= 0) {
    return { kind: ColdChainReasonKind.EnduranceExceeded };
  }

  if (
    exposure.ambientC !== null &&
    exposure.ambientC > CRITICAL_AMBIENT_C &&
    connectionHours >= AMBIENT_EXPOSURE_HOURS &&
    !active
  ) {
    return {
      kind: ColdChainReasonKind.HotTransfer,
      ambientC: exposure.ambientC,
    };
  }

  if (connectionHours > LONG_CONNECTION_HOURS && !active) {
    return { kind: ColdChainReasonKind.LongConnection, connectionHours };
  }

  if (
    !active &&
    marginHours < profile.enduranceHours * ELEVATED_MARGIN_FRACTION
  ) {
    return { kind: ColdChainReasonKind.ThinMargin };
  }

  return { kind: ColdChainReasonKind.WithinMargin };
}

export function explanationOf(
  assessment: Pick<
    ColdChainAssessment,
    'reason' | 'solution' | 'enduranceHours' | 'exposureHours' | 'marginHours'
  >,
): string {
  const { reason, solution, enduranceHours, exposureHours, marginHours } =
    assessment;
  const phrase = solutionPhrase(solution);

  switch (reason.kind) {
    case ColdChainReasonKind.EnduranceExceeded:
      return `Exposure of ${exposureHours} h exceeds the ${enduranceHours} h endurance of ${phrase}.`;
    case ColdChainReasonKind.HotTransfer:
      return `${reason.ambientC} °C at the transfer point exceeds what ${phrase} is validated for.`;
    case ColdChainReasonKind.LongConnection:
      return `${articleFor(reason.connectionHours)} ${reason.connectionHours} h connection leaves the shipment on ${phrase} longer than it should be.`;
    case ColdChainReasonKind.ThinMargin:
      return `${capitalise(phrase)} with ${marginHours} h margin on a ${enduranceHours} h endurance; no cooling available in flight.`;
    case ColdChainReasonKind.WithinMargin:
      return `${capitalise(phrase)} with ${marginHours} h margin on a ${enduranceHours} h endurance.`;
  }
}

export function needsBetterSolution(
  profile: TemperatureProfile,
  exposureHours: number,
): boolean {
  return (
    profile.solution !== TemperatureSolution.Active &&
    profile.enduranceHours < exposureHours
  );
}

export function withSuitableSolution(
  commodity: Commodity,
  exposureHours: number,
): Commodity {
  if (
    !commodity.temperature ||
    !needsBetterSolution(commodity.temperature, exposureHours)
  ) {
    return commodity;
  }

  return {
    ...commodity,
    shc: commodity.shc.filter((code) => code !== SpecialHandlingCode.DryIce),
    temperature: {
      ...commodity.temperature,
      solution: TemperatureSolution.Active,
      enduranceHours: ACTIVE_ENDURANCE_HOURS,
    },
  };
}

export function upgradeOfferedSolutions(
  offered: OfferedCommodity[],
  exposureHours: number,
): OfferedCommodity[] {
  return offered.map((offer) => ({
    ...offer,
    commodity: withSuitableSolution(offer.commodity, exposureHours),
  }));
}

function solutionPhrase(solution: TemperatureSolution): string {
  if (solution === TemperatureSolution.Active) {
    return 'an active container';
  }

  return solution === TemperatureSolution.DryIce
    ? 'a dry ice pack'
    : 'a passive shipper';
}

function articleFor(value: number): string {
  const digits = String(Math.floor(value));

  if (digits.startsWith('8') || digits === '11' || digits === '18') {
    return 'An';
  }

  return 'A';
}

function capitalise(phrase: string): string {
  return `${phrase.charAt(0).toUpperCase()}${phrase.slice(1)}`;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

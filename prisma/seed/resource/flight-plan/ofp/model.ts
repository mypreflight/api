export type WindLevel = {
  altitude: number;
  direction: number;
  speed: number;
  oat: number;
};

export type FirCrossing = {
  code: string;
  name: string;
  latitude: number;
  longitude: number;
};

export type OfpFix = {
  ident: string;
  name: string;
  type: string;
  frequency: string | null;
  latitude: number;
  longitude: number;
  stage: string;
  airway: string;
  distance: number;
  trackTrue: number;
  trackMag: number;
  altitude: number;
  mach: number;
  trueAirspeed: number;
  groundSpeed: number;
  windComponent: number;
  elapsedSeconds: number;
  fuelUsed: number;
  fuelOnBoard: number;
  oat: number;
  isaDeviation: number;
  windDirection: number;
  windSpeed: number;
  shear: number;
  tropopause: number;
  mora: number;
  fir: string;
  firCrossing: FirCrossing | null;
  winds: WindLevel[];
};

export type WeatherReport = {
  issued: Date;
  text: string;
};

export type NotamSection =
  | 'AIRPORT'
  | 'RUNWAY'
  | 'SID'
  | 'STAR'
  | 'APPROACH PROCEDURES';

export type OfpNotam = {
  id: string;
  section: NotamSection;
  html: string;
};

export type OfpAirport = {
  icao: string;
  iata: string;
  name: string;
  timezone: string;
  latitude: number;
  longitude: number;
  elevation: number;
  runway: string;
  metar: WeatherReport | null;
  taf: WeatherReport | null;
  notams: OfpNotam[];
};

export type OfpAlternate = OfpAirport & {
  distance: number;
  trackTrue: number;
  route: string;
  cruiseAltitude: number;
  windComponent: number;
  ete: number;
  burn: number;
};

export type OfpAircraft = {
  icao: string;
  name: string;
  engines: string;
  equipment: string;
  selcal: string | null;
  pbn: string;
  approachCategory: string;
};

export type OfpFuel = {
  taxi: number;
  trip: number;
  contingency: number;
  contingencyRule: string;
  alternate: number;
  reserve: number;
  extra: number;
  takeoff: number;
  ramp: number;
  landing: number;
};

export type OfpTimes = {
  enroute: number;
  scheduledOut: Date;
  scheduledOff: Date;
  scheduledOn: Date;
  scheduledIn: Date;
  estimatedOut: Date;
  estimatedOff: Date;
  estimatedOn: Date;
  estimatedIn: Date;
  taxiOut: number;
  reserve: number;
  contingency: number;
  extra: number;
};

export type OfpWeights = {
  operatingEmpty: number;
  passengers: number;
  cargo: number;
  payload: number;
  zeroFuel: number;
  maxZeroFuel: number;
  takeoff: number;
  maxTakeoff: number;
  maxTakeoffStructural: number;
  landing: number;
  maxLanding: number;
};

export type OfpImpact = {
  label: string;
  fuel: number | null;
  time: number | null;
};

export type OfpGeneral = {
  costIndex: number;
  steps: string;
  routeDistance: number;
  airDistance: number;
  greatCircleDistance: number;
  averageWindDirection: number;
  averageWindSpeed: number;
  averageWindComponent: number;
  averageIsaDeviation: number;
  averageFuelFlow: number;
  route: string;
};

export type OfpAtc = {
  callsign: string;
  route: string;
  departureFir: string;
  destinationFir: string;
  firs: string[];
  firEstimates: { fir: string; elapsedSeconds: number }[];
};

export type Ofp = {
  callsign: string;
  registration: string;
  generated: Date;
  requestId: string;
  dispatcher: string;
  aircraft: OfpAircraft;
  origin: OfpAirport;
  destination: OfpAirport;
  alternates: OfpAlternate[];
  general: OfpGeneral;
  fuel: OfpFuel;
  times: OfpTimes;
  weights: OfpWeights;
  impacts: OfpImpact[];
  navlog: OfpFix[];
  atc: OfpAtc;
  runwayAnalysis: string;
};

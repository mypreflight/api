export type SpeedReference = {
  weight: number;
  speed: number;
  perTonne: number;
};

export type AircraftPerformance = {
  name: string;
  engines: string;
  equipment: string;
  pbn: string;
  approachCategory: string;
  operatingEmpty: number;
  maxTakeoff: number;
  maxLanding: number;
  maxZeroFuel: number;
  seats: number;
  freight: number;
  costIndex: number;
  ceiling: number;
  cruiseMach: number;
  holdingFuelFlow: number;
  alternateFuelFlow: number;
  taxiFuel: number;
  takeoffFlap: string;
  landingFlap: string;
  thrust: string;
  bleeds: string;
  maxFlex: number;
  takeoffDistance: number;
  rotation: SpeedReference;
  reference: SpeedReference;
  landingDistance: {
    weight: number;
    dry: number;
    perTonne: number;
    wetFactor: number;
  };
};

const AIRBUS_NARROWBODY = {
  equipment: 'M-SDE3FGHIRWY/LB1',
  pbn: 'A1B1C1D1O1S1',
  ceiling: 39000,
  cruiseMach: 0.78,
  takeoffFlap: '1',
  landingFlap: 'FULL',
  thrust: 'FLEX',
  bleeds: 'BLEEDS ON',
};

const PERFORMANCE: Record<string, AircraftPerformance> = {
  A320: {
    ...AIRBUS_NARROWBODY,
    name: 'A320-200',
    engines: 'CFM56-5B4/P',
    approachCategory: 'C',
    operatingEmpty: 42600,
    maxTakeoff: 78000,
    maxLanding: 66000,
    maxZeroFuel: 62500,
    seats: 180,
    freight: 1500,
    costIndex: 30,
    holdingFuelFlow: 2100,
    alternateFuelFlow: 2300,
    taxiFuel: 200,
    maxFlex: 60,
    takeoffDistance: 7200,
    rotation: { weight: 64, speed: 140, perTonne: 1.2 },
    reference: { weight: 60, speed: 131, perTonne: 1 },
    landingDistance: { weight: 60, dry: 2750, perTonne: 30, wetFactor: 1.297 },
  },
  A321: {
    ...AIRBUS_NARROWBODY,
    name: 'A321-200',
    engines: 'CFM56-5B3/P',
    approachCategory: 'D',
    operatingEmpty: 49188,
    maxTakeoff: 93500,
    maxLanding: 77800,
    maxZeroFuel: 73800,
    seats: 200,
    freight: 2000,
    costIndex: 53,
    holdingFuelFlow: 2300,
    alternateFuelFlow: 2600,
    taxiFuel: 270,
    maxFlex: 58,
    takeoffDistance: 8510,
    rotation: { weight: 67.7, speed: 138, perTonne: 1.2 },
    reference: { weight: 67, speed: 132, perTonne: 1 },
    landingDistance: { weight: 67, dry: 2902, perTonne: 28, wetFactor: 1.297 },
  },
  A339: {
    name: 'A330-900',
    engines: 'TRENT 7000-72',
    equipment: 'H-SDE1E2E3FGHIJ2J3J4J5M1RWXYZ/LB1D1',
    pbn: 'A1B1C1D1L1O1S2',
    approachCategory: 'C',
    operatingEmpty: 135500,
    maxTakeoff: 251900,
    maxLanding: 191000,
    maxZeroFuel: 181000,
    seats: 300,
    freight: 9000,
    costIndex: 30,
    ceiling: 41000,
    cruiseMach: 0.82,
    holdingFuelFlow: 4800,
    alternateFuelFlow: 5400,
    taxiFuel: 800,
    takeoffFlap: '1',
    landingFlap: 'FULL',
    thrust: 'FLEX',
    bleeds: 'BLEEDS ON',
    maxFlex: 55,
    takeoffDistance: 9500,
    rotation: { weight: 200, speed: 145, perTonne: 0.45 },
    reference: { weight: 180, speed: 136, perTonne: 0.35 },
    landingDistance: { weight: 180, dry: 4300, perTonne: 22, wetFactor: 1.3 },
  },
  B77W: {
    name: 'B777-300ER',
    engines: 'GE90-115BL',
    equipment: 'H-SDE1E2E3FGHIJ2J3J4J5M1P2RWXYZ/LB1D1',
    pbn: 'A1B1C1D1L1O1S2',
    approachCategory: 'D',
    operatingEmpty: 168000,
    maxTakeoff: 351500,
    maxLanding: 251300,
    maxZeroFuel: 237700,
    seats: 304,
    freight: 12000,
    costIndex: 80,
    ceiling: 43000,
    cruiseMach: 0.84,
    holdingFuelFlow: 6500,
    alternateFuelFlow: 7600,
    taxiFuel: 600,
    takeoffFlap: '15',
    landingFlap: '30',
    thrust: 'ATM',
    bleeds: 'PACKS ON',
    maxFlex: 60,
    takeoffDistance: 10200,
    rotation: { weight: 250, speed: 152, perTonne: 0.28 },
    reference: { weight: 210, speed: 146, perTonne: 0.3 },
    landingDistance: { weight: 210, dry: 5300, perTonne: 21, wetFactor: 1.32 },
  },
};

export function performanceOf(type: string): AircraftPerformance {
  return PERFORMANCE[type] ?? { ...PERFORMANCE.A320, name: type };
}

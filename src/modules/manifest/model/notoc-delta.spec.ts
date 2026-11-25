import { notocChanges } from './notoc-delta';
import {
  NotocDangerousGoods,
  NotocDocument,
  NotocSpecialLoad,
} from './notoc.model';
import {
  DrillLetter,
  HazardClass,
  PackingGroup,
  QuantityUnit,
  SpecialHandlingCode,
} from './commodity.model';
import {
  CargoDeck,
  HoldPositionSide,
  LoadingPosition,
} from './hold-layout.model';

const SIDES: Record<string, HoldPositionSide> = {
  L: HoldPositionSide.Left,
  R: HoldPositionSide.Right,
  P: HoldPositionSide.Full,
};

function at(written: string): LoadingPosition {
  return {
    deck: CargoDeck.Lower,
    compartment: Number(written[0]),
    row: Number(written[1]),
    side: SIDES[written[2]],
  };
}

function dangerousGoods(
  awb: string,
  loadingPosition: LoadingPosition | null,
): NotocDangerousGoods {
  return {
    awb,
    properShippingName: 'Paint',
    unNumber: 'UN1263',
    hazardClass: HazardClass.FlammableLiquid,
    classOrDivision: HazardClass.FlammableLiquid,
    subsidiaryRisk: null,
    packingGroup: PackingGroup.Medium,
    packages: 24,
    netQuantity: { amount: 5, unit: QuantityUnit.Litres },
    radioactive: null,
    impCode: SpecialHandlingCode.FlammableLiquid,
    uldId: 'AKE 12345 BA',
    loadingPosition,
    compartment: 1,
    unloadingAirport: 'JFK',
    cargoAircraftOnly: false,
    drill: {
      responseCode: {
        drillNumber: 3,
        drillLetters: [DrillLetter.OtherRiskLowOrNone],
      },
      inherentRisk: 'Flammable liquid or solid.',
      riskToAircraftAndOccupants: 'Rapid fire spread.',
      spillAndFireProcedure: 'Contain the spill.',
      additionalRisks: [],
    },
  };
}

function specialLoad(
  awb: string,
  loadingPosition: LoadingPosition | null,
): NotocSpecialLoad {
  return {
    awb,
    description: 'Live tropical fish, boxed',
    pieces: 40,
    shc: [SpecialHandlingCode.LiveAnimals],
    grossKg: 640,
    handlingRemark: null,
    temperature: null,
    holdCondition: null,
    uldId: null,
    loadingPosition,
    compartment: 3,
    unloadingAirport: 'JFK',
    heaviestPiece: null,
  };
}

function document(
  overrides: Partial<NotocDocument> = {},
  cargoKg = 6000,
  baggageKg = 2000,
): NotocDocument {
  return {
    header: {
      operatorName: 'American Airlines, Inc.',
      flightNumber: 'AA2010',
      flightDate: '2026-06-02',
      stationOfLoading: 'FRA',
      stationOfLoadingCity: 'Frankfurt',
      aircraftRegistration: 'N78881',
      aircraftType: 'B77W',
      preparedBy: 'Cameron Goldner',
      loadingSupervisor: 'Ettie Maggio',
      emergencyTelephone: '+44 20 7946 0639',
    },
    specialPassengers: [],
    dangerousGoods: [],
    dryIce: [],
    specialLoads: [],
    coldChain: [],
    ...overrides,
    summary: {
      compartments: [
        {
          compartment: 1,
          deck: CargoDeck.Lower,
          weightKg: cargoKg,
          dryIceKg: 0,
        },
      ],
      containerCount: 4,
      palletCount: 0,
      looseLotCount: 0,
      cargoKg,
      baggageKg,
      deadloadKg: cargoKg + baggageKg,
      beyondCount: 0,
      tightestConnectionMinutes: null,
      ...overrides.summary,
    },
  };
}

describe('notocChanges', () => {
  it('reports no change when the load is identical', () => {
    const before = document({
      dangerousGoods: [dangerousGoods('001-1', at('11L'))],
    });

    expect(notocChanges(before, before)).toEqual({
      changed: false,
      dangerousGoodsAdded: [],
      dangerousGoodsRemoved: [],
      specialLoadsAdded: [],
      specialLoadsRemoved: [],
      repositioned: [],
      cargoChangeKg: 0,
      deadloadChangeKg: 0,
    });
  });

  it('reports a dangerous goods shipment the reconciliation added', () => {
    const before = document({
      dangerousGoods: [dangerousGoods('001-1', at('11L'))],
    });
    const after = document({
      dangerousGoods: [
        dangerousGoods('001-1', at('11L')),
        dangerousGoods('001-2', at('11R')),
      ],
    });

    const changes = notocChanges(before, after);

    expect(changes.dangerousGoodsAdded).toEqual(['001-2']);
    expect(changes.dangerousGoodsRemoved).toEqual([]);
    expect(changes.changed).toBe(true);
  });

  it('reports a special load the reconciliation offloaded', () => {
    const before = document({
      specialLoads: [specialLoad('001-9', at('31L'))],
    });
    const after = document({ specialLoads: [] });

    const changes = notocChanges(before, after);

    expect(changes.specialLoadsRemoved).toEqual(['001-9']);
    expect(changes.specialLoadsAdded).toEqual([]);
    expect(changes.changed).toBe(true);
  });

  it('reports a shipment that moved to another position', () => {
    const before = document({
      dangerousGoods: [dangerousGoods('001-1', at('11L'))],
    });
    const after = document({
      dangerousGoods: [dangerousGoods('001-1', at('21R'))],
    });

    expect(notocChanges(before, after).repositioned).toEqual([
      { awb: '001-1', fromPosition: at('11L'), toPosition: at('21R') },
    ]);
  });

  it('reports a shipment whose unit lost its position', () => {
    const before = document({
      specialLoads: [specialLoad('001-9', at('31L'))],
    });
    const after = document({ specialLoads: [specialLoad('001-9', null)] });

    expect(notocChanges(before, after).repositioned).toEqual([
      { awb: '001-9', fromPosition: at('31L'), toPosition: null },
    ]);
  });

  it('does not call an added shipment repositioned', () => {
    const before = document({ dangerousGoods: [] });
    const after = document({
      dangerousGoods: [dangerousGoods('001-2', at('11R'))],
    });

    const changes = notocChanges(before, after);

    expect(changes.repositioned).toEqual([]);
    expect(changes.dangerousGoodsAdded).toEqual(['001-2']);
  });

  it('reports the change in cargo weight and deadload', () => {
    const before = document({}, 6000, 2000);
    const after = document({}, 4500, 2000);

    const changes = notocChanges(before, after);

    expect(changes.cargoChangeKg).toBe(-1500);
    expect(changes.deadloadChangeKg).toBe(-1500);
    expect(changes.changed).toBe(true);
  });

  it('sorts the shipments it reports', () => {
    const before = document({ dangerousGoods: [] });
    const after = document({
      dangerousGoods: [
        dangerousGoods('001-9', at('11L')),
        dangerousGoods('001-2', at('11R')),
      ],
    });

    expect(notocChanges(before, after).dangerousGoodsAdded).toEqual([
      '001-2',
      '001-9',
    ]);
  });
});

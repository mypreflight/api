import { composeNotoc } from './notoc';
import { PassengerSpecialService, PassengerStatus } from './manifest.model';
import { HoldCondition, NotocDocument, NotocHeader } from './notoc.model';
import { NotifiablePassenger } from './notoc-passengers';
import {
  CargoContentClassName,
  CargoShipmentEntry,
  CargoShipmentStatusName,
  CargoUnitEntry,
  FlightCargoManifest,
} from './cargo-manifest.model';
import { LoadUnitKind } from './cargo-packing';
import {
  CargoDeck,
  HoldPositionSide,
  LoadingPosition,
} from './hold-layout.model';
import { UldType } from './uld';
import { TransferRole } from './shipment-journey';
import {
  ColdChainAssessment,
  ColdChainReasonKind,
  ColdChainRisk,
} from './cold-chain';
import {
  DangerousGoodsProfile,
  DrillLetter,
  ExplosiveDivision,
  HandlingRemark,
  HazardClass,
  PackingGroup,
  QuantityUnit,
  SpecialHandlingCode,
  TemperatureRegime,
  TemperatureSolution,
} from './commodity.model';

const HEADER: NotocHeader = {
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
};

function lower(
  compartment: number,
  row: number,
  side: HoldPositionSide,
): LoadingPosition {
  return { deck: CargoDeck.Lower, compartment, row, side };
}

function compose(
  load: FlightCargoManifest,
  passengers: NotifiablePassenger[] = [],
): NotocDocument {
  return composeNotoc(load, 'JFK', HEADER, passengers);
}

function shipment(
  overrides: Partial<CargoShipmentEntry> = {},
): CargoShipmentEntry {
  return {
    awb: '001-48203713',
    commodity: 'printed-matter',
    description: 'Books, palletised',
    pieces: 68,
    grossKg: 1500,
    volumeM3: 2.143,
    shc: [] as SpecialHandlingCode[],
    shipper: 'Bauer Verlag GmbH',
    consignee: 'Whitaker Distribution LLC',
    origin: 'FRA',
    destination: 'JFK',
    transferRole: TransferRole.Local,
    onwardCarrier: null,
    onwardFlightNumber: null,
    connectionMinutes: null,
    connectionAtRisk: false,
    dangerousGoods: null,
    coldChain: null,
    status: CargoShipmentStatusName.Loaded,
    offloadReason: null,
    offloadedFromPosition: null,
    ...overrides,
  };
}

function unit(
  shipments: CargoShipmentEntry[],
  overrides: Partial<CargoUnitEntry> = {},
): CargoUnitEntry {
  return {
    kind: LoadUnitKind.Uld,
    uldCode: 'AKE48201AA',
    uldType: UldType.Ld3,
    loadingPosition: lower(1, 1, HoldPositionSide.Left),
    compartment: 1,
    deck: CargoDeck.Lower,
    tareKg: 82,
    grossKg: shipments.reduce((sum, entry) => sum + entry.grossKg, 0),
    volumeM3: 2.143,
    contentClass: CargoContentClassName.Cargo,
    beyondDestination: null,
    sealed: false,
    bagCount: null,
    priority: false,
    ...overrides,
    shipments,
  };
}

function manifest(units: CargoUnitEntry[]): FlightCargoManifest {
  const cargoKg = units.reduce(
    (sum, entry) => sum + entry.tareKg + entry.grossKg,
    0,
  );

  return {
    flightId: 'd2601432-e8cb-4018-8cee-f24aaaa29ca5',
    holdVariant: 'b77w-ld3',
    cargoKg,
    baggageKg: 0,
    bagCount: 0,
    baggageSource: null,
    containerCount: units.length,
    bulkLotCount: 0,
    shipmentCount: units.reduce(
      (sum, entry) => sum + entry.shipments.length,
      0,
    ),
    worstColdChainRisk: null,
    dangerousGoodsCount: 0,
    cargoAircraftOnlyCount: 0,
    transferCount: 0,
    tightestConnectionMinutes: null,
    compartmentLoad: [
      { compartment: 1, deck: CargoDeck.Lower, weightKg: cargoKg, dryIceKg: 0 },
    ],
    segregationAdvisories: [],
    units,
  };
}

const paint: DangerousGoodsProfile = {
  unNumber: 'UN1263',
  properShippingName: 'Paint',
  hazardClass: HazardClass.FlammableLiquid,
  subsidiaryRisk: null,
  packingGroup: PackingGroup.Medium,
  netQuantity: { amount: 5, unit: QuantityUnit.Litres },
  cargoAircraftOnly: false,
  responseCode: {
    drillNumber: 3,
    drillLetters: [DrillLetter.OtherRiskLowOrNone],
  },
};

const chilled: ColdChainAssessment = {
  regime: TemperatureRegime.Cool,
  minC: 2,
  maxC: 8,
  solution: TemperatureSolution.Passive,
  setPointC: null,
  enduranceHours: 48,
  exposureHours: 14.1,
  marginHours: 33.9,
  risk: ColdChainRisk.Low,
  reason: { kind: ColdChainReasonKind.WithinMargin },
};

describe('composeNotoc', () => {
  it('lists nothing hazardous when nothing hazardous is aboard', () => {
    const document = compose(manifest([unit([shipment()])]));

    expect(document.dangerousGoods).toEqual([]);
    expect(document.dryIce).toEqual([]);
  });

  it('reports a dangerous goods shipment in full, with its drill', () => {
    const document = compose(
      manifest([
        unit([
          shipment({
            awb: '001-11111118',
            commodity: 'paint',
            description: 'Architectural paint, tins',
            pieces: 24,
            shc: [SpecialHandlingCode.FlammableLiquid],
            dangerousGoods: paint,
          }),
        ]),
      ]),
    );

    expect(document.dangerousGoods).toEqual([
      {
        awb: '001-11111118',
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
        uldId: 'AKE48201AA',
        loadingPosition: lower(1, 1, HoldPositionSide.Left),
        compartment: 1,
        unloadingAirport: 'JFK',
        cargoAircraftOnly: false,
        drill: {
          responseCode: {
            drillNumber: 3,
            drillLetters: [DrillLetter.OtherRiskLowOrNone],
          },
          inherentRisk: expect.stringContaining('Flammable liquid'),
          riskToAircraftAndOccupants: expect.stringContaining('fire'),
          spillAndFireProcedure: expect.stringContaining('ignition source'),
          additionalRisks: ['No significant risk beyond the drill itself.'],
        },
      },
    ]);
  });

  it('keeps a dangerous goods shipment out of the special loads section', () => {
    const document = compose(
      manifest([
        unit([
          shipment({
            commodity: 'radiopharmaceuticals',
            shc: [
              SpecialHandlingCode.Pharmaceuticals,
              SpecialHandlingCode.RadioactiveYellow,
            ],
            dangerousGoods: paint,
          }),
        ]),
      ]),
    );

    expect(document.dangerousGoods).toHaveLength(1);
    expect(document.specialLoads).toEqual([]);
  });

  it('reports a notifiable load that is not dangerous goods', () => {
    const document = compose(
      manifest([
        unit([
          shipment({
            awb: '001-22222225',
            commodity: 'horses',
            description: 'Sport horses in stalls',
            grossKg: 2400,
            shc: [SpecialHandlingCode.LiveAnimals, SpecialHandlingCode.Heavy],
          }),
        ]),
      ]),
    );

    expect(document.specialLoads).toHaveLength(1);
    expect(document.specialLoads[0]).toMatchObject({
      awb: '001-22222225',
      shc: [SpecialHandlingCode.LiveAnimals, SpecialHandlingCode.Heavy],
      grossKg: 2400,
      loadingPosition: lower(1, 1, HoldPositionSide.Left),
      compartment: 1,
      unloadingAirport: 'JFK',
    });
  });

  it('carries the header it is given', () => {
    const document = compose(manifest([unit([shipment()])]));

    expect(document.header).toEqual(HEADER);
  });

  it('notifies the special category passengers it is given', () => {
    const document = compose(manifest([unit([shipment()])]), [
      {
        designator: '14C',
        status: PassengerStatus.Boarded,
        ssr: PassengerSpecialService.Stretcher,
      },
    ]);

    expect(document.specialPassengers).toEqual([
      {
        seat: '14C',
        ssr: PassengerSpecialService.Stretcher,
        mobilityAid: null,
      },
    ]);
  });

  it('prints the division of an explosive and the code its division takes', () => {
    const document = compose(
      manifest([
        unit([
          shipment({
            commodity: 'ammunition-sporting',
            shc: [],
            dangerousGoods: {
              ...paint,
              unNumber: '0012',
              hazardClass: HazardClass.Explosives,
              division: ExplosiveDivision.Division14S,
              responseCode: {
                drillNumber: 1,
                drillLetters: [DrillLetter.OtherRiskLowOrNone],
              },
            },
          }),
        ]),
      ]),
    );

    expect(document.dangerousGoods[0]).toMatchObject({
      classOrDivision: ExplosiveDivision.Division14S,
      impCode: SpecialHandlingCode.ExplosivesDivision14S,
    });
  });

  it('codes dangerous goods by their class where the shipment names no code', () => {
    const document = compose(
      manifest([
        unit([
          shipment({
            shc: [SpecialHandlingCode.DangerousGoods],
            dangerousGoods: { ...paint, hazardClass: HazardClass.Corrosive },
          }),
        ]),
      ]),
    );

    expect(document.dangerousGoods[0].impCode).toBe(
      SpecialHandlingCode.Corrosive,
    );
  });

  it('prints an explosive by its division and compatibility group', () => {
    const document = compose(
      manifest([
        unit([
          shipment({
            commodity: 'ammunition-sporting',
            shc: [SpecialHandlingCode.ExplosivesDivision14S],
            dangerousGoods: {
              ...paint,
              unNumber: '0012',
              hazardClass: HazardClass.Explosives,
              responseCode: {
                drillNumber: 1,
                drillLetters: [DrillLetter.OtherRiskLowOrNone],
              },
            },
          }),
        ]),
      ]),
    );

    expect(document.dangerousGoods[0]).toMatchObject({
      classOrDivision: '1.4S',
      impCode: SpecialHandlingCode.ExplosivesDivision14S,
    });
  });

  it('leaves dangerous goods the notification does not require off it', () => {
    const document = compose(
      manifest([
        unit([
          shipment({
            commodity: 'biological-cat-b',
            shc: [SpecialHandlingCode.InfectiousSubstance],
            dangerousGoods: {
              ...paint,
              unNumber: '3373',
              hazardClass: HazardClass.InfectiousSubstance,
              responseCode: {
                drillNumber: 11,
                drillLetters: [DrillLetter.Infectious],
              },
            },
          }),
        ]),
      ]),
    );

    expect(document.dangerousGoods).toEqual([]);
  });

  it('reports a radioactive package by category and transport index', () => {
    const document = compose(
      manifest([
        unit([
          shipment({
            commodity: 'radiopharmaceuticals',
            shc: [SpecialHandlingCode.RadioactiveYellow],
            dangerousGoods: {
              ...paint,
              unNumber: '2915',
              hazardClass: HazardClass.Radioactive,
              responseCode: {
                drillNumber: 7,
                drillLetters: [DrillLetter.OtherRiskLowOrNone],
              },
            },
          }),
        ]),
      ]),
    );

    const { radioactive } = document.dangerousGoods[0];
    expect(radioactive).not.toBeNull();
    expect(['II-YELLOW', 'III-YELLOW']).toContain(radioactive!.category);
    expect(radioactive!.transportIndex).toBeGreaterThan(0);
    expect(radioactive!.transportIndex).toBeLessThanOrEqual(3);
  });

  it('gives a category I-WHITE package a transport index of nought', () => {
    const document = compose(
      manifest([
        unit([
          shipment({
            commodity: 'radiopharmaceuticals',
            shc: [SpecialHandlingCode.RadioactiveWhite],
            dangerousGoods: {
              ...paint,
              unNumber: '2915',
              hazardClass: HazardClass.Radioactive,
              responseCode: {
                drillNumber: 7,
                drillLetters: [DrillLetter.OtherRiskLowOrNone],
              },
            },
          }),
        ]),
      ]),
    );

    expect(document.dangerousGoods[0]).toMatchObject({
      radioactive: { category: 'I-WHITE', transportIndex: 0 },
      impCode: SpecialHandlingCode.RadioactiveWhite,
    });
  });

  it('gives the same radioactive package the same transport index every time', () => {
    const load = manifest([
      unit([
        shipment({
          awb: '001-77777770',
          commodity: 'radiopharmaceuticals',
          shc: [SpecialHandlingCode.RadioactiveYellow],
          dangerousGoods: { ...paint, hazardClass: HazardClass.Radioactive },
        }),
      ]),
    ]);

    expect(compose(load).dangerousGoods[0].radioactive).toEqual(
      compose(load).dangerousGoods[0].radioactive,
    );
  });

  it('totals dry ice per compartment, apart from the dangerous goods lines', () => {
    const dryIce: DangerousGoodsProfile = {
      ...paint,
      unNumber: '1845',
      hazardClass: HazardClass.Miscellaneous,
      responseCode: {
        drillNumber: 9,
        drillLetters: [DrillLetter.Anaesthetic],
      },
    };
    const document = compose(
      manifest([
        unit([
          shipment({
            awb: '001-10000001',
            commodity: 'dry-ice',
            pieces: 4,
            grossKg: 80,
            shc: [SpecialHandlingCode.DryIce],
            dangerousGoods: dryIce,
          }),
          shipment({
            awb: '001-10000002',
            commodity: 'dry-ice',
            pieces: 2,
            grossKg: 40,
            shc: [SpecialHandlingCode.DryIce],
            dangerousGoods: dryIce,
          }),
        ]),
        unit(
          [
            shipment({
              awb: '001-10000003',
              commodity: 'snow-crab',
              pieces: 10,
              grossKg: 250,
              shc: [SpecialHandlingCode.Frozen, SpecialHandlingCode.DryIce],
            }),
          ],
          {
            loadingPosition: lower(3, 1, HoldPositionSide.Left),
            compartment: 3,
          },
        ),
      ]),
    );

    expect(document.dangerousGoods).toEqual([]);
    expect(document.dryIce).toEqual([
      {
        compartment: 1,
        packages: 6,
        kg: 120,
        unloadingAirport: 'JFK',
        drill: expect.objectContaining({
          responseCode: {
            drillNumber: 9,
            drillLetters: [DrillLetter.Anaesthetic],
          },
        }),
      },
      {
        compartment: 3,
        packages: 10,
        kg: 30,
        unloadingAirport: 'JFK',
        drill: expect.objectContaining({
          responseCode: {
            drillNumber: 9,
            drillLetters: [DrillLetter.Anaesthetic],
          },
        }),
      },
    ]);
  });

  it('reports what the form asks of a special load', () => {
    const document = compose(
      manifest([
        unit([
          shipment({
            commodity: 'pets-in-hold',
            description: 'Family pet, hold carriage',
            pieces: 2,
            grossKg: 60,
            shc: [SpecialHandlingCode.LiveAnimalsHold],
          }),
        ]),
      ]),
    );

    expect(document.specialLoads[0]).toMatchObject({
      pieces: 2,
      uldId: 'AKE48201AA',
      handlingRemark: HandlingRemark.PetsInKennels,
      temperature: null,
      holdCondition: HoldCondition.HeatedAndVentilated,
    });
  });

  it('states the temperature a perishable load must be kept at', () => {
    const document = compose(
      manifest([
        unit([
          shipment({
            commodity: 'flowers-roses',
            shc: [SpecialHandlingCode.Perishable],
            coldChain: chilled,
          }),
        ]),
      ]),
    );

    expect(document.specialLoads[0]).toMatchObject({
      handlingRemark: null,
      temperature: { minC: 2, maxC: 8 },
      holdCondition: null,
    });
  });

  it('reports the heaviest piece of a heavy load', () => {
    const document = compose(
      manifest([
        unit([
          shipment({
            commodity: 'horses',
            pieces: 4,
            grossKg: 2400,
            shc: [SpecialHandlingCode.LiveAnimals, SpecialHandlingCode.Heavy],
          }),
        ]),
      ]),
    );

    expect(document.specialLoads[0].heaviestPiece).toEqual({
      kg: 600,
      lengthCm: 300,
      widthCm: 110,
      heightCm: 230,
    });
  });

  it('never reports a heaviest piece heavier than the shipment allows', () => {
    const document = compose(
      manifest([
        unit([
          shipment({
            commodity: 'human-remains',
            pieces: 1,
            grossKg: 220,
            shc: [SpecialHandlingCode.HumanRemains, SpecialHandlingCode.Heavy],
          }),
        ]),
      ]),
    );

    expect(document.specialLoads[0].heaviestPiece).toEqual({
      kg: 220,
      lengthCm: 220,
      widthCm: 70,
      heightCm: 60,
    });
  });

  it('leaves ordinary freight out of the special loads section', () => {
    const document = compose(manifest([unit([shipment()])]));

    expect(document.specialLoads).toEqual([]);
  });

  it('reports the largest piece of an outsized load', () => {
    const document = compose(
      manifest([
        unit([
          shipment({
            commodity: 'engine-fan-blades',
            shc: [SpecialHandlingCode.Heavy],
            grossKg: 1472,
          }),
        ]),
      ]),
    );

    expect(document.specialLoads[0].heaviestPiece).not.toBeNull();
    expect(document.specialLoads[0].heaviestPiece!.kg).toBeGreaterThan(0);
  });

  it('carries the cold chain assessment', () => {
    const document = compose(
      manifest([
        unit([
          shipment({
            awb: '001-33333332',
            commodity: 'insulin',
            description: 'Insulin, insulated shipper',
            shc: [
              SpecialHandlingCode.Pharmaceuticals,
              SpecialHandlingCode.Cool,
            ],
            coldChain: chilled,
          }),
        ]),
      ]),
    );

    expect(document.coldChain).toEqual([
      {
        awb: '001-33333332',
        description: 'Insulin, insulated shipper',
        regime: TemperatureRegime.Cool,
        risk: ColdChainRisk.Low,
        solution: TemperatureSolution.Passive,
        enduranceHours: 48,
        exposureHours: 14.1,
        marginHours: 33.9,
        reason: { kind: ColdChainReasonKind.WithinMargin },
      },
    ]);
  });

  it('counts containers, pallets and loose lots separately', () => {
    const document = compose(
      manifest([
        unit([shipment()], { uldType: UldType.Ld3 }),
        unit([shipment()], {
          uldType: UldType.Pallet96,
          loadingPosition: lower(2, 1, HoldPositionSide.Full),
        }),
        unit([shipment()], {
          kind: LoadUnitKind.BulkLot,
          uldType: null,
          uldCode: null,
          loadingPosition: null,
          tareKg: 0,
        }),
      ]),
    );

    expect(document.summary.containerCount).toBe(1);
    expect(document.summary.palletCount).toBe(1);
    expect(document.summary.looseLotCount).toBe(1);
  });

  it('leaves a unit emptied by offloading out of the unit counts', () => {
    const document = compose(
      manifest([
        unit([shipment()]),
        unit([], {
          loadingPosition: null,
          tareKg: 0,
          grossKg: 0,
          uldCode: 'AKE48202AA',
        }),
      ]),
    );

    expect(document.summary.containerCount).toBe(1);
  });

  it('reports the deadload and the tightest onward connection', () => {
    const load = manifest([
      unit([
        shipment({ onwardCarrier: 'DL', connectionMinutes: 240 }),
        shipment({ awb: '001-2', onwardCarrier: 'AC', connectionMinutes: 95 }),
      ]),
    ]);
    load.baggageKg = 2000;

    const document = compose(load);

    expect(document.summary.beyondCount).toBe(2);
    expect(document.summary.tightestConnectionMinutes).toBe(95);
    expect(document.summary.deadloadKg).toBe(load.cargoKg + 2000);
  });

  it('describes only what is still loaded', () => {
    const document = compose(
      manifest([
        unit([
          shipment({ shc: [SpecialHandlingCode.LiveAnimals] }),
          shipment({
            awb: '001-2',
            shc: [SpecialHandlingCode.Valuable],
            status: CargoShipmentStatusName.Offloaded,
          }),
        ]),
      ]),
    );

    expect(document.specialLoads).toHaveLength(1);
    expect(document.specialLoads[0].shc).toEqual(['AVI']);
  });

  it('carries the compartment load, dry ice included', () => {
    const load = manifest([
      unit([shipment({ shc: [SpecialHandlingCode.DryIce] })]),
    ]);
    load.compartmentLoad = [
      {
        compartment: 1,
        deck: CargoDeck.Lower,
        weightKg: 1582,
        dryIceKg: 120,
      },
    ];

    expect(compose(load).summary.compartments).toEqual([
      { compartment: 1, deck: CargoDeck.Lower, weightKg: 1582, dryIceKg: 120 },
    ]);
  });
});

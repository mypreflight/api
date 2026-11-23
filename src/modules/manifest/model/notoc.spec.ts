import { composeNotoc } from './notoc';
import {
  DANGEROUS_GOODS_STATEMENT,
  NO_DANGEROUS_GOODS_STATEMENT,
} from './notoc.model';
import {
  CargoContentClassName,
  CargoShipmentEntry,
  CargoShipmentStatusName,
  CargoUnitEntry,
  FlightCargoManifest,
} from './cargo-manifest.model';
import { LoadUnitKind } from './cargo-packing';
import { CargoDeck } from './hold-layout.model';
import { UldType } from './uld';
import { TransferRole } from './shipment-journey';
import { ColdChainRisk, ColdChainAssessment } from './cold-chain';
import {
  DangerousGoodsProfile,
  HazardClass,
  PackingGroup,
  SpecialHandlingCode,
  TemperatureRegime,
  TemperatureSolution,
} from './commodity.model';

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
    offloadedFrom: null,
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
    positionDesignator: '11L',
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
  netPerPackage: '5 L',
  cargoAircraftOnly: false,
  ercCode: '3L',
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
  explanation: 'A passive shipper with 33.9 h margin on a 48 h endurance.',
  advisory: true,
};

describe('composeNotoc', () => {
  it('states in as many words that nothing hazardous is aboard', () => {
    const document = composeNotoc(manifest([unit([shipment()])]), 'JFK');

    expect(document.statement).toBe(NO_DANGEROUS_GOODS_STATEMENT);
    expect(document.dangerousGoods).toEqual([]);
  });

  it('reports a dangerous goods shipment in full, with its drill', () => {
    const document = composeNotoc(
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
      'JFK',
    );

    expect(document.statement).toBe(DANGEROUS_GOODS_STATEMENT);
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
        netPerPackage: '5 L',
        quantityIsTotal: false,
        radioactive: null,
        impCode: SpecialHandlingCode.FlammableLiquid,
        uldId: 'AKE48201AA',
        position: '11L',
        compartment: 1,
        unloadingAirport: 'JFK',
        cargoAircraftOnly: false,
        drill: {
          ercCode: '3L',
          inherentRisk: expect.stringContaining('Flammable liquid'),
          riskToAircraftAndOccupants: expect.stringContaining('fire'),
          spillAndFireProcedure: expect.stringContaining('ignition source'),
          additionalRisks: ['No significant risk beyond the drill itself.'],
        },
      },
    ]);
  });

  it('keeps a dangerous goods shipment out of the special loads section', () => {
    const document = composeNotoc(
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
      'JFK',
    );

    expect(document.dangerousGoods).toHaveLength(1);
    expect(document.specialLoads).toEqual([]);
  });

  it('reports a notifiable load that is not dangerous goods', () => {
    const document = composeNotoc(
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
      'JFK',
    );

    expect(document.specialLoads).toHaveLength(1);
    expect(document.specialLoads[0]).toMatchObject({
      awb: '001-22222225',
      shc: [SpecialHandlingCode.LiveAnimals, SpecialHandlingCode.Heavy],
      grossKg: 2400,
      position: '11L',
      compartment: 1,
      unloadingAirport: 'JFK',
    });
  });

  it('carries no header unless one is given', () => {
    const document = composeNotoc(manifest([unit([shipment()])]), 'JFK');

    expect(document.header).toBeNull();
  });

  it('prints an explosive by its division and compatibility group', () => {
    const document = composeNotoc(
      manifest([
        unit([
          shipment({
            commodity: 'ammunition-sporting',
            shc: [SpecialHandlingCode.ExplosivesDivision14S],
            dangerousGoods: {
              ...paint,
              unNumber: '0012',
              hazardClass: HazardClass.Explosives,
              ercCode: '1L',
            },
          }),
        ]),
      ]),
      'JFK',
    );

    expect(document.dangerousGoods[0]).toMatchObject({
      classOrDivision: '1.4S',
      impCode: SpecialHandlingCode.ExplosivesDivision14S,
    });
  });

  it('leaves dangerous goods the notification does not require off it', () => {
    const document = composeNotoc(
      manifest([
        unit([
          shipment({
            commodity: 'biological-cat-b',
            shc: [SpecialHandlingCode.InfectiousSubstance],
            dangerousGoods: {
              ...paint,
              unNumber: '3373',
              hazardClass: HazardClass.InfectiousSubstance,
              ercCode: '11Y',
            },
          }),
        ]),
      ]),
      'JFK',
    );

    expect(document.dangerousGoods).toEqual([]);
    expect(document.statement).toBe(NO_DANGEROUS_GOODS_STATEMENT);
  });

  it('reports a radioactive package by category and transport index', () => {
    const document = composeNotoc(
      manifest([
        unit([
          shipment({
            commodity: 'radiopharmaceuticals',
            shc: [SpecialHandlingCode.RadioactiveYellow],
            dangerousGoods: {
              ...paint,
              unNumber: '2915',
              hazardClass: HazardClass.Radioactive,
              ercCode: '7L',
            },
          }),
        ]),
      ]),
      'JFK',
    );

    const { radioactive } = document.dangerousGoods[0];
    expect(radioactive).not.toBeNull();
    expect(['II-YELLOW', 'III-YELLOW']).toContain(radioactive!.category);
    expect(radioactive!.transportIndex).toBeGreaterThan(0);
    expect(radioactive!.transportIndex).toBeLessThanOrEqual(3);
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

    expect(composeNotoc(load, 'JFK').dangerousGoods[0].radioactive).toEqual(
      composeNotoc(load, 'JFK').dangerousGoods[0].radioactive,
    );
  });

  it('totals dry ice per compartment on one line without a waybill', () => {
    const dryIce = {
      ...paint,
      unNumber: '1845',
      hazardClass: HazardClass.Miscellaneous,
      ercCode: '9A',
    };
    const document = composeNotoc(
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
          { positionDesignator: '31L', compartment: 3 },
        ),
      ]),
      'JFK',
    );

    expect(document.dangerousGoods).toEqual([
      expect.objectContaining({
        awb: null,
        unNumber: '1845',
        packages: 6,
        netPerPackage: '120 kg',
        quantityIsTotal: true,
        impCode: SpecialHandlingCode.DryIce,
        position: null,
        compartment: 1,
      }),
      expect.objectContaining({
        awb: null,
        packages: 10,
        netPerPackage: '30 kg',
        compartment: 3,
      }),
    ]);
  });

  it('reports what the form asks of a special load', () => {
    const document = composeNotoc(
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
      'JFK',
    );

    expect(document.specialLoads[0]).toMatchObject({
      pieces: 2,
      uldId: 'AKE48201AA',
      supplementaryInformation: [
        'PETS IN IATA KENNELS',
        'HEATED AND VENTILATED HOLD',
      ],
    });
  });

  it('states the temperature a perishable load must be kept at', () => {
    const document = composeNotoc(
      manifest([
        unit([
          shipment({
            commodity: 'flowers-roses',
            shc: [SpecialHandlingCode.Perishable],
            coldChain: chilled,
          }),
        ]),
      ]),
      'JFK',
    );

    expect(document.specialLoads[0].supplementaryInformation).toEqual([
      'KEEP AT +2 TO +8 °C',
    ]);
  });

  it('prints the heaviest piece among the supplementary information', () => {
    const document = composeNotoc(
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
      'JFK',
    );

    expect(document.specialLoads[0].supplementaryInformation).toContain(
      'HEAVIEST PIECE 600 KG, 300x110x230 CM',
    );
  });

  it('never reports a heaviest piece heavier than the shipment allows', () => {
    const document = composeNotoc(
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
      'JFK',
    );

    expect(document.specialLoads[0].heaviestPiece).toEqual({
      kg: 220,
      lengthCm: 220,
      widthCm: 70,
      heightCm: 60,
    });
  });

  it('leaves ordinary freight out of the special loads section', () => {
    const document = composeNotoc(manifest([unit([shipment()])]), 'JFK');

    expect(document.specialLoads).toEqual([]);
  });

  it('reports the largest piece of an outsized load', () => {
    const document = composeNotoc(
      manifest([
        unit([
          shipment({
            commodity: 'engine-fan-blades',
            shc: [SpecialHandlingCode.Heavy],
            grossKg: 1472,
          }),
        ]),
      ]),
      'JFK',
    );

    expect(document.specialLoads[0].heaviestPiece).not.toBeNull();
    expect(document.specialLoads[0].heaviestPiece!.kg).toBeGreaterThan(0);
  });

  it('carries the cold chain assessment and marks it advisory', () => {
    const document = composeNotoc(
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
      'JFK',
    );

    expect(document.coldChain).toEqual([
      {
        awb: '001-33333332',
        description: 'Insulin, insulated shipper',
        regime: TemperatureRegime.Cool,
        risk: ColdChainRisk.Low,
        marginHours: 33.9,
        explanation: chilled.explanation,
        advisory: true,
      },
    ]);
  });

  it('counts containers, pallets and loose lots separately', () => {
    const document = composeNotoc(
      manifest([
        unit([shipment()], { uldType: UldType.Ld3, positionDesignator: '11L' }),
        unit([shipment()], {
          uldType: UldType.Pallet96,
          positionDesignator: '21P',
        }),
        unit([shipment()], {
          kind: LoadUnitKind.BulkLot,
          uldType: null,
          uldCode: null,
          positionDesignator: null,
          tareKg: 0,
        }),
      ]),
      'JFK',
    );

    expect(document.summary.containerCount).toBe(1);
    expect(document.summary.palletCount).toBe(1);
    expect(document.summary.looseLotCount).toBe(1);
  });

  it('leaves a unit emptied by offloading out of the unit counts', () => {
    const document = composeNotoc(
      manifest([
        unit([shipment()]),
        unit([], {
          positionDesignator: null,
          tareKg: 0,
          grossKg: 0,
          uldCode: 'AKE48202AA',
        }),
      ]),
      'JFK',
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

    const document = composeNotoc(load, 'JFK');

    expect(document.summary.beyondCount).toBe(2);
    expect(document.summary.tightestConnectionMinutes).toBe(95);
    expect(document.summary.deadloadKg).toBe(load.cargoKg + 2000);
  });

  it('describes only what is still loaded', () => {
    const document = composeNotoc(
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
      'JFK',
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

    expect(composeNotoc(load, 'JFK').summary.compartments).toEqual([
      { compartment: 1, deck: CargoDeck.Lower, weightKg: 1582, dryIceKg: 120 },
    ]);
  });
});

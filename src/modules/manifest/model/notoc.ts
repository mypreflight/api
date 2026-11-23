import {
  CargoShipmentEntry,
  CargoShipmentStatusName,
  CargoUnitEntry,
  FlightCargoManifest,
} from './cargo-manifest.model';
import { LoadUnitKind } from './cargo-packing';
import {
  Commodity,
  DangerousGoodsProfile,
  HazardClass,
  SpecialHandlingCode,
  TemperatureSolution,
} from './commodity.model';
import { ULD_SPECS, UldType } from './uld';
import { UldBaseCode } from './uld-code.model';
import { findCommodityById } from '../data/cargo-commodities';
import { ColdChainRisk } from './cold-chain';
import { drillFor } from './emergency-drill';
import {
  DANGEROUS_GOODS_STATEMENT,
  HoldCondition,
  NO_DANGEROUS_GOODS_STATEMENT,
  NotocColdChain,
  NotocDangerousGoods,
  NotocDocument,
  NotocHeader,
  NotocLoadSummary,
  NotocRadioactive,
  NotocSpecialLoad,
  RadioactiveCategory,
  SpecialLoadRemark,
} from './notoc.model';
import { dryIceKgOf } from './segregation.policy';
import { NotifiablePassenger, specialPassengersOf } from './notoc-passengers';
import { stableUnit } from './stable-random';

export const NOTIFIABLE_HANDLING_CODES: SpecialHandlingCode[] = [
  SpecialHandlingCode.LiveAnimals,
  SpecialHandlingCode.LiveAnimalsHold,
  SpecialHandlingCode.HatchingEggs,
  SpecialHandlingCode.HumanRemains,
  SpecialHandlingCode.LivingOrgans,
  SpecialHandlingCode.Valuable,
  SpecialHandlingCode.Pharmaceuticals,
  SpecialHandlingCode.Heavy,
  SpecialHandlingCode.Outsized,
  SpecialHandlingCode.MunitionsOfWar,
  SpecialHandlingCode.SportingWeapons,
  SpecialHandlingCode.DiplomaticMail,
  SpecialHandlingCode.Wet,
  SpecialHandlingCode.Obnoxious,
  SpecialHandlingCode.Perishable,
  SpecialHandlingCode.PerishableMeat,
  SpecialHandlingCode.PerishableSeafood,
  SpecialHandlingCode.PerishableFlowers,
  SpecialHandlingCode.PerishableProduce,
  SpecialHandlingCode.Cool,
  SpecialHandlingCode.Frozen,
  SpecialHandlingCode.ControlledRoomTemperature,
  SpecialHandlingCode.ActiveTemperatureControl,
];

export const DANGEROUS_GOODS_IMP_CODES: SpecialHandlingCode[] = [
  SpecialHandlingCode.ExplosivesOther,
  SpecialHandlingCode.ExplosivesDivision14S,
  SpecialHandlingCode.ExplosivesDivision14G,
  SpecialHandlingCode.FlammableGas,
  SpecialHandlingCode.NonFlammableGas,
  SpecialHandlingCode.ToxicGas,
  SpecialHandlingCode.FlammableLiquid,
  SpecialHandlingCode.FlammableSolid,
  SpecialHandlingCode.SpontaneouslyCombustible,
  SpecialHandlingCode.DangerousWhenWet,
  SpecialHandlingCode.Oxidizer,
  SpecialHandlingCode.OrganicPeroxide,
  SpecialHandlingCode.Toxic,
  SpecialHandlingCode.InfectiousSubstance,
  SpecialHandlingCode.RadioactiveWhite,
  SpecialHandlingCode.RadioactiveYellow,
  SpecialHandlingCode.Corrosive,
  SpecialHandlingCode.MiscellaneousDangerousGoods,
  SpecialHandlingCode.LithiumIon,
  SpecialHandlingCode.LithiumMetal,
  SpecialHandlingCode.LithiumIonInEquipment,
  SpecialHandlingCode.LithiumMetalInEquipment,
  SpecialHandlingCode.DryIce,
  SpecialHandlingCode.Magnetised,
];

const DRY_ICE_UN_NUMBER = '1845';
const DRY_ICE_ERC_CODE = '9A';
const YELLOW_II_SHARE = 0.6;

const SIZED_HANDLING_CODES: SpecialHandlingCode[] = [
  SpecialHandlingCode.Heavy,
  SpecialHandlingCode.Outsized,
];

type PlacedShipment = {
  shipment: CargoShipmentEntry;
  unit: CargoUnitEntry;
};

export type NotifiableLoadSummary = {
  dangerousGoodsCount: number;
  cargoAircraftOnlyCount: number;
  specialLoadCount: number;
  worstColdChainRisk: ColdChainRisk | null;
};

const RISK_ORDER = [
  ColdChainRisk.Low,
  ColdChainRisk.Elevated,
  ColdChainRisk.High,
];

export function notifiableLoadSummary(
  manifest: FlightCargoManifest,
): NotifiableLoadSummary {
  const document = composeNotoc(manifest, '');

  return {
    dangerousGoodsCount: document.dangerousGoods.length,
    cargoAircraftOnlyCount: document.dangerousGoods.filter(
      (entry) => entry.cargoAircraftOnly,
    ).length,
    specialLoadCount: document.specialLoads.length,
    worstColdChainRisk: worstRiskOf(
      document.coldChain.map((entry) => entry.risk),
    ),
  };
}

function worstRiskOf(risks: ColdChainRisk[]): ColdChainRisk | null {
  return risks.length === 0
    ? null
    : risks.reduce((worst, risk) =>
        RISK_ORDER.indexOf(risk) > RISK_ORDER.indexOf(worst) ? risk : worst,
      );
}

export function composeNotoc(
  manifest: FlightCargoManifest,
  unloadingAirport: string,
  header: NotocHeader | null = null,
  passengers: NotifiablePassenger[] = [],
): NotocDocument {
  const placed = loadedShipmentsOf(manifest);
  const dangerousGoods = [
    ...placed
      .filter(({ shipment }) => isListedDangerousGoods(shipment))
      .map(({ shipment, unit }) =>
        dangerousGoodsEntry(shipment, unit, unloadingAirport),
      )
      .filter((entry): entry is NotocDangerousGoods => entry !== null),
    ...dryIceEntries(placed, unloadingAirport),
  ];

  return {
    header,
    specialPassengers: specialPassengersOf(passengers, manifest),
    statement:
      dangerousGoods.length === 0
        ? NO_DANGEROUS_GOODS_STATEMENT
        : DANGEROUS_GOODS_STATEMENT,
    dangerousGoods,
    specialLoads: placed
      .filter(({ shipment }) => shipment.dangerousGoods === null)
      .map(({ shipment, unit }) =>
        specialLoadEntry(shipment, unit, unloadingAirport),
      )
      .filter((entry): entry is NotocSpecialLoad => entry !== null),
    coldChain: placed
      .map(({ shipment }) => coldChainEntry(shipment))
      .filter((entry): entry is NotocColdChain => entry !== null),
    summary: summaryOf(manifest, placed),
  };
}

function loadedShipmentsOf(manifest: FlightCargoManifest): PlacedShipment[] {
  return manifest.units.flatMap((unit) =>
    unit.shipments
      .filter((shipment) => shipment.status === CargoShipmentStatusName.Loaded)
      .map((shipment) => ({ shipment, unit })),
  );
}

function isListedDangerousGoods(shipment: CargoShipmentEntry): boolean {
  const profile = shipment.dangerousGoods;

  if (!profile || profile.unNumber === DRY_ICE_UN_NUMBER) {
    return false;
  }

  return !(
    profile.notocExempt ??
    catalogueProfileOf(shipment)?.notocExempt ??
    false
  );
}

function catalogueProfileOf(
  shipment: CargoShipmentEntry,
): DangerousGoodsProfile | undefined {
  return findCommodityById(shipment.commodity)?.dangerousGoods;
}

function dangerousGoodsEntry(
  shipment: CargoShipmentEntry,
  unit: CargoUnitEntry,
  unloadingAirport: string,
): NotocDangerousGoods | null {
  const profile = shipment.dangerousGoods;
  const drill = profile ? drillFor(profile.ercCode) : null;

  if (!profile || !drill) {
    return null;
  }

  return {
    awb: shipment.awb,
    properShippingName: profile.properShippingName,
    unNumber: profile.unNumber,
    hazardClass: profile.hazardClass,
    classOrDivision:
      profile.division ??
      catalogueProfileOf(shipment)?.division ??
      profile.hazardClass,
    subsidiaryRisk: profile.subsidiaryRisk,
    packingGroup: profile.packingGroup,
    packages: shipment.pieces,
    netPerPackage: profile.netPerPackage,
    quantityIsTotal: false,
    radioactive: radioactiveOf(shipment, profile),
    impCode: impCodeOf(shipment.shc),
    uldId: unit.uldCode,
    position: unit.positionDesignator,
    compartment: unit.compartment,
    unloadingAirport,
    cargoAircraftOnly: profile.cargoAircraftOnly,
    drill,
  };
}

function impCodeOf(codes: string[]): SpecialHandlingCode | null {
  return (
    (codes.find((code) =>
      DANGEROUS_GOODS_IMP_CODES.includes(code as SpecialHandlingCode),
    ) as SpecialHandlingCode | undefined) ?? null
  );
}

function radioactiveOf(
  shipment: CargoShipmentEntry,
  profile: DangerousGoodsProfile,
): NotocRadioactive | null {
  if (profile.hazardClass !== HazardClass.Radioactive) {
    return null;
  }

  if (shipment.shc.includes(SpecialHandlingCode.RadioactiveWhite)) {
    return { category: RadioactiveCategory.IWhite, transportIndex: null };
  }

  const roll = stableUnit(shipment.awb);

  if (roll < YELLOW_II_SHARE) {
    return {
      category: RadioactiveCategory.IIYellow,
      transportIndex: round1(0.1 + (roll / YELLOW_II_SHARE) * 0.9),
    };
  }

  return {
    category: RadioactiveCategory.IIIYellow,
    transportIndex: round1(
      1.1 + ((roll - YELLOW_II_SHARE) / (1 - YELLOW_II_SHARE)) * 1.9,
    ),
  };
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

type DryIceLoad = {
  compartment: number | null;
  packages: number;
  kg: number;
};

function dryIceEntries(
  placed: PlacedShipment[],
  unloadingAirport: string,
): NotocDangerousGoods[] {
  const drill = drillFor(DRY_ICE_ERC_CODE);
  const byCompartment = new Map<number | null, DryIceLoad>();

  for (const { shipment, unit } of placed) {
    const kg = dryIceKgOf(
      shipment.shc as SpecialHandlingCode[],
      shipment.grossKg,
      {
        pieces: shipment.pieces,
        kgPerPiece: findCommodityById(shipment.commodity)?.temperature
          ?.dryIceKgPerPiece,
      },
    );

    if (kg === 0) {
      continue;
    }

    const load = byCompartment.get(unit.compartment) ?? {
      compartment: unit.compartment,
      packages: 0,
      kg: 0,
    };
    load.packages += shipment.pieces;
    load.kg += kg;
    byCompartment.set(unit.compartment, load);
  }

  if (!drill) {
    return [];
  }

  return [...byCompartment.values()]
    .sort(
      (one, other) =>
        (one.compartment ?? Number.MAX_SAFE_INTEGER) -
        (other.compartment ?? Number.MAX_SAFE_INTEGER),
    )
    .map((load) => ({
      awb: null,
      properShippingName: 'Dry ice',
      unNumber: DRY_ICE_UN_NUMBER,
      hazardClass: HazardClass.Miscellaneous,
      classOrDivision: HazardClass.Miscellaneous,
      subsidiaryRisk: null,
      packingGroup: null,
      packages: load.packages,
      netPerPackage: `${Math.round(load.kg)} kg`,
      quantityIsTotal: true,
      radioactive: null,
      impCode: SpecialHandlingCode.DryIce,
      uldId: null,
      position: null,
      compartment: load.compartment,
      unloadingAirport,
      cargoAircraftOnly: false,
      drill,
    }));
}

function specialLoadEntry(
  shipment: CargoShipmentEntry,
  unit: CargoUnitEntry,
  unloadingAirport: string,
): NotocSpecialLoad | null {
  const notifiable = shipment.shc.filter((code) =>
    NOTIFIABLE_HANDLING_CODES.includes(code as SpecialHandlingCode),
  );

  if (notifiable.length === 0) {
    return null;
  }

  const sized = notifiable.some((code) =>
    SIZED_HANDLING_CODES.includes(code as SpecialHandlingCode),
  );

  const commodity = findCommodityById(shipment.commodity);
  const heaviestPiece = sized ? heaviestPieceOf(shipment, commodity) : null;

  return {
    awb: shipment.awb,
    description: shipment.description,
    pieces: shipment.pieces,
    shc: notifiable,
    grossKg: shipment.grossKg,
    supplementaryInformation: supplementaryInformationOf(
      shipment,
      commodity,
      heaviestPiece,
    ),
    uldId: unit.uldCode,
    position: unit.positionDesignator,
    compartment: unit.compartment,
    unloadingAirport,
    heaviestPiece,
  };
}

function heaviestPieceOf(
  shipment: CargoShipmentEntry,
  commodity: Commodity | undefined,
): NotocSpecialLoad['heaviestPiece'] {
  const largest = commodity?.heaviestPiece;

  if (!largest) {
    return null;
  }

  const perPieceKg = Math.ceil(shipment.grossKg / Math.max(1, shipment.pieces));

  return { ...largest, kg: Math.min(largest.kg, perPieceKg) };
}

function supplementaryInformationOf(
  shipment: CargoShipmentEntry,
  commodity: Commodity | undefined,
  heaviestPiece: NotocSpecialLoad['heaviestPiece'],
): string[] {
  const lines: string[] = [];

  if (commodity?.notocRemark) {
    lines.push(commodity.notocRemark);
  } else if (shipment.shc.includes(SpecialHandlingCode.Valuable)) {
    lines.push(SpecialLoadRemark.SecuredStowage);
  }

  if (commodity?.temperature) {
    const { minC, maxC } = commodity.temperature;
    lines.push(`KEEP AT ${signed(minC)} TO ${signed(maxC)} °C`);
  }

  if (shipment.coldChain?.solution === TemperatureSolution.Active) {
    lines.push(SpecialLoadRemark.ActiveContainer);
  } else if (shipment.coldChain?.solution === TemperatureSolution.DryIce) {
    lines.push(SpecialLoadRemark.PackedInDryIce);
  }

  const hold = holdConditionOf(commodity);

  if (hold) {
    lines.push(hold);
  }

  if (heaviestPiece) {
    const { kg, lengthCm, widthCm, heightCm } = heaviestPiece;
    lines.push(
      `HEAVIEST PIECE ${kg} KG, ${lengthCm}x${widthCm}x${heightCm} CM`,
    );
  }

  return lines;
}

function holdConditionOf(
  commodity: Commodity | undefined,
): HoldCondition | null {
  const heated = commodity?.compartment.requiresHeated ?? false;
  const ventilated = commodity?.compartment.requiresVentilated ?? false;

  if (heated && ventilated) {
    return HoldCondition.HeatedAndVentilated;
  }

  if (heated) {
    return HoldCondition.Heated;
  }

  return ventilated ? HoldCondition.Ventilated : null;
}

function signed(celsius: number): string {
  return celsius > 0 ? `+${celsius}` : `${celsius}`;
}

function coldChainEntry(shipment: CargoShipmentEntry): NotocColdChain | null {
  const assessment = shipment.coldChain;

  if (!assessment) {
    return null;
  }

  return {
    awb: shipment.awb,
    description: shipment.description,
    regime: assessment.regime,
    risk: assessment.risk,
    marginHours: assessment.marginHours,
    explanation: assessment.explanation,
    advisory: true,
  };
}

function summaryOf(
  manifest: FlightCargoManifest,
  placed: PlacedShipment[],
): NotocLoadSummary {
  const carrying = manifest.units.filter(
    (unit) => unit.tareKg + unit.grossKg > 0,
  );

  return {
    compartments: manifest.compartmentLoad,
    containerCount: carrying.filter((unit) => baseOf(unit) === UldBaseCode.Ld3)
      .length,
    palletCount: carrying.filter((unit) => {
      const base = baseOf(unit);

      return base === UldBaseCode.Pallet88 || base === UldBaseCode.Pallet96;
    }).length,
    looseLotCount: carrying.filter((unit) => unit.kind === LoadUnitKind.BulkLot)
      .length,
    cargoKg: manifest.cargoKg,
    baggageKg: manifest.baggageKg,
    deadloadKg: manifest.cargoKg + manifest.baggageKg,
    beyondCount: placed.filter(
      ({ shipment }) => shipment.onwardCarrier !== null,
    ).length,
    tightestConnectionMinutes: tightestConnectionOf(placed),
  };
}

function baseOf(unit: CargoUnitEntry): UldBaseCode | null {
  return unit.uldType ? ULD_SPECS[unit.uldType as UldType].base : null;
}

function tightestConnectionOf(placed: PlacedShipment[]): number | null {
  const connections = placed
    .map(({ shipment }) => shipment.connectionMinutes)
    .filter((minutes): minutes is number => minutes !== null);

  return connections.length === 0 ? null : Math.min(...connections);
}

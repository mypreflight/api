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
  ExplosiveDivision,
  HandlingRemark,
  HazardClass,
  SpecialHandlingCode,
} from './commodity.model';
import { ULD_SPECS, UldType } from './uld';
import { UldBaseCode } from './uld-code.model';
import { findCommodityById } from '../data/cargo-commodities';
import { ColdChainRisk } from './cold-chain';
import { drillFor, EmergencyDrill } from './emergency-drill';
import {
  DANGEROUS_GOODS_STATEMENT,
  HoldCondition,
  NO_DANGEROUS_GOODS_STATEMENT,
  NotocColdChain,
  NotocDangerousGoods,
  NotocDocument,
  NotocDryIce,
  NotocHeader,
  NotocLoadSummary,
  NotocRadioactive,
  NotocSpecialLoad,
  RadioactiveCategory,
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

const IMP_CODE_BY_CLASS: Record<
  ExplosiveDivision | HazardClass,
  SpecialHandlingCode
> = {
  [ExplosiveDivision.Division12E]: SpecialHandlingCode.ExplosivesOther,
  [ExplosiveDivision.Division14G]: SpecialHandlingCode.ExplosivesDivision14G,
  [ExplosiveDivision.Division14S]: SpecialHandlingCode.ExplosivesDivision14S,
  [HazardClass.Explosives]: SpecialHandlingCode.ExplosivesOther,
  [HazardClass.FlammableGas]: SpecialHandlingCode.FlammableGas,
  [HazardClass.NonFlammableGas]: SpecialHandlingCode.NonFlammableGas,
  [HazardClass.ToxicGas]: SpecialHandlingCode.ToxicGas,
  [HazardClass.FlammableLiquid]: SpecialHandlingCode.FlammableLiquid,
  [HazardClass.FlammableSolid]: SpecialHandlingCode.FlammableSolid,
  [HazardClass.SpontaneouslyCombustible]:
    SpecialHandlingCode.SpontaneouslyCombustible,
  [HazardClass.DangerousWhenWet]: SpecialHandlingCode.DangerousWhenWet,
  [HazardClass.Oxidizer]: SpecialHandlingCode.Oxidizer,
  [HazardClass.OrganicPeroxide]: SpecialHandlingCode.OrganicPeroxide,
  [HazardClass.ToxicSubstance]: SpecialHandlingCode.Toxic,
  [HazardClass.InfectiousSubstance]: SpecialHandlingCode.InfectiousSubstance,
  [HazardClass.Radioactive]: SpecialHandlingCode.RadioactiveYellow,
  [HazardClass.Corrosive]: SpecialHandlingCode.Corrosive,
  [HazardClass.Miscellaneous]: SpecialHandlingCode.MiscellaneousDangerousGoods,
};

type PlacedShipment = {
  shipment: CargoShipmentEntry;
  unit: CargoUnitEntry;
};

type ListedDangerousGoods = PlacedShipment & {
  profile: DangerousGoodsProfile;
  drill: EmergencyDrill;
};

type NotifiableSpecialLoad = PlacedShipment & {
  codes: SpecialHandlingCode[];
};

type DryIceLoad = {
  compartment: number | null;
  packages: number;
  kg: number;
};

type NotifiableLoads = {
  dangerousGoods: ListedDangerousGoods[];
  dryIce: DryIceLoad[];
  specialLoads: NotifiableSpecialLoad[];
  coldChain: NotocColdChain[];
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
  const loads = notifiableLoadsOf(loadedShipmentsOf(manifest));

  return {
    dangerousGoodsCount: loads.dangerousGoods.length + loads.dryIce.length,
    cargoAircraftOnlyCount: loads.dangerousGoods.filter(
      ({ profile }) => profile.cargoAircraftOnly,
    ).length,
    specialLoadCount: loads.specialLoads.length,
    worstColdChainRisk: worstRiskOf(loads.coldChain.map((entry) => entry.risk)),
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
  header: NotocHeader,
  passengers: NotifiablePassenger[],
): NotocDocument {
  const placed = loadedShipmentsOf(manifest);
  const loads = notifiableLoadsOf(placed);
  const dangerousGoods = loads.dangerousGoods.map((entry) =>
    dangerousGoodsEntry(entry, unloadingAirport),
  );
  const dryIce = dryIceEntries(loads.dryIce, unloadingAirport);

  return {
    header,
    specialPassengers: specialPassengersOf(passengers, manifest),
    statement:
      dangerousGoods.length + dryIce.length === 0
        ? NO_DANGEROUS_GOODS_STATEMENT
        : DANGEROUS_GOODS_STATEMENT,
    dangerousGoods,
    dryIce,
    specialLoads: loads.specialLoads.map((entry) =>
      specialLoadEntry(entry, unloadingAirport),
    ),
    coldChain: loads.coldChain,
    summary: summaryOf(manifest, placed),
  };
}

function notifiableLoadsOf(placed: PlacedShipment[]): NotifiableLoads {
  return {
    dangerousGoods: placed.flatMap((entry) => {
      const listed = listedDangerousGoodsOf(entry);

      return listed ? [listed] : [];
    }),
    dryIce: dryIceLoadsOf(placed),
    specialLoads: placed.flatMap((entry) => {
      const notifiable = notifiableSpecialLoadOf(entry);

      return notifiable ? [notifiable] : [];
    }),
    coldChain: placed
      .map(({ shipment }) => coldChainEntry(shipment))
      .filter((entry): entry is NotocColdChain => entry !== null),
  };
}

function loadedShipmentsOf(manifest: FlightCargoManifest): PlacedShipment[] {
  return manifest.units.flatMap((unit) =>
    unit.shipments
      .filter((shipment) => shipment.status === CargoShipmentStatusName.Loaded)
      .map((shipment) => ({ shipment, unit })),
  );
}

function listedDangerousGoodsOf(
  entry: PlacedShipment,
): ListedDangerousGoods | null {
  const profile = entry.shipment.dangerousGoods;

  if (!profile || !isListedDangerousGoods(entry.shipment)) {
    return null;
  }

  const drill = drillFor(profile.ercCode);

  return drill ? { ...entry, profile, drill } : null;
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

function notifiableSpecialLoadOf(
  entry: PlacedShipment,
): NotifiableSpecialLoad | null {
  if (entry.shipment.dangerousGoods !== null) {
    return null;
  }

  const codes = entry.shipment.shc.filter((code): code is SpecialHandlingCode =>
    NOTIFIABLE_HANDLING_CODES.includes(code as SpecialHandlingCode),
  );

  return codes.length === 0 ? null : { ...entry, codes };
}

function catalogueProfileOf(
  shipment: CargoShipmentEntry,
): DangerousGoodsProfile | undefined {
  return findCommodityById(shipment.commodity)?.dangerousGoods;
}

function dangerousGoodsEntry(
  { shipment, unit, profile, drill }: ListedDangerousGoods,
  unloadingAirport: string,
): NotocDangerousGoods {
  const classOrDivision = classOrDivisionOf(shipment, profile);

  return {
    awb: shipment.awb,
    properShippingName: profile.properShippingName,
    unNumber: profile.unNumber,
    hazardClass: profile.hazardClass,
    classOrDivision,
    subsidiaryRisk: profile.subsidiaryRisk,
    packingGroup: profile.packingGroup,
    packages: shipment.pieces,
    netPerPackage: profile.netPerPackage,
    radioactive: radioactiveOf(shipment, profile),
    impCode: impCodeOf(shipment.shc, classOrDivision),
    uldId: unit.uldCode,
    position: unit.positionDesignator,
    compartment: unit.compartment,
    unloadingAirport,
    cargoAircraftOnly: profile.cargoAircraftOnly,
    drill,
  };
}

function classOrDivisionOf(
  shipment: CargoShipmentEntry,
  profile: DangerousGoodsProfile,
): ExplosiveDivision | HazardClass {
  return (
    profile.division ??
    catalogueProfileOf(shipment)?.division ??
    profile.hazardClass
  );
}

function impCodeOf(
  codes: string[],
  classOrDivision: ExplosiveDivision | HazardClass,
): SpecialHandlingCode {
  const listed = codes.find((code): code is SpecialHandlingCode =>
    DANGEROUS_GOODS_IMP_CODES.includes(code as SpecialHandlingCode),
  );

  return listed ?? IMP_CODE_BY_CLASS[classOrDivision];
}

function radioactiveOf(
  shipment: CargoShipmentEntry,
  profile: DangerousGoodsProfile,
): NotocRadioactive | null {
  if (profile.hazardClass !== HazardClass.Radioactive) {
    return null;
  }

  if (shipment.shc.includes(SpecialHandlingCode.RadioactiveWhite)) {
    return { category: RadioactiveCategory.IWhite, transportIndex: 0 };
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

function dryIceLoadsOf(placed: PlacedShipment[]): DryIceLoad[] {
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

  return [...byCompartment.values()].sort(
    (one, other) =>
      (one.compartment ?? Number.MAX_SAFE_INTEGER) -
      (other.compartment ?? Number.MAX_SAFE_INTEGER),
  );
}

function dryIceEntries(
  loads: DryIceLoad[],
  unloadingAirport: string,
): NotocDryIce[] {
  const drill = drillFor(DRY_ICE_ERC_CODE);

  if (!drill) {
    return [];
  }

  return loads.map((load) => ({
    compartment: load.compartment,
    packages: load.packages,
    kg: Math.round(load.kg),
    unloadingAirport,
    drill,
  }));
}

function specialLoadEntry(
  { shipment, unit, codes }: NotifiableSpecialLoad,
  unloadingAirport: string,
): NotocSpecialLoad {
  const commodity = findCommodityById(shipment.commodity);
  const sized = codes.some((code) => SIZED_HANDLING_CODES.includes(code));
  const temperature = commodity?.temperature;

  return {
    awb: shipment.awb,
    description: shipment.description,
    pieces: shipment.pieces,
    shc: codes,
    grossKg: shipment.grossKg,
    handlingRemark: handlingRemarkOf(shipment, commodity),
    temperature: temperature
      ? { minC: temperature.minC, maxC: temperature.maxC }
      : null,
    temperatureSolution: shipment.coldChain?.solution ?? null,
    holdCondition: holdConditionOf(commodity),
    uldId: unit.uldCode,
    position: unit.positionDesignator,
    compartment: unit.compartment,
    unloadingAirport,
    heaviestPiece: sized ? heaviestPieceOf(shipment, commodity) : null,
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

function handlingRemarkOf(
  shipment: CargoShipmentEntry,
  commodity: Commodity | undefined,
): HandlingRemark | null {
  if (commodity?.notocRemark) {
    return commodity.notocRemark;
  }

  return shipment.shc.includes(SpecialHandlingCode.Valuable)
    ? HandlingRemark.SecuredStowage
    : null;
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

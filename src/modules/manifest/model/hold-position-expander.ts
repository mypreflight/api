import {
  CargoDeck,
  CargoDoorSide,
  CompartmentLoading,
  HoldCompartment,
  HoldCompartmentName,
  HoldPosition,
  HoldPositionSide,
} from './hold-layout.model';
import { UldBaseCode, UldContourCode } from './uld-code.model';

export type HoldPositionTemplate = {
  rows: number;
  sides: HoldPositionSide[];
  acceptedBases: UldBaseCode[];
  acceptedContours: UldContourCode[];
  maxWeightKg: number;
};

export type HoldPositionOverride = {
  row: number;
  side: HoldPositionSide;
  acceptedBases?: UldBaseCode[];
  acceptedContours?: UldContourCode[];
  maxWeightKg?: number;
};

export type SourceCompartment = {
  number: number;
  name: HoldCompartmentName;
  loading: CompartmentLoading;
  maxWeightKg: number;
  volumeM3: number;
  heated: boolean;
  ventilated: boolean;
  doorSide: CargoDoorSide;
  positionTemplate?: HoldPositionTemplate;
  positionOverrides?: HoldPositionOverride[];
};

export type SourceDeck = {
  deck: CargoDeck;
  compartments: SourceCompartment[];
};

export type SourceVariant = {
  id: string;
  isDefault: boolean;
  decks: SourceDeck[];
};

export type SourceHoldLayout = {
  type: string;
  variants: SourceVariant[];
};

export function expandPositions(
  compartment: SourceCompartment,
  deck: CargoDeck,
): HoldPosition[] {
  const template = compartment.positionTemplate;

  if (!template) {
    return [];
  }

  const overrides = compartment.positionOverrides ?? [];
  const positions: HoldPosition[] = [];

  for (let row = 1; row <= template.rows; row++) {
    for (const side of template.sides) {
      const override = overrides.find(
        (candidate) => candidate.row === row && candidate.side === side,
      );
      const position = { deck, compartment: compartment.number, row, side };

      positions.push({
        ...position,
        acceptedBases: override?.acceptedBases ?? template.acceptedBases,
        acceptedContours:
          override?.acceptedContours ?? template.acceptedContours,
        maxWeightKg: override?.maxWeightKg ?? template.maxWeightKg,
      });
    }
  }

  return positions;
}

export function expandCompartment(
  compartment: SourceCompartment,
  deck: CargoDeck,
): HoldCompartment {
  return {
    number: compartment.number,
    name: compartment.name,
    loading: compartment.loading,
    maxWeightKg: compartment.maxWeightKg,
    volumeM3: compartment.volumeM3,
    heated: compartment.heated,
    ventilated: compartment.ventilated,
    doorSide: compartment.doorSide,
    positions: expandPositions(compartment, deck),
  };
}

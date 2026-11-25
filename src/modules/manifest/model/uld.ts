import { HoldPosition } from './hold-layout.model';
import { UldBaseCode, UldContourCode } from './uld-code.model';
import { UldCapacity } from './cargo-volume';
import { HeaviestPiece } from './commodity.model';

export enum UldType {
  Ld3 = 'AKE',
  Ld3Reduced = 'AKH',
  Ld3Active = 'RKN',
  Pallet96 = 'PMC',
  Pallet88 = 'PAG',
  MainDeck = 'AMA',
  PalletActive = 'RAP',
}

export type UldSpec = {
  type: UldType;
  base: UldBaseCode;
  contour: UldContourCode;
  tareKg: number;
  maxGrossKg: number;
  volumeM3: number;
  active: boolean;
  pieceLimit: PieceLimit;
};

export type PieceLimit = {
  lengthCm: number;
  widthCm: number;
  heightCm: number;
};

export const BULK_DOOR_LIMIT: PieceLimit = {
  lengthCm: 300,
  widthCm: 114,
  heightCm: 91,
};

export const ULD_SPECS: Record<UldType, UldSpec> = {
  [UldType.Ld3]: {
    type: UldType.Ld3,
    base: UldBaseCode.Ld3,
    contour: UldContourCode.Ld3FullHeight,
    tareKg: 82,
    maxGrossKg: 1588,
    volumeM3: 4.3,
    active: false,
    pieceLimit: { lengthCm: 150, widthCm: 140, heightCm: 155 },
  },
  [UldType.Ld3Reduced]: {
    type: UldType.Ld3Reduced,
    base: UldBaseCode.Ld3,
    contour: UldContourCode.Ld3ReducedHeight,
    tareKg: 75,
    maxGrossKg: 1588,
    volumeM3: 3.4,
    active: false,
    pieceLimit: { lengthCm: 150, widthCm: 140, heightCm: 105 },
  },
  [UldType.Ld3Active]: {
    type: UldType.Ld3Active,
    base: UldBaseCode.Ld3,
    contour: UldContourCode.Ld3Active,
    tareKg: 250,
    maxGrossKg: 1588,
    volumeM3: 1.5,
    active: true,
    pieceLimit: { lengthCm: 121, widthCm: 85, heightCm: 113 },
  },
  [UldType.Pallet96]: {
    type: UldType.Pallet96,
    base: UldBaseCode.Pallet96,
    contour: UldContourCode.Pallet96Contoured,
    tareKg: 120,
    maxGrossKg: 6800,
    volumeM3: 11,
    active: false,
    pieceLimit: { lengthCm: 310, widthCm: 240, heightCm: 160 },
  },
  [UldType.Pallet88]: {
    type: UldType.Pallet88,
    base: UldBaseCode.Pallet88,
    contour: UldContourCode.Pallet88Contoured,
    tareKg: 105,
    maxGrossKg: 6800,
    volumeM3: 10,
    active: false,
    pieceLimit: { lengthCm: 310, widthCm: 215, heightCm: 160 },
  },
  [UldType.MainDeck]: {
    type: UldType.MainDeck,
    base: UldBaseCode.Pallet96,
    contour: UldContourCode.MainDeckContainer,
    tareKg: 300,
    maxGrossKg: 6804,
    volumeM3: 17.6,
    active: false,
    pieceLimit: { lengthCm: 310, widthCm: 235, heightCm: 235 },
  },
  [UldType.PalletActive]: {
    type: UldType.PalletActive,
    base: UldBaseCode.Pallet88,
    contour: UldContourCode.Pallet96Active,
    tareKg: 570,
    maxGrossKg: 4500,
    volumeM3: 6,
    active: true,
    pieceLimit: { lengthCm: 297, widthCm: 204, heightCm: 155 },
  },
};

const SERIAL_LENGTH = 5;

export function uldSpecsFor(position: HoldPosition): UldSpec[] {
  return Object.values(ULD_SPECS).filter(
    (spec) =>
      position.acceptedBases.includes(spec.base) &&
      position.acceptedContours.includes(spec.contour),
  );
}

export function fits(spec: UldSpec, position: HoldPosition): boolean {
  return (
    position.acceptedBases.includes(spec.base) &&
    position.acceptedContours.includes(spec.contour)
  );
}

export function pieceFits(
  piece: HeaviestPiece | undefined,
  limit: PieceLimit,
  tilt = false,
): boolean {
  if (!piece) {
    return true;
  }

  if (tilt) {
    const sides = descending([piece.lengthCm, piece.widthCm, piece.heightCm]);
    const room = descending([limit.lengthCm, limit.widthCm, limit.heightCm]);

    return sides.every((side, index) => side <= room[index]);
  }

  const [long, short] = descending([piece.lengthCm, piece.widthCm]);
  const [roomLong, roomShort] = descending([limit.lengthCm, limit.widthCm]);

  return (
    piece.heightCm <= limit.heightCm && long <= roomLong && short <= roomShort
  );
}

function descending(values: number[]): number[] {
  return [...values].sort((one, other) => other - one);
}

export function capacityAt(spec: UldSpec, position: HoldPosition): UldCapacity {
  return {
    volumeM3: spec.volumeM3,
    maxGrossKg: Math.min(spec.maxGrossKg, position.maxWeightKg) - spec.tareKg,
  };
}

export function generateUldSerial(roll: number): string {
  return String(Math.floor(roll * 10 ** SERIAL_LENGTH)).padStart(
    SERIAL_LENGTH,
    '0',
  );
}

export function formatUldCode(
  type: UldType,
  serial: string,
  owner: string,
): string {
  return `${type}${serial}${owner}`;
}

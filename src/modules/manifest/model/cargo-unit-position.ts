import {
  CargoDeck as PrismaCargoDeck,
  HoldPositionSide as PrismaHoldPositionSide,
} from 'prisma/client/client';
import {
  CargoDeck,
  HoldPositionSide,
  LoadingPosition,
} from './hold-layout.model';

export type PositionColumns = {
  deck: PrismaCargoDeck | null;
  compartment: number | null;
  positionRow: number | null;
  positionSide: PrismaHoldPositionSide | null;
};

export function positionColumnsOf(position: LoadingPosition | null): {
  positionRow: number | null;
  positionSide: PrismaHoldPositionSide | null;
} {
  return position === null
    ? { positionRow: null, positionSide: null }
    : {
        positionRow: position.row,
        positionSide: position.side as unknown as PrismaHoldPositionSide,
      };
}

export function loadingPositionOfRow(
  row: PositionColumns,
): LoadingPosition | null {
  if (
    row.positionRow === null ||
    row.positionSide === null ||
    row.deck === null ||
    row.compartment === null
  ) {
    return null;
  }

  return {
    deck: row.deck as unknown as CargoDeck,
    compartment: row.compartment,
    row: row.positionRow,
    side: row.positionSide as unknown as HoldPositionSide,
  };
}

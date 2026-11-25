import {
  CargoDeck,
  HoldPositionSide,
  LoadingPosition,
} from './hold-layout.model';

const SIDE_SUFFIX: Record<HoldPositionSide, string> = {
  [HoldPositionSide.Left]: 'L',
  [HoldPositionSide.Right]: 'R',
  [HoldPositionSide.Full]: 'P',
};

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function designatorOf({
  deck,
  compartment,
  row,
  side,
}: LoadingPosition): string {
  const ordinal =
    deck === CargoDeck.Main ? LETTERS[row - 1] : `${compartment}${row}`;

  return `${ordinal}${SIDE_SUFFIX[side]}`;
}

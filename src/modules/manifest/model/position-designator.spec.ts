import { CargoDeck, HoldPositionSide } from './hold-layout.model';
import { designatorOf } from './position-designator';

describe('position designator', () => {
  it('writes a lower deck position as compartment, row and side', () => {
    expect(
      designatorOf({
        deck: CargoDeck.Lower,
        compartment: 1,
        row: 2,
        side: HoldPositionSide.Right,
      }),
    ).toBe('12R');
  });

  it('writes a full-width position with a pallet suffix', () => {
    expect(
      designatorOf({
        deck: CargoDeck.Lower,
        compartment: 4,
        row: 3,
        side: HoldPositionSide.Full,
      }),
    ).toBe('43P');
  });

  it('writes a main deck row as a letter', () => {
    expect(
      designatorOf({
        deck: CargoDeck.Main,
        compartment: 6,
        row: 15,
        side: HoldPositionSide.Left,
      }),
    ).toBe('OL');
  });
});

import {
  expandCompartment,
  expandPositions,
  SourceCompartment,
} from './hold-position-expander';
import {
  CargoDeck,
  CargoDoorSide,
  CompartmentLoading,
  HoldCompartmentName,
  HoldPositionSide,
} from './hold-layout.model';
import { UldBaseCode, UldContourCode } from './uld-code.model';

function compartment(
  overrides: Partial<SourceCompartment> = {},
): SourceCompartment {
  return {
    number: 1,
    name: HoldCompartmentName.Forward,
    loading: CompartmentLoading.Uld,
    maxWeightKg: 6352,
    volumeM3: 17.2,
    heated: false,
    ventilated: false,
    doorSide: CargoDoorSide.Right,
    positionTemplate: {
      rows: 2,
      sides: [HoldPositionSide.Left, HoldPositionSide.Right],
      acceptedBases: [UldBaseCode.Ld3],
      acceptedContours: [
        UldContourCode.Ld3FullHeight,
        UldContourCode.Ld3ReducedHeight,
      ],
      maxWeightKg: 1588,
    },
    ...overrides,
  };
}

describe('hold position expander', () => {
  it('numbers a paired run by row, left before right', () => {
    const positions = expandPositions(compartment(), CargoDeck.Lower);

    expect(
      positions.map(({ deck, compartment, row, side }) => ({
        deck,
        compartment,
        row,
        side,
      })),
    ).toEqual([
      {
        deck: CargoDeck.Lower,
        compartment: 1,
        row: 1,
        side: HoldPositionSide.Left,
      },
      {
        deck: CargoDeck.Lower,
        compartment: 1,
        row: 1,
        side: HoldPositionSide.Right,
      },
      {
        deck: CargoDeck.Lower,
        compartment: 1,
        row: 2,
        side: HoldPositionSide.Left,
      },
      {
        deck: CargoDeck.Lower,
        compartment: 1,
        row: 2,
        side: HoldPositionSide.Right,
      },
    ]);
  });

  it('numbers a full-width run by row alone', () => {
    const positions = expandPositions(
      compartment({
        number: 4,
        positionTemplate: {
          rows: 3,
          sides: [HoldPositionSide.Full],
          acceptedBases: [UldBaseCode.Pallet96],
          acceptedContours: [UldContourCode.Pallet96Contoured],
          maxWeightKg: 6800,
        },
      }),
      CargoDeck.Lower,
    );

    expect(positions.map(({ row, side }) => [row, side])).toEqual([
      [1, HoldPositionSide.Full],
      [2, HoldPositionSide.Full],
      [3, HoldPositionSide.Full],
    ]);
  });

  it('places a main deck run on the main deck', () => {
    const positions = expandPositions(
      compartment({
        number: 6,
        name: HoldCompartmentName.Main,
        positionTemplate: {
          rows: 3,
          sides: [HoldPositionSide.Left, HoldPositionSide.Right],
          acceptedBases: [UldBaseCode.Pallet96],
          acceptedContours: [UldContourCode.MainDeckContainer],
          maxWeightKg: 6804,
        },
      }),
      CargoDeck.Main,
    );

    expect(
      positions.every((position) => position.deck === CargoDeck.Main),
    ).toBe(true);
    expect(positions.map(({ row }) => row)).toEqual([1, 1, 2, 2, 3, 3]);
  });

  it('carries the template onto every position', () => {
    const positions = expandPositions(compartment(), CargoDeck.Lower);

    expect(positions.every((position) => position.compartment === 1)).toBe(
      true,
    );
    expect(positions.every((position) => position.maxWeightKg === 1588)).toBe(
      true,
    );
    expect(positions[0].acceptedContours).toEqual([
      UldContourCode.Ld3FullHeight,
      UldContourCode.Ld3ReducedHeight,
    ]);
  });

  it('replaces only the fields an override names', () => {
    const positions = expandPositions(
      compartment({
        positionOverrides: [
          {
            row: 2,
            side: HoldPositionSide.Right,
            acceptedContours: [UldContourCode.Ld3ReducedHeight],
          },
        ],
      }),
      CargoDeck.Lower,
    );

    const overridden = positions.find(
      (position) =>
        position.row === 2 && position.side === HoldPositionSide.Right,
    )!;
    const untouched = positions.find(
      (position) =>
        position.row === 2 && position.side === HoldPositionSide.Left,
    )!;

    expect(overridden.acceptedContours).toEqual([
      UldContourCode.Ld3ReducedHeight,
    ]);
    expect(overridden.maxWeightKg).toBe(1588);
    expect(overridden.acceptedBases).toEqual([UldBaseCode.Ld3]);
    expect(untouched.acceptedContours).toEqual([
      UldContourCode.Ld3FullHeight,
      UldContourCode.Ld3ReducedHeight,
    ]);
  });

  it('expands a compartment with no template to no positions', () => {
    const loose = compartment({
      loading: CompartmentLoading.Loose,
      positionTemplate: undefined,
    });

    expect(expandPositions(loose, CargoDeck.Lower)).toEqual([]);
    expect(expandCompartment(loose, CargoDeck.Lower).positions).toEqual([]);
  });

  it('keeps the fields of the compartment it expands', () => {
    const expanded = expandCompartment(
      compartment({ heated: true, ventilated: true, volumeM3: 12.4 }),
      CargoDeck.Lower,
    );

    expect(expanded.heated).toBe(true);
    expect(expanded.ventilated).toBe(true);
    expect(expanded.volumeM3).toBe(12.4);
    expect(expanded.positions).toHaveLength(4);
  });
});

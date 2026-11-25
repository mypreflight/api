import { ColdChainReasonKind, ColdChainRisk } from './cold-chain';
import {
  DrillLetter,
  QuantityUnit,
  TemperatureRegime,
  TemperatureSolution,
} from './commodity.model';
import { CargoDeck, HoldPositionSide } from './hold-layout.model';
import { NotocDocumentRecord, NotocDrillRecord } from './notoc.model';
import {
  DANGEROUS_GOODS_STATEMENT,
  ercCodeOf,
  NO_DANGEROUS_GOODS_STATEMENT,
  netPerPackageOf,
  withTransitionalChanges,
  withTransitionalFields,
  writtenPosition,
} from './transitional-fields';

const DRY_ICE_DRILL = {
  responseCode: { drillNumber: 9, drillLetters: [DrillLetter.Anaesthetic] },
} as NotocDrillRecord;

function record(
  overrides: Partial<NotocDocumentRecord> = {},
): NotocDocumentRecord {
  return {
    dangerousGoods: [],
    dryIce: [],
    specialLoads: [],
    coldChain: [],
    ...overrides,
  } as unknown as NotocDocumentRecord;
}

describe('withTransitionalFields', () => {
  it('states that nothing hazardous is aboard when no line lists any', () => {
    expect(withTransitionalFields(record()).statement).toBe(
      NO_DANGEROUS_GOODS_STATEMENT,
    );
  });

  it('states that dangerous goods are aboard when only dry ice is', () => {
    const document = withTransitionalFields(
      record({
        dryIce: [{ drill: DRY_ICE_DRILL }],
      } as Partial<NotocDocumentRecord>),
    );

    expect(document.statement).toBe(DANGEROUS_GOODS_STATEMENT);
  });

  it('prints the net quantity as it was printed before', () => {
    expect(netPerPackageOf({ amount: 2.5, unit: QuantityUnit.Kilograms })).toBe(
      '2.5 kg',
    );
    expect(
      netPerPackageOf({ amount: 50, unit: QuantityUnit.Millilitres }),
    ).toBe('50 mL');
  });

  it('explains a cold chain entry and marks it advisory', () => {
    const document = withTransitionalFields(
      record({
        coldChain: [
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
        ],
      }),
    );

    expect(document.coldChain[0]).toMatchObject({
      explanation: 'A passive shipper with 33.9 h margin on a 48 h endurance.',
      advisory: true,
    });
  });

  it('writes the response code as it was written before', () => {
    expect(
      ercCodeOf({
        drillNumber: 6,
        drillLetters: [DrillLetter.Toxic, DrillLetter.Corrosive],
      }),
    ).toBe('6PC');
    expect(
      ercCodeOf({ drillNumber: 11, drillLetters: [DrillLetter.Infectious] }),
    ).toBe('11Y');
  });

  it('writes positions on the lines and in the change set as they were written before', () => {
    const forward = {
      deck: CargoDeck.Lower,
      compartment: 1,
      row: 1,
      side: HoldPositionSide.Left,
    };
    const main = {
      deck: CargoDeck.Main,
      compartment: 6,
      row: 3,
      side: HoldPositionSide.Right,
    };
    const document = withTransitionalFields(
      record({
        specialLoads: [{ loadingPosition: forward }],
        dryIce: [{ drill: DRY_ICE_DRILL }],
      } as Partial<NotocDocumentRecord>),
    );
    const changes = withTransitionalChanges({
      changed: true,
      dangerousGoodsAdded: [],
      dangerousGoodsRemoved: [],
      specialLoadsAdded: [],
      specialLoadsRemoved: [],
      repositioned: [
        { awb: '001-1', fromPosition: forward, toPosition: main },
        { awb: '001-2', fromPosition: main, toPosition: null },
      ],
      cargoChangeKg: 0,
      deadloadChangeKg: 0,
    });

    expect(document.specialLoads[0].position).toBe('11L');
    expect(document.dryIce[0].drill.ercCode).toBe('9A');
    expect(writtenPosition(null)).toBeNull();
    expect(changes.repositioned).toMatchObject([
      { from: '11L', to: 'CR' },
      { from: 'CR', to: null },
    ]);
  });
});

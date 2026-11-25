import { ColdChainReasonKind, ColdChainRisk } from './cold-chain';
import {
  QuantityUnit,
  TemperatureRegime,
  TemperatureSolution,
} from './commodity.model';
import { NotocDocumentRecord } from './notoc.model';
import {
  DANGEROUS_GOODS_STATEMENT,
  NO_DANGEROUS_GOODS_STATEMENT,
  netPerPackageOf,
  withTransitionalFields,
} from './transitional-fields';

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
      record({ dryIce: [{}] } as Partial<NotocDocumentRecord>),
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
});

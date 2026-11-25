import {
  loadedCargoKg,
  OffloadReason,
  planCargoReconciliation,
  ReconcilableUnit,
  retainedCargoKg,
} from './cargo-reconciliation';
import { OffloadPriority } from './commodity.model';
import {
  CargoDeck,
  HoldPositionSide,
  LoadingPosition,
} from './hold-layout.model';

function forwardLeft(row: number): LoadingPosition {
  return {
    deck: CargoDeck.Lower,
    compartment: 1,
    row,
    side: HoldPositionSide.Left,
  };
}

function unit(
  id: string,
  tareKg: number,
  row: number | null,
  shipments: [string, number, OffloadPriority][],
): ReconcilableUnit {
  return {
    id,
    tareKg,
    loadingPosition: row === null ? null : forwardLeft(row),
    shipments: shipments.map(([shipmentId, grossKg, offloadPriority]) => ({
      id: shipmentId,
      grossKg,
      offloadPriority,
    })),
  };
}

describe('loadedCargoKg', () => {
  it('counts unit tare alongside shipment gross weight', () => {
    const units = [
      unit('u1', 100, 1, [['s1', 900, OffloadPriority.General]]),
      unit('u2', 0, null, [['s2', 500, OffloadPriority.Standard]]),
    ];

    expect(loadedCargoKg(units)).toBe(1500);
  });
});

describe('retainedCargoKg', () => {
  it('counts shipments that may not be offloaded and the tare carrying them', () => {
    const units = [
      unit('u1', 100, 1, [['s1', 900, OffloadPriority.General]]),
      unit('u2', 120, 2, [['s2', 800, OffloadPriority.Never]]),
    ];

    expect(retainedCargoKg(units)).toBe(920);
  });

  it('counts the whole unit once when it mixes retained and offloadable freight', () => {
    const units = [
      unit('u1', 100, 1, [
        ['s1', 400, OffloadPriority.General],
        ['s2', 600, OffloadPriority.Never],
      ]),
    ];

    expect(retainedCargoKg(units)).toBe(700);
  });

  it('is zero when nothing aboard is protected', () => {
    const units = [unit('u1', 100, 1, [['s1', 900, OffloadPriority.General]])];

    expect(retainedCargoKg(units)).toBe(0);
  });
});

describe('planCargoReconciliation', () => {
  it('changes nothing when the tonnage is unchanged', () => {
    const units = [unit('u1', 100, 1, [['s1', 900, OffloadPriority.General]])];

    expect(planCargoReconciliation(units, 1000)).toEqual({
      offloads: [],
      emptiedUnitIds: [],
      addKg: 0,
    });
  });

  it('asks for the shortfall when the tonnage rises', () => {
    const units = [unit('u1', 100, 1, [['s1', 900, OffloadPriority.General]])];

    const plan = planCargoReconciliation(units, 2500);

    expect(plan.offloads).toEqual([]);
    expect(plan.addKg).toBe(1500);
  });

  it('sheds ordinary freight before sensitive freight', () => {
    const units = [
      unit('u1', 100, 1, [['pharma', 500, OffloadPriority.Sensitive]]),
      unit('u2', 100, 2, [['general', 500, OffloadPriority.General]]),
    ];

    const plan = planCargoReconciliation(units, 800);

    expect(plan.offloads.map((offload) => offload.shipmentId)).toEqual([
      'general',
    ]);
  });

  it('works up the priority ladder when one shipment is not enough', () => {
    const units = [
      unit('u1', 0, null, [
        ['general', 300, OffloadPriority.General],
        ['standard', 300, OffloadPriority.Standard],
        ['express', 300, OffloadPriority.Express],
      ]),
    ];

    const plan = planCargoReconciliation(units, 300);

    expect(plan.offloads.map((offload) => offload.shipmentId)).toEqual([
      'general',
      'standard',
    ]);
  });

  it('sheds the heaviest first within one priority', () => {
    const units = [
      unit('u1', 0, null, [
        ['light', 200, OffloadPriority.General],
        ['heavy', 700, OffloadPriority.General],
      ]),
    ];

    const plan = planCargoReconciliation(units, 500);

    expect(plan.offloads.map((offload) => offload.shipmentId)).toEqual([
      'heavy',
    ]);
  });

  it('never offloads freight the commodity protects', () => {
    const units = [
      unit('u1', 100, 1, [['organs', 900, OffloadPriority.Never]]),
      unit('u2', 100, 2, [['general', 900, OffloadPriority.General]]),
    ];

    const plan = planCargoReconciliation(units, 1000);

    expect(plan.offloads.map((offload) => offload.shipmentId)).toEqual([
      'general',
    ]);
    expect(plan.emptiedUnitIds).toEqual(['u2']);
  });

  it('leaves the protected load alone even when the whole rest is not enough', () => {
    const units = [
      unit('u1', 100, 1, [['organs', 900, OffloadPriority.Never]]),
      unit('u2', 100, 2, [['general', 900, OffloadPriority.General]]),
    ];

    const plan = planCargoReconciliation(units, 0);

    expect(plan.offloads.map((offload) => offload.shipmentId)).toEqual([
      'general',
    ]);
    expect(plan.addKg).toBe(0);
  });

  it('records the position an offloaded shipment had been assigned', () => {
    const units = [unit('u1', 100, 1, [['s1', 900, OffloadPriority.General]])];

    const plan = planCargoReconciliation(units, 0);

    expect(plan.offloads).toEqual([
      {
        shipmentId: 's1',
        unitId: 'u1',
        reason: OffloadReason.PayloadRestriction,
        offloadedFromPosition: forwardLeft(1),
      },
    ]);
  });

  it('frees the tare of a unit emptied by offloading', () => {
    const units = [
      unit('u1', 100, 1, [['s1', 900, OffloadPriority.General]]),
      unit('u2', 100, 2, [['s2', 900, OffloadPriority.Standard]]),
    ];

    const plan = planCargoReconciliation(units, 1000);

    expect(plan.emptiedUnitIds).toEqual(['u1']);
    expect(plan.addKg).toBe(0);
  });

  it('keeps a unit that still carries something loaded', () => {
    const units = [
      unit('u1', 100, 1, [
        ['general', 400, OffloadPriority.General],
        ['pharma', 500, OffloadPriority.Never],
      ]),
    ];

    const plan = planCargoReconciliation(units, 600);

    expect(plan.offloads.map((offload) => offload.shipmentId)).toEqual([
      'general',
    ]);
    expect(plan.emptiedUnitIds).toEqual([]);
  });

  it('asks for the overshoot back so the manifest lands on the tonnage', () => {
    const units = [
      unit('u1', 0, null, [['s1', 1000, OffloadPriority.General]]),
      unit('u2', 0, null, [['s2', 1000, OffloadPriority.Standard]]),
    ];

    const plan = planCargoReconciliation(units, 1400);

    expect(plan.offloads.map((offload) => offload.shipmentId)).toEqual(['s1']);
    expect(plan.addKg).toBe(400);
  });

  it('reconciles an empty manifest to the whole tonnage as an addition', () => {
    expect(planCargoReconciliation([], 2000)).toEqual({
      offloads: [],
      emptiedUnitIds: [],
      addKg: 2000,
    });
  });
});

describe('an unresolvable commodity', () => {
  it('is treated as freight that may not be offloaded, so the shortfall is refused rather than shed', () => {
    const units = [
      unit('u1', 100, 1, [['unknown', 900, OffloadPriority.Never]]),
      unit('u2', 100, 2, [['general', 900, OffloadPriority.General]]),
    ];

    const plan = planCargoReconciliation(units, 1000);

    expect(plan.offloads.map((offload) => offload.shipmentId)).toEqual([
      'general',
    ]);
    expect(retainedCargoKg(units)).toBe(1000);
  });
});

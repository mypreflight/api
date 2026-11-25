import { LoadingPosition, samePosition } from './hold-layout.model';
import { NotocDocument } from './notoc.model';

export type NotocReposition = {
  awb: string;
  fromPosition: LoadingPosition | null;
  toPosition: LoadingPosition | null;
};

export type NotocChanges = {
  changed: boolean;
  dangerousGoodsAdded: string[];
  dangerousGoodsRemoved: string[];
  specialLoadsAdded: string[];
  specialLoadsRemoved: string[];
  repositioned: NotocReposition[];
  cargoChangeKg: number;
  deadloadChangeKg: number;
};

export function notocChanges(
  preliminary: NotocDocument,
  final: NotocDocument,
): NotocChanges {
  const dangerousGoodsAdded = missingFrom(
    final.dangerousGoods,
    preliminary.dangerousGoods,
  );
  const dangerousGoodsRemoved = missingFrom(
    preliminary.dangerousGoods,
    final.dangerousGoods,
  );
  const specialLoadsAdded = missingFrom(
    final.specialLoads,
    preliminary.specialLoads,
  );
  const specialLoadsRemoved = missingFrom(
    preliminary.specialLoads,
    final.specialLoads,
  );
  const repositioned = repositionsBetween(preliminary, final);
  const cargoChangeKg = final.summary.cargoKg - preliminary.summary.cargoKg;
  const deadloadChangeKg =
    final.summary.deadloadKg - preliminary.summary.deadloadKg;

  return {
    changed:
      dangerousGoodsAdded.length > 0 ||
      dangerousGoodsRemoved.length > 0 ||
      specialLoadsAdded.length > 0 ||
      specialLoadsRemoved.length > 0 ||
      repositioned.length > 0 ||
      cargoChangeKg !== 0 ||
      deadloadChangeKg !== 0,
    dangerousGoodsAdded,
    dangerousGoodsRemoved,
    specialLoadsAdded,
    specialLoadsRemoved,
    repositioned,
    cargoChangeKg,
    deadloadChangeKg,
  };
}

function missingFrom(
  entries: { awb: string }[],
  reference: { awb: string }[],
): string[] {
  const known = new Set(reference.map((entry) => entry.awb));

  return entries
    .map((entry) => entry.awb)
    .filter((awb) => !known.has(awb))
    .sort();
}

function repositionsBetween(
  preliminary: NotocDocument,
  final: NotocDocument,
): NotocReposition[] {
  const before = positionsOf(preliminary);
  const after = positionsOf(final);

  return [...after.entries()]
    .filter(
      ([awb, toPosition]) =>
        before.has(awb) && !samePlacement(before.get(awb)!, toPosition),
    )
    .map(([awb, toPosition]) => ({
      awb,
      fromPosition: before.get(awb)!,
      toPosition,
    }))
    .sort((one, other) => one.awb.localeCompare(other.awb));
}

function samePlacement(
  one: LoadingPosition | null,
  other: LoadingPosition | null,
): boolean {
  return one === null || other === null
    ? one === other
    : samePosition(one, other);
}

function positionsOf(
  document: NotocDocument,
): Map<string, LoadingPosition | null> {
  return new Map(
    [...document.dangerousGoods, ...document.specialLoads].map((entry) => [
      entry.awb,
      entry.loadingPosition,
    ]),
  );
}

import {
  DangerousGoodsProfile,
  NetQuantity,
  ResponseCode,
} from './commodity.model';
import { ColdChainAssessment, explanationOf } from './cold-chain';
import { LoadingPosition } from './hold-layout.model';
import { NotocChanges } from './notoc-delta';
import {
  NotocChangeSet,
  NotocDocument,
  NotocDocumentRecord,
  NotocDrill,
  NotocDrillRecord,
} from './notoc.model';
import { designatorOf } from './position-designator';

export const NO_DANGEROUS_GOODS_STATEMENT = 'No dangerous goods loaded.';
export const DANGEROUS_GOODS_STATEMENT =
  'Dangerous goods loaded as listed below.';

export function netPerPackageOf({ amount, unit }: NetQuantity): string {
  return `${amount} ${unit}`;
}

export function ercCodeOf({ drillNumber, drillLetters }: ResponseCode): string {
  return `${drillNumber}${drillLetters.join('')}`;
}

export function writtenPosition(
  position: LoadingPosition | null,
): string | null {
  return position === null ? null : designatorOf(position);
}

export function withTransitionalDangerousGoods(
  profile: DangerousGoodsProfile,
): DangerousGoodsProfile & { netPerPackage: string; ercCode: string } {
  return {
    ...profile,
    netPerPackage: netPerPackageOf(profile.netQuantity),
    ercCode: ercCodeOf(profile.responseCode),
  };
}

export function withExplanation(
  assessment: ColdChainAssessment,
): ColdChainAssessment & { explanation: string; advisory: boolean } {
  return {
    ...assessment,
    explanation: explanationOf(assessment),
    advisory: true,
  };
}

function withErcCode(drill: NotocDrillRecord): NotocDrill {
  return { ...drill, ercCode: ercCodeOf(drill.responseCode) };
}

export function withTransitionalFields(
  record: NotocDocumentRecord,
): NotocDocument {
  return {
    ...record,
    statement:
      record.dangerousGoods.length + record.dryIce.length === 0
        ? NO_DANGEROUS_GOODS_STATEMENT
        : DANGEROUS_GOODS_STATEMENT,
    dangerousGoods: record.dangerousGoods.map((entry) => ({
      ...entry,
      netPerPackage: netPerPackageOf(entry.netQuantity),
      position: writtenPosition(entry.loadingPosition),
      drill: withErcCode(entry.drill),
    })),
    dryIce: record.dryIce.map((entry) => ({
      ...entry,
      drill: withErcCode(entry.drill),
    })),
    specialLoads: record.specialLoads.map((entry) => ({
      ...entry,
      position: writtenPosition(entry.loadingPosition),
    })),
    coldChain: record.coldChain.map((entry) => ({
      ...entry,
      explanation: explanationOf(entry),
      advisory: true,
    })),
  };
}

export function withTransitionalChanges(changes: NotocChanges): NotocChangeSet {
  return {
    ...changes,
    repositioned: changes.repositioned.map((reposition) => ({
      ...reposition,
      from: writtenPosition(reposition.fromPosition),
      to: writtenPosition(reposition.toPosition),
    })),
  };
}

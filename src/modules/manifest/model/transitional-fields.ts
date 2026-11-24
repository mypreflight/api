import { DangerousGoodsProfile, NetQuantity } from './commodity.model';
import { ColdChainAssessment, explanationOf } from './cold-chain';
import { NotocDocument, NotocDocumentRecord } from './notoc.model';

export const NO_DANGEROUS_GOODS_STATEMENT = 'No dangerous goods loaded.';
export const DANGEROUS_GOODS_STATEMENT =
  'Dangerous goods loaded as listed below.';

export function netPerPackageOf({ amount, unit }: NetQuantity): string {
  return `${amount} ${unit}`;
}

export function withNetPerPackage(
  profile: DangerousGoodsProfile,
): DangerousGoodsProfile & { netPerPackage: string } {
  return { ...profile, netPerPackage: netPerPackageOf(profile.netQuantity) };
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
    })),
    coldChain: record.coldChain.map((entry) => ({
      ...entry,
      explanation: explanationOf(entry),
      advisory: true,
    })),
  };
}

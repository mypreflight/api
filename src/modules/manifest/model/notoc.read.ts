import {
  NotocDangerousGoods,
  NotocDocument,
  NotocSpecialLoad,
} from './notoc.model';

type StoredDangerousGoods = Omit<
  NotocDangerousGoods,
  'classOrDivision' | 'quantityIsTotal' | 'radioactive' | 'impCode' | 'uldId'
> &
  Partial<NotocDangerousGoods>;

type StoredSpecialLoad = Omit<
  NotocSpecialLoad,
  'pieces' | 'supplementaryInformation' | 'uldId'
> &
  Partial<NotocSpecialLoad>;

type StoredNotocDocument = Omit<
  NotocDocument,
  'header' | 'specialPassengers' | 'dangerousGoods' | 'specialLoads'
> & {
  header?: NotocDocument['header'];
  specialPassengers?: NotocDocument['specialPassengers'];
  dangerousGoods: StoredDangerousGoods[];
  specialLoads: StoredSpecialLoad[];
};

export function readNotocDocument(stored: unknown): NotocDocument {
  const document = stored as StoredNotocDocument;

  return {
    ...document,
    header: document.header ?? null,
    specialPassengers: document.specialPassengers ?? [],
    dangerousGoods: document.dangerousGoods.map((entry) => ({
      ...entry,
      classOrDivision: entry.classOrDivision ?? entry.hazardClass,
      quantityIsTotal: entry.quantityIsTotal ?? false,
      radioactive: entry.radioactive ?? null,
      impCode: entry.impCode ?? null,
      uldId: entry.uldId ?? null,
    })),
    specialLoads: document.specialLoads.map((load) => ({
      ...load,
      pieces: load.pieces ?? null,
      supplementaryInformation: load.supplementaryInformation ?? [],
      uldId: load.uldId ?? null,
    })),
  };
}

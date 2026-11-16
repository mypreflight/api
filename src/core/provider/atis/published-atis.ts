export enum AtisKind {
  Combined = 'combined',
  Arrival = 'arrival',
  Departure = 'departure',
}

export type PublishedAtis = {
  kind: AtisKind;
  content: string;
  publishedAt: Date | null;
};

export type AtisByIcao = Map<string, PublishedAtis[]>;

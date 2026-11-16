import { AtisByIcao, AtisKind, PublishedAtis } from '../../atis/published-atis';
import { FaaDatisEntry } from '../type/faa-datis.types';

const KINDS: Record<string, AtisKind> = {
  combined: AtisKind.Combined,
  arr: AtisKind.Arrival,
  dep: AtisKind.Departure,
};

const ISSUE_TIME = /^(\d{2})(\d{2})$/;
const CLOCK_SKEW_MS = 10 * 60 * 1000;

export function parseFaaDatis(
  entries: FaaDatisEntry[],
  icaoCodes: string[],
): AtisByIcao {
  const requested = new Set(icaoCodes);
  const byIcao: AtisByIcao = new Map();

  for (const entry of entries) {
    const icaoCode = entry.airport?.trim().toUpperCase();
    const kind = entry.type ? KINDS[entry.type.trim().toLowerCase()] : null;
    const content = entry.datis?.trim();

    if (!icaoCode || !requested.has(icaoCode) || !kind || !content) {
      continue;
    }

    const atis: PublishedAtis = {
      kind,
      content,
      publishedAt: issuedAt(entry.time, entry.updatedAt),
    };

    byIcao.set(icaoCode, [...(byIcao.get(icaoCode) ?? []), atis]);
  }

  return byIcao;
}

export function issuedAt(
  time: string | null | undefined,
  updatedAt: string | null | undefined,
): Date | null {
  const match = time?.trim().match(ISSUE_TIME);
  const anchor = updatedAt ? new Date(updatedAt) : null;

  if (!match || !anchor || Number.isNaN(anchor.getTime())) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours > 23 || minutes > 59) {
    return null;
  }

  const issued = new Date(
    Date.UTC(
      anchor.getUTCFullYear(),
      anchor.getUTCMonth(),
      anchor.getUTCDate(),
      hours,
      minutes,
    ),
  );

  if (issued.getTime() > anchor.getTime() + CLOCK_SKEW_MS) {
    issued.setUTCDate(issued.getUTCDate() - 1);
  }

  return issued;
}

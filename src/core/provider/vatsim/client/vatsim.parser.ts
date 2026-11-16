import { AtisByIcao, AtisKind } from '../../atis/published-atis';
import { VatsimAtisEntry } from '../type/vatsim.types';

const ATIS_CALLSIGN = /^([A-Z0-9]{4})_(?:(A|ARR|D|DEP)_)?ATIS$/;

const KINDS: Record<string, AtisKind> = {
  A: AtisKind.Arrival,
  ARR: AtisKind.Arrival,
  D: AtisKind.Departure,
  DEP: AtisKind.Departure,
};

export function parseVatsimAtis(
  entries: VatsimAtisEntry[],
  icaoCodes: string[],
): AtisByIcao {
  const requested = new Set(icaoCodes);
  const byIcao: AtisByIcao = new Map();

  for (const entry of entries) {
    const match = entry.callsign?.trim().toUpperCase().match(ATIS_CALLSIGN);

    if (!match || !requested.has(match[1])) {
      continue;
    }

    const content = (entry.text_atis ?? [])
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join('\n');

    if (!content) {
      continue;
    }

    const icaoCode = match[1];
    const kind = match[2] ? KINDS[match[2]] : AtisKind.Combined;

    byIcao.set(icaoCode, [
      ...(byIcao.get(icaoCode) ?? []),
      { kind, content, publishedAt: toDate(entry.last_updated) },
    ]);
  }

  return byIcao;
}

function toDate(value: string | null | undefined): Date | null {
  const date = value ? new Date(value) : null;

  return date && !Number.isNaN(date.getTime()) ? date : null;
}

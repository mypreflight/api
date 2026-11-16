import { AtisKind, PublishedAtis } from '../../atis/published-atis';

const STREAMED_CONTENT = '<blazor-ssr>';
const NO_ATIS = 'No ATIS available';
const ATIS_BLOCK = 'class="atis"';

const CARD =
  /<h5 class="card-title"[^>]*>([\s\S]*?)<\/h5>\s*(?:<h6[^>]*>([\s\S]*?)<\/h6>\s*)?<div class="atis">([\s\S]*?)<\/div>/g;

const KINDS: Record<string, AtisKind> = {
  'arrival atis': AtisKind.Arrival,
  'departure atis': AtisKind.Departure,
  atis: AtisKind.Combined,
};

const RECEIVED_AT = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}) UTC$/;

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

export class UnrecognisedAtisGuruPageError extends Error {
  constructor() {
    super('atis.guru answered with a page that is not an airport ATIS page');
  }
}

export function parseAtisGuruPage(html: string): PublishedAtis[] {
  const start = html.indexOf(STREAMED_CONTENT);
  const page = start >= 0 ? html.slice(start) : html;

  if (!page.includes(ATIS_BLOCK) && !page.includes(NO_ATIS)) {
    throw new UnrecognisedAtisGuruPageError();
  }

  const reports: PublishedAtis[] = [];

  for (const [, title, receivedAt, text] of page.matchAll(CARD)) {
    const kind = KINDS[toText(title).toLowerCase()];
    const content = toAtisText(text);

    if (!kind || !content) {
      continue;
    }

    reports.push({
      kind,
      content,
      publishedAt: toReceivedAt(toText(receivedAt ?? '')),
    });
  }

  return reports;
}

function toText(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, ''))
    .replace(/\s+/g, ' ')
    .trim();
}

function toAtisText(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, ''))
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .trim();
}

function toReceivedAt(text: string): Date | null {
  const match = text.match(RECEIVED_AT);

  if (!match) {
    return null;
  }

  const [, year, month, day, hours, minutes] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, hours, minutes));

  return Number.isNaN(date.getTime()) ? null : date;
}

function decodeEntities(text: string): string {
  return text.replace(
    /&(#x[0-9a-f]+|#\d+|[a-z]+);/gi,
    (entity, code: string) => {
      if (!code.startsWith('#')) {
        return NAMED_ENTITIES[code.toLowerCase()] ?? entity;
      }

      const isHex = code[1] === 'x' || code[1] === 'X';
      const codePoint = parseInt(code.slice(isHex ? 2 : 1), isHex ? 16 : 10);

      return codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : entity;
    },
  );
}

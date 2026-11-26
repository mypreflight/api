const MONTHS = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MAY',
  'JUN',
  'JUL',
  'AUG',
  'SEP',
  'OCT',
  'NOV',
  'DEC',
];

export const PAGE_WIDTH = 68;
export const RULE = '-'.repeat(PAGE_WIDTH);

export function left(value: string | number, width: number): string {
  return String(value).padEnd(width, ' ');
}

export function right(value: string | number, width: number): string {
  return String(value).padStart(width, ' ');
}

export function zero(value: number, width: number): string {
  return String(Math.abs(Math.round(value))).padStart(width, '0');
}

export function signed(
  value: number,
  width: number,
  positive = 'P',
  negative = 'M',
): string {
  return `${value < 0 ? negative : positive}${zero(value, width)}`;
}

export function centered(title: string, width: number, fill: string): string {
  const padding = Math.max(0, width - title.length);
  const before = Math.floor(padding / 2);

  return `${fill.repeat(before)}${title}${fill.repeat(padding - before)}`;
}

export function banner(title: string, fill: string): string {
  return centered(` ${title} `, PAGE_WIDTH, fill);
}

export function wrapWords(text: string, width: number): string[] {
  const lines: string[] = [];

  for (const word of text.split(/\s+/).filter((part) => part !== '')) {
    const last = lines.length === 0 ? null : lines[lines.length - 1];

    if (last === null || last.length + 1 + word.length > width) {
      lines.push(word);
    } else {
      lines[lines.length - 1] = `${last} ${word}`;
    }
  }

  return lines;
}

export function visibleLength(html: string): number {
  return html.replace(/<[^>]+>/g, '').length;
}

export function wrapHtmlWords(html: string, width: number): string[] {
  const lines: string[] = [];

  for (const word of html.split(/\s+/).filter((part) => part !== '')) {
    const last = lines.length === 0 ? null : lines[lines.length - 1];

    if (
      last === null ||
      visibleLength(last) + 1 + visibleLength(word) > width
    ) {
      lines.push(word);
    } else {
      lines[lines.length - 1] = `${last} ${word}`;
    }
  }

  return lines;
}

export function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

export function minutes(seconds: number): number {
  return Math.floor(seconds / 60);
}

export function duration(seconds: number): string {
  const total = minutes(Math.max(0, seconds));

  return `${zero(Math.floor(total / 60), 2)}${zero(total % 60, 2)}`;
}

export function clock(date: Date): string {
  return `${zero(date.getUTCHours(), 2)}${zero(date.getUTCMinutes(), 2)}`;
}

export function localClock(date: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const part = (type: string) =>
    parts.find((entry) => entry.type === type)?.value ?? '00';

  return `${part('hour')}${part('minute')}`;
}

export function longDate(date: Date): string {
  return `${zero(date.getUTCDate(), 2)}${MONTHS[date.getUTCMonth()]}${date.getUTCFullYear()}`;
}

export function shortDate(date: Date): string {
  return `${zero(date.getUTCDate(), 2)}${MONTHS[date.getUTCMonth()]}${String(date.getUTCFullYear()).slice(2)}`;
}

export function dayMonth(date: Date): string {
  return `${zero(date.getUTCDate(), 2)}${MONTHS[date.getUTCMonth()]}`;
}

export function titleDate(date: Date): string {
  const month = MONTHS[date.getUTCMonth()];

  return `${zero(date.getUTCDate(), 2)}${month[0]}${month.slice(1).toLowerCase()}${date.getUTCFullYear()}`;
}

export function dayHourMinute(date: Date): string {
  return `${zero(date.getUTCDate(), 2)}${clock(date)}`;
}

export function dayHour(date: Date): string {
  return `${zero(date.getUTCDate(), 2)}${zero(date.getUTCHours(), 2)}`;
}

export function compactDate(date: Date): string {
  return `${String(date.getUTCFullYear()).slice(2)}${zero(date.getUTCMonth() + 1, 2)}${zero(date.getUTCDate(), 2)}`;
}

export function latitude(degrees: number): string {
  const absolute = Math.abs(degrees);
  const whole = Math.floor(absolute);
  const minute = (absolute - whole) * 60;
  const tenths = Math.round(minute * 10);
  const carry = tenths === 600 ? 1 : 0;

  return `${degrees < 0 ? 'S' : 'N'}${zero(whole + carry, 2)}${(carry ? 0 : tenths / 10).toFixed(1).padStart(4, '0')}`;
}

export function longitude(degrees: number): string {
  const absolute = Math.abs(degrees);
  const whole = Math.floor(absolute);
  const minute = (absolute - whole) * 60;
  const tenths = Math.round(minute * 10);
  const carry = tenths === 600 ? 1 : 0;

  return `${degrees < 0 ? 'W' : 'E'}${zero(whole + carry, 3)}${(carry ? 0 : tenths / 10).toFixed(1).padStart(4, '0')}`;
}

export function tonnes(kilograms: number): string {
  return (kilograms / 1000).toFixed(1);
}

export function hundreds(kilograms: number): number {
  return Math.round(kilograms / 100);
}

export function heading(degrees: number): string {
  return zero(((Math.round(degrees) % 360) + 360) % 360, 3);
}

export function hashOf(text: string): number {
  let hash = 2166136261;

  for (const character of text) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export const STALE_CHECK_IN_AFTER_HOURS = 24;

const HOUR_MS = 60 * 60 * 1000;

export function staleCheckInCutoff(now: Date): Date {
  return new Date(now.getTime() - STALE_CHECK_IN_AFTER_HOURS * HOUR_MS);
}

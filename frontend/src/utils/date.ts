import { differenceInCalendarDays, format, isValid, parseISO, startOfDay } from 'date-fns';

export function getTodayIso(now: Date = new Date()): string {
  return format(now, 'yyyy-MM-dd');
}

export function getDaysRemaining(weddingDateIso: string, now: Date = new Date()): number {
  if (!weddingDateIso) return 0;
  const parsed = parseISO(weddingDateIso);
  if (!isValid(parsed)) return 0;
  return differenceInCalendarDays(startOfDay(parsed), startOfDay(now));
}

export function formatDisplayDate(iso?: string): string {
  if (!iso) return 'No due date';
  const parsed = parseISO(iso);
  if (!isValid(parsed)) return iso;
  return format(parsed, 'd MMM yyyy');
}

export function formatLongDate(iso?: string): string {
  if (!iso) return '';
  const parsed = parseISO(iso);
  if (!isValid(parsed)) return iso;
  return format(parsed, 'd MMMM yyyy');
}

export function isDateStrictlyBeforeToday(iso: string, todayIso: string = getTodayIso()): boolean {
  if (!iso) return false;
  return iso.slice(0, 10) < todayIso.slice(0, 10);
}

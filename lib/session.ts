import { kstTimestamp } from './kst';

export function getSessionRange(bookingDate: string, slot: string, sessionType: string | null) {
  const start = kstTimestamp(bookingDate, slot);
  const durationMin = sessionType === 'free' ? 10 : 30;
  return { start, end: start + durationMin * 60 * 1000 };
}
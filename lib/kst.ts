export const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export function kstNow(): Date {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
  return new Date(utc + KST_OFFSET_MS);
}

export function kstTimestamp(dateStr: string, timeStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [h, min] = timeStr.split(':').map(Number);
  return Date.UTC(y, m - 1, d, h, min) - KST_OFFSET_MS;
}

export function kstTodayIso(): string {
  const k = kstNow();
  const y = k.getFullYear();
  const m = String(k.getMonth() + 1).padStart(2, '0');
  const d = String(k.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
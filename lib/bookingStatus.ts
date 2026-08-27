export type BookingPhase = 'no_show' | 'today' | 'upcoming' | 'past';

export function todayKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function toDateKey(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function classifyBooking(dateStr: string, status?: string | null): BookingPhase {
  if (status === 'no_show') return 'no_show';
  const key = toDateKey(dateStr);
  const today = todayKey();
  if (!key) return 'upcoming';
  if (key < today) return 'past';
  if (key === today) return 'today';
  return 'upcoming';
}

export const PHASE_LABEL: Record<BookingPhase, string> = {
  no_show: '노쇼',
  today: '진행중',
  upcoming: '예정',
  past: '완료',
};

export function formatDate(d: string) {
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });
}
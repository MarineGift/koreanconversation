export interface CreditPack {
  id: string;
  credits: number;
  prices: Record<'KRW' | 'USD', number>;
  basePrices: Record<'KRW' | 'USD', number>;
  name: Record<'en' | 'ko', string>;
  description: Record<'en' | 'ko', string>;
  popular?: boolean;
}

export const BASE_PRICE_PER_SESSION: Record<'KRW' | 'USD', number> = {
  KRW: 53200,
  USD: 40,
};

export const creditPacks: CreditPack[] = [
  {
    id: 'pack-5',
    credits: 5,
    prices: { KRW: 233000, USD: 175 },
    basePrices: { KRW: 266000, USD: 200 },
    name: { en: '5 Credits', ko: '5회권' },
    description: { en: '5 × 30-min sessions', ko: '30분 1:1 수업 5회' },
  },
  {
    id: 'pack-10',
    credits: 10,
    prices: { KRW: 399000, USD: 300 },
    basePrices: { KRW: 532000, USD: 400 },
    name: { en: '10 Credits', ko: '10회권' },
    description: { en: '10 × 30-min sessions', ko: '30분 1:1 수업 10회' },
    popular: true,
  },
  {
    id: 'pack-40',
    credits: 40,
    prices: { KRW: 1330000, USD: 1000 },
    basePrices: { KRW: 2128000, USD: 1600 },
    name: { en: '40 Credits — Intensive', ko: '40회권 — 집중 과정' },
    description: {
      en: 'A fully customized program: business meetings, tourism, and real-time Korean↔English interpretation built around your goals.',
      ko: '비즈니스 미팅, 관광 등 현장 상황에 맞춘 맞춤형 프로그램. 필요한 한국어 통역과 영어 통역을 함께 제공합니다.',
    },
  },
];

export function getPackById(id: string): CreditPack | undefined {
  return creditPacks.find((p) => p.id === id);
}

export function formatPrice(amount: number, currency: 'KRW' | 'USD'): string {
  if (currency === 'KRW') {
    return `₩${amount.toLocaleString('ko-KR')}`;
  }
  return `$${amount.toLocaleString('en-US')}`;
}
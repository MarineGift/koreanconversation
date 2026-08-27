export const creditPacks = [
  { id: 'pack-5', credits: 5, prices: { KRW: 233000, USD: 175 }, name: '5 Credits Pack' },
  { id: 'pack-10', credits: 10, prices: { KRW: 399000, USD: 300 }, name: '10 Credits Pack' },
  { id: 'pack-40', credits: 40, prices: { KRW: 1330000, USD: 1000 }, name: '40 Credits Pack' },
];

export const testCreditPacks = [
  { id: 'test-pack-1', credits: 1, prices: { KRW: 1400, USD: 1 }, name: 'Test $1 Pack' },
  { id: 'test-pack-5', credits: 5, prices: { KRW: 7000, USD: 5 }, name: 'Test $5 Pack' },
];

export interface CustomPackage {
  id: string;
  title: string;
  titleKo: string;
  desc: string;
  popular?: boolean;
  includes: string[];
}

export interface QuoteStep {
  icon: string;
  title: string;
  desc: string;
}

export const quoteSteps: QuoteStep[] = [
  { icon: 'ri-edit-line', title: 'Tell us what you need', desc: 'Share your dates, goals and the services you want.' },
  { icon: 'ri-file-list-3-line', title: 'We design your plan', desc: 'We build a custom itinerary or treatment plan just for you.' },
  { icon: 'ri-price-tag-3-line', title: 'Receive a transparent quote', desc: 'You get a clear, itemized estimate with no hidden fees.' },
];

export const tourPackages: CustomPackage[] = [
  {
    id: 'tour-guide',
    title: 'Tour Guide',
    titleKo: '투어 가이드',
    desc: 'Sightseeing, culture, food and shopping with a dedicated licensed guide.',
    includes: [
      'Private licensed tour guide',
      'Fully custom itinerary',
      'Airport pickup & drop-off',
      'Local transport & navigation',
      'Restaurant & activity booking',
    ],
  },
  {
    id: 'interpretation',
    title: 'Business Interpretation',
    titleKo: '비즈니스 통역',
    desc: 'Meetings, negotiations and site visits with a professional interpreter.',
    includes: [
      'Professional interpreter',
      'Meeting & negotiation support',
      'Factory & site visits',
      'Document translation',
      'Market research assistance',
    ],
  },
  {
    id: 'full',
    title: 'Full Package',
    titleKo: '풀 패키지',
    desc: 'Guide + interpreter combined for a seamless tourism & business trip.',
    popular: true,
    includes: [
      'Everything in Guide + Interpretation',
      'Dedicated bilingual coordinator',
      'End-to-end itinerary design',
      'Accommodation & transport booking',
      '24/7 on-call support',
    ],
  },
];
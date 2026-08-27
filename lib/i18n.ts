export type Lang = 'en' | 'ko';

export function detectLang(): Lang {
  return 'en';
}

export const pricingT = {
  en: {
    title: 'Credit Packs',
    subtitle: '1 credit = 1 × 30-min 1:1 coaching session. Purchase credits and book anytime.',
    buy: 'Buy Now',
    popular: 'Most Popular',
    perSession: 'per session',
    creditLabel: 'credits',
    oneCredit: '1 credit = 30-min session',
    kstNotice: 'All times are in KST (Korea Standard Time, UTC+9).',
    features: [
      '1:1 live video coaching',
      'Personalized feedback',
      'Valid for 12 months',
      'Transferable unused credits',
    ],
    eventTitle: 'Open Event',
    eventDate: 'Aug 1 – Sep 30, 2026',
    eventDesc: 'Grand opening special pricing. Limited time only!',
    intensive: 'Intensive',
    save: 'Save',
    basePrice: 'Standard rate: $40 per 30-min session',
    baseLabel: 'Regular',
    promoLabel: 'Event price',
    policyTitle: 'Pricing & Policy',
    noShowTitle: 'No-Show Policy',
    noShowDesc: 'If you miss a scheduled session without canceling at least 24 hours in advance, that session credit will still be deducted.',
    refundTitle: 'No Refunds',
    refundDesc: 'All purchases are final. Payments are non-refundable.',
    transferTitle: 'Credit Transfer',
    transferDesc: 'Unused credits can be transferred to another registered member.',
  },
  ko: {
    title: '수업 크레딧 팩',
    subtitle: '1크레딧 = 30분 1:1 코칭 1회. 크레딧을 구매하고 원할 때 예약하세요.',
    buy: '구매하기',
    popular: '인기 상품',
    perSession: '회당',
    creditLabel: '크레딧',
    oneCredit: '1크레딧 = 30분 수업 1회',
    kstNotice: '모든 시간은 KST(한국 표준시, UTC+9) 기준입니다.',
    features: [
      '1:1 실시간 화상 코칭',
      '맞춤형 피드백',
      '구매 후 12개월 유효',
      '미사용 크레딧 양도 가능',
    ],
    eventTitle: '오픈 기념 이벤트',
    eventDate: '2026년 8월 1일 ~ 9월 30일',
    eventDesc: '오픈 기념 특별 할인가! 기간 한정 프로모션입니다.',
    intensive: '집중 과정',
    save: '할인',
    basePrice: '기본 요금: 30분당 $40',
    baseLabel: '기본가',
    promoLabel: '이벤트가',
    policyTitle: '요금 및 정책',
    noShowTitle: '노쇼(No-Show) 패널티',
    noShowDesc: '예약한 세션을 최소 24시간 전에 취소하지 않고 참여하지 않으면 해당 세션 크레딧이 차감됩니다.',
    refundTitle: '환불 불가',
    refundDesc: '모든 결제는 최종적이며 환불이 불가능합니다.',
    transferTitle: '크레딧 양도',
    transferDesc: '사용하지 않은 잔여 크레딧은 다른 회원에게 양도할 수 있습니다.',
  },
} as const;

export const checkoutT = {
  en: {
    loading: 'Loading checkout...',
    orderSummary: 'Order Summary',
    payNow: 'Pay Now',
    initializing: 'Initializing...',
    termsTitle: 'Terms & Conditions',
    termsText: 'I agree that all purchases are final and non-refundable. Unused credits may be transferred to another member.',
    termsRequired: 'Please agree to the terms before paying.',
  },
  ko: {
    loading: '결제 화면을 불러오는 중...',
    orderSummary: '주문 요약',
    payNow: '결제하기',
    initializing: '준비 중...',
    termsTitle: '약관 동의',
    termsText: '본 결제는 환불이 불가능한 최종 결제임에 동의합니다. 사용하지 않은 잔여 크레딧은 다른 회원에게 양도할 수 있습니다.',
    termsRequired: '결제 전에 약관에 동의해 주세요.',
  },
} as const;

export const successT = {
  en: {
    processing: 'Processing payment...',
    complete: 'Payment Complete!',
    creditsAdded: 'credits have been added to your account.',
    goMypage: 'Go to My Page',
    failed: 'Payment Failed',
    contactSupport: 'Contact Support',
    retry: 'Retry',
  },
  ko: {
    processing: '결제를 처리하는 중...',
    complete: '결제가 완료되었습니다!',
    creditsAdded: '크레딧이 적립되었습니다.',
    goMypage: '마이페이지로 이동',
    failed: '결제에 실패했습니다',
    contactSupport: '고객지원 문의',
    retry: '다시 시도',
  },
} as const;

export const failT = {
  en: {
    title: 'Payment Failed',
    tryAgain: 'Try Again',
    contactSupport: 'Contact Support',
  },
  ko: {
    title: '결제에 실패했습니다',
    tryAgain: '다시 시도',
    contactSupport: '고객지원 문의',
  },
} as const;
import { supabase } from './supabase';

export interface Product {
  id: string;
  name: string;
  tagline: string;
  description: string;
  features: string[];
  paddleProductId: string;
  priceNote: string;
  popular?: boolean;
  cta: string;
}

export interface PaddlePriceInfo {
  priceId: string;
  productId: string;
  amount: number;
  currency: string;
  formattedPrice: string;
}

export async function getPaddlePriceInfo(productId: string): Promise<PaddlePriceInfo | null> {
  if (!productId) return null;
  try {
    const { data, error } = await supabase.functions.invoke('get-paddle-price', {
      body: { productId },
    });
    if (error || !data || data.error) {
      console.error('getPaddlePriceInfo error:', error || data?.error);
      return null;
    }
    return data as PaddlePriceInfo;
  } catch (err) {
    console.error('getPaddlePriceInfo failed:', err);
    return null;
  }
}

export const products: Product[] = [
  {
    id: 'single-session',
    name: '30-Minute Coaching',
    tagline: 'Single Session',
    description:
      'A focused 1:1 session to sharpen your Korean speaking and build real confidence.',
    features: [
      '1:1 live video session',
      'Personalized speaking & pronunciation feedback',
      'Real-life conversation practice',
      'Book anytime that suits you',
    ],
    paddleProductId: process.env.NEXT_PUBLIC_PADDLE_SINGLE_SESSION || '',
    priceNote: 'one-time',
    cta: 'Book This Session',
  },
  {
    id: 'ten-session-pack',
    name: '10-Session Pack',
    tagline: 'Best Value',
    description:
      'Ten structured 1:1 sessions with a custom plan to take your Korean to the next level.',
    features: [
      '10 live 1:1 sessions',
      'Custom lesson plan & progress tracking',
      'Priority scheduling',
      'Homework & review materials',
      'Save vs. single sessions',
    ],
    paddleProductId: process.env.NEXT_PUBLIC_PADDLE_TEN_SESSION_PACK || '',
    priceNote: 'one-time',
    popular: true,
    cta: 'Get the Pack',
  },
  {
    id: 'ten-session-special',
    name: '10-Session Special',
    tagline: 'Limited Event',
    description:
      'Special event pricing for our 10-session package. $100 off the regular $400 value.',
    features: [
      '10 live 1:1 sessions',
      'Only $30 per session (save $10 each)',
      'Custom lesson plan & progress tracking',
      'Priority scheduling',
      'Homework & review materials',
      'Limited-time offer',
    ],
    paddleProductId: process.env.NEXT_PUBLIC_PADDLE_TEN_SESSION_SPECIAL || '',
    priceNote: 'one-time',
    cta: 'Get Special Offer',
  },
];
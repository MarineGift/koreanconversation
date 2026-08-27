import { supabase } from './supabase';

export async function createAirwallexIntent(packId: string, siteUrl?: string) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-airwallex-intent`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    },
    body: JSON.stringify({ packId, siteUrl }),
  });

  const rawText = await res.text();
  let body: any = null;
  try {
    body = JSON.parse(rawText);
  } catch {}

  if (!res.ok) {
    const msg = body?.error || `Edge Function error ${res.status}`;
    const detail = body?.detail ? ` (${JSON.stringify(body.detail)})` : '';
    throw new Error(msg + detail);
  }

  if (!body || body.error) {
    const msg = body?.error || 'Failed to create PaymentIntent';
    const detail = body?.detail ? ` (${JSON.stringify(body.detail)})` : '';
    throw new Error(msg + detail);
  }

  return body as {
    orderId: string;
    paymentIntentId: string;
    clientSecret: string;
    amount: number;
    currency: 'KRW' | 'USD';
    credits: number;
    orderName: string;
  };
}

let airwallexInitPromise: Promise<void> | null = null;
let airwallexScriptLoaded = false;

export function loadAirwallex(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (airwallexScriptLoaded || (typeof window !== 'undefined' && (window as any).Airwallex)) {
      resolve();
      return;
    }
    const existing = document.querySelector('script[src="https://checkout.airwallex.com/assets/elements.bundle.min.js"]');
    if (existing) {
      const loadHandler = () => {
        airwallexScriptLoaded = true;
        resolve();
      };
      const errHandler = () => reject(new Error('Failed to load Airwallex SDK'));
      existing.addEventListener('load', loadHandler, { once: true });
      existing.addEventListener('error', errHandler, { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.airwallex.com/assets/elements.bundle.min.js';
    script.async = true;
    script.onload = () => {
      airwallexScriptLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load Airwallex SDK'));
    document.head.appendChild(script);
  });
}

export async function initAirwallex(): Promise<void> {
  if (airwallexInitPromise) {
    try {
      await airwallexInitPromise;
      return;
    } catch {
      airwallexInitPromise = null;
    }
  }

  airwallexInitPromise = new Promise<void>((resolve, reject) => {
    const Airwallex = typeof window !== 'undefined' && (window as any).Airwallex;
    if (!Airwallex) {
      reject(new Error('Airwallex SDK not loaded'));
      return;
    }
    Airwallex.init({
      env: 'demo',
      origin: window.location.origin,
    });
    resolve();
  });

  airwallexInitPromise.catch(() => {
    airwallexInitPromise = null;
  });

  return airwallexInitPromise;
}
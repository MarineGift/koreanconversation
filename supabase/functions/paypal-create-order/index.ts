import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const PAYPAL_CLIENT_ID = Deno.env.get('PAYPAL_CLIENT_ID') || '';
const PAYPAL_SECRET = Deno.env.get('PAYPAL_SECRET') || '';
const PAYPAL_ENV = (Deno.env.get('PAYPAL_ENVIRONMENT') || 'sandbox').toLowerCase();
const PAYPAL_API_BASE = PAYPAL_ENV === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
const PAYPAL_CHECKOUT_BASE = PAYPAL_ENV === 'live' ? 'https://www.paypal.com' : 'https://www.sandbox.paypal.com';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const creditPacks = [
  { id: 'pack-5', credits: 5, prices: { KRW: 233000, USD: 175 } },
  { id: 'pack-10', credits: 10, prices: { KRW: 399000, USD: 300 } },
  { id: 'pack-40', credits: 40, prices: { KRW: 1330000, USD: 1000 } },
];

const testCreditPacks = [
  { id: 'test-pack-1', credits: 1, prices: { KRW: 1400, USD: 1 } },
  { id: 'test-pack-5', credits: 5, prices: { KRW: 7000, USD: 5 } },
];

function encodeBasic(key: string, secret: string): string {
  try {
    return btoa(`${key}:${secret}`);
  } catch {
    const bin = new TextEncoder().encode(`${key}:${secret}`);
    let res = '';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    for (let i = 0; i < bin.length; i += 3) {
      const a = bin[i];
      const b = bin[i + 1] ?? 0;
      const c = bin[i + 2] ?? 0;
      res += chars[a >> 2];
      res += chars[((a & 3) << 4) | (b >> 4)];
      res += chars[((b & 15) << 2) | (c >> 6)];
      res += chars[c & 63];
    }
    const pad = bin.length % 3;
    if (pad === 1) {
      res = res.slice(0, -2) + '==';
    } else if (pad === 2) {
      res = res.slice(0, -1) + '=';
    }
    return res;
  }
}

async function getPayPalToken(): Promise<string> {
  console.log(`[paypal-create-order] env=${PAYPAL_ENV}, apiBase=${PAYPAL_API_BASE}, clientIdLen=${PAYPAL_CLIENT_ID.length}, secretLen=${PAYPAL_SECRET.length}`);
  const res = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${encodeBasic(PAYPAL_CLIENT_ID, PAYPAL_SECRET)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`[paypal-create-order] PayPal auth failed. status=${res.status}, response=${text}`);
    throw new Error(`PayPal 인증 실패: 등록된 Client ID/Secret이 유효하지 않습니다. developer.paypal.com에서 ${PAYPAL_ENV === 'live' ? 'Live' : 'Sandbox'} REST API App의 Secret을 정확히 복사했는지 확인해 주세요.`);
  }
  const data = await res.json();
  return data.access_token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  try {
    if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
      console.error('[paypal-create-order] missing credentials');
      return json({ error: 'PayPal credentials not configured in Edge Function Secrets', detail: 'PAYPAL_CLIENT_ID and PAYPAL_SECRET must be set in Supabase Edge Function secrets.' }, 500);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (!token) return json({ error: 'Unauthorized', detail: 'Authorization header is missing.' }, 401);
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    const userEmail = (userData?.user?.email ?? '').toLowerCase();
    if (userError || !userEmail) return json({ error: 'Unauthorized', detail: userError?.message || 'Invalid or expired session token. Please log in again.' }, 401);

    const body = await req.json().catch(() => null);
    const packId = body?.packId;
    const organizationId = body?.organizationId || null;
    if (!packId) return json({ error: 'packId is required', detail: 'No credit pack was selected.' }, 400);

    const allPacks = [...creditPacks, ...testCreditPacks];
    const pack = allPacks.find((p) => p.id === packId);
    if (!pack) return json({ error: 'Invalid pack', detail: `Pack ID '${packId}' is not recognized.` }, 400);

    const currency = 'USD';
    const amount = pack.prices.USD;

    const orderId = `ord-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const { error: insertError } = await supabase.from('orders').insert({
      order_id: orderId,
      member_email: userEmail,
      pack_id: packId,
      credits: pack.credits,
      amount,
      currency,
      payment_method: 'paypal',
      status: 'pending',
      organization_id: organizationId,
    });

    if (insertError) {
      console.error('[paypal-create-order] order insert failed:', insertError);
      return json({ error: 'Order insert failed', detail: insertError.message }, 500);
    }

    const orderName = `${pack.credits} Coaching Credits`;

    const paypalToken = await getPayPalToken();

    const paypalBody: any = {
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: currency,
          value: amount.toString(),
        },
        description: orderName,
        custom_id: orderId,
        invoice_id: orderId,
      }],
    };

    if (body?.returnUrl && body?.cancelUrl) {
      paypalBody.payment_source = {
        paypal: {
          experience_context: {
            return_url: body.returnUrl,
            cancel_url: body.cancelUrl,
          },
        },
      };
    }

    const paypalRes = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paypalToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paypalBody),
    });

    const paypalData = await paypalRes.json().catch(() => null);
    if (!paypalRes.ok) {
      console.error('[paypal-create-order] PayPal order creation failed:', paypalData);
      const detail = paypalData?.details?.[0]?.description || paypalData?.message || JSON.stringify(paypalData);
      return json({ error: 'PayPal order creation failed', detail }, 500);
    }

    const paypalOrderId = paypalData?.id;
    if (!paypalOrderId) {
      console.error('[paypal-create-order] PayPal response missing order id:', paypalData);
      return json({ error: 'PayPal response missing order id', detail: 'PayPal did not return an order ID.' }, 500);
    }

    await supabase.from('orders').update({
      payment_key: paypalOrderId,
      updated_at: new Date().toISOString(),
    }).eq('order_id', orderId);

    let approveUrl = paypalData?.links?.find((l: any) => l.rel === 'approve')?.href || null;
    if (!approveUrl) {
      approveUrl = paypalData?.links?.find((l: any) => l.rel === 'payer-action')?.href || null;
    }
    if (!approveUrl) {
      approveUrl = `${PAYPAL_CHECKOUT_BASE}/checkoutnow?token=${paypalOrderId}`;
    }

    console.log(`[paypal-create-order] success. orderId=${orderId}, paypalOrderId=${paypalOrderId}, approveUrl=${approveUrl}`);

    return json({
      orderId,
      paypalOrderId,
      approveUrl,
      amount,
      currency,
      credits: pack.credits,
      orderName,
    });
  } catch (err: any) {
    console.error('[paypal-create-order] error:', err);
    return json({ error: err.message || String(err), detail: err.stack || '' }, 500);
  }
});

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const PAYPAL_CLIENT_ID = Deno.env.get('PAYPAL_CLIENT_ID') || '';
const PAYPAL_SECRET = Deno.env.get('PAYPAL_SECRET') || '';
const PAYPAL_ENV = (Deno.env.get('PAYPAL_ENVIRONMENT') || 'sandbox').toLowerCase();
const PAYPAL_API_BASE = PAYPAL_ENV === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

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
  console.log(`[paypal-capture-order] env=${PAYPAL_ENV}, apiBase=${PAYPAL_API_BASE}, clientIdLen=${PAYPAL_CLIENT_ID.length}, secretLen=${PAYPAL_SECRET.length}`);
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
    console.error(`[paypal-capture-order] PayPal auth failed. status=${res.status}, response=${text}`);
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
      console.error('[paypal-capture-order] missing credentials');
      return json({ error: 'PayPal credentials not configured in Edge Function Secrets', detail: 'PAYPAL_CLIENT_ID and PAYPAL_SECRET must be set in Supabase Edge Function secrets.' }, 500);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json().catch(() => null);
    const paypalOrderId = body?.paypalOrderId;
    const orderId = body?.orderId;

    if (!paypalOrderId) {
      return json({ error: 'Missing paypalOrderId', detail: 'PayPal order token was not provided in the request.' }, 400);
    }

    let order: any = null;
    if (orderId) {
      const { data: foundOrder } = await supabase
        .from('orders')
        .select('*')
        .eq('order_id', orderId)
        .maybeSingle();
      order = foundOrder;
    }

    if (!order) {
      const { data: foundOrder } = await supabase
        .from('orders')
        .select('*')
        .eq('payment_key', paypalOrderId)
        .maybeSingle();
      order = foundOrder;
    }

    if (!order) {
      return json({ error: 'Order not found', detail: `No pending order found for PayPal order ID: ${paypalOrderId}. The order may have already been processed or does not exist.` }, 404);
    }

    if (order.status === 'completed') {
      return json({ success: true, credits: order.credits, orderId: order.order_id });
    }

    const paypalToken = await getPayPalToken();

    const captureRes = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${paypalOrderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paypalToken}`,
        'Content-Type': 'application/json',
      },
    });

    const captureData = await captureRes.json().catch(() => null);

    if (!captureRes.ok) {
      console.error('[paypal-capture-order] capture failed:', captureData);
      await supabase.from('orders').update({
        status: 'failed',
        updated_at: new Date().toISOString(),
      }).eq('order_id', order.order_id);

      const detail = captureData?.details?.[0]?.description || captureData?.message || JSON.stringify(captureData);
      return json({
        success: false,
        error: 'PayPal capture failed',
        details: captureData?.details,
        detail,
      }, 400);
    }

    console.log(`[paypal-capture-order] capture success. orderId=${order.order_id}, paypalOrderId=${paypalOrderId}`);

    const { data: member } = await supabase
      .from('members')
      .select('session_credits')
      .eq('email', order.member_email)
      .maybeSingle();

    const currentCredits = member?.session_credits ?? 0;
    const newCredits = currentCredits + order.credits;

    await supabase.from('members').update({
      session_credits: newCredits,
    }).eq('email', order.member_email);

    await supabase.from('orders').update({
      status: 'completed',
      payment_method: 'paypal',
      updated_at: new Date().toISOString(),
    }).eq('order_id', order.order_id);

    return json({
      success: true,
      credits: order.credits,
      orderId: order.order_id,
    });
  } catch (err: any) {
    console.error('[paypal-capture-order] error:', err);
    return json({ error: err.message || String(err), detail: err.stack || '' }, 500);
  }
});

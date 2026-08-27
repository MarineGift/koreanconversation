import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const AIRWALLEX_CLIENT_ID = Deno.env.get('AIRWALLEX_CLIENT_ID') || '';
const AIRWALLEX_API_KEY = Deno.env.get('AIRWALLEX_API_KEY') || '';

const AIRWALLEX_BASE = 'https://api-demo.airwallex.com/api/v1';

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

async function getAirwallexToken(): Promise<string> {
  const res = await fetch(`${AIRWALLEX_BASE}/authentication/login`, {
    method: 'POST',
    headers: {
      'x-client-id': AIRWALLEX_CLIENT_ID,
      'x-api-key': AIRWALLEX_API_KEY,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Airwallex auth failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  return data.token as string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  try {
    if (!AIRWALLEX_CLIENT_ID || !AIRWALLEX_API_KEY) {
      return json({ error: 'Airwallex credentials not configured' }, 500);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (!token) return json({ error: 'Unauthorized' }, 401);
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    const userEmail = (userData?.user?.email ?? '').toLowerCase();
    if (userError || !userEmail) return json({ error: 'Unauthorized' }, 401);

    const body = await req.json().catch(() => null);
    const packId = body?.packId;
    if (!packId) return json({ error: 'packId is required' }, 400);

    const pack = creditPacks.find((p) => p.id === packId);
    if (!pack) return json({ error: 'Invalid pack' }, 400);

    const { error: memberError } = await supabase
      .from('members')
      .select('billing_region, nationality')
      .eq('email', userEmail)
      .maybeSingle();

    if (memberError) {
      return json({ error: 'Member lookup failed', detail: memberError.message }, 500);
    }

    const currency: 'USD' = 'USD';
    const amount = pack.prices.USD;

    const orderId = `ord-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const { error: insertError } = await supabase.from('orders').insert({
      order_id: orderId,
      member_email: userEmail,
      pack_id: packId,
      credits: pack.credits,
      amount,
      currency,
      status: 'pending',
    });

    if (insertError) {
      return json({ error: 'Order insert failed', detail: insertError.message }, 500);
    }

    const orderName = `${pack.credits} Coaching Credits`;

    const siteUrl = body?.siteUrl || 'https://koreancoaching.com';
    const returnUrl = `${siteUrl}/payments/success`;

    let awxToken: string;
    try {
      awxToken = await getAirwallexToken();
    } catch (authErr: any) {
      return json({ error: 'Airwallex auth failed', detail: authErr?.message || String(authErr) }, 500);
    }

    const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const intentRes = await fetch(`${AIRWALLEX_BASE}/pa/payment_intents/create`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${awxToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        request_id: requestId,
        amount,
        currency,
        merchant_order_id: orderId,
        descriptor: 'Korean Coaching',
        return_url: returnUrl,
        metadata: {
          pack_id: packId,
          credits: String(pack.credits),
          member_email: userEmail,
        },
      }),
    });

    const intentData = await intentRes.json().catch(() => null);
    if (!intentRes.ok) {
      return json({ error: 'Airwallex PaymentIntent creation failed', detail: intentData, status: intentRes.status }, 500);
    }

    const paymentIntentId = intentData?.id;
    const clientSecret = intentData?.client_secret;

    if (!paymentIntentId || !clientSecret) {
      return json({ error: 'Airwallex response missing id or client_secret', detail: intentData }, 500);
    }

    await supabase.from('orders').update({
      payment_key: paymentIntentId,
      updated_at: new Date().toISOString(),
    }).eq('order_id', orderId);

    return json({
      orderId,
      paymentIntentId,
      clientSecret,
      amount,
      currency,
      credits: pack.credits,
      orderName,
    });
  } catch (err: any) {
    return json({ error: err.message || String(err) }, 500);
  }
});

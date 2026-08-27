import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

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

function getBillingRegion(member: any): 'KR' | 'US' {
  if (member?.billing_region === 'KR') return 'KR';
  const nationality = member?.nationality || '';
  if (/south korea|korea|한국|대한민국|kr/i.test(nationality)) return 'KR';
  return 'US';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (!token) return json({ error: 'Unauthorized' }, 401);
    const { data: userData } = await supabase.auth.getUser(token);
    const userEmail = (userData?.user?.email ?? '').toLowerCase();
    if (!userEmail) return json({ error: 'Unauthorized' }, 401);

    const body = await req.json().catch(() => null);
    const packId = body?.packId;
    if (!packId) return json({ error: 'packId is required' }, 400);

    const allPacks = [...creditPacks, ...testCreditPacks];
    const pack = allPacks.find((p) => p.id === packId);
    if (!pack) return json({ error: 'Invalid pack' }, 400);

    const { data: member } = await supabase
      .from('members')
      .select('billing_region, nationality')
      .eq('email', userEmail)
      .maybeSingle();

    const region = getBillingRegion(member);
    const currency: 'KRW' = 'KRW';
    const amount = pack.prices.KRW;

    const variantKey = Deno.env.get('TOSS_VARIANT_KEY_KRW') || 'DEFAULT';

    const orderId = `ord-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    await supabase.from('orders').insert({
      order_id: orderId,
      member_email: userEmail,
      pack_id: packId,
      credits: pack.credits,
      amount,
      currency,
      payment_method: 'toss',
      status: 'pending',
    });

    const orderName = region === 'KR'
      ? `수업 크레딧 ${pack.credits}회권`
      : `${pack.credits} Coaching Credits`;

    return json({
      orderId,
      amount,
      currency,
      variantKey,
      orderName,
      credits: pack.credits,
    });
  } catch (err: any) {
    return json({ error: err.message || String(err) }, 500);
  }
});

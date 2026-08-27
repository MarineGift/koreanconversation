import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const TOSS_SECRET_KEY = Deno.env.get('TOSS_SECRET_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function encodeBasic(key: string): string {
  const bin = new TextEncoder().encode(key + ':');
  let res = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
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

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  try {
    if (!TOSS_SECRET_KEY) {
      return json({ error: 'TOSS_SECRET_KEY not configured' }, 500);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json().catch(() => null);
    const paymentKey = body?.paymentKey;
    const orderId = body?.orderId;
    const amount = body?.amount;

    if (!paymentKey || !orderId || amount == null) {
      return json({ error: 'Missing paymentKey, orderId or amount' }, 400);
    }

    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('order_id', orderId)
      .maybeSingle();

    if (!order) {
      return json({ error: 'Order not found' }, 404);
    }

    if (order.status === 'completed') {
      return json({ success: true, credits: order.credits, orderId });
    }

    const serverAmount = Number(order.amount);
    const clientAmount = Number(amount);
    if (serverAmount !== clientAmount) {
      return json({ error: 'Amount mismatch', serverAmount, clientAmount }, 400);
    }

    const tossRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${encodeBasic(TOSS_SECRET_KEY)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentKey, orderId, amount: serverAmount }),
    });

    const tossResult = await tossRes.json().catch(() => null);

    if (!tossRes.ok) {
      await supabase.from('orders').update({
        status: 'failed',
        payment_key: paymentKey,
        toss_response: tossResult,
        updated_at: new Date().toISOString(),
      }).eq('order_id', orderId);

      return json({
        success: false,
        error: tossResult?.message || 'Toss payment confirmation failed',
        tossCode: tossResult?.code,
      }, 400);
    }

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
      payment_key: paymentKey,
      toss_response: tossResult,
      updated_at: new Date().toISOString(),
    }).eq('order_id', orderId);

    return json({
      success: true,
      credits: order.credits,
      orderId,
    });
  } catch (err: any) {
    return json({ error: err.message || String(err) }, 500);
  }
});

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const AIRWALLEX_WEBHOOK_SECRET = Deno.env.get('AIRWALLEX_WEBHOOK_SECRET') || '';

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function verifyWebhookSignature(
  payload: string,
  timestamp: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const signedPayload = `${timestamp}${payload}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(signedPayload)
  );
  return toHex(new Uint8Array(sig)) === signature;
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const payloadText = await req.text();
  const timestamp = req.headers.get('x-timestamp') || '';
  const signature = req.headers.get('x-signature') || '';

  if (!AIRWALLEX_WEBHOOK_SECRET) {
    return new Response('Webhook secret not configured', { status: 500 });
  }

  const isValid = await verifyWebhookSignature(
    payloadText,
    timestamp,
    signature,
    AIRWALLEX_WEBHOOK_SECRET
  );
  if (!isValid) {
    return new Response('Invalid signature', { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(payloadText);
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const eventName = payload?.name || '';
  const dataObject = payload?.data?.object || {};
  const intentId = dataObject?.id || '';
  const merchantOrderId = dataObject?.merchant_order_id || '';
  const status = dataObject?.status || '';

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  if (eventName === 'payment_intent.cancelled') {
    try {
      await supabase
        .from('orders')
        .update({
          status: 'failed',
          toss_response: payload,
          updated_at: new Date().toISOString(),
        })
        .eq('order_id', merchantOrderId);
    } catch {}
    return new Response(
      JSON.stringify({ received: true, processed: 'cancelled' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (eventName !== 'payment_intent.succeeded') {
    return new Response(
      JSON.stringify({ received: true, ignored: eventName }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (status !== 'SUCCEEDED' && status !== 'succeeded') {
    return new Response(
      JSON.stringify({ received: true, ignored: 'not succeeded' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!merchantOrderId) {
    return new Response('Missing merchant_order_id', { status: 400 });
  }

  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('order_id', merchantOrderId)
    .maybeSingle();

  if (!order) {
    return new Response('Order not found', { status: 404 });
  }

  if (order.status === 'completed') {
    return new Response(
      JSON.stringify({ success: true, duplicate: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { data: member } = await supabase
    .from('members')
    .select('session_credits')
    .eq('email', order.member_email)
    .maybeSingle();

  const currentCredits = member?.session_credits ?? 0;
  const newCredits = currentCredits + order.credits;

  await supabase
    .from('members')
    .update({ session_credits: newCredits })
    .eq('email', order.member_email);

  await supabase
    .from('orders')
    .update({
      status: 'completed',
      payment_key: intentId,
      toss_response: payload,
      updated_at: new Date().toISOString(),
    })
    .eq('order_id', merchantOrderId);

  return new Response(
    JSON.stringify({ success: true, creditsAdded: order.credits }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
});

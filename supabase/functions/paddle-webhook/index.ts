import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const PADDLE_WEBHOOK_SECRET = Deno.env.get('PADDLE_WEBHOOK_SECRET') || '';

function base64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function verifySignature(payload: string, signature: string, secret: string): Promise<boolean> {
  const parts = signature.split(';');
  let ts = '';
  let h1 = '';
  for (const part of parts) {
    if (part.startsWith('ts=')) ts = part.replace('ts=', '');
    if (part.startsWith('h1=')) h1 = part.replace('h1=', '');
  }
  if (!ts || !h1) return false;
  const signedPayload = `${ts}:${payload}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload));
  return base64(new Uint8Array(sig)) === h1;
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const payloadText = await req.text();
  const signature = req.headers.get('paddle-signature') || '';

  if (!PADDLE_WEBHOOK_SECRET) {
    return new Response('Webhook secret not configured', { status: 500 });
  }

  const isValid = await verifySignature(payloadText, signature, PADDLE_WEBHOOK_SECRET);
  if (!isValid) {
    return new Response('Invalid signature', { status: 401 });
  }

  const payload = JSON.parse(payloadText);
  if (payload.event_type !== 'transaction.completed') {
    return new Response('Event ignored', { status: 200 });
  }

  const data = payload.data || {};
  const custom = data.custom_data || {};
  const totals = data.details?.totals || {};

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const sessionType = custom.sessionType || 'single';
  const bookingId = crypto.randomUUID();

  const question = custom.question || null;
  if (question) {
    try {
      await supabase.from('coach_questions').insert({
        coach_id: custom.coachId,
        booking_id: bookingId,
        organization_id: custom.organizationId || null,
        member_name: custom.name,
        member_email: custom.email,
        question,
      });
    } catch {}
  }

  try {
    await supabase.from('members').upsert({
      email: custom.email,
      full_name: custom.name,
      nationality: custom.nationality,
      organization_id: custom.organizationId || null,
      inputter: 'paddle',
    }, { onConflict: 'email' });
  } catch {}

  if (sessionType === 'package') {
    try {
      const { data: member } = await supabase
        .from('members')
        .select('session_credits')
        .eq('email', custom.email)
        .maybeSingle();
      const current = member?.session_credits ?? 0;
      await supabase
        .from('members')
        .update({ session_credits: current + 10 })
        .eq('email', custom.email);
    } catch {}
  }

  let siteUrl = '';
  if (custom.organizationId) {
    try {
      const { data: org } = await supabase
        .from('organizations')
        .select('website_url')
        .eq('id', custom.organizationId)
        .maybeSingle();
      siteUrl = org?.website_url ?? '';
    } catch {}
  }

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      id: bookingId,
      coach_id: custom.coachId,
      organization_id: custom.organizationId || null,
      name: custom.name,
      email: custom.email,
      nationality: custom.nationality,
      booking_date: custom.date,
      slot: custom.slot,
      session_type: sessionType,
      quantity: custom.quantity || 1,
      status: 'pending',
      room_url: null,
      paddle_transaction_id: data.id,
      amount_paid: totals.total ? parseFloat(totals.total) : null,
      currency: totals.currency_code || 'USD',
      ip_address: custom.ipAddress || null,
      user_agent: custom.userAgent || null,
      country_code: custom.countryCode || null,
      browser_info: custom.browserInfo || null,
      os_info: custom.osInfo || null,
      region_city: custom.regionCity || null,
      site_url: siteUrl || null,
    })
    .select()
    .single();

  if (bookingError) {
    return new Response(JSON.stringify({ error: bookingError.message }), { status: 500 });
  }

  if (sessionType === 'package') {
    try {
      const { data: member } = await supabase
        .from('members')
        .select('session_credits')
        .eq('email', custom.email)
        .maybeSingle();
      const current = member?.session_credits ?? 0;
      await supabase
        .from('members')
        .update({ session_credits: Math.max(0, current - 1) })
        .eq('email', custom.email);
    } catch {}
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});

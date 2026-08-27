import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const RELAY_DEFAULT_URL = 'https://urm.marinebiogroup.com/api/relay/mail';
const RELAY_PROFILE = 'koreancoaching';
const RELAY_TIMEOUT_MS = 20000;
const RELAY_MAX_RETRIES = 2;
const RELAY_BASE_DELAY_MS = 500;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

async function sendMail(opts: { to: string; subject: string; html: string }): Promise<void> {
  const url = Deno.env.get('MAIL_RELAY_URL') || RELAY_DEFAULT_URL;
  const token = Deno.env.get('MAIL_RELAY_TOKEN') || '';
  let lastError = 'unknown_error';
  for (let attempt = 0; attempt <= RELAY_MAX_RETRIES; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, RELAY_BASE_DELAY_MS * 2 ** (attempt - 1)));
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), RELAY_TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-relay-token': token },
        body: JSON.stringify({ profile: RELAY_PROFILE, to: opts.to, subject: opts.subject, html: opts.html }),
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timer);
      lastError = (err as any)?.name === 'AbortError' ? 'timeout' : 'network_error';
      continue;
    }
    clearTimeout(timer);
    const data = await res.json().catch(() => null);
    if (res.ok && data?.ok) return;
    lastError = data?.error || `http_${res.status}`;
    if (res.status >= 500) continue;
    throw new Error(`Mail relay failed: ${lastError}`);
  }
  throw new Error(`Mail relay failed: ${lastError}`);
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
    const bookingId = body?.bookingId;
    const reason = typeof body?.reason === 'string' ? body.reason : '';
    if (!bookingId) return json({ error: 'bookingId is required' }, 400);

    const { data: booking } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .maybeSingle();
    if (!booking) return json({ error: 'Booking not found' }, 404);

    const { data: member } = await supabase
      .from('members')
      .select('role')
      .eq('email', userEmail)
      .maybeSingle();
    const isAdmin = member?.role === 'admin';

    const { data: coach } = await supabase
      .from('coaches')
      .select('id')
      .eq('email', userEmail)
      .maybeSingle();
    const isOwnerCoach = coach ? coach.id === booking.coach_id : false;

    if (!isAdmin && !isOwnerCoach) return json({ error: 'Unauthorized' }, 403);

    const { data: coachInfo } = await supabase
      .from('coaches')
      .select('name, email')
      .eq('id', booking.coach_id)
      .maybeSingle();

    await supabase.from('coach_questions').delete().eq('booking_id', bookingId);
    const { error: delError } = await supabase.from('bookings').delete().eq('id', bookingId);
    if (delError) return json({ error: delError.message }, 500);

    const sessionLabel = booking.session_type === 'free' ? 'Free 10-min Session' : '1:1 Coaching Session';
    const coachName = coachInfo?.name || 'Your coach';

    const studentHtml = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#171717;background:#FBF7F2;">
        <h2 style="margin:0 0 6px;font-size:22px;">Hi ${booking.name}, your booking was declined</h2>
        <p style="margin:0 0 24px;color:#737373;font-size:15px;line-height:1.6;">Your coach ${coachName} could not accept your ${sessionLabel.toLowerCase()}.${reason ? ` Reason: ${reason}` : ''}</p>
        <div style="background:#ffffff;border:1px solid #e5e5e5;border-radius:16px;padding:20px 24px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:10px 0;color:#737373;font-size:14px;">Session</td><td style="padding:10px 0;font-weight:600;font-size:14px;color:#171717;">${sessionLabel}</td></tr>
            <tr><td style="padding:10px 0;color:#737373;font-size:14px;">Date</td><td style="padding:10px 0;font-weight:600;font-size:14px;color:#171717;">${booking.booking_date}</td></tr>
            <tr><td style="padding:10px 0;color:#737373;font-size:14px;">Time</td><td style="padding:10px 0;font-weight:600;font-size:14px;color:#171717;">${booking.slot}</td></tr>
          </table>
        </div>
        <p style="margin:24px 0 0;color:#a3a3a3;font-size:12px;line-height:1.6;">You can book another session at any time through our website.</p>
      </div>
    `;

    try {
      await sendMail({ to: booking.email, subject: `Booking declined — ${booking.booking_date} ${booking.slot}`, html: studentHtml });
    } catch (err) {
      console.error('decline email failed:', err);
    }

    return json({ ok: true });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});

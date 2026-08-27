import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function sessionEnd(bookingDate: string, slot: string, sessionType: string | null): number {
  const durationMin = sessionType === 'free' ? 10 : 30;
  const t = Date.parse(`${bookingDate}T${slot}:00Z`);
  if (isNaN(t)) return 0;
  return t + durationMin * 60 * 1000;
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

    const isOwner = (booking.email ?? '').toLowerCase() === userEmail;

    if (!isAdmin && !isOwnerCoach && !isOwner) return json({ error: 'Unauthorized' }, 403);

    if (booking.status !== 'confirmed') return json({ ok: true, settled: false });

    const end = sessionEnd(booking.booking_date, booking.slot, booking.session_type);
    if (Date.now() < end) return json({ ok: true, settled: false });

    const joined = !!booking.joined_at;
    let newStatus = 'completed';
    let deducted = false;

    if (!joined) {
      newStatus = 'no_show';
      if (booking.session_type !== 'free' && !booking.credit_deducted) {
        const { data: memberRow } = await supabase
          .from('members')
          .select('session_credits')
          .eq('email', booking.email)
          .maybeSingle();
        const current = memberRow?.session_credits ?? 0;
        const next = Math.max(0, current - 1);
        await supabase.from('members').update({ session_credits: next }).eq('email', booking.email);
        deducted = true;
      }
    }

    await supabase.from('bookings').update({ status: newStatus, credit_deducted: !joined && booking.session_type !== 'free' ? true : booking.credit_deducted }).eq('id', bookingId);

    return json({ ok: true, settled: true, status: newStatus, credit_deducted: deducted });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});

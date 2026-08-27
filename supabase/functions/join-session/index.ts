import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const DAILY_API_KEY = Deno.env.get('DAILY_API_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function sessionExp(bookingDate: string, slot: string, sessionType: string | null): number {
  const durationMin = sessionType === 'free' ? 10 : 30;
  const t = Date.parse(`${bookingDate}T${slot}:00Z`);
  if (isNaN(t)) return Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7;
  return Math.floor(t / 1000) + durationMin * 60 + 60 * 60 * 24;
}

async function ensureDailyRoom(bookingId: string, bookingDate: string, slot: string, sessionType: string | null): Promise<string> {
  if (!DAILY_API_KEY) return '';
  const safeName = `kc-${String(bookingId).replace(/-/g, '')}`.slice(0, 60);
  const exp = sessionExp(bookingDate, slot, sessionType);
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch('https://api.daily.co/v1/rooms', {
        method: 'POST',
        headers: { Authorization: `Bearer ${DAILY_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: safeName,
          properties: {
            enable_chat: true,
            enable_screenshare: true,
            start_video_off: false,
            start_audio_off: false,
            exp,
          },
        }),
      });
      const roomData = await res.json().catch(() => null);
      if (res.ok && roomData?.url) return roomData.url;
      const getRes = await fetch(`https://api.daily.co/v1/rooms/${safeName}`, {
        headers: { Authorization: `Bearer ${DAILY_API_KEY}` },
      });
      const getData = await getRes.json().catch(() => null);
      if (getRes.ok && getData?.url) return getData.url;
    } catch (_err) {
      // retry below
    }
    if (attempt < 2) await new Promise((r) => setTimeout(r, 300 * 2 ** attempt));
  }
  return '';
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

    if (booking.status === 'cancelled') return json({ error: 'Booking was cancelled' }, 400);

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

    const roomUrl = booking.room_url || await ensureDailyRoom(booking.id, booking.booking_date, booking.slot, booking.session_type);

    let deducted = false;

    if (isOwner) {
      const updates: Record<string, unknown> = {};
      if (!booking.joined_at) updates.joined_at = new Date().toISOString();
      if (booking.session_type !== 'free' && !booking.credit_deducted) {
        const { data: memberRow } = await supabase
          .from('members')
          .select('session_credits')
          .eq('email', booking.email)
          .maybeSingle();
        const current = memberRow?.session_credits ?? 0;
        const next = Math.max(0, current - 1);
        await supabase.from('members').update({ session_credits: next }).eq('email', booking.email);
        updates.credit_deducted = true;
        deducted = true;
      }
      if (roomUrl) updates.room_url = roomUrl;
      await supabase.from('bookings').update(updates).eq('id', bookingId);
    } else if (roomUrl) {
      await supabase.from('bookings').update({ room_url: roomUrl }).eq('id', bookingId);
    }

    return json({ ok: true, room_url: roomUrl, credit_deducted: deducted });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});

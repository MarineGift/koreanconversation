import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const DAILY_API_KEY = Deno.env.get('DAILY_API_KEY') || '';
const NOTIFY_SECRET = 'booking-notify-7f3a9c2e';

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

    const { data: member } = await supabase
      .from('members')
      .select('role')
      .eq('email', userEmail)
      .maybeSingle();
    const isAdmin = member?.role === 'admin';

    const { data: coach } = await supabase
      .from('coaches')
      .select('id, name, email')
      .eq('email', userEmail)
      .maybeSingle();
    const isOwnerCoach = coach ? coach.id === booking.coach_id : false;

    const isBookingOwner = (booking.email ?? '').toLowerCase() === userEmail;

    if (!isAdmin && !isOwnerCoach && !isBookingOwner) return json({ error: 'Unauthorized' }, 403);

    if (booking.status === 'confirmed' && booking.room_url) {
      return json({ ok: true, room_url: booking.room_url });
    }

    const roomUrl = await ensureDailyRoom(booking.id, booking.booking_date, booking.slot, booking.session_type);

    const { error: updateError } = await supabase
      .from('bookings')
      .update({ status: 'confirmed', room_url: roomUrl || null })
      .eq('id', bookingId);
    if (updateError) return json({ error: updateError.message }, 500);

    // Send confirmation email directly with room link
    try {
      const coachInfo = await supabase
        .from('coaches')
        .select('name, email')
        .eq('id', booking.coach_id)
        .maybeSingle();

      const notifyRes = await fetch(`${SUPABASE_URL}/functions/v1/notify-booking-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-notify-secret': NOTIFY_SECRET,
        },
        body: JSON.stringify({
          name: booking.name,
          email: booking.email,
          nationality: booking.nationality,
          date: booking.booking_date,
          slot: booking.slot,
          session_type: booking.session_type,
          room_url: roomUrl,
          coach_email: coachInfo.data?.email || booking.coach_email || null,
          coach_name: coachInfo.data?.name || booking.coach_name || 'Your coach',
          status: 'confirmed',
        }),
      });
      const notifyText = await notifyRes.text();
      let notifyData: any = null;
      try { notifyData = JSON.parse(notifyText); } catch {}
      if (!notifyRes.ok) {
        console.error('[confirm-booking] notify email failed:', notifyData || notifyText);
      }
    } catch (err) {
      console.error('[confirm-booking] notify email error:', err);
    }

    return json({ ok: true, room_url: roomUrl, room_error: roomUrl ? null : 'failed_to_create_room' });
  } catch (err) {
    console.error('[confirm-booking] error:', err);
    return json({ error: String(err) }, 500);
  }
});

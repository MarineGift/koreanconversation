import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

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
    const fromEmail = (userData?.user?.email ?? '').toLowerCase();
    if (!fromEmail) return json({ error: 'Unauthorized' }, 401);

    const body = await req.json().catch(() => null);
    const toEmail = (body?.toEmail ?? '').toLowerCase().trim();
    const credits = Number(body?.credits);

    if (!toEmail || !Number.isInteger(credits) || credits <= 0) {
      return json({ error: '유효한 이메일과 양수 크레딧을 입력하세요.' }, 400);
    }
    if (toEmail === fromEmail) return json({ error: '본인에게는 양도할 수 없습니다.' }, 400);

    const { data: sender } = await supabase
      .from('members')
      .select('session_credits')
      .eq('email', fromEmail)
      .maybeSingle();
    const senderCredits = sender?.session_credits ?? 0;
    if (senderCredits < credits) {
      return json({ error: '보유 크레딧이 부족합니다.' }, 400);
    }

    const { data: recipient } = await supabase
      .from('members')
      .select('session_credits')
      .eq('email', toEmail)
      .maybeSingle();

    const newSender = senderCredits - credits;

    await supabase.from('members').update({ session_credits: newSender }).eq('email', fromEmail);

    if (recipient) {
      const newRecipient = (recipient.session_credits ?? 0) + credits;
      await supabase.from('members').update({ session_credits: newRecipient }).eq('email', toEmail);
    } else {
      await supabase.from('members').insert({
        email: toEmail,
        role: 'member',
        session_credits: credits,
        full_name: null,
        nationality: null,
        study_purpose: null,
        organization_id: null,
        inputter: 'credit-transfer',
        password: null,
        billing_region: null,
      });
    }

    await supabase.from('credit_transfers').insert({
      from_email: fromEmail,
      to_email: toEmail,
      credits,
    });

    return json({ ok: true, transferred: credits, remaining: newSender });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});

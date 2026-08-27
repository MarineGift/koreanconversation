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

function toHtml(text: string): string {
  const safe = String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const bodyHtml = safe.split(/\n+/).map((line) => `<p style="margin:0 0 14px;">${line}</p>`).join('');
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#171717;background:#FBF7F2;">
      <div style="background:#ffffff;border:1px solid #e5e5e5;border-radius:16px;padding:28px 24px;line-height:1.7;font-size:15px;color:#262626;">${bodyHtml}</div>
      <p style="margin:22px 0 0;color:#a3a3a3;font-size:12px;line-height:1.6;">You are receiving this because you joined as a member. If you no longer wish to receive these emails, you can unsubscribe anytime.</p>
    </div>
  `;
}

async function sendMail(opts: { to: string | string[]; subject: string; html?: string; text?: string; replyTo?: string }): Promise<string> {
  const url = Deno.env.get('MAIL_RELAY_URL') || RELAY_DEFAULT_URL;
  const token = Deno.env.get('MAIL_RELAY_TOKEN') || '';
  let lastError = 'unknown_error';
  for (let attempt = 0; attempt <= RELAY_MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, RELAY_BASE_DELAY_MS * 2 ** (attempt - 1)));
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), RELAY_TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-relay-token': token },
        body: JSON.stringify({
          profile: RELAY_PROFILE,
          to: opts.to,
          subject: opts.subject,
          ...(opts.html ? { html: opts.html } : {}),
          ...(opts.text ? { text: opts.text } : {}),
          ...(opts.replyTo ? { replyTo: opts.replyTo } : {}),
        }),
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timer);
      lastError = (err as any)?.name === 'AbortError' ? 'timeout' : 'network_error';
      continue;
    }
    clearTimeout(timer);
    const data = await res.json().catch(() => null);
    const errorCode = data?.error || `http_${res.status}`;
    if (res.ok && data?.ok) {
      return data?.messageId || '';
    }
    lastError = errorCode;
    if (res.status >= 500) continue;
    throw new Error(`Mail relay failed: ${errorCode}`);
  }
  throw new Error(`Mail relay failed: ${lastError}`);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  async function sendEmail(toEmail: string, subject: string, html: string): Promise<boolean> {
    try {
      await sendMail({ to: toEmail, subject, html });
      return true;
    } catch (err) {
      console.error('[run-marketing-sequence] sendMail failed:', err);
      return false;
    }
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: members } = await supabase.from('members').select('email, full_name, created_at');
    const { data: bookings } = await supabase.from('bookings').select('email');
    const bookedEmails = new Set((bookings ?? []).map((b) => (b.email || '').toLowerCase().trim()));

    const targets = (members ?? []).filter(
      (m) => m.email && !bookedEmails.has(m.email.toLowerCase().trim())
    );

    const { data: sequences } = await supabase
      .from('marketing_sequences')
      .select('*')
      .eq('is_active', true)
      .order('day_offset', { ascending: true })
      .order('sort_order', { ascending: true });

    const { data: sends } = await supabase.from('marketing_sends').select('member_email, sequence_id');
    const sentMap = new Map<string, Set<string>>();
    for (const s of sends ?? []) {
      const set = sentMap.get(s.member_email) ?? new Set<string>();
      set.add(s.sequence_id);
      sentMap.set(s.member_email, set);
    }

    let sentCount = 0;
    const results: { email: string; subject: string }[] = [];
    const now = Date.now();

    for (const m of targets) {
      const created = new Date(m.created_at).getTime();
      const daysSince = Math.floor((now - created) / 86400000);
      const sentSet = sentMap.get(m.email) ?? new Set<string>();
      const due = (sequences ?? []).filter((s) => s.day_offset <= daysSince && !sentSet.has(s.id));
      if (due.length === 0) continue;

      const next = due[due.length - 1];
      const ok = await sendEmail(m.email, next.subject, toHtml(next.body));
      if (ok) {
        await supabase.from('marketing_sends').insert({ member_email: m.email, sequence_id: next.id });
        sentCount++;
        results.push({ email: m.email, subject: next.subject });
      }
    }

    return json({ ok: true, sent: sentCount, total_targets: targets.length, results });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});

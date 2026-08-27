import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const RELAY_DEFAULT_URL = "https://urm.marinebiogroup.com/api/relay/mail";
const RELAY_PROFILE = "koreancoaching";
const RELAY_TIMEOUT_MS = 20000;
const RELAY_MAX_RETRIES = 2;
const RELAY_BASE_DELAY_MS = 500;

async function sendMail(opts: { to: string | string[]; subject: string; html?: string; text?: string; replyTo?: string }): Promise<string> {
  const url = Deno.env.get("MAIL_RELAY_URL") || RELAY_DEFAULT_URL;
  const token = Deno.env.get("MAIL_RELAY_TOKEN") || "";
  let lastError = "unknown_error";
  for (let attempt = 0; attempt <= RELAY_MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, RELAY_BASE_DELAY_MS * 2 ** (attempt - 1)));
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), RELAY_TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-relay-token": token },
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
      lastError = (err as any)?.name === "AbortError" ? "timeout" : "network_error";
      continue;
    }
    clearTimeout(timer);
    const data = await res.json().catch(() => null);
    const errorCode = data?.error || `http_${res.status}`;
    if (res.ok && data?.ok) {
      return data?.messageId || "";
    }
    lastError = errorCode;
    if (res.status >= 500) continue;
    throw new Error(`Mail relay failed: ${errorCode}`);
  }
  throw new Error(`Mail relay failed: ${lastError}`);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    const { email, redirectTo } = await req.json();
    if (!email) {
      return json({ error: 'email is required' }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    const baseUrl = redirectTo || 'https://koreancoaching.com';
    const callbackUrl = `${baseUrl}/auth/callback?next=/reset-password`;

    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: callbackUrl,
      },
    });

    if (error) {
      return json({ error: error.message }, 500);
    }

    let recoveryUrl = data?.properties?.action_link;
    if (!recoveryUrl) {
      return json({ error: 'Failed to generate recovery link' }, 500);
    }

    // Replace the base URL (everything before #) with the actual deployed domain.
    // generateLink returns: http://localhost:3000/#access_token=...
    // We need:            https://koreancoaching.com/#access_token=...
    recoveryUrl = recoveryUrl.replace(/^https?:\/\/[^/#]+/, 'https://koreancoaching.com');

    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#171717;background:#FBF7F2;">
        <h2 style="margin:0 0 6px;font-size:22px;">Reset your password</h2>
        <p style="margin:0 0 24px;color:#737373;font-size:15px;line-height:1.6;">Click the button below to set a new password for your Korean Coaching account.</p>
        <div style="text-align:center;">
          <a href="${recoveryUrl}" style="display:inline-block;background:#171717;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:9999px;font-weight:600;font-size:14px;">Reset Password</a>
        </div>
        <p style="margin:24px 0 0;color:#a3a3a3;font-size:12px;line-height:1.6;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `;

    await sendMail({
      to: email,
      subject: 'Reset your Korean Coaching password',
      html,
    });

    return json({ ok: true });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});

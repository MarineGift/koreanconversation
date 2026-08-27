const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-notify-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const NOTIFY_SECRET = "coach-signup-notify-7f3a9c2e";

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
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    if (req.headers.get("x-notify-secret") !== NOTIFY_SECRET) {
      return json({ error: "unauthorized" }, 401);
    }

    const body = await req.json();
    const coachName = body?.coach_name;
    const coachEmail = body?.coach_email;
    const coachTitle = body?.coach_title;

    if (!coachName) {
      return json({ error: "coach_name is required" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    let adminEmails: string[] = [];
    if (supabaseUrl && serviceKey) {
      try {
        const res = await fetch(
          `${supabaseUrl}/rest/v1/members?role=eq.admin&select=email`,
          {
            headers: {
              apikey: serviceKey,
              Authorization: `Bearer ${serviceKey}`,
            },
          }
        );
        if (res.ok) {
          const rows = await res.json();
          adminEmails = (rows ?? [])
            .map((r: any) => r?.email)
            .filter((e: any) => typeof e === "string" && e.length > 0);
        }
      } catch (err) {
        console.error("[notify-coach-signup] failed to fetch admin emails:", err);
      }
    }

    if (adminEmails.length === 0) {
      return json({ ok: true, skipped: "no admin email found" });
    }

    const subject = `새 강사 가입 승인 요청 — ${coachName}`;

    const titleRow = coachTitle
      ? `<tr><td style="padding:10px 0;color:#737373;font-size:14px;">소개</td><td style="padding:10px 0;font-weight:600;font-size:14px;color:#171717;">${coachTitle}</td></tr>`
      : "";
    const emailRow = coachEmail
      ? `<tr><td style="padding:10px 0;color:#737373;font-size:14px;">이메일</td><td style="padding:10px 0;font-weight:600;font-size:14px;color:#171717;">${coachEmail}</td></tr>`
      : "";

    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#171717;background:#FBF7F2;">
        <h2 style="margin:0 0 6px;font-size:22px;">새 강사가 가입했습니다</h2>
        <p style="margin:0 0 24px;color:#737373;font-size:15px;line-height:1.6;">새로운 강사 가입 요청이 접수되었습니다. 관리자 페이지에서 승인 여부를 검토해 주세요.</p>
        <div style="background:#ffffff;border:1px solid #e5e5e5;border-radius:16px;padding:20px 24px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:10px 0;color:#737373;font-size:14px;">이름</td><td style="padding:10px 0;font-weight:600;font-size:14px;color:#171717;">${coachName}</td></tr>
            ${emailRow}
            ${titleRow}
          </table>
        </div>
        <p style="margin:24px 0 0;color:#a3a3a3;font-size:12px;line-height:1.6;">관리자 대시보드의 강사 현황 탭에서 승인 또는 거절 처리할 수 있습니다.</p>
      </div>
    `;

    async function sendEmail(toEmail: string): Promise<{ ok: boolean; provider?: string; error?: string }> {
      try {
        await sendMail({ to: toEmail, subject, html });
        return { ok: true, provider: "relay" };
      } catch (err) {
        console.error("[notify-coach-signup] sendMail failed:", err);
        return { ok: false, error: String(err) };
      }
    }

    let sent = 0;
    let lastProvider = "";
    for (const toEmail of adminEmails) {
      const result = await sendEmail(toEmail);
      if (result.ok) {
        sent++;
        lastProvider = result.provider || lastProvider;
      }
    }

    return json({ ok: true, sent, admin_emails: adminEmails.length, provider: lastProvider });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});

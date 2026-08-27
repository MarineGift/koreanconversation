const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-notify-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const NOTIFY_SECRET = "member-signup-notify-7f3a9c2e";

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
    const memberName = body?.member_name;
    const memberEmail = body?.member_email;
    const nationality = body?.nationality;
    const studyPurpose = body?.study_purpose;

    if (!memberEmail) {
      return json({ error: "member_email is required" }, 400);
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
        console.error("[notify-member-signup] failed to fetch admin emails:", err);
      }
    }

    if (adminEmails.length === 0) {
      return json({ ok: true, skipped: "no admin email found" });
    }

    const subject = `새 회원 가입 — ${memberName || memberEmail}`;

    const nameRow = memberName
      ? `<tr><td style="padding:10px 0;color:#737373;font-size:14px;">이름</td><td style="padding:10px 0;font-weight:600;font-size:14px;color:#171717;">${memberName}</td></tr>`
      : "";
    const nationalityRow = nationality
      ? `<tr><td style="padding:10px 0;color:#737373;font-size:14px;">국적</td><td style="padding:10px 0;font-weight:600;font-size:14px;color:#171717;">${nationality}</td></tr>`
      : "";
    const purposeRow = studyPurpose
      ? `<tr><td style="padding:10px 0;color:#737373;font-size:14px;">수강 목적</td><td style="padding:10px 0;font-weight:600;font-size:14px;color:#171717;">${studyPurpose}</td></tr>`
      : "";

    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#171717;background:#FBF7F2;">
        <h2 style="margin:0 0 6px;font-size:22px;">새 회원이 가입했습니다</h2>
        <p style="margin:0 0 24px;color:#737373;font-size:15px;line-height:1.6;">새로운 회원 가입이 완료되었습니다. 회원 목록에서 확인할 수 있습니다.</p>
        <div style="background:#ffffff;border:1px solid #e5e5e5;border-radius:16px;padding:20px 24px;">
          <table style="width:100%;border-collapse:collapse;">
            ${nameRow}
            <tr><td style="padding:10px 0;color:#737373;font-size:14px;">이메일</td><td style="padding:10px 0;font-weight:600;font-size:14px;color:#171717;">${memberEmail}</td></tr>
            ${nationalityRow}
            ${purposeRow}
          </table>
        </div>
        <p style="margin:24px 0 0;color:#a3a3a3;font-size:12px;line-height:1.6;">관리자 대시보드의 회원 목록 탭에서 상세 정보를 확인할 수 있습니다.</p>
      </div>
    `;

    async function sendEmail(toEmail: string): Promise<{ ok: boolean; provider?: string; error?: string }> {
      try {
        await sendMail({ to: toEmail, subject, html });
        return { ok: true, provider: "relay" };
      } catch (err) {
        console.error("[notify-member-signup] sendMail failed:", err);
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

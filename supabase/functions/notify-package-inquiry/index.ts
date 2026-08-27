const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const RELAY_DEFAULT_URL = "https://urm.marinebiogroup.com/api/relay/mail";
const RELAY_PROFILE = "koreancoaching";
const RELAY_TIMEOUT_MS = 20000;
const RELAY_MAX_RETRIES = 2;
const RELAY_BASE_DELAY_MS = 500;

async function sendMail(opts: { to: string | string[]; subject: string; html?: string }): Promise<string> {
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

const PACKAGE_LABEL: Record<string, string> = {
  tour: "투어 패키지",
  business: "비즈니스 패키지",
  medical: "메디컬 패키지",
};

function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
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
    const body = await req.json();
    const packageType = body?.package_type || "tour";
    const name = body?.name;
    const email = body?.email;
    const country = body?.country;
    const company = body?.company;
    const groupSize = body?.group_size;
    const serviceType = body?.service_type;
    const modules = Array.isArray(body?.modules) ? body.modules : [];
    const hospitals = Array.isArray(body?.hospitals) ? body.hospitals : [];
    const arrivalDate = body?.arrival_date;
    const departureDate = body?.departure_date;
    const duration = body?.duration;
    const message = body?.message;

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
        console.error("[notify-package-inquiry] failed to fetch admin emails:", err);
      }
    }

    if (adminEmails.length === 0) {
      return json({ ok: true, skipped: "no admin email found" });
    }

    const subject = `새 패키지 문의 — ${PACKAGE_LABEL[packageType] || packageType}`;

    const rows: string[] = [];
    const push = (label: string, value: unknown) => {
      const v = value === undefined || value === null || value === "" ? null : String(value);
      if (v) rows.push(`<tr><td style="padding:10px 0;color:#737373;font-size:14px;">${label}</td><td style="padding:10px 0;font-weight:600;font-size:14px;color:#171717;">${esc(v)}</td></tr>`);
    };
    push("패키지", PACKAGE_LABEL[packageType] || packageType);
    push("이름", name);
    push("이메일", email);
    push("국가", country);
    push("회사", company);
    push("인원", groupSize ? `${groupSize}명` : undefined);
    push("서비스", serviceType);
    if (modules.length > 0) push("관심 항목", modules.join(", "));
    if (hospitals.length > 0) push("선호 병원", hospitals.join(", "));
    push("도착일", arrivalDate);
    push("출국일", departureDate);
    push("체류 기간", duration);

    const messageBlock = message
      ? `<div style="background:#f5f5f5;border-radius:12px;padding:16px;margin-top:16px;">
          <div style="font-size:12px;color:#a3a3a3;margin-bottom:6px;">메시지</div>
          <div style="font-size:14px;color:#404040;line-height:1.7;white-space:pre-wrap;">${esc(message)}</div>
        </div>`
      : "";

    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#171717;background:#FBF7F2;">
        <h2 style="margin:0 0 6px;font-size:22px;">새 패키지 문의가 접수되었습니다</h2>
        <p style="margin:0 0 24px;color:#737373;font-size:15px;line-height:1.6;">고객이 견적 문의를 남겼습니다. 관리자 대시보드의 패키지 문의 탭에서 상세 내용을 확인할 수 있습니다.</p>
        <div style="background:#ffffff;border:1px solid #e5e5e5;border-radius:16px;padding:20px 24px;">
          <table style="width:100%;border-collapse:collapse;">${rows.join("")}</table>
        </div>
        ${messageBlock}
        <p style="margin:24px 0 0;color:#a3a3a3;font-size:12px;line-height:1.6;">관리자 대시보드에서 문의 상태를 관리할 수 있습니다.</p>
      </div>
    `;

    async function sendEmail(toEmail: string): Promise<{ ok: boolean; provider?: string; error?: string }> {
      try {
        await sendMail({ to: toEmail, subject, html });
        return { ok: true, provider: "relay" };
      } catch (err) {
        console.error("[notify-package-inquiry] sendMail failed:", err);
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

    let userSent = false;
    if (typeof email === "string" && email.length > 0) {
      const label = PACKAGE_LABEL[packageType] || packageType;
      const userSubject = `Thank you for your ${label} inquiry`;
      const userHtml = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#171717;background:#FBF7F2;">
        <h2 style="margin:0 0 6px;font-size:22px;">Thank you, ${esc(name || "there")}!</h2>
        <p style="margin:0 0 24px;color:#737373;font-size:15px;line-height:1.6;">We received your ${label} inquiry and will reply within 24 hours with a personalized proposal.</p>
        <div style="background:#ffffff;border:1px solid #e5e5e5;border-radius:16px;padding:20px 24px;">
          <p style="margin:0 0 12px;font-size:14px;color:#404040;">Here is a summary of your request:</p>
          <table style="width:100%;border-collapse:collapse;">${rows.join("")}</table>
        </div>
        ${messageBlock}
        <p style="margin:24px 0 0;color:#a3a3a3;font-size:12px;line-height:1.6;">If you have any questions, simply reply to this email.</p>
      </div>
    `;
      try {
        await sendMail({ to: email, subject: userSubject, html: userHtml });
        userSent = true;
      } catch (err) {
        console.error("[notify-package-inquiry] user confirmation sendMail failed:", err);
      }
    }

    return json({ ok: true, sent, user_sent: userSent, admin_emails: adminEmails.length, provider: lastProvider });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});

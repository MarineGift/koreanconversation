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

function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatDate(d: unknown): string {
  if (!d) return "—";
  const date = new Date(String(d));
  if (isNaN(date.getTime())) return String(d);
  return date.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
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
    const bookingId = body?.bookingId;
    const reason = body?.reason;
    const siteName = body?.siteName || "";

    if (!bookingId) {
      return json({ error: "bookingId is required" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    const headers = {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    };

    let booking: any = null;
    let coachName = "";
    if (supabaseUrl && serviceKey) {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/bookings?id=eq.${encodeURIComponent(bookingId)}&select=name,email,coach_id,coach_name,booking_date,slot,lesson_name`,
        { headers }
      );
      if (res.ok) {
        const rows = await res.json();
        booking = rows?.[0] ?? null;
        if (booking) {
          coachName = booking.coach_name || "";
          if (!coachName && booking.coach_id) {
            const cRes = await fetch(
              `${supabaseUrl}/rest/v1/coaches?id=eq.${encodeURIComponent(booking.coach_id)}&select=name`,
              { headers }
            );
            if (cRes.ok) {
              const cRows = await cRes.json();
              coachName = cRows?.[0]?.name || "";
            }
          }
        }
      }
    }

    if (!booking) {
      return json({ error: "booking not found" }, 404);
    }

    let adminEmails: string[] = [];
    if (supabaseUrl && serviceKey) {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/members?role=eq.admin&select=email`,
        { headers }
      );
      if (res.ok) {
        const rows = await res.json();
        adminEmails = (rows ?? [])
          .map((r: any) => r?.email)
          .filter((e: any) => typeof e === "string" && e.length > 0);
      }
    }

    if (adminEmails.length === 0) {
      return json({ ok: true, skipped: "no admin email found" });
    }

    const subject = `새 환불 요청 — ${booking.name || "수강생"}`;

    const rows: string[] = [];
    const push = (label: string, value: unknown) => {
      const v = value === undefined || value === null || value === "" ? null : String(value);
      if (v) rows.push(`<tr><td style="padding:10px 0;color:#737373;font-size:14px;white-space:nowrap;padding-right:16px;">${label}</td><td style="padding:10px 0;font-weight:600;font-size:14px;color:#171717;">${esc(v)}</td></tr>`);
    };
    push("수강생", booking.name);
    push("이메일", booking.email);
    push("사이트", siteName);
    push("강사", coachName);
    push("수업", booking.lesson_name);
    push("수업 일자", formatDate(booking.booking_date));
    push("시간", booking.slot);

    const reasonBlock = reason
      ? `<div style="background:#f5f5f5;border-radius:12px;padding:16px;margin-top:16px;">
          <div style="font-size:12px;color:#a3a3a3;margin-bottom:6px;">환불 사유</div>
          <div style="font-size:14px;color:#404040;line-height:1.7;white-space:pre-wrap;">${esc(reason)}</div>
        </div>`
      : "";

    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#171717;background:#FBF7F2;">
        <h2 style="margin:0 0 6px;font-size:22px;">새 환불 요청이 접수되었습니다</h2>
        <p style="margin:0 0 24px;color:#737373;font-size:15px;line-height:1.6;">수강생이 수업에 대한 환불을 요청했습니다. 관리자 대시보드의 환불 요청 탭에서 승인 또는 거절할 수 있습니다.</p>
        <div style="background:#ffffff;border:1px solid #e5e5e5;border-radius:16px;padding:20px 24px;">
          <table style="width:100%;border-collapse:collapse;">${rows.join("")}</table>
        </div>
        ${reasonBlock}
        <p style="margin:24px 0 0;color:#a3a3a3;font-size:12px;line-height:1.6;">환불을 승인하면 사용된 크레딧이 수강생에게 자동으로 환급됩니다.</p>
      </div>
    `;

    let sent = 0;
    for (const toEmail of adminEmails) {
      try {
        await sendMail({ to: toEmail, subject, html });
        sent++;
      } catch (err) {
        console.error("[notify-refund-request] sendMail failed:", err);
      }
    }

    return json({ ok: true, sent, admin_emails: adminEmails.length });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});
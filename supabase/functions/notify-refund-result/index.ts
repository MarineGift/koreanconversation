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
    const result = body?.result;
    const reason = body?.reason;
    const coachName = body?.coachName || "";

    if (!bookingId || !result) {
      return json({ error: "bookingId and result are required" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` };

    let booking: any = null;
    let studentEmail = "";
    let studentName = "";

    if (supabaseUrl && serviceKey) {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/bookings?id=eq.${encodeURIComponent(bookingId)}&select=name,email,coach_name,booking_date,slot,lesson_name,refund_status,refund_reason`,
        { headers }
      );
      if (res.ok) {
        const rows = await res.json();
        booking = rows?.[0] ?? null;
        if (booking) {
          studentEmail = booking.email || "";
          studentName = booking.name || "";
        }
      }
    }

    if (!booking || !studentEmail) {
      return json({ ok: true, skipped: "no student email found" });
    }

    const isApproved = result === 'approved';
    const subject = isApproved
      ? `환불이 승인되었습니다 — ${studentName || "수강생"}`
      : `환불이 거절되었습니다 — ${studentName || "수강생"}`;

    const rows: string[] = [];
    const push = (label: string, value: unknown) => {
      const v = value === undefined || value === null || value === "" ? null : String(value);
      if (v) rows.push(`<tr><td style="padding:10px 0;color:#737373;font-size:14px;white-space:nowrap;padding-right:16px;">${label}</td><td style="padding:10px 0;font-weight:600;font-size:14px;color:#171717;">${esc(v)}</td></tr>`);
    };
    push("수강생", studentName);
    push("강사", coachName || booking.coach_name || "");
    push("수업", booking.lesson_name);
    push("수업 일자", formatDate(booking.booking_date));
    push("시간", booking.slot);

    const statusColor = isApproved ? '#16a34a' : '#dc2626';
    const statusBg = isApproved ? '#f0fdf4' : '#fef2f2';
    const statusText = isApproved ? '환불 승인' : '환불 거절';
    const messageText = isApproved
      ? '수강생의 환불 요청이 승인되었습니다. 사용된 크레딧이 계정에 자동으로 환급됩니다.'
      : '수강생의 환불 요청이 거절되었습니다. 아래 사유를 확인해 주세요.';

    const reasonBlock = !isApproved && reason
      ? `<div style="background:#f5f5f5;border-radius:12px;padding:16px;margin-top:16px;">
          <div style="font-size:12px;color:#a3a3a3;margin-bottom:6px;">거절 사유</div>
          <div style="font-size:14px;color:#404040;line-height:1.7;white-space:pre-wrap;">${esc(reason)}</div>
        </div>`
      : "";

    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#171717;background:#FBF7F2;">
        <div style="display:inline-block;padding:6px 14px;border-radius:999px;font-size:13px;font-weight:600;margin-bottom:16px;" style="background:${statusBg};color:${statusColor};">
          ${statusText}
        </div>
        <h2 style="margin:0 0 6px;font-size:22px;">${isApproved ? '환불이 승인되었습니다' : '환불이 거절되었습니다'}</h2>
        <p style="margin:0 0 24px;color:#737373;font-size:15px;line-height:1.6;">${messageText}</p>
        <div style="background:#ffffff;border:1px solid #e5e5e5;border-radius:16px;padding:20px 24px;">
          <table style="width:100%;border-collapse:collapse;">${rows.join("")}</table>
        </div>
        ${reasonBlock}
        <p style="margin:24px 0 0;color:#a3a3a3;font-size:12px;line-height:1.6;">추가 문의 사항은 관리자에게 연락해 주세요.</p>
      </div>
    `;

    let sent = 0;
    try {
      await sendMail({ to: studentEmail, subject, html });
      sent = 1;
    } catch (err) {
      console.error("[notify-refund-result] sendMail failed:", err);
    }

    return json({ ok: true, sent });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});

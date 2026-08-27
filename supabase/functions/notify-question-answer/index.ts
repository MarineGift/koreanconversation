const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-notify-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const NOTIFY_SECRET = "question-answer-notify-7f3a9c2e";

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
    const question = body?.question;
    const answer = body?.answer;
    const coachName = body?.coach_name;

    if (!memberEmail || !answer) {
      return json({ error: "member_email and answer are required" }, 400);
    }

    const subject = `코치가 질문에 답변했습니다 — ${coachName || "Korean Coaching"}`;

    const questionBlock = question
      ? `<div style="background:#f5f5f5;border-radius:12px;padding:16px;margin-top:16px;">
          <div style="font-size:12px;color:#a3a3a3;margin-bottom:6px;">나의 질문</div>
          <div style="font-size:14px;color:#404040;line-height:1.6;">${question}</div>
        </div>`
      : "";

    const answerHtml = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#171717;background:#FBF7F2;">
        <h2 style="margin:0 0 6px;font-size:22px;">코치가 질문에 답변을 남겼습니다</h2>
        <p style="margin:0 0 24px;color:#737373;font-size:15px;line-height:1.6;">${coachName || "코치"} 님이 수강 신청 시 남기신 질문에 답변을 달았습니다.</p>
        ${questionBlock}
        <div style="background:#ffffff;border:1px solid #e5e5e5;border-radius:16px;padding:20px 24px;margin-top:16px;">
          <div style="font-size:12px;color:#a3a3a3;margin-bottom:8px;">코치의 답변</div>
          <div style="font-size:14px;color:#171717;line-height:1.7;white-space:pre-wrap;">${answer}</div>
        </div>
        <p style="margin:24px 0 0;color:#a3a3a3;font-size:12px;line-height:1.6;">추가로 궁금한 점이 있다면 예약된 수업 시간에 편하게 질문해 주세요.</p>
      </div>
    `;

    async function sendEmail(toEmail: string): Promise<{ ok: boolean; provider?: string; error?: string }> {
      try {
        await sendMail({ to: toEmail, subject, html: answerHtml });
        return { ok: true, provider: "relay" };
      } catch (err) {
        console.error("[notify-question-answer] sendMail failed:", err);
        return { ok: false, error: String(err) };
      }
    }

    const result = await sendEmail(memberEmail);
    if (!result.ok) {
      return json({ error: result.error || "Failed to send answer email" }, 500);
    }

    return json({ ok: true, provider: result.provider });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});

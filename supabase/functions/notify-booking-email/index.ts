
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-notify-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const NOTIFY_SECRET = "booking-notify-7f3a9c2e";

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

async function sendEmail(toEmail: string, subject: string, html: string): Promise<{ ok: boolean; provider?: string; id?: string | null; error?: string }> {
  try {
    const messageId = await sendMail({ to: toEmail, subject, html });
    return { ok: true, provider: "relay", id: messageId || null };
  } catch (err) {
    console.error("[notify-booking-email] sendMail failed:", err);
    return { ok: false, error: String(err) };
  }
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

  if (req.headers.get("x-notify-secret") !== NOTIFY_SECRET) {
    return json({ error: "Unauthorized" }, 401);
  }

  try {
    const body = await req.json();
    const name = body?.name;
    const email = body?.email;
    const nationality = body?.nationality;
    const date = body?.date;
    const slot = body?.slot;
    const sessionType = body?.session_type;
    const roomUrl = body?.room_url;
    const coachEmail = body?.coach_email;
    const coachName = body?.coach_name;
    const question = body?.question;
    const status = body?.status || "confirmed";
    const cancelReason = body?.cancel_reason;

    if (!name || !email || !date || !slot) {
      return json({ error: "name, email, date, and slot are required" }, 400);
    }

    const sessionLabel = sessionType === "free" ? "Free 10-min Session" : "1:1 Coaching Session";
    const isPending = status === "pending";
    const isCancelled = status === "cancelled";

    const nationalityRow = nationality
      ? `<tr><td style="padding:10px 0;color:#737373;font-size:14px;">Nationality</td><td style="padding:10px 0;font-weight:600;font-size:14px;color:#171717;">${nationality}</td></tr>`
      : "";

    const questionRow = question
      ? `<tr><td style="padding:10px 0;color:#737373;font-size:14px;vertical-align:top;">Question</td><td style="padding:10px 0;font-weight:600;font-size:14px;color:#171717;">${question}</td></tr>`
      : "";

    let studentSubject: string;
    let studentHtml: string;
    let coachSubject: string;
    let coachHtml: string;

    if (isCancelled) {
      studentSubject = `Booking cancelled — ${date} ${slot}`;
      studentHtml = `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#171717;background:#FBF7F2;">
          <h2 style="margin:0 0 6px;font-size:22px;">Hi ${name}, your booking has been cancelled</h2>
          <p style="margin:0 0 24px;color:#737373;font-size:15px;line-height:1.6;">Your coach has cancelled your ${sessionLabel.toLowerCase()}. ${cancelReason ? `Reason: ${cancelReason}` : ""}</p>
          <div style="background:#ffffff;border:1px solid #e5e5e5;border-radius:16px;padding:20px 24px;">
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:10px 0;color:#737373;font-size:14px;">Session</td><td style="padding:10px 0;font-weight:600;font-size:14px;color:#171717;">${sessionLabel}</td></tr>
              <tr><td style="padding:10px 0;color:#737373;font-size:14px;">Coach</td><td style="padding:10px 0;font-weight:600;font-size:14px;color:#171717;">${coachName || "Your coach"}</td></tr>
              <tr><td style="padding:10px 0;color:#737373;font-size:14px;">Date</td><td style="padding:10px 0;font-weight:600;font-size:14px;color:#171717;">${date}</td></tr>
              <tr><td style="padding:10px 0;color:#737373;font-size:14px;">Time</td><td style="padding:10px 0;font-weight:600;font-size:14px;color:#171717;">${slot}</td></tr>
              ${nationalityRow}
            </table>
          </div>
          <p style="margin:24px 0 0;color:#a3a3a3;font-size:12px;line-height:1.6;">You can book another session at any time through our website.</p>
        </div>
      `;
      coachSubject = `Booking cancelled — ${date} ${slot}`;
      coachHtml = `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#171717;background:#FBF7F2;">
          <h2 style="margin:0 0 6px;font-size:22px;">Booking cancelled — ${sessionLabel}</h2>
          <p style="margin:0 0 24px;color:#737373;font-size:15px;line-height:1.6;">You cancelled a session with ${name}. ${cancelReason ? `Reason recorded: ${cancelReason}` : ""}</p>
          <div style="background:#ffffff;border:1px solid #e5e5e5;border-radius:16px;padding:20px 24px;">
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:10px 0;color:#737373;font-size:14px;">Student</td><td style="padding:10px 0;font-weight:600;font-size:14px;color:#171717;">${name}</td></tr>
              <tr><td style="padding:10px 0;color:#737373;font-size:14px;">Email</td><td style="padding:10px 0;font-weight:600;font-size:14px;color:#171717;">${email}</td></tr>
              ${nationalityRow}
              <tr><td style="padding:10px 0;color:#737373;font-size:14px;">Date</td><td style="padding:10px 0;font-weight:600;font-size:14px;color:#171717;">${date}</td></tr>
              <tr><td style="padding:10px 0;color:#737373;font-size:14px;">Time</td><td style="padding:10px 0;font-weight:600;font-size:14px;color:#171717;">${slot}</td></tr>
              ${questionRow}
            </table>
          </div>
          <p style="margin:24px 0 0;color:#a3a3a3;font-size:12px;line-height:1.6;">The student has been notified of this cancellation.</p>
        </div>
      `;
    } else if (isPending) {
      studentSubject = `Booking request received — ${date} ${slot}`;
      studentHtml = `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#171717;background:#FBF7F2;">
          <h2 style="margin:0 0 6px;font-size:22px;">Hi ${name}, we received your request!</h2>
          <p style="margin:0 0 24px;color:#737373;font-size:15px;line-height:1.6;">Thanks for your interest. Your coach will review and confirm your ${sessionLabel.toLowerCase()} shortly.</p>
          <div style="background:#ffffff;border:1px solid #e5e5e5;border-radius:16px;padding:20px 24px;">
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:10px 0;color:#737373;font-size:14px;">Session</td><td style="padding:10px 0;font-weight:600;font-size:14px;color:#171717;">${sessionLabel}</td></tr>
              <tr><td style="padding:10px 0;color:#737373;font-size:14px;">Coach</td><td style="padding:10px 0;font-weight:600;font-size:14px;color:#171717;">${coachName || "Your coach"}</td></tr>
              <tr><td style="padding:10px 0;color:#737373;font-size:14px;">Date</td><td style="padding:10px 0;font-weight:600;font-size:14px;color:#171717;">${date}</td></tr>
              <tr><td style="padding:10px 0;color:#737373;font-size:14px;">Time</td><td style="padding:10px 0;font-weight:600;font-size:14px;color:#171717;">${slot}</td></tr>
              ${nationalityRow}
            </table>
          </div>
          <p style="margin:24px 0 0;color:#a3a3a3;font-size:12px;line-height:1.6;">You will receive another email once your coach confirms the booking.</p>
        </div>
      `;
      coachSubject = `New booking request — ${date} ${slot}`;
      coachHtml = `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#171717;background:#FBF7F2;">
          <h2 style="margin:0 0 6px;font-size:22px;">New booking request — ${sessionLabel}</h2>
          <p style="margin:0 0 24px;color:#737373;font-size:15px;line-height:1.6;">A student has requested a session with you. Please review and confirm.</p>
          <div style="background:#ffffff;border:1px solid #e5e5e5;border-radius:16px;padding:20px 24px;">
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:10px 0;color:#737373;font-size:14px;">Student</td><td style="padding:10px 0;font-weight:600;font-size:14px;color:#171717;">${name}</td></tr>
              <tr><td style="padding:10px 0;color:#737373;font-size:14px;">Email</td><td style="padding:10px 0;font-weight:600;font-size:14px;color:#171717;">${email}</td></tr>
              ${nationalityRow}
              <tr><td style="padding:10px 0;color:#737373;font-size:14px;">Date</td><td style="padding:10px 0;font-weight:600;font-size:14px;color:#171717;">${date}</td></tr>
              <tr><td style="padding:10px 0;color:#737373;font-size:14px;">Time</td><td style="padding:10px 0;font-weight:600;font-size:14px;color:#171717;">${slot}</td></tr>
              ${questionRow}
            </table>
          </div>
          <p style="margin:24px 0 0;color:#a3a3a3;font-size:12px;line-height:1.6;">Please confirm or decline this request in your coach portal.</p>
        </div>
      `;
    } else {
      const studentRoomBlock = roomUrl
        ? `<a href="${roomUrl}" style="display:inline-block;background:#171717;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:9999px;font-weight:600;font-size:14px;">Enter your classroom</a>`
        : "";
      studentSubject = `Your session is confirmed — ${date} ${slot}`;
      studentHtml = `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#171717;background:#FBF7F2;">
          <h2 style="margin:0 0 6px;font-size:22px;">Hi ${name}, your session is confirmed!</h2>
          <p style="margin:0 0 24px;color:#737373;font-size:15px;line-height:1.6;">Thanks for booking. Here are the details of your ${sessionLabel.toLowerCase()}.</p>
          <div style="background:#ffffff;border:1px solid #e5e5e5;border-radius:16px;padding:20px 24px;">
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:10px 0;color:#737373;font-size:14px;">Session</td><td style="padding:10px 0;font-weight:600;font-size:14px;color:#171717;">${sessionLabel}</td></tr>
              <tr><td style="padding:10px 0;color:#737373;font-size:14px;">Coach</td><td style="padding:10px 0;font-weight:600;font-size:14px;color:#171717;">${coachName || "Your coach"}</td></tr>
              <tr><td style="padding:10px 0;color:#737373;font-size:14px;">Date</td><td style="padding:10px 0;font-weight:600;font-size:14px;color:#171717;">${date}</td></tr>
              <tr><td style="padding:10px 0;color:#737373;font-size:14px;">Time</td><td style="padding:10px 0;font-weight:600;font-size:14px;color:#171717;">${slot}</td></tr>
              ${nationalityRow}
            </table>
          </div>
          ${studentRoomBlock ? `<div style="margin-top:24px;text-align:center;">${studentRoomBlock}</div>` : ""}
          <p style="margin:24px 0 0;color:#a3a3a3;font-size:12px;line-height:1.6;">If you need to reschedule or cancel, please contact us as soon as possible. Please join your session on time.</p>
        </div>
      `;
      const coachRoomBlock = roomUrl
        ? `<a href="${roomUrl}" style="display:inline-block;background:#171717;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:9999px;font-weight:600;font-size:14px;">Enter classroom</a>`
        : "";
      coachSubject = `New ${sessionLabel} booking — ${date} ${slot}`;
      coachHtml = `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#171717;background:#FBF7F2;">
          <h2 style="margin:0 0 6px;font-size:22px;">New booking — ${sessionLabel}</h2>
          <p style="margin:0 0 24px;color:#737373;font-size:15px;line-height:1.6;">A student has booked a session with you. Here are the details.</p>
          <div style="background:#ffffff;border:1px solid #e5e5e5;border-radius:16px;padding:20px 24px;">
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:10px 0;color:#737373;font-size:14px;">Student</td><td style="padding:10px 0;font-weight:600;font-size:14px;color:#171717;">${name}</td></tr>
              <tr><td style="padding:10px 0;color:#737373;font-size:14px;">Email</td><td style="padding:10px 0;font-weight:600;font-size:14px;color:#171717;">${email}</td></tr>
              ${nationalityRow}
              <tr><td style="padding:10px 0;color:#737373;font-size:14px;">Date</td><td style="padding:10px 0;font-weight:600;font-size:14px;color:#171717;">${date}</td></tr>
              <tr><td style="padding:10px 0;color:#737373;font-size:14px;">Time</td><td style="padding:10px 0;font-weight:600;font-size:14px;color:#171717;">${slot}</td></tr>
              ${questionRow}
            </table>
          </div>
          ${coachRoomBlock ? `<div style="margin-top:24px;text-align:center;">${coachRoomBlock}</div>` : ""}
          <p style="margin:24px 0 0;color:#a3a3a3;font-size:12px;line-height:1.6;">You can join the classroom at the scheduled time using the link above.</p>
        </div>
      `;
    }

    const studentResult = await sendEmail(email, studentSubject, studentHtml);
    if (!studentResult.ok) {
      return json({ error: studentResult.error || "Failed to send student email" }, 500);
    }

    if (coachEmail) {
      await sendEmail(coachEmail, coachSubject, coachHtml);
    }

    return json({ ok: true, provider: studentResult.provider, id: studentResult.id });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});

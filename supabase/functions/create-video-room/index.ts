const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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
    const apiKey = Deno.env.get("DAILY_API_KEY");
    if (!apiKey) {
      return json({ error: "DAILY_API_KEY is not configured. Add it in the Supabase Dashboard under Edge Function Secrets." }, 500);
    }

    const body = await req.json();
    const name = body?.name;
    if (!name || typeof name !== "string") {
      return json({ error: "name is required" }, 400);
    }

    const safeName = name.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 50);

    const res = await fetch("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: safeName,
        properties: {
          enable_chat: true,
          enable_screenshare: true,
          start_video_off: false,
          start_audio_off: false,
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 60,
        },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return json({ error: data?.info || data?.error || "Failed to create room", status: res.status }, res.status);
    }

    return json({ url: data.url, name: data.name });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const PADDLE_API_KEY = Deno.env.get('PADDLE_API_KEY');
  if (!PADDLE_API_KEY) {
    return json({ error: 'PADDLE_API_KEY not configured in Edge Function secrets' }, 500);
  }

  try {
    const body = await req.json();
    const productId = body?.productId;
    if (!productId || typeof productId !== 'string') {
      return json({ error: 'productId is required' }, 400);
    }

    const res = await fetch(
      `https://api.paddle.com/prices?product_id=${encodeURIComponent(productId)}&status=active`,
      {
        headers: {
          Authorization: `Bearer ${PADDLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await res.json();
    if (!res.ok) {
      return json({ error: data?.error?.detail || 'Paddle API error' }, res.status);
    }

    const prices = data?.data || [];
    if (prices.length === 0) {
      return json({ error: 'No active prices found for this product' }, 404);
    }

    const price = prices[0];
    const amountCents = parseInt(price.unit_price?.amount || '0', 10);
    const currency = price.unit_price?.currency_code || 'USD';

    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amountCents / 100);

    return json({
      priceId: price.id,
      productId,
      amount: amountCents,
      currency,
      formattedPrice: formatted,
    });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});

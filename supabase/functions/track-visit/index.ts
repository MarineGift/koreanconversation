import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'apikey, x-client-info, authorization, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

  try {
    const body = await req.json().catch(() => null) || {};
    const ip = body.ip || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || '';
    const referrer = req.headers.get('referer') || body.referrer || '';
    const pagePath = body.pagePath || '/';
    const orgId = body.organizationId || null;
    const siteDomain = body.siteDomain || null;
    const siteName = body.siteName || null;

    const ua = userAgent.toLowerCase();
    let browser = 'Other';
    if (ua.includes('chrome') && !ua.includes('edg')) browser = 'Chrome';
    else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
    else if (ua.includes('firefox')) browser = 'Firefox';
    else if (ua.includes('edg')) browser = 'Edge';
    else if (ua.includes('opera') || ua.includes('opr')) browser = 'Opera';

    let os = 'Other';
    if (ua.includes('windows')) os = 'Windows';
    else if (ua.includes('macintosh')) os = 'Mac';
    else if (ua.includes('linux')) os = 'Linux';
    else if (ua.includes('android')) os = 'Android';
    else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';

    let device = 'Desktop';
    if (ua.includes('mobile')) device = 'Mobile';
    else if (ua.includes('tablet') || ua.includes('ipad')) device = 'Tablet';

    let country = body.country || 'Unknown';
    let region = body.region || 'Unknown';
    let city = body.city || 'Unknown';

    if ((!country || country === 'Unknown') && ip !== 'unknown' && !ip.startsWith('192.168.') && !ip.startsWith('10.') && !ip.startsWith('127.')) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 3000);
        const geoRes = await fetch(`https://ipapi.co/${ip}/json/`, { signal: controller.signal });
        clearTimeout(timer);
        if (geoRes.ok) {
          const geo = await geoRes.json();
          if (geo.country_name) country = geo.country_name;
          if (geo.region) region = geo.region;
          if (geo.city) city = geo.city;
        }
      } catch {
        // ignore geo lookup failures
      }
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    await supabase.from('visitor_logs').insert({
      ip_address: ip,
      country,
      region,
      city,
      browser,
      os,
      device,
      referrer,
      page_path: pagePath,
      user_agent: userAgent,
      organization_id: orgId,
      site_domain: siteDomain,
      site_name: siteName,
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

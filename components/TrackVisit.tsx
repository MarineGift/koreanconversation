'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { resolveSiteByHostname } from '@/lib/org';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export default function TrackVisit() {
  const pathname = usePathname();
  const siteRef = useRef<{ organizationId: string | null; domain: string; name: string } | null>(null);
  const geoRef = useRef<{ ip: string; country: string; region: string; city: string } | null>(null);
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;

    const track = async () => {
      try {
        if (!siteRef.current) {
          siteRef.current = await resolveSiteByHostname();
        }
        if (!geoRef.current) {
          try {
            const geoRes = await fetch('https://ipapi.co/json/');
            if (geoRes.ok) {
              const data = await geoRes.json();
              geoRef.current = {
                ip: data.ip || '',
                country: data.country_name || '',
                region: data.region || '',
                city: data.city || '',
              };
            }
          } catch {
            // silent
          }
          if (!geoRef.current) {
            try {
              const ipRes = await fetch('https://api.ipify.org?format=json');
              if (ipRes.ok) {
                const ipData = await ipRes.json();
                geoRef.current = { ip: ipData.ip || '', country: '', region: '', city: '' };
              }
            } catch {
              // silent
            }
          }
          if (!geoRef.current) {
            geoRef.current = { ip: '', country: '', region: '', city: '' };
          }
        }

        const site = siteRef.current!;
        const geo = geoRef.current!;

        await fetch(`${SUPABASE_URL}/functions/v1/track-visit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON,
            'Authorization': `Bearer ${SUPABASE_ANON}`,
          },
          body: JSON.stringify({
            pagePath: pathname,
            referrer: document.referrer,
            organizationId: site.organizationId,
            siteDomain: site.domain,
            siteName: site.name,
            ip: geo.ip,
            country: geo.country,
            region: geo.region,
            city: geo.city,
          }),
        });
      } catch {
        // silent fail
      }
    };
    track();
  }, [pathname]);

  return null;
}
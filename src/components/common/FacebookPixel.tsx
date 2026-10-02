// src/components/common/FacebookPixel.tsx
'use client';

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';

const PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;

/**
 * Initialises Meta Pixel once, and fires PageView on every route change.
 * Requires NEXT_PUBLIC_FACEBOOK_PIXEL_ID to be set in .env.local.
 */
function PixelPageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!PIXEL_ID || typeof window === 'undefined' || !(window as any).fbq) return;
    (window as any).fbq('track', 'PageView');
  }, [pathname, searchParams]);

  return null;
}

export function FacebookPixel() {
  if (!PIXEL_ID) return null;

  return (
    <>
      <Script
        id="fb-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${PIXEL_ID}');
            fbq('track', 'PageView');
          `,
        }}
      />
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
      <Suspense fallback={null}>
        <PixelPageViewTracker />
      </Suspense>
    </>
  );
}

/**
 * Track a custom event from anywhere in the app.
 * Usage: trackFbEvent('Lead', { content_name: 'Provider Signup' })
 */
export function trackFbEvent(
  eventName: string,
  params?: Record<string, any>,
) {
  if (typeof window === 'undefined' || !(window as any).fbq) return;
  (window as any).fbq('track', eventName, params);
}
import Script from 'next/script';
import { getTomlContent } from '@/lib/content';
import { getConfig } from '@/lib/config';

export default function GoogleAnalytics() {
  const analytics = getTomlContent<{ measurement_id?: string }>('analytics.toml');
  const measurementId = (process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || analytics?.measurement_id || '').trim();

  if (!measurementId) return null;
  if (!/^G-[A-Z0-9]+$/.test(measurementId)) {
    throw new Error('Invalid GA4 Measurement ID in content/analytics.toml.');
  }
  const hostname = new URL(getConfig().site.url).hostname;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          if (window.location.hostname === ${JSON.stringify(hostname)}) {
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', ${JSON.stringify(measurementId)});
          }
        `}
      </Script>
    </>
  );
}

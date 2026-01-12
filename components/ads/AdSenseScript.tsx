'use client';

import Script from 'next/script';

export default function AdSenseScript() {
  const publisherId = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID;

  if (!publisherId) return null;

  return (
    <Script
      id="adsbygoogle-init"
      strategy="afterInteractive"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`}
      crossOrigin="anonymous"
      // Added prompt for Auto Ads verification
      onLoad={() => {
        if (typeof window !== 'undefined') {
            // Usually not needed if the script tag is present with the client ID,
            // but confirms execution.
            console.log('AdSense Script Loaded');
        }
      }}
    />
  );
}
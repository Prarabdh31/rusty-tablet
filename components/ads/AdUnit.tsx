'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

interface AdUnitProps {
  slotId: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'vertical' | 'horizontal';
  className?: string;
  responsive?: boolean;
  label?: string; // e.g. "Advertisement"
}

export default function AdUnit({ 
  slotId, 
  format = 'auto', 
  className = '', 
  responsive = true,
  label = 'Advertisement'
}: AdUnitProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    // Prevent double-injection in React Strict Mode
    if (initialized.current) return;
    
    try {
      if (typeof window !== 'undefined') {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        initialized.current = true;
      }
    } catch (e) {
      console.error('AdSense Error:', e);
    }
  }, []);

  if (!process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID) {
    // Fallback for development if no ID provided
    return (
      <div className={`bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-400 ${className}`}>
        AdSense Config Missing
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {label && (
        <span className="block text-[10px] text-[#64748B] uppercase tracking-widest text-center mb-1">
          {label}
        </span>
      )}
      <ins
        className="adsbygoogle block"
        style={{ display: 'block', width: '100%', height: '100%' }}
        data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID}
        data-ad-slot={slotId}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  );
}
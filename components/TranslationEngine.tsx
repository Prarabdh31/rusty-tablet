'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    google: any;
    googleTranslateElementInit: any;
  }
}

export default function TranslationEngine() {
  useEffect(() => {
    // 1. Define the Init function called by Google
    window.googleTranslateElementInit = function () {
      new window.google.translate.TranslateElement(
        {
          pageLanguage: 'en',
          // Ensure 'ja' is included for Japanese
          includedLanguages: 'en,hi,es,ja', 
          autoDisplay: false,
        },
        'google_translate_element'
      );
    };

    // 2. Inject the Script
    const scriptId = 'google-translate-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.type = 'text/javascript';
      script.async = true;
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      document.body.appendChild(script);
    }
  }, []);

  return (
    // Hidden container for the Google Widget
    <div 
      id="google_translate_element" 
      style={{ display: 'none' }} 
    />
  );
}
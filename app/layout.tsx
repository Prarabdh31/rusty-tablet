import type { Metadata } from "next";
import { Merriweather, Inter } from "next/font/google";
import "./globals.css";
import TranslationEngine from "@/components/TranslationEngine";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Script from "next/script";
import { createClient } from "@supabase/supabase-js";

const merriweather = Merriweather({ 
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  variable: "--font-serif",
  display: "swap",
});

const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-sans",
  display: "swap",
});

// Dynamic Metadata from "The Beacon"
export async function generateMetadata(): Promise<Metadata> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: settings } = await supabase
    .from('site_settings')
    .select('key, value');

  const config = settings?.reduce((acc: any, curr: any) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {}) || {};

  const title = config.site_name || "Rusty Tablet";
  const description = config.site_description || "Digital Industrialism for the modern thinker.";

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.rustytablet.com'),
    title: {
      default: title,
      template: `%s | ${title}`,
    },
    description: description,
    keywords: config.site_keywords ? config.site_keywords.split(',').map((k: string) => k.trim()) : [],
    openGraph: {
      title: title,
      description: description,
      siteName: title,
      locale: config.language || 'en-US',
      type: 'website',
      images: [
        {
          url: '/opengraph-image.png', // Default fallback
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      creator: config.twitter_handle || '@rustytablet',
    },
    // Removed 'icons' property to let app/icon.tsx and app/apple-icon.tsx handle it automatically
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Access environment variable directly for the raw script
  const publisherId = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Direct injection of AdSense script into <head>.
          This is the most robust method for initial site verification.
        */}
        {publisherId && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`}
            crossOrigin="anonymous"
          ></script>
        )}
      </head>
      <body className={`${merriweather.variable} ${inter.variable} font-sans min-h-screen relative`}>
        {/* Google Analytics - Moved to next/script in body to fix hydration errors */}
        <Script 
          src="https://www.googletagmanager.com/gtag/js?id=G-CXCE30BVHL"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-CXCE30BVHL');
          `}
        </Script>

        <AuthProvider>
          <TranslationEngine />
          <div className="paper-texture" />
          <div className="relative z-10">
            {children}
          </div>
          <Analytics />
          <SpeedInsights />
        </AuthProvider>
      </body>
    </html>
  );
}
import type { Metadata } from "next";
import { Merriweather, Inter } from "next/font/google";
import "./globals.css";
import TranslationEngine from "@/components/TranslationEngine";
import { AuthProvider } from "@/components/providers/AuthProvider";

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

export const metadata: Metadata = {
  title: "Rusty Tablet",
  description: "Digital Industrialism for the modern thinker.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const publisherId = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID;

  return (
    <html lang="en">
      <head>
        {/* Google Analytics */}
        <script 
          async 
          src="https://www.googletagmanager.com/gtag/js?id=G-CXCE30BVHL"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-CXCE30BVHL');
            `,
          }}
        />
        {/* AdSense */}
        {publisherId && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`}
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body className={`${merriweather.variable} ${inter.variable} font-sans min-h-screen relative`}>
        <AuthProvider>
          <TranslationEngine />
          <div className="paper-texture" />
          <div className="relative z-10">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
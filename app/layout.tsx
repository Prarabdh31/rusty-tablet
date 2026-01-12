import type { Metadata } from "next";
import { Merriweather, Inter } from "next/font/google";
import "./globals.css";
import TranslationEngine from "@/components/TranslationEngine";
import { AuthProvider } from "@/components/providers/AuthProvider";
// Removed AdSenseScript import to use direct injection

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
  // Access environment variable directly for the raw script
  const publisherId = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID;

  return (
    <html lang="en">
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
import type { Metadata } from "next";
import { Merriweather, Inter } from "next/font/google";
import "./globals.css";
import TranslationEngine from "@/components/TranslationEngine";

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
  return (
    <html lang="en">
      <body className={`${merriweather.variable} ${inter.variable} font-sans min-h-screen relative`}>
        <TranslationEngine />
        <div className="paper-texture" />
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  );
}
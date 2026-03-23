import type { Metadata } from "next";
import { Bangers, Space_Grotesk } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { APP_DESCRIPTION, APP_LOCALE, APP_NAME } from "@/config/app";

import "./globals.css";

const headingFont = Bangers({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: "400"
});

const bodyFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang={APP_LOCALE}>
      <body
        className={`${headingFont.variable} ${bodyFont.variable} font-[var(--font-body)] antialiased bg-neo-bg text-neo-dark selection:bg-neo-cyan selection:text-neo-dark`}
      >
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

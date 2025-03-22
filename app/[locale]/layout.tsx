import type React from "react";
import "@/styles/globals.css";
import { Instrument_Sans, Instrument_Serif } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster as SonnerToaster } from "sonner";
import Script from "next/script";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { I18nProviderClient } from "@/locales/client";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument-sans",
});
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument-serif",
});

export const metadata: Metadata = {
  title: "Vecto3d | Transform Your Vectors in a New Dimension",
  description: "A super simple tool to convert SVG logos to 3D models",
  icons: {
    icon: [
      { media: "(prefers-color-scheme: light)", url: "/logo_light.svg" },
      { media: "(prefers-color-scheme: dark)", url: "/logo_dark.svg" },
    ],
  },
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <html lang={locale} suppressHydrationWarning>
      <meta property="og:image" content="/opengraph-image.png" />
      <meta property="og:image:type" content="image/png" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="675" />
      <meta
        property="og:site_name"
        content="Vecto3d | Transform Your Vectors in a New Dimension"
      />
      <meta property="og:url" content="https://vecto3d.xyz/" />
      <meta name="twitter:image" content="/twitter-image.png" />
      <meta name="twitter:image:type" content="image/png" />
      <meta name="twitter:image:width" content="1200" />
      <meta name="twitter:image:height" content="675" />
      <Script
        src="https://cloud.umami.is/script.js"
        defer
        data-website-id="237f1de7-ab04-44dd-a7b4-6b0b819b7991"
      />
      <body className={cn(instrumentSans.className, instrumentSerif.variable)}>
        <I18nProviderClient locale={locale}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange>
            {children}
            <Analytics />
            <SonnerToaster
              position="top-center"
              richColors
              closeButton
              theme="system"
            />
          </ThemeProvider>
        </I18nProviderClient>
      </body>
    </html>
  );
}

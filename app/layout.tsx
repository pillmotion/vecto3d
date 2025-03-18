import type React from "react";
import "@/styles/globals.css";
import { Instrument_Sans, Instrument_Serif } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster as SonnerToaster } from "sonner";
import Script from "next/script";
import { cn } from "@/lib/utils";
const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument-sans",
});
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument-serif",
});

export const metadata = {
  title: "Vecto3d | Convert SVGs to 3D Models",
  description: "A super simple tool to convert SVG logos to 3D models",
  icons: {
    icon: [
      { media: "(prefers-color-scheme: light)", url: "/logo_light.svg" },
      { media: "(prefers-color-scheme: dark)", url: "/logo_dark.svg" },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <Script
        src="https://cloud.umami.is/script.js"
        defer
        data-website-id="237f1de7-ab04-44dd-a7b4-6b0b819b7991"
      />
      <body className={cn(instrumentSans.className, instrumentSerif.variable)}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange>
          {children}
          <SonnerToaster
            position="top-center"
            richColors
            closeButton
            theme="system"
          />
        </ThemeProvider>
      </body>
    </html>
  );
}

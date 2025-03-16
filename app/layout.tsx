import type React from "react"
import "@/styles/globals.css"
import {Instrument_Sans} from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"

const instrumentSans = Instrument_Sans({ subsets: ["latin"] })

export const metadata = {
  title: "Vecto3d",
  description: "A super simple tool to convert SVG logos to 3D models",
  generator: 'v0.dev',
  icons: {
    icon: [
      {media: "(prefers-color-scheme: light)", url: "/logo_light.svg"},
      {media: "(prefers-color-scheme: dark)", url: "/logo_dark.svg"},
    ]
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={instrumentSans.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  )
}

import { Geist, Geist_Mono } from "next/font/google"

// @ts-ignore
import "@workspace/ui/globals.css"
import { ConvexProviders } from "@/components/convex-provider"

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased`}
      >
        <ConvexProviders>{children}</ConvexProviders>
      </body>
    </html>
  )
}

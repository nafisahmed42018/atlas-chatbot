import { Geist, Geist_Mono } from "next/font/google"

// @ts-ignore
import "@workspace/ui/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@workspace/ui/lib/utils"
import { AuthProvider } from "@/components/convex-provider"
import { ClerkProvider } from "@clerk/nextjs"
import { AuthGuard } from "@/modules/auth/ui/components/auth-guard"

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })

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
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        geist.variable
      )}
    >
      <body>
        <ThemeProvider>
          <ClerkProvider>
            <AuthProvider>{children}</AuthProvider>
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

import type { Metadata } from "next"
import { Sora, Manrope } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
})

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-heading",
})

export const metadata: Metadata = {
  title: "K2-Sync - Wellness OS",
  description: "Plataforma operacional para negocios de saude e bem-estar",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${manrope.variable} ${sora.variable} antialiased min-h-screen bg-background font-sans`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}

import type { Metadata } from "next"
import "./globals.css"
import { Providers } from "@/components/providers"

export const metadata: Metadata = {
  title: "K2-Sync - Sistema de Gestao para Saude",
  description: "SaaS completo para gestao de profissionais e clinicas de saude e beleza",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-background">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}

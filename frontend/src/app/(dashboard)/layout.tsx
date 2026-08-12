"use client"

import { useMemo } from "react"

import { Sidebar } from "@/components/layout/sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Bell, LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <div className="min-h-screen bg-premium">
      <Sidebar />

      <div className="lg:pl-64 transition-all duration-300">
        <header className="sticky top-0 z-40 h-16 glass-header">
          <div className="flex h-full items-center justify-between px-6">
            <div className="w-10 lg:hidden" />

            <div className="flex-1" />

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-xl hover:bg-muted transition-colors" title="Notificações">
                <Bell className="h-[18px] w-[18px] text-muted-foreground" />
                <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background animate-pulse" />
              </Button>
              <ThemeToggle />
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-colors" onClick={handleLogout} title="Sair do Sistema">
                <LogOut className="h-[18px] w-[18px]" />
              </Button>
            </div>
          </div>
        </header>

        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

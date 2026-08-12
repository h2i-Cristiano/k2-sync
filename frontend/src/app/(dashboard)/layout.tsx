"use client"

import { useState, useEffect, useCallback } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Bell, Search, LogOut, Leaf } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { CommandPalette } from "@/components/command-palette"

const WEEKDAYS = ["Domingo", "Segunda-feira", "Terca-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sabado"]

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return "Bom dia"
  if (hour >= 12 && hour < 18) return "Boa tarde"
  return "Boa noite"
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
}

function formatDate(date: Date): string {
  const weekday = WEEKDAYS[date.getDay()]
  return `${weekday}`
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [cmdOpen, setCmdOpen] = useState(false)
  const [userName, setUserName] = useState<string>("")
  const [greeting, setGreeting] = useState(getGreeting())
  const [currentTime, setCurrentTime] = useState(formatTime(new Date()))
  const [currentDate, setCurrentDate] = useState(formatDate(new Date()))
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const name = user?.user_metadata?.full_name?.split(" ")[0] || ""
      setUserName(name)
    }
    getUser()
  }, [supabase.auth])

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      setGreeting(getGreeting())
      setCurrentTime(formatTime(now))
      setCurrentDate(formatDate(now))
    }, 30000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setCmdOpen((prev) => !prev)
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <div className="min-h-screen bg-premium">
      <Sidebar />
      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />

      <div className="lg:pl-64 transition-all duration-300">
        <header className="sticky top-0 z-40 h-16 glass-header">
          <div className="flex h-full items-center justify-between px-6">
            <div className="w-10 lg:hidden" />

            {/* Left: Greeting + Time */}
            <div className="hidden md:flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-teal-500/15 to-cyan-500/15 flex items-center justify-center">
                  <Leaf className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground leading-tight">
                    {greeting}{userName ? `, ${userName}` : ""}
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    {currentTime} &bull; {currentDate}
                  </p>
                </div>
              </div>
            </div>

            {/* Center: Search */}
            <div className="flex-1 max-w-md mx-4">
              <button
                onClick={() => setCmdOpen(true)}
                className="relative w-full flex items-center"
              >
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-teal-600/70 dark:text-teal-400/70 pointer-events-none" />
                <Input
                  placeholder="Pesquisar... (⌘K)"
                  className="pl-10 pr-12 h-10 bg-background/60 border-primary/15 focus:border-primary/50 focus:bg-background rounded-xl transition-all shadow-xs cursor-pointer"
                  readOnly
                  tabIndex={-1}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-muted text-[10px] font-semibold text-muted-foreground/70 pointer-events-none border border-border/50">
                  ⌘K
                </div>
              </button>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-xl hover:bg-accent/10 transition-colors" title="Notificacoes">
                <Bell className="h-[18px] w-[18px] text-muted-foreground hover:text-accent dark:hover:text-accent" />
                <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-teal-500 ring-2 ring-background animate-pulse" />
              </Button>
              <ThemeToggle />
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 transition-colors" onClick={handleLogout} title="Sair do Sistema">
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

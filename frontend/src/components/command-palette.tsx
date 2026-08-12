"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Search, Users, Calendar, FileText, Settings, ArrowRight, Loader2 } from "lucide-react"

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface SearchResult {
  id: string
  title: string
  subtitle?: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  type: "patient" | "navigation"
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  const navigationItems: SearchResult[] = [
    { id: "nav-dashboard", title: "Dashboard", href: "/dashboard", icon: ArrowRight, type: "navigation" },
    { id: "nav-appointments", title: "Agenda", href: "/appointments", icon: Calendar, type: "navigation" },
    { id: "nav-patients", title: "Pacientes", href: "/patients", icon: Users, type: "navigation" },
    { id: "nav-records", title: "Prontuários", href: "/records", icon: FileText, type: "navigation" },
    { id: "nav-settings", title: "Configurações", href: "/settings", icon: Settings, type: "navigation" },
  ]

  const searchPatients = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults(navigationItems)
      return
    }

    setLoading(true)
    try {
      const { data } = await supabase
        .from("patients")
        .select("id, full_name, email, phone")
        .or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`)
        .limit(8)

      const patientResults: SearchResult[] = (data || []).map((p) => ({
        id: p.id,
        title: p.full_name,
        subtitle: p.email || p.phone || "Sem contato",
        href: `/patients/${p.id}`,
        icon: Users,
        type: "patient" as const,
      }))

      setResults([...patientResults, ...navigationItems])
    } catch (err) {
      console.error("Erro ao buscar pacientes:", err)
      setResults(navigationItems)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    if (open) {
      setQuery("")
      setResults(navigationItems)
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  useEffect(() => {
    const timer = setTimeout(() => {
      searchPatients(query)
    }, 200)
    return () => clearTimeout(timer)
  }, [query, searchPatients])

  useEffect(() => {
    setSelectedIndex(0)
  }, [results])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault()
      router.push(results[selectedIndex].href)
      onOpenChange(false)
    } else if (e.key === "Escape") {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-lg gap-0 overflow-hidden rounded-2xl border-border/60 shadow-2xl" onKeyDown={handleKeyDown}>
        <div className="flex items-center border-b border-border/60 px-4">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <Search className="h-4 w-4 text-muted-foreground" />
          )}
          <Input
            ref={inputRef}
            placeholder="Buscar pacientes, navegar..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-12 text-base"
          />
          <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            ESC
          </kbd>
        </div>
        <div className="max-h-[300px] overflow-y-auto p-2">
          {results.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Nenhum resultado encontrado.
            </div>
          ) : (
            <>
              {!query && (
                <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  Navegação
                </p>
              )}
              {query && results.some(r => r.type === "patient") && (
                <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  Pacientes
                </p>
              )}
              {results.map((result, index) => {
                const Icon = result.icon
                return (
                  <button
                    key={result.id}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                      index === selectedIndex
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-muted/50"
                    }`}
                    onClick={() => {
                      router.push(result.href)
                      onOpenChange(false)
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                      result.type === "patient"
                        ? "bg-teal-500/10 text-teal-600 dark:text-teal-400"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-medium truncate">{result.title}</p>
                      {result.subtitle && (
                        <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                      )}
                    </div>
                    {result.type === "navigation" && (
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                    )}
                  </button>
                )
              })}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
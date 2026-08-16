"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { StatCard } from "@/components/ui/stat-card"
import { StatusBadge } from "@/components/ui/status-badge"
import { Calendar, Clock, UserPlus, CalendarPlus, Sparkles, ArrowRight, CheckCircle2, CalendarDays } from "lucide-react"
import Link from "next/link"
import { fetchServices, getServiceById, ServiceDef } from "@/lib/services"

const MOTIVATIONAL_MESSAGES = [
  "Cuide de quem cuida. Cada sessão é uma jornada de bem-estar.",
  "O cuidado com o outro começa com o cuidado consigo mesmo.",
  "Transformar vidas começa com presença e dedicação.",
  "Cada toque, cada gesto, cada momento de atenção faz diferença.",
  "Bem-estar não é destino, é o caminho que percorremos juntos.",
  "Sua energia transborda. Cuide dela com a mesma intensidade.",
  "A saúde é o maior presente que podemos oferecer.",
  "Paz interior se reflete em cada ato de cuidado.",
]

const statusLabels: Record<string, { label: string; tone: "default" | "success" }> = {
  scheduled: { label: "Agendado", tone: "default" },
  confirmed: { label: "Confirmado", tone: "success" },
}

const quickActions = [
  {
    href: "/patients",
    label: "Novo Paciente",
    icon: UserPlus,
    iconBg: "bg-primary/10 text-primary",
    hover: "hover:border-primary/40 hover:bg-primary/5 hover:text-primary",
  },
  {
    href: "/appointments",
    label: "Agendar Sessão",
    icon: CalendarPlus,
    iconBg: "bg-gold/15 text-gold",
    hover: "hover:border-gold/40 hover:bg-gold/10 hover:text-gold",
  },
]

export default function DashboardPage() {
  const [todayAppointments, setTodayAppointments] = useState<any[]>([])
  const [services, setServices] = useState<ServiceDef[]>([])
  const [loading, setLoading] = useState(true)
  const [motivationalMsg, setMotivationalMsg] = useState("")
  const [currentTime, setCurrentTime] = useState("")
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    const randomIdx = Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)
    setMotivationalMsg(MOTIVATIONAL_MESSAGES[randomIdx])
  }, [])

  useEffect(() => {
    const formatDateTime = () => {
      const now = new Date()
      const days = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"]
      const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]
      const day = days[now.getDay()]
      const date = now.getDate()
      const month = months[now.getMonth()]
      const year = now.getFullYear()
      const hours = String(now.getHours()).padStart(2, "0")
      const minutes = String(now.getMinutes()).padStart(2, "0")
      setCurrentTime(`${day}, ${date} de ${month} de ${year} • ${hours}:${minutes}`)
    }
    formatDateTime()
    const interval = setInterval(formatDateTime, 60000)
    return () => clearInterval(interval)
  }, [])

  const fetchToday = useCallback(async () => {
    setLoading(true)
    try {
      const startOfDay = new Date()
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date()
      endOfDay.setHours(23, 59, 59, 999)

      const { data } = await supabase
        .from("appointments")
        .select("id, scheduled_at, service_type, status, duration_minutes, patients(full_name, phone)")
        .gte("scheduled_at", startOfDay.toISOString())
        .lte("scheduled_at", endOfDay.toISOString())
        .in("status", ["scheduled", "confirmed"])
        .order("scheduled_at", { ascending: true })

      setTodayAppointments(data || [])
    } catch (err) {
      console.error("Erro ao carregar agendamentos de hoje:", err)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchToday()
    fetchServices().then(setServices)
  }, [fetchToday])

  const scheduled = todayAppointments.filter((a) => a.status === "scheduled").length
  const confirmed = todayAppointments.filter((a) => a.status === "confirmed").length

  return (
    <div className="space-y-6 animate-slide-up-fade">
      {/* Welcome */}
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-card to-gold/10 p-5 ring-1 ring-border/40 sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Wellness OS</p>
            <h1 className="mt-1.5 font-heading text-xl font-bold tracking-tight text-foreground sm:text-2xl">Bem-vindo(a)</h1>
            <p className="mt-1.5 max-w-md text-sm leading-relaxed text-muted-foreground text-pretty">{motivationalMsg}</p>
          </div>
          <div className="hidden shrink-0 items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary md:flex">
            <Clock className="h-3.5 w-3.5" /> {currentTime}
          </div>
        </div>
      </div>

      {/* Hoje */}
      <div className="grid grid-cols-2 gap-3 sm:gap-5">
        {loading ? (
          <>
            <Card><CardContent className="space-y-2 p-5"><Skeleton className="h-3 w-20" /><Skeleton className="h-7 w-12" /></CardContent></Card>
            <Card><CardContent className="space-y-2 p-5"><Skeleton className="h-3 w-20" /><Skeleton className="h-7 w-12" /></CardContent></Card>
          </>
        ) : (
          <>
            <StatCard
              label="Agendados"
              value={scheduled}
              icon={Calendar}
              tone="primary"
              hint="Hoje"
              href="/appointments"
            />
            <StatCard
              label="Confirmados"
              value={confirmed}
              icon={CheckCircle2}
              tone="success"
              hint="Hoje"
              href="/appointments"
            />
          </>
        )}
      </div>

      {/* Pré-lista de hoje */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-bold">
            <CalendarDays className="h-4 w-4 text-primary" /> Agenda de Hoje
          </CardTitle>
          <Button render={<Link href="/appointments" />} variant="ghost" size="sm" className="h-8 gap-1 text-primary">
            Ver completa <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-[64px] w-full rounded-xl" />
            ))
          ) : todayAppointments.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">Nenhum agendamento para hoje.</p>
              <Button render={<Link href="/appointments" />} variant="outline" size="sm" className="mt-3">
                <CalendarPlus className="mr-2 h-4 w-4" /> Agendar Sessão
              </Button>
            </div>
          ) : (
            <>
              {todayAppointments.slice(0, 6).map((apt) => {
                const timeStr = new Date(apt.scheduled_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
                const svc = getServiceById(services, apt.service_type)
                const meta = statusLabels[apt.status] || { label: apt.status, tone: "secondary" as const }
                return (
                  <Link
                    key={apt.id}
                    href="/appointments"
                    className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1.5 rounded-xl bg-card p-3.5 ring-1 ring-border/40 transition-[box-shadow,transform] hover:shadow-md sm:flex sm:gap-4"
                    style={{ borderLeft: `3px solid ${svc?.color || "#6B7280"}` }}
                  >
                    <div className="w-12 shrink-0">
                      <span className="tnum font-heading text-sm font-bold leading-none text-foreground">{timeStr}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{apt.patients?.full_name || "Paciente Removido"}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: svc?.color || "#6B7280" }} />
                        <span className="truncate">{svc?.label || apt.service_type}</span>
                        {apt.duration_minutes ? (
                          <span className="shrink-0 text-muted-foreground/60">{apt.duration_minutes}min</span>
                        ) : null}
                      </p>
                    </div>
                    <StatusBadge label={meta.label} tone={meta.tone} className="col-start-2 mt-0.5 justify-self-start sm:mt-0 sm:ml-auto" />
                  </Link>
                )
              })}
            </>
          )}
        </CardContent>
      </Card>

      {/* Ações Rápidas */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-bold">
            <Sparkles className="h-4 w-4 text-primary" /> Ações Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href} className="w-full">
              <Button
                variant="outline"
                className={`h-12 w-full justify-start gap-3 rounded-xl border-border/60 px-4 text-sm font-medium transition-colors ${action.hover}`}
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${action.iconBg}`}>
                  <action.icon className="h-4 w-4" />
                </div>
                {action.label}
              </Button>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
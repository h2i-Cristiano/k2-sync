"use client"

import { useEffect, useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { StatCard } from "@/components/ui/stat-card"
import { Users, Calendar, FileText, Plus, UserPlus, CalendarPlus, ClipboardPlus, Clock } from "lucide-react"
import Link from "next/link"

interface Stats {
  totalPatients: number
  upcomingAppointments: number
  totalRecords: number
}

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
  {
    href: "/records",
    label: "Novo Prontuário",
    icon: ClipboardPlus,
    iconBg: "bg-success/15 text-success",
    hover: "hover:border-success/40 hover:bg-success/10 hover:text-success",
  },
]

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalPatients: 0,
    upcomingAppointments: 0,
    totalRecords: 0,
  })
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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [patients, appointments, records] = await Promise.all([
          supabase.from("patients").select("id", { count: "exact", head: true }),
          supabase.from("appointments").select("id", { count: "exact", head: true }).gte("scheduled_at", new Date().toISOString()),
          supabase.from("medical_records").select("id", { count: "exact", head: true }),
        ])

        setStats({
          totalPatients: patients.count || 0,
          upcomingAppointments: appointments.count || 0,
          totalRecords: records.count || 0,
        })
      } catch (err) {
        console.error("Erro ao carregar estatísticas:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [supabase])

  const statCards = [
    { label: "Pacientes", value: stats.totalPatients, icon: Users, tone: "primary" as const, hint: "Cadastrados", href: "/patients" },
    { label: "Agendamentos", value: stats.upcomingAppointments, icon: Calendar, tone: "gold" as const, hint: "Na agenda", href: "/appointments" },
    { label: "Prontuários", value: stats.totalRecords, icon: FileText, tone: "success" as const, hint: "Registrados", href: "/records" },
  ]

  return (
    <div className="space-y-6 animate-slide-up-fade">
      {/* Welcome */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-card to-gold/10 p-5 ring-1 ring-border/40 sm:p-6">
        <div className="pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full bg-primary/10" />
        <div className="pointer-events-none absolute -bottom-8 -left-8 h-20 w-20 rounded-full bg-gold/10" />
        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Wellness OS</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">Bem-vindo(a)</h1>
            <p className="mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">{motivationalMsg}</p>
          </div>
          <div className="hidden shrink-0 items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary md:flex">
            <Clock className="h-3.5 w-3.5" /> {currentTime}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="space-y-2 p-5">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-7 w-14" />
                </CardContent>
              </Card>
            ))
          : statCards.map((card) => (
              <StatCard
                key={card.label}
                label={card.label}
                value={card.value}
                icon={card.icon}
                tone={card.tone}
                hint={card.hint}
                href={card.href}
              />
            ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-bold">
            <Plus className="h-4 w-4 text-primary" /> Ações Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href} className="w-full">
              <Button
                variant="outline"
                className={`h-12 w-full justify-start rounded-xl border-border/60 transition-colors ${action.hover}`}
              >
                <div className={`mr-3 flex h-8 w-8 items-center justify-center rounded-lg ${action.iconBg}`}>
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
"use client"

import { useEffect, useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Users, Calendar, FileText, TrendingUp, Plus, UserPlus, CalendarPlus, ClipboardPlus, Clock } from "lucide-react"
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

  const cards = [
    {
      title: "Pacientes",
      value: stats.totalPatients,
      icon: Users,
      href: "/patients",
      badge: "Cadastrados",
      gradient: "from-primary/10 to-primary/5",
      textGradient: "text-primary",
      iconBg: "bg-primary/10 text-primary",
      barGradient: "bg-primary",
    },
    {
      title: "Agendamentos",
      value: stats.upcomingAppointments,
      icon: Calendar,
      href: "/appointments",
      badge: "Na Agenda",
      gradient: "from-accent/10 to-accent/5",
      textGradient: "text-accent",
      iconBg: "bg-accent/10 text-accent",
      barGradient: "bg-accent",
    },
    {
      title: "Prontuários",
      value: stats.totalRecords,
      icon: FileText,
      href: "/records",
      badge: "Registrados",
      gradient: "from-success/10 to-success/5",
      textGradient: "text-success",
      iconBg: "bg-success/10 text-success",
      barGradient: "bg-success",
    },
  ]

  return (
    <div className="space-y-8 animate-slide-up-fade">
      {/* Motivational Banner */}
      <Card className="glass-card border-border/60 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-8 -mt-8" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/5 rounded-full -ml-6 -mb-6" />
        <CardContent className="p-6 relative">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h1 className="text-xl font-bold text-foreground mb-1">Bem-vindo ao Wellness OS</h1>
              <p className="text-sm text-muted-foreground leading-relaxed">{motivationalMsg}</p>
            </div>
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold shrink-0">
              <Clock className="h-3.5 w-3.5" /> {currentTime}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-5 md:grid-cols-3">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-10 w-16" />
                    </div>
                    <Skeleton className="h-12 w-12 rounded-xl" />
                  </div>
                </CardContent>
              </Card>
            ))
          : cards.map((card) => (
              <Link key={card.title} href={card.href}>
                <Card className="glass-card card-hover-effect cursor-pointer relative overflow-hidden group border-border/60">
                  <div className={`absolute top-0 right-0 h-20 w-20 rounded-full bg-gradient-to-br ${card.gradient} opacity-30 -mr-5 -mt-5 group-hover:scale-125 transition-transform duration-300 pointer-events-none`} />
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{card.title}</p>
                        <p className="text-4xl font-black mt-2 text-foreground tracking-tight">{card.value}</p>
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${card.textGradient} mt-2`}>
                          <TrendingUp className="h-3 w-3" /> {card.badge}
                        </span>
                      </div>
                      <div className={`h-12 w-12 rounded-2xl ${card.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                        <card.icon className="h-6 w-6" />
                      </div>
                    </div>
                  </CardContent>
                  <div className={`h-1 w-full ${card.barGradient} opacity-40`} />
                </Card>
              </Link>
            ))}
      </div>

      {/* Quick Actions */}
      <Card className="glass-card border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" /> Ações Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link href="/patients" className="w-full">
            <Button variant="outline" className="w-full justify-start h-12 rounded-xl border-border/60 hover:border-primary/50 hover:bg-primary/5 hover:text-primary font-medium transition-all group">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center mr-3 text-primary group-hover:scale-110 transition-transform">
                <UserPlus className="h-4 w-4" />
              </div>
              Novo Paciente
            </Button>
          </Link>
          <Link href="/appointments" className="w-full">
            <Button variant="outline" className="w-full justify-start h-12 rounded-xl border-border/60 hover:border-accent/50 hover:bg-accent/5 hover:text-accent font-medium transition-all group">
              <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center mr-3 text-accent group-hover:scale-110 transition-transform">
                <CalendarPlus className="h-4 w-4" />
              </div>
              Agendar Sessão
            </Button>
          </Link>
          <Link href="/records" className="w-full">
            <Button variant="outline" className="w-full justify-start h-12 rounded-xl border-border/60 hover:border-success/50 hover:bg-success/5 hover:text-success font-medium transition-all group">
              <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center mr-3 text-success group-hover:scale-110 transition-transform">
                <ClipboardPlus className="h-4 w-4" />
              </div>
              Novo Prontuário
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

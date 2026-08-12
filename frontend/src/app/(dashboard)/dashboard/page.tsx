"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Users, Calendar, FileText, ArrowRight, TrendingUp, Plus, UserPlus, CalendarPlus, ClipboardPlus, Sparkles, Leaf } from "lucide-react"
import Link from "next/link"

interface Stats {
  totalPatients: number
  upcomingAppointments: number
  totalRecords: number
}

const MOTIVATIONAL_MESSAGES = [
  "Cuide de quem cuida. Cada sessao e uma jornada de bem-estar.",
  "O cuidado com o outro comeca com o cuidado consigo mesmo.",
  "Transformar vidas comute com presenca e dedicacao.",
  "Cada toque, cada gesto, cada momento de atencao faz diferenca.",
  "Bem-estar nao e destino, e o caminho que percorremos juntos.",
  "Sua energia transborda. Cuide dela com a mesma intensidade.",
  "A saude e o maior present que podemos oferecer.",
  "Paz interior se reflete em cada ato de cuidado.",
]

const AVATAR_GRADIENTS = [
  "from-teal-500 to-cyan-700",
  "from-purple-500 to-violet-700",
  "from-rose-500 to-pink-700",
  "from-amber-500 to-orange-700",
  "from-sky-500 to-blue-700",
]

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalPatients: 0,
    upcomingAppointments: 0,
    totalRecords: 0,
  })
  const [recentPatients, setRecentPatients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [motivationalMsg, setMotivationalMsg] = useState("")
  const supabase = createClient()

  useEffect(() => {
    const randomIdx = Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)
    setMotivationalMsg(MOTIVATIONAL_MESSAGES[randomIdx])
  }, [])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [patients, appointments, records, recent] = await Promise.all([
          supabase.from("patients").select("id", { count: "exact", head: true }),
          supabase.from("appointments").select("id", { count: "exact", head: true }).gte("scheduled_at", new Date().toISOString()),
          supabase.from("medical_records").select("id", { count: "exact", head: true }),
          supabase.from("patients").select("id, full_name, email, phone").order("created_at", { ascending: false }).limit(5),
        ])

        setStats({
          totalPatients: patients.count || 0,
          upcomingAppointments: appointments.count || 0,
          totalRecords: records.count || 0,
        })
        setRecentPatients(recent.data || [])
      } catch (err) {
        console.error("Erro ao carregar estatisticas:", err)
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
      gradient: "from-teal-500/10 to-cyan-500/20",
      textGradient: "text-teal-600 dark:text-teal-400",
      iconBg: "bg-teal-500/15 text-teal-600 dark:bg-teal-500/25 dark:text-teal-400",
      barGradient: "from-teal-500 to-cyan-500",
    },
    {
      title: "Agendamentos",
      value: stats.upcomingAppointments,
      icon: Calendar,
      href: "/appointments",
      badge: "Na Agenda",
      gradient: "from-purple-500/10 to-violet-500/20",
      textGradient: "text-purple-600 dark:text-purple-400",
      iconBg: "bg-purple-500/15 text-purple-600 dark:bg-purple-500/25 dark:text-purple-400",
      barGradient: "from-purple-500 to-violet-500",
    },
    {
      title: "Prontuarios",
      value: stats.totalRecords,
      icon: FileText,
      href: "/records",
      badge: "Registrados",
      gradient: "from-rose-500/10 to-orange-500/20",
      textGradient: "text-rose-600 dark:text-rose-400",
      iconBg: "bg-rose-500/15 text-rose-600 dark:bg-rose-500/25 dark:text-rose-400",
      barGradient: "from-rose-500 to-orange-500",
    },
  ]

  return (
    <div className="space-y-8 animate-slide-up-fade">
      {/* Motivational Banner */}
      <Card className="glass-card border-border/60 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-teal-500/10 to-cyan-500/10 rounded-full -mr-8 -mt-8" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-500/10 to-violet-500/10 rounded-full -ml-6 -mb-6" />
        <CardContent className="p-6 relative">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-teal-500/15 to-cyan-500/15 flex items-center justify-center shrink-0">
              <Leaf className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-foreground mb-1">Bem-vindo ao Wellness OS</h1>
              <p className="text-sm text-muted-foreground leading-relaxed">{motivationalMsg}</p>
            </div>
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-300 text-xs font-semibold shrink-0">
              <Sparkles className="h-3.5 w-3.5" /> Hoje
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
                      <Skeleton className="h-12 w-16" />
                    </div>
                    <Skeleton className="h-12 w-12 rounded-xl" />
                  </div>
                </CardContent>
              </Card>
            ))
          : cards.map((card) => (
              <Link key={card.title} href={card.href}>
                <Card className="glass-card card-hover-effect cursor-pointer relative overflow-hidden group border-border/60">
                  <div className={`absolute top-0 right-0 h-24 w-24 rounded-full bg-gradient-to-br ${card.gradient} opacity-20 -mr-6 -mt-6 group-hover:scale-125 transition-transform duration-300 pointer-events-none`} />
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{card.title}</p>
                        <p className="text-5xl font-black mt-2 text-foreground tracking-tight">{card.value}</p>
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${card.textGradient} mt-2`}>
                          <TrendingUp className="h-3 w-3" /> {card.badge}
                        </span>
                      </div>
                      <div className={`h-12 w-12 rounded-2xl ${card.iconBg} flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform duration-200`}>
                        <card.icon className="h-6 w-6" />
                      </div>
                    </div>
                  </CardContent>
                  <div className={`h-1 w-full bg-gradient-to-r ${card.barGradient} opacity-60`} />
                </Card>
              </Link>
            ))}
      </div>

      {/* Quick Actions */}
      <Card className="glass-card border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Plus className="h-4 w-4 text-teal-600 dark:text-teal-400" /> Acoes Rapidas
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link href="/patients" className="w-full">
            <Button variant="outline" className="w-full justify-start h-12 rounded-xl border-purple-500/20 hover:border-purple-500/50 hover:bg-purple-500/10 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition-all group">
              <div className="h-8 w-8 rounded-lg bg-purple-500/15 flex items-center justify-center mr-3 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                <UserPlus className="h-4 w-4" />
              </div>
              Novo Paciente
            </Button>
          </Link>
          <Link href="/appointments" className="w-full">
            <Button variant="outline" className="w-full justify-start h-12 rounded-xl border-teal-500/20 hover:border-teal-500/50 hover:bg-teal-500/10 hover:text-teal-700 dark:hover:text-teal-300 font-medium transition-all group">
              <div className="h-8 w-8 rounded-lg bg-teal-500/15 flex items-center justify-center mr-3 text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform">
                <CalendarPlus className="h-4 w-4" />
              </div>
              Agendar Sessao
            </Button>
          </Link>
          <Link href="/records" className="w-full">
            <Button variant="outline" className="w-full justify-start h-12 rounded-xl border-rose-500/20 hover:border-rose-500/50 hover:bg-rose-500/10 hover:text-rose-700 dark:hover:text-rose-300 font-medium transition-all group">
              <div className="h-8 w-8 rounded-lg bg-rose-500/15 flex items-center justify-center mr-3 text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform">
                <ClipboardPlus className="h-4 w-4" />
              </div>
              Novo Prontuario
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Recent Patients */}
      <Card className="glass-card border-border/60">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Users className="h-4 w-4 text-teal-600 dark:text-teal-400" /> Pacientes Recentes
          </CardTitle>
          <Link href="/patients" className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1">
            Ver lista completa <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentPatients.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground space-y-3">
              <div className="h-12 w-12 mx-auto rounded-full bg-teal-500/10 flex items-center justify-center text-teal-600">
                <Users className="h-6 w-6" />
              </div>
              <p className="font-medium text-sm">Nenhum paciente cadastrado ainda.</p>
              <Link href="/patients">
                <Button size="sm" className="rounded-xl font-semibold shadow-xs">
                  <UserPlus className="mr-2 h-4 w-4" /> Cadastrar Primeiro Paciente
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {recentPatients.map((p, idx) => {
                const gradient = AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length]
                const initial = p.full_name?.charAt(0).toUpperCase() || "P"
                return (
                  <Link
                    key={p.id}
                    href={`/patients/${p.id}`}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-accent/5 transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`h-10 w-10 rounded-full bg-gradient-to-tr ${gradient} text-white flex items-center justify-center font-bold text-sm shadow-xs group-hover:scale-105 transition-transform`}>
                        {initial}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-foreground group-hover:text-accent transition-colors">{p.full_name}</p>
                        <p className="text-xs text-muted-foreground">{p.email || p.phone || "Sem contato informado"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 bg-teal-500/10 px-2.5 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        Ver Perfil
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

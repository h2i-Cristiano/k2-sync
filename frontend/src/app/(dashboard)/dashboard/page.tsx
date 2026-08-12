"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Users, Calendar, FileText, ArrowRight, TrendingUp, Plus, UserPlus, CalendarPlus, ClipboardPlus, Sparkles } from "lucide-react"
import Link from "next/link"

interface Stats {
  totalPatients: number
  upcomingAppointments: number
  totalRecords: number
}

const AVATAR_GRADIENTS = [
  "from-emerald-500 to-teal-700",
  "from-amber-500 to-orange-600",
  "from-indigo-500 to-blue-700",
  "from-rose-500 to-pink-700",
  "from-purple-500 to-indigo-700",
]

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalPatients: 0,
    upcomingAppointments: 0,
    totalRecords: 0,
  })
  const [recentPatients, setRecentPatients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

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
        console.error("Erro ao carregar estatísticas:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [supabase])

  const cards = [
    {
      title: "Total de Pacientes",
      value: stats.totalPatients,
      icon: Users,
      href: "/patients",
      badge: "Cadastrados",
      gradient: "from-emerald-500/10 to-teal-500/20 text-emerald-600 dark:text-emerald-400",
      iconBg: "bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/25 dark:text-emerald-400",
    },
    {
      title: "Próximos Agendamentos",
      value: stats.upcomingAppointments,
      icon: Calendar,
      href: "/appointments",
      badge: "Na Agenda",
      gradient: "from-amber-500/10 to-orange-500/20 text-amber-600 dark:text-amber-400",
      iconBg: "bg-amber-500/15 text-amber-600 dark:bg-amber-500/25 dark:text-amber-400",
    },
    {
      title: "Prontuários Registrados",
      value: stats.totalRecords,
      icon: FileText,
      href: "/records",
      badge: "Atualizados",
      gradient: "from-indigo-500/10 to-blue-500/20 text-indigo-600 dark:text-indigo-400",
      iconBg: "bg-indigo-500/15 text-indigo-600 dark:bg-indigo-500/25 dark:text-indigo-400",
    },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-semibold mb-2">
            <Sparkles className="h-3.5 w-3.5" /> Visão Geral da Clínica
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Acompanhe seus pacientes, agenda e registros em tempo real.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-5 md:grid-cols-3">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-8 w-16" />
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
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{card.title}</p>
                        </div>
                        <p className="text-3xl font-extrabold mt-2 text-foreground">{card.value}</p>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-2">
                          <TrendingUp className="h-3 w-3" /> {card.badge}
                        </span>
                      </div>
                      <div className={`h-12 w-12 rounded-2xl ${card.iconBg} flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform duration-200`}>
                        <card.icon className="h-6 w-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
      </div>

      {/* Quick Actions */}
      <Card className="glass-card border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Plus className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Ações Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link href="/patients" className="w-full">
            <Button variant="outline" className="w-full justify-start h-12 rounded-xl border-primary/20 hover:border-primary/50 hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium transition-all group">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/15 flex items-center justify-center mr-3 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                <UserPlus className="h-4 w-4" />
              </div>
              Novo Paciente
            </Button>
          </Link>
          <Link href="/appointments" className="w-full">
            <Button variant="outline" className="w-full justify-start h-12 rounded-xl border-amber-500/20 hover:border-amber-500/50 hover:bg-amber-500/10 hover:text-amber-700 dark:hover:text-amber-300 font-medium transition-all group">
              <div className="h-8 w-8 rounded-lg bg-amber-500/15 flex items-center justify-center mr-3 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                <CalendarPlus className="h-4 w-4" />
              </div>
              Agendar Sessão
            </Button>
          </Link>
          <Link href="/records" className="w-full">
            <Button variant="outline" className="w-full justify-start h-12 rounded-xl border-indigo-500/20 hover:border-indigo-500/50 hover:bg-indigo-500/10 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-all group">
              <div className="h-8 w-8 rounded-lg bg-indigo-500/15 flex items-center justify-center mr-3 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                <ClipboardPlus className="h-4 w-4" />
              </div>
              Novo Prontuário
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Recent Patients */}
      <Card className="glass-card border-border/60">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Pacientes Cadastrados Recentemente
          </CardTitle>
          <Link href="/patients" className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1">
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
              <div className="h-12 w-12 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
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
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-primary/5 transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`h-10 w-10 rounded-full bg-gradient-to-tr ${gradient} text-white flex items-center justify-center font-bold text-sm shadow-xs group-hover:scale-105 transition-transform`}>
                        {initial}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">{p.full_name}</p>
                        <p className="text-xs text-muted-foreground">{p.email || p.phone || "Sem contato informado"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        Ver Perfil
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
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


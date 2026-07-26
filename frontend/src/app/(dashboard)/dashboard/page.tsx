"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Calendar, FileText, ArrowRight } from "lucide-react"
import Link from "next/link"

interface Stats {
  totalPatients: number
  upcomingAppointments: number
  totalRecords: number
}

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
      const [patients, appointments, records, recent] = await Promise.all([
        supabase.from("patients").select("*", { count: "exact", head: true }),
        supabase.from("appointments").select("*", { count: "exact", head: true }).gte("scheduled_at", new Date().toISOString()),
        supabase.from("medical_records").select("*", { count: "exact", head: true }),
        supabase.from("patients").select("id, full_name, email, phone").order("created_at", { ascending: false }).limit(5),
      ])

      setStats({
        totalPatients: patients.count || 0,
        upcomingAppointments: appointments.count || 0,
        totalRecords: records.count || 0,
      })
      setRecentPatients(recent.data || [])
      setLoading(false)
    }

    fetchStats()
  }, [supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Carregando...</p>
      </div>
    )
  }

  const cards = [
    {
      title: "Pacientes",
      value: stats.totalPatients,
      icon: Users,
      href: "/patients",
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Proximos Agendamentos",
      value: stats.upcomingAppointments,
      icon: Calendar,
      href: "/appointments",
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      title: "Prontuarios",
      value: stats.totalRecords,
      icon: FileText,
      href: "/records",
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Visao geral do seu consultorio</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <Link key={card.title} href={card.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                    <p className="text-3xl font-bold mt-1">{card.value}</p>
                  </div>
                  <div className={`h-12 w-12 rounded-xl ${card.bg} flex items-center justify-center`}>
                    <card.icon className={`h-6 w-6 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Patients */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Pacientes Recentes</CardTitle>
          <Link href="/patients" className="text-sm text-primary hover:underline flex items-center gap-1">
            Ver todos <ArrowRight className="h-4 w-4" />
          </Link>
        </CardHeader>
        <CardContent>
          {recentPatients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhum paciente cadastrado ainda.</p>
              <Link href="/patients" className="text-primary hover:underline text-sm">
                Adicionar primeiro paciente
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentPatients.map((p) => (
                <Link
                  key={p.id}
                  href={`/patients/${p.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm">
                      {p.full_name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{p.full_name}</p>
                      <p className="text-xs text-muted-foreground">{p.email || p.phone || "Sem contato"}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acoes Rapidas</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3 flex-wrap">
          <Link href="/patients">
            <Button variant="outline">
              <Users className="mr-2 h-4 w-4" />
              Novo Paciente
            </Button>
          </Link>
          <Link href="/appointments">
            <Button variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              Agendar Sessao
            </Button>
          </Link>
          <Link href="/records">
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Novo Prontuario
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { DollarSign, TrendingUp, Clock, XCircle, ArrowRight } from "lucide-react"
import Link from "next/link"

interface FinancialStats {
  totalRevenue: number
  pendingAmount: number
  paidCount: number
  pendingCount: number
}

export default function FinancialPage() {
  const [stats, setStats] = useState<FinancialStats>({
    totalRevenue: 0,
    pendingAmount: 0,
    paidCount: 0,
    pendingCount: 0,
  })
  const [recentPayments, setRecentPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [paid, pending, recent] = await Promise.all([
          supabase.from("financial_entries").select("amount").eq("type", "receivable").eq("status", "paid"),
          supabase.from("financial_entries").select("amount, id").eq("type", "receivable").eq("status", "pending"),
          supabase
            .from("financial_entries")
            .select("id, amount, status, description, created_at, patients(full_name)")
            .eq("type", "receivable")
            .order("created_at", { ascending: false })
            .limit(10),
        ])

        const totalRevenue = (paid.data || []).reduce((sum, p) => sum + Number(p.amount), 0)
        const pendingAmount = (pending.data || []).reduce((sum, p) => sum + Number(p.amount), 0)

        setStats({
          totalRevenue,
          pendingAmount,
          paidCount: paid.data?.length || 0,
          pendingCount: pending.data?.length || 0,
        })
        setRecentPayments(recent.data || [])
      } catch (err) {
        console.error("Erro ao carregar dados financeiros:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [supabase])

  const cards = [
    {
      title: "Faturamento Total",
      value: `R$ ${stats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      title: "Pendente",
      value: `R$ ${stats.pendingAmount.toFixed(2)}`,
      icon: Clock,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      title: "Pagos",
      value: stats.paidCount.toString(),
      icon: TrendingUp,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "A Receber",
      value: stats.pendingCount.toString(),
      icon: XCircle,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
  ]

  return (
    <div className="space-y-6 animate-slide-up-fade">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Financeiro</h1>
          <p className="text-sm text-muted-foreground">Acompanhe seus recebimentos e pendências.</p>
        </div>
        <Link href="/financial/charges" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
          Ver cobranças <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="glass-card">
                <CardContent className="p-5">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-20" />
                </CardContent>
              </Card>
            ))
          : cards.map((card) => (
              <Card key={card.title} className="glass-card">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{card.title}</p>
                      <p className="text-2xl font-bold mt-1 text-foreground">{card.value}</p>
                    </div>
                    <div className={`h-10 w-10 rounded-xl ${card.bg} flex items-center justify-center`}>
                      <card.icon className={`h-5 w-5 ${card.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Recent Payments */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">Pagamentos Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : recentPayments.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground text-sm">Nenhum pagamento registrado.</p>
          ) : (
            <div className="divide-y divide-border/40">
              {recentPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {payment.patients?.full_name?.charAt(0)?.toUpperCase() || "P"}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{payment.patients?.full_name || "Paciente"}</p>
                      <p className="text-xs text-muted-foreground">{payment.description || new Date(payment.created_at).toLocaleDateString("pt-BR")}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">R$ {Number(payment.amount).toFixed(2)}</p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      payment.status === "paid"
                        ? "bg-emerald-500/10 text-emerald-600"
                        : "bg-amber-500/10 text-amber-600"
                    }`}>
                      {payment.status === "paid" ? "Pago" : "Pendente"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/ui/page-header"
import { StatCard } from "@/components/ui/stat-card"
import { StatusBadge } from "@/components/ui/status-badge"
import { ArrowRight, DollarSign, Clock, TrendingUp, Receipt } from "lucide-react"
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

  const statCards = [
    { label: "Faturamento Total", value: `R$ ${stats.totalRevenue.toFixed(2)}`, icon: DollarSign, tone: "success" as const, href: "/financial/charges" },
    { label: "Pendente", value: `R$ ${stats.pendingAmount.toFixed(2)}`, icon: Clock, tone: "warning" as const, href: "/financial/charges" },
    { label: "Pagos", value: stats.paidCount.toString(), icon: TrendingUp, tone: "primary" as const, href: "/financial/charges" },
    { label: "A Receber", value: stats.pendingCount.toString(), icon: Receipt, tone: "destructive" as const, href: "/financial/charges" },
  ]

  return (
    <div className="space-y-5 animate-slide-up-fade">
      <PageHeader
        title="Financeiro"
        description="Acompanhe seus recebimentos e pendências."
        actions={
          <Button render={<Link href="/financial/charges" />} variant="outline">
            Ver cobranças <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="space-y-2 p-5">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-7 w-24" />
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
                href={card.href}
              />
            ))}
      </div>

      <Card className="ring-1 ring-border/40">
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
                <div key={payment.id} className="flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {payment.patients?.full_name?.charAt(0)?.toUpperCase() || "P"}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{payment.patients?.full_name || "Paciente"}</p>
                      <p className="text-xs text-muted-foreground truncate">{payment.description || new Date(payment.created_at).toLocaleDateString("pt-BR")}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-sm tnum">R$ {Number(payment.amount).toFixed(2)}</p>
                    <StatusBadge label={payment.status === "paid" ? "Pago" : "Pendente"} tone={payment.status === "paid" ? "success" : "warning"} />
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
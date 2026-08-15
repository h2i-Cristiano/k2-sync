"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/ui/page-header"
import { StatusBadge } from "@/components/ui/status-badge"
import { MessageCircle, CheckCircle, Clock, Check } from "lucide-react"
import { getWhatsAppUrl, buildPaymentMessage } from "@/lib/whatsapp"
import { toast } from "sonner"

interface PendingCharge {
  id: string
  amount: number
  status: string
  description: string
  due_date: string
  created_at: string
  patients: { full_name: string; phone: string } | null
  appointments: { service_type: string; total_cost: number } | null
}

export default function ChargesPage() {
  const [charges, setCharges] = useState<PendingCharge[]>([])
  const [loading, setLoading] = useState(true)
  const [marking, setMarking] = useState<string | null>(null)
  const supabase = createClient()

  const fetchCharges = async () => {
    try {
      const { data } = await supabase
        .from("financial_entries")
        .select("id, amount, status, description, due_date, created_at, patients(full_name, phone), appointments(service_type, total_cost)")
        .eq("type", "receivable")
        .order("created_at", { ascending: false })
      setCharges((data || []) as any[])
    } catch (err) {
      console.error("Erro ao carregar cobranças:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCharges() }, [supabase])

  const pendingCharges = charges.filter(c => c.status === "pending")
  const paidCharges = charges.filter(c => c.status === "paid")

  const handleSendWhatsApp = (charge: PendingCharge) => {
    if (!charge.patients?.phone) return
    const message = buildPaymentMessage({
      patientName: charge.patients.full_name,
      serviceName: charge.description || "Serviço",
      amount: Number(charge.amount),
      status: "completed",
    })
    const url = getWhatsAppUrl(charge.patients.phone, message)
    window.open(url, "_blank")
  }

  const handleMarkPaid = async (id: string) => {
    setMarking(id)
    const { error } = await supabase
      .from("financial_entries")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", id)
    setMarking(null)
    if (error) { toast.error("Erro ao marcar como pago"); return }
    toast.success("Pagamento registrado!")
    fetchCharges()
  }

  const renderSkeleton = (count: number) => (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      ))}
    </div>
  )

  return (
    <div className="space-y-5 animate-slide-up-fade">
      <PageHeader
        title="Cobranças"
        description="Gerencie pagamentos pendentes, registre recebimentos e envie cobranças via WhatsApp."
      />

      {/* Pending Charges */}
      <Card className="ring-1 ring-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Clock className="h-4 w-4 text-warning" /> Pendentes ({pendingCharges.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            renderSkeleton(3)
          ) : pendingCharges.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground text-sm">Nenhuma cobrança pendente.</p>
          ) : (
            <div className="divide-y divide-border/40">
              {pendingCharges.map((charge) => (
                <div key={charge.id} className="flex flex-col gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-warning/15 flex items-center justify-center text-warning font-bold text-sm">
                      {charge.patients?.full_name?.charAt(0)?.toUpperCase() || "P"}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{charge.patients?.full_name || "Paciente"}</p>
                      <p className="text-xs text-muted-foreground truncate">{charge.description || "Serviço"}</p>
                      {charge.due_date && (
                        <p className="text-[10px] text-muted-foreground/70 tnum">Vencimento: {new Date(charge.due_date).toLocaleDateString("pt-BR")}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                    <p className="font-semibold text-sm tnum">R$ {Number(charge.amount).toFixed(2)}</p>
                    <Button
                      size="sm"
                      className="h-10 flex-1 rounded-lg sm:flex-none"
                      onClick={() => handleMarkPaid(charge.id)}
                      disabled={marking === charge.id}
                    >
                      <Check className="h-4 w-4 mr-1" /> {marking === charge.id ? "..." : "Marcar pago"}
                    </Button>
                    {charge.patients?.phone && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-10 flex-1 rounded-lg sm:flex-none text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-700"
                        onClick={() => handleSendWhatsApp(charge)}
                      >
                        <MessageCircle className="h-4 w-4 mr-1" /> Cobrar
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paid */}
      <Card className="ring-1 ring-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-success" /> Pagos ({paidCharges.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            renderSkeleton(2)
          ) : paidCharges.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground text-sm">Nenhum pagamento registrado.</p>
          ) : (
            <div className="divide-y divide-border/40">
              {paidCharges.map((charge) => (
                <div key={charge.id} className="flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-success/15 flex items-center justify-center text-success font-bold text-sm">
                      {charge.patients?.full_name?.charAt(0)?.toUpperCase() || "P"}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{charge.patients?.full_name || "Paciente"}</p>
                      <p className="text-xs text-muted-foreground truncate">{charge.description || "Serviço"}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-sm text-success tnum">R$ {Number(charge.amount).toFixed(2)}</p>
                    <StatusBadge label="Pago" tone="success" />
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
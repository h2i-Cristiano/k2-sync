"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
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

  return (
    <div className="space-y-6 animate-slide-up-fade">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Cobranças</h1>
        <p className="text-sm text-muted-foreground">Gerencie pagamentos pendentes, registre recebimentos e envie cobranças via WhatsApp.</p>
      </div>

      {/* Pending Charges */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" /> Pendentes ({pendingCharges.length})
          </CardTitle>
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
                  <Skeleton className="h-9 w-24 rounded-lg" />
                </div>
              ))}
            </div>
          ) : pendingCharges.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground text-sm">Nenhuma cobrança pendente.</p>
          ) : (
            <div className="divide-y divide-border/40">
              {pendingCharges.map((charge) => (
                <div key={charge.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 font-bold text-sm">
                      {charge.patients?.full_name?.charAt(0)?.toUpperCase() || "P"}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{charge.patients?.full_name || "Paciente"}</p>
                      <p className="text-xs text-muted-foreground">{charge.description || "Serviço"}</p>
                      {charge.due_date && (
                        <p className="text-[10px] text-muted-foreground/70">Vencimento: {new Date(charge.due_date).toLocaleDateString("pt-BR")}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">R$ {Number(charge.amount).toFixed(2)}</p>
                    <Button
                      size="sm"
                      className="rounded-lg"
                      onClick={() => handleMarkPaid(charge.id)}
                      disabled={marking === charge.id}
                    >
                      <Check className="h-4 w-4 mr-1" /> {marking === charge.id ? "..." : "Marcar pago"}
                    </Button>
                    {charge.patients?.phone && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-lg border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-600"
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
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-500" /> Pagos ({paidCharges.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
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
          ) : paidCharges.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground text-sm">Nenhum pagamento registrado.</p>
          ) : (
            <div className="divide-y divide-border/40">
              {paidCharges.map((charge) => (
                <div key={charge.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 font-bold text-sm">
                      {charge.patients?.full_name?.charAt(0)?.toUpperCase() || "P"}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{charge.patients?.full_name || "Paciente"}</p>
                      <p className="text-xs text-muted-foreground">{charge.description || "Serviço"}</p>
                    </div>
                  </div>
                  <p className="font-semibold text-sm text-emerald-600">R$ {Number(charge.amount).toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
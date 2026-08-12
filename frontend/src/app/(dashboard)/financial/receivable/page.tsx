"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2, ArrowUpCircle, Save, X, CalendarClock } from "lucide-react"
import { toast } from "sonner"

interface FinancialEntry {
  id: string
  description: string
  amount: number
  due_date: string
  status: string
  category: string | null
  notes: string | null
  paid_at: string | null
  created_at: string
}

const CATEGORIES = ["Consulta", "Sessão", "Pacote", "Produto", "Parceria", "Outros"]

export default function ReceivablePage() {
  const [entries, setEntries] = useState<FinancialEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState({ description: "", amount: 0, due_date: "", category: "Consulta", notes: "" })
  const [tenantId, setTenantId] = useState<string | null>(null)
  const supabase = createClient()

  const fetchEntries = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).single()
      if (profile) setTenantId(profile.tenant_id)
    }
    const { data } = await supabase.from("financial_entries").select("*").eq("type", "receivable").order("due_date", { ascending: false })
    setEntries((data || []) as FinancialEntry[])
    setLoading(false)
  }

  useEffect(() => { fetchEntries() }, [])

  const handleSave = async (id?: string) => {
    if (!form.description.trim()) { toast.error("Descrição é obrigatória"); return }
    if (!form.due_date) { toast.error("Data de vencimento é obrigatória"); return }
    if (form.amount <= 0) { toast.error("Valor deve ser maior que zero"); return }

    if (id) {
      const { error } = await supabase.from("financial_entries").update({ description: form.description, amount: form.amount, due_date: form.due_date, category: form.category, notes: form.notes || null }).eq("id", id)
      if (error) { toast.error("Erro ao atualizar"); return }
    } else {
      if (!tenantId) { toast.error("Tenant não identificado"); return }
      const { error } = await supabase.from("financial_entries").insert({ ...form, notes: form.notes || null, type: "receivable", tenant_id: tenantId })
      if (error) { toast.error("Erro ao criar"); return }
    }

    toast.success(id ? "Conta atualizada!" : "Conta criada!")
    setEditing(null)
    setShowNew(false)
    setForm({ description: "", amount: 0, due_date: "", category: "Consulta", notes: "" })
    fetchEntries()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta conta?")) return
    const { error } = await supabase.from("financial_entries").delete().eq("id", id)
    if (error) { toast.error("Erro ao excluir"); return }
    toast.success("Conta excluída!")
    fetchEntries()
  }

  const handleMarkPaid = async (id: string) => {
    const { error } = await supabase.from("financial_entries").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", id)
    if (error) { toast.error("Erro ao marcar como recebido"); return }
    toast.success("Conta marcada como recebida!")
    fetchEntries()
  }

  const pendingEntries = entries.filter(e => e.status === "pending")
  const paidEntries = entries.filter(e => e.status === "paid")
  const totalPending = pendingEntries.reduce((s, e) => s + Number(e.amount), 0)

  return (
    <div className="space-y-6 animate-slide-up-fade">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contas a Receber</h1>
          <p className="text-sm text-muted-foreground">Receitas e pagamentos de pacientes.</p>
        </div>
        <Button onClick={() => { setShowNew(true); setEditing(null) }} className="rounded-xl">
          <Plus className="h-4 w-4 mr-2" /> Nova Conta
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">R$ {totalPending.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">A Receber ({pendingEntries.length})</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">R$ {paidEntries.reduce((s, e) => s + Number(e.amount), 0).toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Recebido ({paidEntries.length})</p>
          </CardContent>
        </Card>
      </div>

      {/* New Entry Form */}
      {showNew && (
        <Card className="glass-card border-primary/30">
          <CardContent className="p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1"><Label className="text-xs">Descrição *</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Ex: Sessão de massoterapia..." className="h-10 rounded-lg" /></div>
              <div className="space-y-1"><Label className="text-xs">Valor (R$) *</Label><Input type="number" step="0.01" min="0.01" value={form.amount || ""} onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))} className="h-10 rounded-lg" /></div>
              <div className="space-y-1"><Label className="text-xs">Vencimento *</Label><Input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} className="h-10 rounded-lg" /></div>
              <div className="space-y-1"><Label className="text-xs">Categoria</Label>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map(c => (
                    <button key={c} onClick={() => setForm(f => ({ ...f, category: c }))} className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${form.category === c ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>{c}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-3"><Label className="text-xs">Observações</Label><Input value={form.notes || ""} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Opcional..." className="h-9 rounded-lg" /></div>
            <div className="flex gap-2 mt-4">
              <Button size="sm" onClick={() => handleSave()} className="rounded-lg"><Save className="h-3.5 w-3.5 mr-1" /> Salvar</Button>
              <Button size="sm" variant="ghost" onClick={() => { setShowNew(false); setForm({ description: "", amount: 0, due_date: "", category: "Consulta", notes: "" }) }} className="rounded-lg"><X className="h-3.5 w-3.5 mr-1" /> Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Entries */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-primary" /> A Receber
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-5 space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}</div>
          ) : pendingEntries.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground text-sm">Nenhuma conta a receber.</p>
          ) : (
            <div className="divide-y divide-border/40">
              {pendingEntries.map((entry) => (
                <div key={entry.id} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
                  {editing === entry.id ? (
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
                      <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="h-9 rounded-lg text-sm" />
                      <Input type="number" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))} className="h-9 rounded-lg text-sm" />
                      <Input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} className="h-9 rounded-lg text-sm" />
                      <div className="flex gap-1">
                        <Button size="sm" onClick={() => handleSave(entry.id)} className="rounded-lg h-9"><Save className="h-3 w-3" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditing(null)} className="rounded-lg h-9"><X className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <ArrowUpCircle className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{entry.description}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {entry.category && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{entry.category}</Badge>}
                          <span>Vence: {new Date(entry.due_date + "T12:00:00").toLocaleDateString("pt-BR")}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">R$ {Number(entry.amount).toFixed(2)}</p>
                        <Button size="sm" variant="outline" className="rounded-lg h-8 border-emerald-500/30 hover:bg-emerald-500/10" onClick={() => handleMarkPaid(entry.id)}>Receber</Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg" onClick={() => { setEditing(entry.id); setForm({ description: entry.description, amount: entry.amount, due_date: entry.due_date, category: entry.category || "Consulta", notes: entry.notes || "" }) }}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg text-destructive" onClick={() => handleDelete(entry.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paid Entries */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <ArrowUpCircle className="h-4 w-4 text-emerald-500" /> Recebidos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-5 space-y-3">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}</div>
          ) : paidEntries.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground text-sm">Nenhuma conta recebida.</p>
          ) : (
            <div className="divide-y divide-border/40">
              {paidEntries.map((entry) => (
                <div key={entry.id} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors opacity-70">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                    <ArrowUpCircle className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{entry.description}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {entry.category && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{entry.category}</Badge>}
                      <span>Recebido em: {entry.paid_at ? new Date(entry.paid_at).toLocaleDateString("pt-BR") : "-"}</span>
                    </div>
                  </div>
                  <p className="font-semibold text-sm text-emerald-600">R$ {Number(entry.amount).toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useEffect, useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/ui/page-header"
import { StatCard } from "@/components/ui/stat-card"
import { Plus, Pencil, Trash2, ArrowUpCircle, Save, X, CalendarClock, Calendar, Wallet } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { MoneyInput } from "@/components/forms/MoneyInput"

interface FinancialEntry {
  id: string
  description: string
  amount: number
  due_date: string
  status: string
  category: string | null
  notes: string | null
  paid_at: string | null
  appointment_id: string | null
  created_at: string
}

interface Category {
  id: string
  name: string
}

export default function ReceivablePage() {
  const [entries, setEntries] = useState<FinancialEntry[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState({ description: "", amount: "", due_date: "", category: "Consulta", notes: "" })
  const [newCategoryName, setNewCategoryName] = useState("")
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const supabase = useMemo(() => createClient(), [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).single()
    if (!profile) { setLoading(false); return }

    setTenantId(profile.tenant_id)

    const [entriesResult, categoriesResult] = await Promise.all([
      supabase.from("financial_entries").select("*").eq("type", "receivable").order("due_date", { ascending: false }),
      supabase.from("financial_categories").select("id, name").eq("type", "receivable").order("name"),
    ])

    setEntries((entriesResult.data || []) as FinancialEntry[])
    setCategories((categoriesResult.data || []) as Category[])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const allCategories = useMemo(() => {
    const dbNames = categories.map(c => c.name)
    const defaults = ["Consulta", "Sessão", "Pacote", "Produto", "Parceria", "Outros"]
    const merged = [...new Set([...defaults, ...dbNames])]
    return merged.sort()
  }, [categories])

  const handleAddCategory = async () => {
    if (!newCategoryName.trim() || !tenantId) return
    const { error } = await supabase.from("financial_categories").insert({ tenant_id: tenantId, type: "receivable", name: newCategoryName.trim() })
    if (error) { toast.error("Erro ao criar categoria"); return }
    toast.success("Categoria criada!")
    setNewCategoryName("")
    setShowNewCategory(false)
    const { data } = await supabase.from("financial_categories").select("id, name").eq("type", "receivable").order("name")
    setCategories((data || []) as Category[])
  }

  const handleSave = async (id?: string) => {
    if (!form.description.trim()) { toast.error("Descrição é obrigatória"); return }
    if (!form.due_date) { toast.error("Data de vencimento é obrigatória"); return }
    const amount = Number(form.amount)
    if (!(amount > 0)) { toast.error("Valor deve ser maior que zero"); return }

    if (id) {
      const { error } = await supabase.from("financial_entries").update({ description: form.description, amount, due_date: form.due_date, category: form.category, notes: form.notes || null }).eq("id", id)
      if (error) { toast.error("Erro ao atualizar"); return }
    } else {
      if (!tenantId) { toast.error("Tenant não identificado"); return }
      const { error } = await supabase.from("financial_entries").insert({ ...form, amount, notes: form.notes || null, type: "receivable", tenant_id: tenantId })
      if (error) { toast.error("Erro ao criar"); return }
    }

    toast.success(id ? "Conta atualizada!" : "Conta criada!")
    setEditing(null)
    setShowNew(false)
    setForm({ description: "", amount: "", due_date: "", category: "Consulta", notes: "" })
    fetchData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta conta?")) return
    const { error } = await supabase.from("financial_entries").delete().eq("id", id)
    if (error) { toast.error("Erro ao excluir"); return }
    toast.success("Conta excluída!")
    fetchData()
  }

  const handleMarkPaid = async (id: string) => {
    const { error } = await supabase.from("financial_entries").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", id)
    if (error) { toast.error("Erro ao marcar como recebido"); return }
    toast.success("Conta marcada como recebida!")
    fetchData()
  }

  const pendingEntries = entries.filter(e => e.status === "pending")
  const paidEntries = entries.filter(e => e.status === "paid")
  const totalPending = pendingEntries.reduce((s, e) => s + Number(e.amount), 0)

  return (
    <div className="space-y-5 animate-slide-up-fade">
      <PageHeader
        title="Contas a Receber"
        description="Receitas e pagamentos de pacientes."
        actions={
          <Button onClick={() => { setShowNew(true); setEditing(null) }}>
            <Plus className="h-4 w-4 mr-2" /> Nova Conta
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-5">
        <StatCard
          label="A Receber"
          value={`R$ ${totalPending.toFixed(2)}`}
          hint={`${pendingEntries.length} conta(s)`}
          icon={Wallet}
          tone="warning"
        />
        <StatCard
          label="Recebido"
          value={`R$ ${paidEntries.reduce((s, e) => s + Number(e.amount), 0).toFixed(2)}`}
          hint={`${paidEntries.length} conta(s)`}
          icon={ArrowUpCircle}
          tone="success"
        />
      </div>

      {showNew && (
        <Card className="ring-1 ring-primary/30">
          <CardContent className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1"><Label className="text-xs">Descrição *</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Ex: Sessão de massoterapia..." /></div>
              <div className="space-y-1"><Label className="text-xs">Valor (R$) *</Label><MoneyInput value={form.amount} onChange={v => setForm(f => ({ ...f, amount: v }))} placeholder="0,00" /></div>
              <div className="space-y-1"><Label className="text-xs">Vencimento *</Label><Input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} /></div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Categoria</Label>
                  <button type="button" onClick={() => setShowNewCategory(!showNewCategory)} className="text-[10px] text-primary hover:underline">+ Nova</button>
                </div>
                {showNewCategory ? (
                  <div className="flex gap-1">
                    <Input value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="Nome da categoria" className="h-9 text-xs" onKeyDown={e => e.key === "Enter" && handleAddCategory()} />
                    <Button size="sm" className="h-9 px-2" onClick={handleAddCategory}><Save className="h-3 w-3" /></Button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {allCategories.map(c => (
                      <button key={c} onClick={() => setForm(f => ({ ...f, category: c }))} className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${form.category === c ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>{c}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-3"><Label className="text-xs">Observações</Label><Input value={form.notes || ""} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Opcional..." /></div>
            <div className="flex gap-2 mt-4">
              <Button size="sm" onClick={() => handleSave()}><Save className="h-3.5 w-3.5 mr-1" /> Salvar</Button>
              <Button size="sm" variant="ghost" onClick={() => { setShowNew(false); setShowNewCategory(false); setForm({ description: "", amount: "", due_date: "", category: "Consulta", notes: "" }) }}><X className="h-3.5 w-3.5 mr-1" /> Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="ring-1 ring-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-warning" /> A Receber
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
                <div key={entry.id} className="flex flex-col gap-3 p-4 hover:bg-muted/50 transition-colors sm:flex-row sm:items-center sm:gap-4">
                  {editing === entry.id ? (
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="text-sm" />
                      <MoneyInput value={form.amount} onChange={v => setForm(f => ({ ...f, amount: v }))} className="text-sm" />
                      <Input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} className="text-sm" />
                      <div className="flex gap-1">
                        <Button size="sm" onClick={() => handleSave(entry.id)}><Save className="h-3 w-3" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditing(null)}><X className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="h-10 w-10 shrink-0 rounded-xl bg-warning/15 flex items-center justify-center text-warning">
                          <ArrowUpCircle className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{entry.description}</p>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            {entry.category && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{entry.category}</Badge>}
                            <span className="tnum">Vence: {new Date(entry.due_date + "T12:00:00").toLocaleDateString("pt-BR")}</span>
                            {entry.appointment_id && (
                              <Link href="/appointments" className="inline-flex items-center gap-0.5 text-primary hover:underline">
                                <Calendar className="h-3 w-3" /> Agendamento
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                        <p className="font-semibold text-sm tnum">R$ {Number(entry.amount).toFixed(2)}</p>
                        <Button size="sm" className="h-9 rounded-lg" onClick={() => handleMarkPaid(entry.id)}>Receber</Button>
                        <Button size="icon" variant="ghost" className="h-9 w-9 rounded-lg" title="Editar" onClick={() => { setEditing(entry.id); setForm({ description: entry.description, amount: String(entry.amount), due_date: entry.due_date, category: entry.category || "Consulta", notes: entry.notes || "" }) }}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" className="h-9 w-9 rounded-lg text-destructive" title="Excluir" onClick={() => handleDelete(entry.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="ring-1 ring-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <ArrowUpCircle className="h-4 w-4 text-success" /> Recebidos
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
                <div key={entry.id} className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors opacity-70 sm:gap-4">
                  <div className="h-10 w-10 shrink-0 rounded-xl bg-success/15 flex items-center justify-center text-success">
                    <ArrowUpCircle className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{entry.description}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {entry.category && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{entry.category}</Badge>}
                      <span className="tnum">Recebido em: {entry.paid_at ? new Date(entry.paid_at).toLocaleDateString("pt-BR") : "-"}</span>
                      {entry.appointment_id && (
                        <Link href="/appointments" className="inline-flex items-center gap-0.5 text-primary hover:underline">
                          <Calendar className="h-3 w-3" /> Agendamento
                        </Link>
                      )}
                    </div>
                  </div>
                  <p className="font-semibold text-sm text-success tnum shrink-0">R$ {Number(entry.amount).toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
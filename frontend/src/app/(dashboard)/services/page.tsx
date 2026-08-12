"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Pencil, Trash2, Hand, Save, X } from "lucide-react"
import { toast } from "sonner"

interface Service {
  id: string
  name: string
  color: string
  duration_minutes: number
  price: number
  commission_percent: number
  active: boolean
  sort_order: number
}

const COLOR_OPTIONS = [
  "#3B82F6", "#EC4899", "#8B5CF6", "#10B981", "#F97316",
  "#EF4444", "#B89A63", "#06B6D4", "#059669", "#6B7280",
]

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ name: "", color: "#3B82F6", duration_minutes: 60, price: 0, commission_percent: 0 })
  const [tenantId, setTenantId] = useState<string | null>(null)
  const supabase = createClient()

  const fetchServices = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).single()
      if (profile) setTenantId(profile.tenant_id)
    }
    const { data } = await supabase.from("services").select("*").order("sort_order").order("name")
    setServices((data || []) as Service[])
    setLoading(false)
  }

  useEffect(() => { fetchServices() }, [])

  const handleSave = async (id?: string) => {
    if (!form.name.trim()) {
      toast.error("Nome é obrigatório")
      return
    }

    if (id) {
      const { error } = await supabase.from("services").update(form).eq("id", id)
      if (error) { toast.error("Erro ao atualizar"); return }
    } else {
      if (!tenantId) { toast.error("Tenant não identificado"); return }
      const { error } = await supabase.from("services").insert({ ...form, sort_order: services.length, tenant_id: tenantId, active: true })
      if (error) { toast.error("Erro ao criar"); return }
    }

    toast.success(id ? "Serviço atualizado!" : "Serviço criado!")
    setEditing(null)
    setShowNew(false)
    setForm({ name: "", color: "#3B82F6", duration_minutes: 60, price: 0, commission_percent: 0 })
    fetchServices()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este serviço?")) return
    const { error } = await supabase.from("services").delete().eq("id", id)
    if (error) { toast.error("Erro ao excluir"); return }
    toast.success("Serviço excluído!")
    fetchServices()
  }

  const handleToggleActive = async (id: string, active: boolean) => {
    await supabase.from("services").update({ active: !active }).eq("id", id)
    fetchServices()
  }

  return (
    <div className="space-y-6 animate-slide-up-fade">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Serviços</h1>
          <p className="text-sm text-muted-foreground">Gerencie os serviços oferecidos.</p>
        </div>
        <Button onClick={() => { setShowNew(true); setEditing(null) }} className="rounded-xl">
          <Plus className="h-4 w-4 mr-2" /> Novo Serviço
        </Button>
      </div>

      {/* New Service Form */}
      {showNew && (
        <Card className="glass-card border-primary/30">
          <CardContent className="p-5">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Nome *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome do serviço" className="h-10 rounded-lg" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Cor</Label>
                <div className="flex gap-1.5 flex-wrap">
                  {COLOR_OPTIONS.map(c => (
                    <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))} className={`h-6 w-6 rounded-full border-2 transition-transform ${form.color === c ? "border-foreground scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Duração (min)</Label>
                <Input type="number" value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: Number(e.target.value) }))} className="h-10 rounded-lg" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Preço (R$)</Label>
                <Input type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} className="h-10 rounded-lg" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Comissão (%)</Label>
                <Input type="number" step="0.01" min="0" max="100" value={form.commission_percent} onChange={e => setForm(f => ({ ...f, commission_percent: Number(e.target.value) }))} className="h-10 rounded-lg" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button size="sm" onClick={() => handleSave()} className="rounded-lg"><Save className="h-3.5 w-3.5 mr-1" /> Salvar</Button>
              <Button size="sm" variant="ghost" onClick={() => { setShowNew(false); setForm({ name: "", color: "#3B82F6", duration_minutes: 60, price: 0, commission_percent: 0 }) }} className="rounded-lg"><X className="h-3.5 w-3.5 mr-1" /> Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Services List */}
      <Card className="glass-card">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Hand className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Nenhum serviço cadastrado.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {services.map((svc) => (
                <div key={svc.id} className={`flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors ${!svc.active ? "opacity-50" : ""}`}>
                  {editing === svc.id ? (
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-3">
                      <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="h-9 rounded-lg text-sm" />
                      <div className="flex gap-1">
                        {COLOR_OPTIONS.slice(0, 5).map(c => (
                          <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))} className={`h-6 w-6 rounded-full border-2 ${form.color === c ? "border-foreground" : "border-transparent"}`} style={{ backgroundColor: c }} />
                        ))}
                      </div>
                      <Input type="number" value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: Number(e.target.value) }))} className="h-9 rounded-lg text-sm" />
                      <Input type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} className="h-9 rounded-lg text-sm" />
                      <div className="flex gap-1">
                        <Button size="sm" onClick={() => handleSave(svc.id)} className="rounded-lg h-9"><Save className="h-3 w-3" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditing(null)} className="rounded-lg h-9"><X className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="h-8 w-8 rounded-lg shrink-0" style={{ backgroundColor: svc.color + "20" }}>
                        <div className="h-full w-full rounded-lg flex items-center justify-center">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: svc.color }} />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{svc.name}</p>
                        <p className="text-xs text-muted-foreground">{svc.duration_minutes}min • R$ {svc.price.toFixed(0)}{svc.commission_percent > 0 ? ` • ${svc.commission_percent}% comissão` : ""}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" onClick={() => handleToggleActive(svc.id, svc.active)} className="h-8 w-8 p-0 rounded-lg text-xs">
                          {svc.active ? "✓" : "○"}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { setEditing(svc.id); setForm({ name: svc.name, color: svc.color, duration_minutes: svc.duration_minutes, price: svc.price, commission_percent: svc.commission_percent }) }} className="h-8 w-8 p-0 rounded-lg">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(svc.id)} className="h-8 w-8 p-0 rounded-lg text-destructive hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

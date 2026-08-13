"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { MoneyInput } from "@/components/forms/MoneyInput"
import { Plus, Pencil, Trash2, Hand, Save, X, Package } from "lucide-react"
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
  const [kitService, setKitService] = useState<Service | null>(null)
  const [kitMaterials, setKitMaterials] = useState<any[]>([])
  const [allProducts, setAllProducts] = useState<any[]>([])
  const [kitProduct, setKitProduct] = useState("")
  const [kitQty, setKitQty] = useState("1")
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

  const openKit = async (svc: Service) => {
    setKitService(svc)
    setKitMaterials([])
    setKitProduct("")
    setKitQty("1")
    const [materialsResult, productsResult] = await Promise.all([
      supabase.from("service_materials").select("product_id, quantity, products(name)").eq("service_id", svc.id),
      supabase.from("products").select("id, name, unit, price, cost, stock_quantity, active").eq("active", true).order("name"),
    ])
    setKitMaterials((materialsResult.data || []).map((m: any) => ({ ...m, quantity: Number(m.quantity) })))
    setAllProducts(productsResult.data || [])
  }

  const addKitMaterial = () => {
    const prod = allProducts.find((p) => p.id === kitProduct)
    if (!prod) return
    const qty = Number(kitQty) > 0 ? Number(kitQty) : 1
    setKitMaterials((prev) =>
      prev.some((m) => m.product_id === prod.id)
        ? prev.map((m) => (m.product_id === prod.id ? { ...m, quantity: m.quantity + qty } : m))
        : [...prev, { product_id: prod.id, quantity: qty, products: { name: prod.name } }]
    )
    setKitProduct("")
    setKitQty("1")
  }

  const kitProductById = (productId: string) => allProducts.find((p) => p.id === productId)

  const formatQty = (n: number) =>
    Number(n.toFixed(3)).toLocaleString("pt-BR", { maximumFractionDigits: 3 })

  const sessionCostFor = (m: any) => {
    const prod = kitProductById(m.product_id)
    return prod ? Number(m.quantity) * Number(prod.cost) : 0
  }

  const totalSessionCost = kitMaterials.reduce((sum, m) => sum + sessionCostFor(m), 0)

  const saveKit = async () => {
    if (!kitService || !tenantId) return
    const invalid = kitMaterials.find((m) => !(Number(m.quantity) > 0))
    if (invalid) {
      toast.error("Todas as quantidades devem ser maiores que zero")
      return
    }
    await supabase.from("service_materials").delete().eq("service_id", kitService.id)
    for (const m of kitMaterials) {
      const { error } = await supabase.from("service_materials").insert({
        tenant_id: tenantId,
        service_id: kitService.id,
        product_id: m.product_id,
        quantity: m.quantity,
      })
      if (error) { toast.error("Erro ao salvar o kit"); return }
    }
    toast.success("Kit atualizado!")
    setKitService(null)
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
                <MoneyInput value={form.price} onChange={(v) => setForm(f => ({ ...f, price: Number(v) }))} placeholder="0,00" className="h-10 rounded-lg" />
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
                      <MoneyInput value={form.price} onChange={(v) => setForm(f => ({ ...f, price: Number(v) }))} className="h-9 rounded-lg text-sm" />
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
                        <Button size="sm" variant="ghost" onClick={() => openKit(svc)} className="h-8 w-8 p-0 rounded-lg" title="Kit de materiais">
                          <Package className="h-3.5 w-3.5" />
                        </Button>
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

      {/* Kit de materiais */}
      <Dialog open={!!kitService} onOpenChange={(open) => { if (!open) setKitService(null) }}>
        <DialogContent className="sm:max-w-md rounded-2xl border-border/60">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Kit de materiais</DialogTitle>
            <DialogDescription>
              {kitService?.name} — quantidade consumida por atendimento, na unidade do produto (ex.: 0,1 vidro • 10 ml • 2 luvas).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {kitMaterials.length > 0 && (
              <div className="space-y-2">
                {kitMaterials.map((m) => {
                  const prod = kitProductById(m.product_id)
                  const qty = Number(m.quantity)
                  const unit = prod?.unit || ""
                  const cost = sessionCostFor(m)
                  const stock = prod ? Number(prod.stock_quantity) : 0
                  const sessions = qty > 0 ? Math.floor(stock / qty) : 0
                  const low = qty > 0 && stock < qty
                  return (
                    <div key={m.product_id} className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{m.products?.name || "Produto"}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            inputMode="decimal"
                            value={m.quantity}
                            onChange={(e) =>
                              setKitMaterials((prev) =>
                                prev.map((x) => (x.product_id === m.product_id ? { ...x, quantity: Number(e.target.value) } : x))
                              )
                            }
                            className="h-9 w-24 text-center"
                            aria-label={`Quantidade por sessão de ${m.products?.name || "produto"}`}
                          />
                          <span className="text-xs text-muted-foreground w-7">{unit}</span>
                        </div>
                        <Button type="button" variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-lg text-rose-500 hover:bg-rose-500/10 hover:text-rose-600"
                          onClick={() => setKitMaterials((prev) => prev.filter((x) => x.product_id !== m.product_id))}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                        <span>Custo/sessão: <span className="font-medium text-foreground">R$ {cost.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></span>
                        {qty < 1 && qty > 0 && <span>= {(qty * 100).toFixed(1).replace(/\.0$/, "").replace(".", ",")}%</span>}
                        {prod && (
                          <span className={low ? "font-medium text-warning" : ""}>
                            Estoque: {formatQty(stock)} {unit} • ≈ {sessions} {sessions === 1 ? "sessão" : "sessões"}
                          </span>
                        )}
                        {low && <span className="font-medium text-warning">estoque não cobre 1 sessão</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            {allProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum produto cadastrado. Adicione produtos na página de Estoque.</p>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={kitProduct}
                  onChange={(e) => setKitProduct(e.target.value)}
                  className="flex-1 h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="" className="text-foreground bg-background">Selecione o produto</option>
                  {allProducts.map((p) => (
                    <option key={p.id} value={p.id} className="text-foreground bg-background">
                      {p.name}{kitMaterials.some((m) => m.product_id === p.id) ? " (no kit)" : ""}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={kitQty}
                    onChange={(e) => setKitQty(e.target.value)}
                    className="h-10 w-24 text-center"
                    aria-label="Quantidade por sessão"
                  />
                  <span className="text-xs text-muted-foreground w-7">
                    {allProducts.find((p) => p.id === kitProduct)?.unit || ""}
                  </span>
                </div>
                <Button type="button" variant="secondary" className="h-10 rounded-lg" disabled={!kitProduct} onClick={addKitMaterial}>
                  <Plus className="h-4 w-4 mr-1.5" /> Adicionar
                </Button>
              </div>
            )}
            {kitMaterials.length > 0 && (
              <div className="flex items-center justify-between rounded-lg border border-primary/25 bg-primary/5 px-3 py-2 text-sm">
                <span className="font-medium text-foreground">Custo de materiais por sessão</span>
                <span className="font-bold text-foreground">
                  R$ {totalSessionCost.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setKitService(null)}>Cancelar</Button>
              <Button onClick={saveKit}><Save className="h-4 w-4 mr-1.5" /> Salvar kit</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

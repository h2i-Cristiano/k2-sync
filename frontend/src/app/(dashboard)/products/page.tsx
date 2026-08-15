"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/ui/page-header"
import { EmptyState } from "@/components/ui/empty-state"
import { Switch } from "@/components/ui/switch"
import { MoneyInput } from "@/components/forms/MoneyInput"
import { Plus, Pencil, Trash2, ShoppingBag, Save, X } from "lucide-react"
import { toast } from "sonner"

interface Product {
  id: string
  name: string
  unit: string
  cost: number
  price: number
  stock_quantity: number
  min_stock: number
  active: boolean
  created_at: string
}

const UNIT_OPTIONS = ["un", "ml", "g", "cx", "kit", "par"]

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ name: "", unit: "un", cost: 0, price: 0, stock_quantity: 0, min_stock: 0 })
  const [tenantId, setTenantId] = useState<string | null>(null)
  const supabase = createClient()

  const fetchProducts = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).single()
      if (profile) setTenantId(profile.tenant_id)
    }
    const { data } = await supabase.from("products").select("*").order("name")
    setProducts((data || []) as Product[])
    setLoading(false)
  }

  useEffect(() => { fetchProducts() }, [])

  const resetForm = () => setForm({ name: "", unit: "un", cost: 0, price: 0, stock_quantity: 0, min_stock: 0 })

  const handleSave = async (id?: string) => {
    if (!form.name.trim()) { toast.error("Nome é obrigatório"); return }

    if (id) {
      const { error } = await supabase.from("products").update(form).eq("id", id)
      if (error) { toast.error("Erro ao atualizar"); return }
    } else {
      if (!tenantId) { toast.error("Tenant não identificado"); return }
      const { error } = await supabase.from("products").insert({ ...form, tenant_id: tenantId, active: true })
      if (error) { toast.error("Erro ao criar"); return }
    }

    toast.success(id ? "Produto atualizado!" : "Produto criado!")
    setEditing(null)
    setShowNew(false)
    resetForm()
    fetchProducts()
  }

  const handleToggleActive = async (id: string, active: boolean) => {
    await supabase.from("products").update({ active: !active }).eq("id", id)
    fetchProducts()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este produto?")) return
    const { error } = await supabase.from("products").delete().eq("id", id)
    if (error) { toast.error("Erro ao excluir"); return }
    toast.success("Produto excluído!")
    fetchProducts()
  }

  const fieldRow = (label: string, field: React.ReactNode) => (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      {field}
    </div>
  )

  return (
    <div className="space-y-6 animate-slide-up-fade">
      <PageHeader
        title="Produtos"
        description="Cadastro de produtos, custos e estoque mínimo."
        actions={
          <Button onClick={() => { setShowNew(true); setEditing(null); resetForm() }}>
            <Plus className="h-4 w-4 mr-2" /> Novo Produto
          </Button>
        }
      />

      {showNew && (
        <Card className="ring-1 ring-primary/30">
          <CardContent className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
              {fieldRow("Nome *", <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome do produto" />)}
              {fieldRow("Unidade", (
                <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} className="h-11 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
                  {UNIT_OPTIONS.map(u => <option key={u} value={u} className="text-foreground bg-background">{u}</option>)}
                </select>
              ))}
              {fieldRow("Preço (R$)", <MoneyInput value={form.price} onChange={(v) => setForm(f => ({ ...f, price: Number(v) }))} placeholder="0,00" />)}
              {fieldRow("Custo (R$)", <MoneyInput value={form.cost} onChange={(v) => setForm(f => ({ ...f, cost: Number(v) }))} placeholder="0,00" />)}
              {fieldRow("Estoque inicial", <Input type="number" min="0" aria-label="Estoque inicial" value={form.stock_quantity} onChange={e => setForm(f => ({ ...f, stock_quantity: Number(e.target.value) }))} />)}
              {fieldRow("Estoque mínimo", <Input type="number" min="0" aria-label="Estoque minimo" value={form.min_stock} onChange={e => setForm(f => ({ ...f, min_stock: Number(e.target.value) }))} />)}
            </div>
            <div className="flex gap-2 mt-4">
              <Button size="sm" onClick={() => handleSave()}><Save className="h-3.5 w-3.5 mr-1" /> Salvar</Button>
              <Button size="sm" variant="ghost" onClick={() => { setShowNew(false); resetForm() }}><X className="h-3.5 w-3.5 mr-1" /> Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="ring-1 ring-border/40">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-5 space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}</div>
          ) : products.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title="Nenhum produto cadastrado"
              description="Adicione produtos para controlar o estoque e os kits."
            />
          ) : (
            <div className="divide-y divide-border/40">
              {products.map((prod) => {
                const lowStock = prod.min_stock > 0 && prod.stock_quantity < prod.min_stock
                return (
                  <div key={prod.id} className={`flex flex-col gap-3 p-4 hover:bg-muted/50 transition-colors sm:flex-row sm:items-center sm:gap-4 ${!prod.active ? "opacity-50" : ""}`}>
                    {editing === prod.id ? (
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                        <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="text-sm" />
                        <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} className="h-9 rounded-lg border border-input bg-background px-2 py-1 text-sm text-foreground outline-none focus-visible:border-ring">
                          {UNIT_OPTIONS.map(u => <option key={u} value={u} className="text-foreground bg-background">{u}</option>)}
                        </select>
                        <MoneyInput value={form.price} onChange={(v) => setForm(f => ({ ...f, price: Number(v) }))} className="text-sm" />
                        <MoneyInput value={form.cost} onChange={(v) => setForm(f => ({ ...f, cost: Number(v) }))} className="text-sm" />
                        <Input type="number" min="0" value={form.stock_quantity} onChange={e => setForm(f => ({ ...f, stock_quantity: Number(e.target.value) }))} className="text-sm" />
                        <div className="flex gap-1">
                          <Button size="sm" onClick={() => handleSave(prod.id)}><Save className="h-3 w-3" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditing(null)}><X className="h-3 w-3" /></Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <ShoppingBag className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{prod.name}</p>
                            <p className="text-xs text-muted-foreground tnum">
                              R$ {prod.price.toFixed(2)} • Custo R$ {prod.cost.toFixed(2)} • Estoque: {prod.stock_quantity} {prod.unit}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                          {lowStock && (
                            <span className="text-[10px] font-semibold uppercase tracking-wide bg-warning/15 text-warning px-2 py-1 rounded-full">
                              Estoque baixo
                            </span>
                          )}
                          <Switch
                            size="sm"
                            checked={prod.active}
                            onCheckedChange={() => handleToggleActive(prod.id, prod.active)}
                            aria-label={`Ativar ou desativar ${prod.name}`}
                          />
                          <Button size="icon" variant="ghost" className="h-9 w-9 rounded-lg" title="Editar" onClick={() => { setEditing(prod.id); setForm({ name: prod.name, unit: prod.unit, cost: prod.cost, price: prod.price, stock_quantity: prod.stock_quantity, min_stock: prod.min_stock }) }}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-9 w-9 rounded-lg text-destructive" title="Excluir" onClick={() => handleDelete(prod.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

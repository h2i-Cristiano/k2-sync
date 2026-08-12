"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Pencil, Trash2, ShoppingBag, Save, X } from "lucide-react"
import { toast } from "sonner"

interface Product {
  id: string
  name: string
  price: number
  stock_quantity: number
  active: boolean
  created_at: string
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ name: "", price: 0, stock_quantity: 0 })
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

  const handleSave = async (id?: string) => {
    if (!form.name.trim()) { toast.error("Nome é obrigatório"); return }

    if (id) {
      const { error } = await supabase.from("products").update(form).eq("id", id)
      if (error) { toast.error("Erro ao atualizar"); return }
    } else {
      if (!tenantId) { toast.error("Tenant não identificado"); return }
      const { error } = await supabase.from("products").insert({ ...form, tenant_id: tenantId })
      if (error) { toast.error("Erro ao criar"); return }
    }

    toast.success(id ? "Produto atualizado!" : "Produto criado!")
    setEditing(null)
    setShowNew(false)
    setForm({ name: "", price: 0, stock_quantity: 0 })
    fetchProducts()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este produto?")) return
    const { error } = await supabase.from("products").delete().eq("id", id)
    if (error) { toast.error("Erro ao excluir"); return }
    toast.success("Produto excluído!")
    fetchProducts()
  }

  return (
    <div className="space-y-6 animate-slide-up-fade">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Produtos</h1>
          <p className="text-sm text-muted-foreground">Gerencie os produtos do estúdio.</p>
        </div>
        <Button onClick={() => { setShowNew(true); setEditing(null) }} className="rounded-xl">
          <Plus className="h-4 w-4 mr-2" /> Novo Produto
        </Button>
      </div>

      {showNew && (
        <Card className="glass-card border-primary/30">
          <CardContent className="p-5">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1"><Label className="text-xs">Nome *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="h-10 rounded-lg" /></div>
              <div className="space-y-1"><Label className="text-xs">Preço (R$)</Label><Input type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} className="h-10 rounded-lg" /></div>
              <div className="space-y-1"><Label className="text-xs">Estoque</Label><Input type="number" value={form.stock_quantity} onChange={e => setForm(f => ({ ...f, stock_quantity: Number(e.target.value) }))} className="h-10 rounded-lg" /></div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button size="sm" onClick={() => handleSave()} className="rounded-lg"><Save className="h-3.5 w-3.5 mr-1" /> Salvar</Button>
              <Button size="sm" variant="ghost" onClick={() => { setShowNew(false); setForm({ name: "", price: 0, stock_quantity: 0 }) }} className="rounded-lg"><X className="h-3.5 w-3.5 mr-1" /> Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="glass-card">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-5 space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}</div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShoppingBag className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Nenhum produto cadastrado.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {products.map((prod) => (
                <div key={prod.id} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
                  {editing === prod.id ? (
                    <div className="flex-1 grid grid-cols-3 gap-3">
                      <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="h-9 rounded-lg text-sm" />
                      <Input type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} className="h-9 rounded-lg text-sm" />
                      <div className="flex gap-1">
                        <Button size="sm" onClick={() => handleSave(prod.id)} className="rounded-lg h-9"><Save className="h-3 w-3" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditing(null)} className="rounded-lg h-9"><X className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <ShoppingBag className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{prod.name}</p>
                        <p className="text-xs text-muted-foreground">R$ {prod.price.toFixed(2)} • Estoque: {prod.stock_quantity}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" onClick={() => { setEditing(prod.id); setForm({ name: prod.name, price: prod.price, stock_quantity: prod.stock_quantity }) }} className="h-8 w-8 p-0 rounded-lg"><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(prod.id)} className="h-8 w-8 p-0 rounded-lg text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
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

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
import { Package, ArrowUp, ArrowDown, History, Save, X } from "lucide-react"
import { toast } from "sonner"

interface StockProduct {
  id: string
  name: string
  unit: string
  price: number
  stock_quantity: number
  min_stock: number
}

interface Movement {
  id: string
  quantity: number
  movement_type: string
  reason: string | null
  created_at: string
}

const movementTypeLabel: Record<string, string> = {
  stock_in: "Entrada (reposição)",
  adjust: "Ajuste manual",
  session: "Consumo em atendimento",
}

export default function StockPage() {
  const [products, setProducts] = useState<StockProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [adjustments, setAdjustments] = useState<Record<string, number>>({})
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [restockProduct, setRestockProduct] = useState<StockProduct | null>(null)
  const [restockQty, setRestockQty] = useState("1")
  const [restockNote, setRestockNote] = useState("")
  const [historyProduct, setHistoryProduct] = useState<StockProduct | null>(null)
  const [history, setHistory] = useState<Movement[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const supabase = createClient()

  const fetchProducts = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).single()
      if (profile) setTenantId(profile.tenant_id)
    }
    const { data } = await supabase.from("products").select("id, name, unit, price, stock_quantity, min_stock").eq("active", true).order("name")
    setProducts((data || []) as StockProduct[])
    setLoading(false)
  }

  useEffect(() => { fetchProducts() }, [])

  const applyMovement = async (product: StockProduct, delta: number, movement_type: string, reason?: string) => {
    if (!tenantId) { toast.error("Tenant não identificado"); return }
    const newQty = product.stock_quantity + delta
    if (newQty < 0) { toast.error("Estoque não pode ficar negativo"); return }

    const { error } = await supabase.from("stock_movements").insert({
      tenant_id: tenantId,
      product_id: product.id,
      quantity: delta,
      movement_type,
      reason: reason || null,
    })
    if (error) { toast.error("Erro ao registrar movimentação"); return }

    await supabase.from("products").update({ stock_quantity: newQty }).eq("id", product.id)
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, stock_quantity: newQty } : p))
    return true
  }

  const handleAdjust = async (id: string, delta: number) => {
    const current = products.find(p => p.id === id)
    if (!current) return
    await applyMovement(current, delta, "adjust", "Ajuste manual")
  }

  const handleRestock = async () => {
    if (!restockProduct) return
    const qty = Number(restockQty)
    if (!(qty > 0)) { toast.error("Informe uma quantidade válida"); return }
    const ok = await applyMovement(restockProduct, qty, "stock_in", restockNote.trim() || "Reposição de estoque")
    if (ok) {
      toast.success("Reposição registrada!")
      setRestockProduct(null)
      setRestockQty("1")
      setRestockNote("")
    }
  }

  const openHistory = async (product: StockProduct) => {
    setHistoryProduct(product)
    setHistoryLoading(true)
    const { data } = await supabase
      .from("stock_movements")
      .select("id, quantity, movement_type, reason, created_at")
      .eq("product_id", product.id)
      .order("created_at", { ascending: false })
      .limit(50)
    setHistory((data || []) as Movement[])
    setHistoryLoading(false)
  }

  const handleBulkSave = async () => {
    const updates = Object.entries(adjustments).filter(([, v]) => v !== 0)
    if (updates.length === 0) { toast.error("Nenhuma ajuste para salvar"); return }

    for (const [id, delta] of updates) {
      const current = products.find(p => p.id === id)
      if (!current) continue
      const ok = await applyMovement(current, delta, "adjust", "Ajuste manual")
      if (!ok) return
    }

    toast.success("Estoque atualizado!")
    setAdjustments({})
  }

  const lowStockProducts = products.filter(p => p.min_stock > 0 && p.stock_quantity < p.min_stock)
  const totalItems = products.reduce((s, p) => s + p.stock_quantity, 0)
  const totalValue = products.reduce((s, p) => s + p.stock_quantity * p.price, 0)

  return (
    <div className="space-y-6 animate-slide-up-fade">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Estoque</h1>
          <p className="text-sm text-muted-foreground">Controle de estoque, reposições e histórico de movimentações.</p>
        </div>
        {Object.values(adjustments).some(v => v !== 0) && (
          <Button onClick={handleBulkSave} className="rounded-xl"><Save className="h-4 w-4 mr-2" /> Salvar Ajustes</Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{totalItems}</p>
            <p className="text-xs text-muted-foreground">Itens em estoque</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">R$ {totalValue.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Valor em estoque</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <p className={`text-2xl font-bold ${lowStockProducts.length > 0 ? "text-warning" : ""}`}>{lowStockProducts.length}</p>
            <p className="text-xs text-muted-foreground">Produtos com estoque baixo</p>
          </CardContent>
        </Card>
      </div>

      {lowStockProducts.length > 0 && (
        <div className="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3">
          <p className="text-sm font-medium text-warning">
            {lowStockProducts.map(p => p.name).join(", ")} — abaixo do estoque mínimo. Considere repor.
          </p>
        </div>
      )}

      {/* Products List */}
      <Card className="glass-card">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-5 space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}</div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Nenhum produto ativo.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {products.map((prod) => {
                const adj = adjustments[prod.id] || 0
                const projected = prod.stock_quantity + adj
                const lowStock = prod.min_stock > 0 && prod.stock_quantity < prod.min_stock
                return (
                  <div key={prod.id} className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <Package className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{prod.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Atual: <span className="font-semibold">{prod.stock_quantity} {prod.unit}</span>
                        {prod.min_stock > 0 && <> • Mín: {prod.min_stock}</>}
                        {adj !== 0 && <span className={adj > 0 ? "text-emerald-600" : "text-destructive"}> → {projected}</span>}
                      </p>
                      {lowStock && (
                        <span className="text-[10px] font-semibold uppercase tracking-wide bg-warning/15 text-warning px-2 py-0.5 rounded-full mt-1 inline-block">
                          Estoque baixo
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button size="sm" variant="outline" className="h-8 px-2 rounded-lg text-xs" onClick={() => setRestockProduct(prod)}>
                        <ArrowUp className="h-3.5 w-3.5 mr-1" /> Repor
                      </Button>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0 rounded-lg" onClick={() => handleAdjust(prod.id, -1)}>
                          <ArrowDown className="h-3.5 w-3.5" />
                        </Button>
                        <Input
                          type="number"
                          className="h-8 w-14 text-center text-xs rounded-lg"
                          value={adj}
                          onChange={e => setAdjustments(prev => ({ ...prev, [prod.id]: Number(e.target.value) }))}
                          aria-label="Ajuste"
                        />
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0 rounded-lg" onClick={() => handleAdjust(prod.id, 1)}>
                          <ArrowUp className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg" onClick={() => openHistory(prod)} title="Histórico">
                        <History className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Restock Dialog */}
      <Dialog open={!!restockProduct} onOpenChange={(open) => { if (!open) setRestockProduct(null) }}>
        <DialogContent className="sm:max-w-sm rounded-2xl border-border/60">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Repor estoque</DialogTitle>
            <DialogDescription>{restockProduct?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Quantidade *</Label>
              <Input type="number" min="0" step="0.5" aria-label="Quantidade" value={restockQty} onChange={e => setRestockQty(e.target.value)} className="h-10 rounded-lg" autoFocus />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Observação</Label>
              <Input value={restockNote} onChange={e => setRestockNote(e.target.value)} placeholder="Ex.: Compra do fornecedor" className="h-10 rounded-lg" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setRestockProduct(null)}><X className="h-4 w-4 mr-1.5" /> Cancelar</Button>
              <Button onClick={handleRestock}><ArrowUp className="h-4 w-4 mr-1.5" /> Repor</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={!!historyProduct} onOpenChange={(open) => { if (!open) setHistoryProduct(null) }}>
        <DialogContent className="sm:max-w-md rounded-2xl border-border/60 max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Histórico — {historyProduct?.name}</DialogTitle>
            <DialogDescription>Últimas movimentações de estoque.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {historyLoading ? (
              <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}</div>
            ) : history.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Nenhuma movimentação registrada.</p>
            ) : (
              history.map((m) => (
                <div key={m.id} className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${m.quantity > 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"}`}>
                    {m.quantity > 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{m.quantity > 0 ? "+" : ""}{m.quantity} • {movementTypeLabel[m.movement_type] || m.movement_type}</p>
                    {m.reason && <p className="text-xs text-muted-foreground truncate">{m.reason}</p>}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{new Date(m.created_at).toLocaleDateString("pt-BR")} {new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

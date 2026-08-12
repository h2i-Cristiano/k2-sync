"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Package, ArrowUp, ArrowDown, Save } from "lucide-react"
import { toast } from "sonner"

interface StockProduct {
  id: string
  name: string
  price: number
  stock_quantity: number
}

export default function StockPage() {
  const [products, setProducts] = useState<StockProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [adjustments, setAdjustments] = useState<Record<string, number>>({})
  const supabase = createClient()

  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("id, name, price, stock_quantity").eq("active", true).order("name")
    setProducts((data || []) as StockProduct[])
    setLoading(false)
  }

  useEffect(() => { fetchProducts() }, [])

  const handleAdjust = async (id: string, delta: number) => {
    const current = products.find(p => p.id === id)
    if (!current) return
    const newQty = current.stock_quantity + delta
    if (newQty < 0) { toast.error("Estoque não pode ficar negativo"); return }
    await supabase.from("products").update({ stock_quantity: newQty }).eq("id", id)
    setProducts(prev => prev.map(p => p.id === id ? { ...p, stock_quantity: newQty } : p))
  }

  const handleBulkSave = async () => {
    const updates = Object.entries(adjustments).filter(([, v]) => v !== 0)
    if (updates.length === 0) { toast.error("Nenhuma ajuste para salvar"); return }

    for (const [id, delta] of updates) {
      const current = products.find(p => p.id === id)
      if (!current) continue
      const newQty = current.stock_quantity + delta
      if (newQty < 0) { toast.error(`${current.name}: estoque não pode ficar negativo`); return }
      await supabase.from("products").update({ stock_quantity: newQty }).eq("id", id)
    }

    toast.success("Estoque atualizado!")
    setAdjustments({})
    fetchProducts()
  }

  const totalItems = products.reduce((s, p) => s + p.stock_quantity, 0)
  const totalValue = products.reduce((s, p) => s + p.stock_quantity * p.price, 0)

  return (
    <div className="space-y-6 animate-slide-up-fade">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Estoque</h1>
          <p className="text-sm text-muted-foreground">Controle de estoque dos produtos.</p>
        </div>
        {Object.values(adjustments).some(v => v !== 0) && (
          <Button onClick={handleBulkSave} className="rounded-xl"><Save className="h-4 w-4 mr-2" /> Salvar Ajustes</Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{totalItems}</p>
            <p className="text-xs text-muted-foreground">Itens em estoque</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">R$ {totalValue.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Valor total em estoque</p>
          </CardContent>
        </Card>
      </div>

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
                return (
                  <div key={prod.id} className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <Package className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{prod.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Atual: <span className="font-semibold">{prod.stock_quantity}</span>
                        {adj !== 0 && <span className={adj > 0 ? "text-emerald-600" : "text-destructive"}> → {projected}</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="outline" className="h-8 w-8 p-0 rounded-lg" onClick={() => handleAdjust(prod.id, -1)}>
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                      <Input
                        type="number"
                        className="h-8 w-16 text-center text-xs rounded-lg"
                        value={adj}
                        onChange={e => setAdjustments(prev => ({ ...prev, [prod.id]: Number(e.target.value) }))}
                      />
                      <Button size="sm" variant="outline" className="h-8 w-8 p-0 rounded-lg" onClick={() => handleAdjust(prod.id, 1)}>
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                    </div>
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

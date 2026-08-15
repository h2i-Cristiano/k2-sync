"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/ui/page-header"
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Plus, FileText, Search, Pencil, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { RecordForm } from "@/components/forms/RecordForm"
import { deleteRecord } from "@/lib/actions/record.actions"
import { toast } from "sonner"

const statusTones: Record<string, StatusTone> = {
  draft: "default",
  completed: "success",
  approved: "gold",
}

const statusLabels: Record<string, string> = {
  draft: "Rascunho",
  completed: "Concluído",
  approved: "Aprovado",
}

export default function RecordsPage() {
  const [records, setRecords] = useState<any[]>([])
  const [patients, setPatients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const supabase = useMemo(() => createClient(), [])

  const fetchRecords = useCallback(async () => {
    const { data } = await supabase
      .from("medical_records")
      .select("id, session_number, chief_complaint, assessment, status, created_at, patients(full_name)")
      .order("created_at", { ascending: false })
    setRecords(data || [])
    setLoading(false)
  }, [supabase])

  const fetchPatients = useCallback(async () => {
    const { data } = await supabase.from("patients").select("id, full_name").order("full_name")
    setPatients(data || [])
  }, [supabase])

  useEffect(() => {
    fetchPatients()
    fetchRecords()
  }, [fetchPatients, fetchRecords])

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este prontuário?")) return
    try {
      await deleteRecord(id)
      toast.success("Prontuário excluído!")
      fetchRecords()
    } catch {
      toast.error("Erro ao excluir prontuário.")
    }
  }

  const filteredRecords = records.filter((r) =>
    r.patients?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.chief_complaint?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-5 animate-slide-up-fade">
      <PageHeader
        title="Prontuários"
        description="Prontuários eletrônicos dos seus pacientes."
        actions={
          <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) setEditingRecord(null) }}>
            <DialogTrigger render={<Button />}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Prontuário
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingRecord ? "Editar Prontuário" : "Novo Prontuário"}</DialogTitle>
              </DialogHeader>
              <RecordForm
                patients={patients}
                initialData={editingRecord}
                onSuccess={() => { setIsOpen(false); setEditingRecord(null); fetchRecords() }}
                onCancel={() => { setIsOpen(false); setEditingRecord(null) }}
              />
            </DialogContent>
          </Dialog>
        }
      />

      <div className="relative w-full lg:max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por paciente ou queixa..."
          className="pl-10 bg-card border-border/60"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-card p-4 ring-1 ring-border/40">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-44" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="rounded-2xl bg-card ring-1 ring-border/40">
          <EmptyState
            icon={FileText}
            title={searchTerm ? "Nenhum resultado" : "Nenhum prontuário"}
            description={
              searchTerm
                ? "Nenhum resultado corresponde à sua pesquisa."
                : "Crie o primeiro prontuário eletrônico."
            }
            action={
              searchTerm ? undefined : (
                <Button onClick={() => setIsOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Prontuário
                </Button>
              )
            }
          />
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRecords.map((record) => (
            <Card key={record.id} className="hover:shadow-md transition-[box-shadow,transform] hover:-translate-y-px">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{record.patients?.full_name || "Paciente"}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        Sessão {record.session_number || "?"} — {record.chief_complaint || "Sem queixa"}
                      </p>
                      {record.assessment && (
                        <p className="text-sm mt-1 text-muted-foreground line-clamp-2">{record.assessment}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <StatusBadge label={statusLabels[record.status] || record.status} tone={statusTones[record.status] || "default"} />
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-9 w-9" title="Editar" onClick={() => { setEditingRecord(record); setIsOpen(true) }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" title="Excluir" onClick={() => handleDelete(record.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2 tnum">
                  {new Date(record.created_at).toLocaleDateString("pt-BR")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
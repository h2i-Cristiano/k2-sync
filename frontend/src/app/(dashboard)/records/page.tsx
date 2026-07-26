"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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

export default function RecordsPage() {
  const [records, setRecords] = useState<any[]>([])
  const [patients, setPatients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const supabase = createClient()

  const fetchRecords = useCallback(async () => {
    const { data } = await supabase
      .from("medical_records")
      .select("*, patients(full_name)")
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
    if (!confirm("Tem certeza que deseja excluir este prontuario?")) return
    try {
      await deleteRecord(id)
      toast.success("Prontuario excluido!")
      fetchRecords()
    } catch {
      toast.error("Erro ao excluir prontuario.")
    }
  }

  const filteredRecords = records.filter((r) =>
    r.patients?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.chief_complaint?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Prontuarios</h1>
          <p className="text-muted-foreground mt-1">Prontuarios eletronicos dos seus pacientes.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) setEditingRecord(null) }}>
          <DialogTrigger render={<Button className="shadow-sm" />}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Prontuario
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingRecord ? "Editar Prontuario" : "Novo Prontuario"}</DialogTitle>
            </DialogHeader>
            <RecordForm
              patients={patients}
              initialData={editingRecord}
              onSuccess={() => { setIsOpen(false); setEditingRecord(null); fetchRecords() }}
              onCancel={() => { setIsOpen(false); setEditingRecord(null) }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por paciente ou queixa..."
          className="pl-9"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p>Carregando prontuarios...</p>
          </div>
        </div>
      ) : filteredRecords.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-lg font-medium">Nenhum prontuario</p>
            <p className="text-sm text-muted-foreground">Crie o primeiro prontuario eletronico.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredRecords.map((record) => (
            <Card key={record.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{record.patients?.full_name || "Paciente"}</p>
                      <p className="text-sm text-muted-foreground">
                        Sessao {record.session_number || "?"} - {record.chief_complaint || "Sem queixa"}
                      </p>
                      {record.assessment && (
                        <p className="text-sm mt-1 text-gray-600 dark:text-gray-400 line-clamp-2">{record.assessment}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      record.status === "completed" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                      record.status === "approved" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                    }`}>
                      {record.status === "completed" ? "Concluido" : record.status === "approved" ? "Aprovado" : "Rascunho"}
                    </span>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingRecord(record); setIsOpen(true) }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(record.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
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

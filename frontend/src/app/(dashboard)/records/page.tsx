"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, FileText, Search } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function RecordsPage() {
  const [records, setRecords] = useState<any[]>([])
  const [patients, setPatients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const supabase = createClient()

  const fetchRecords = async () => {
    const { data } = await supabase
      .from("medical_records")
      .select("*, patients(full_name)")
      .order("created_at", { ascending: false })

    setRecords(data || [])
    setLoading(false)
  }

  const fetchPatients = async () => {
    const { data } = await supabase.from("patients").select("id, full_name").order("full_name")
    setPatients(data || [])
  }

  useEffect(() => {
    fetchPatients()
    fetchRecords()
  }, [supabase])

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    const formData = new FormData(e.currentTarget)

    const { error } = await supabase.from("medical_records").insert({
      patient_id: formData.get("patient_id"),
      session_number: parseInt(formData.get("session_number") as string || "1"),
      chief_complaint: formData.get("chief_complaint"),
      assessment: formData.get("assessment"),
      treatment_plan: formData.get("treatment_plan"),
      notes: formData.get("notes"),
      status: "draft",
    })

    if (!error) {
      setIsOpen(false)
      fetchRecords()
    }
    setSaving(false)
  }

  const filteredRecords = records.filter((r) =>
    r.patients?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.chief_complaint?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Prontuarios</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Prontuario
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Novo Prontuario</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Paciente *</Label>
                  <select name="patient_id" className="w-full border rounded-md p-2" required>
                    <option value="">Selecione</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>{p.full_name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Sessao Nº</Label>
                  <Input name="session_number" type="number" defaultValue="1" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Queixa Principal</Label>
                <Input name="chief_complaint" placeholder="Motivo da sessao" />
              </div>
              <div className="space-y-2">
                <Label>Avaliacao / Observacoes</Label>
                <textarea
                  name="assessment"
                  className="w-full border rounded-md p-2 h-20"
                  placeholder="Notas do profissional..."
                />
              </div>
              <div className="space-y-2">
                <Label>Plano de Tratamento</Label>
                <textarea
                  name="treatment_plan"
                  className="w-full border rounded-md p-2 h-20"
                  placeholder="Proximos passos..."
                />
              </div>
              <div className="space-y-2">
                <Label>Notas Adicionais</Label>
                <Input name="notes" placeholder="Observacoes gerais" />
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? "Salvando..." : "Salvar Prontuario"}
              </Button>
            </form>
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
        <div className="p-8 text-center text-muted-foreground">Carregando...</div>
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
                        <p className="text-sm mt-1 text-gray-600 line-clamp-2">{record.assessment}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      record.status === "completed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {record.status === "completed" ? "Concluido" : "Rascunho"}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(record.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

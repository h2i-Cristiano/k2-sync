"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Search, FileText, Users, Eye, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import Link from "next/link"
import { PatientForm } from "@/components/forms/PatientForm"
import { deletePatient } from "@/lib/actions/patient.actions"
import { toast } from "sonner"

export default function PatientsPage() {
  const [patients, setPatients] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchPatients = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from("patients").select("*").order("created_at", { ascending: false })
    if (data) setPatients(data)
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchPatients()
  }, [fetchPatients])

  const filteredPatients = patients.filter((patient) =>
    patient.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone?.includes(searchTerm)
  )

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este paciente? Esta ação não pode ser desfeita.")) return
    
    const result = await deletePatient(id)
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success("Paciente excluído com sucesso")
      fetchPatients()
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pacientes</h1>
          <p className="text-muted-foreground">Gerencie sua lista de pacientes e acesse seus prontuários.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger render={<Button className="shadow-sm hover:shadow-md transition-shadow" />}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Paciente
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Paciente</DialogTitle>
            </DialogHeader>
            <PatientForm onSuccess={() => {
              setIsOpen(false)
              fetchPatients()
            }} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, email ou telefone..."
          className="pl-9 bg-card shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Card className="border-none shadow-md overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mb-4"></div>
              <p>Carregando pacientes...</p>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="p-16 text-center text-muted-foreground bg-muted/20">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-40 text-primary" />
              <p className="text-xl font-medium mb-1">Nenhum paciente encontrado</p>
              <p className="text-sm">Adicione seu primeiro paciente clicando no botão acima.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm whitespace-nowrap">
                <thead className="border-b bg-muted/50">
                  <tr className="text-left text-muted-foreground">
                    <th className="p-4 font-semibold uppercase text-xs tracking-wider">Nome do Paciente</th>
                    <th className="p-4 font-semibold uppercase text-xs tracking-wider">Contato</th>
                    <th className="p-4 font-semibold uppercase text-xs tracking-wider text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredPatients.map((patient) => (
                    <tr key={patient.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shadow-sm ring-1 ring-primary/20 group-hover:scale-105 transition-transform">
                            {patient.full_name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-medium text-base">{patient.full_name}</span>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {patient.cpf ? `CPF: ${patient.cpf}` : "CPF não informado"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">{patient.email || "Sem email"}</div>
                        <div className="text-sm text-muted-foreground">{patient.phone || "Sem telefone"}</div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                          <Button render={<Link href={`/patients/${patient.id}/anamnese`} />} variant="outline" size="sm" className="h-8 shadow-sm">
                            <FileText className="h-3.5 w-3.5 mr-1.5" />
                            Anamnese
                          </Button>
                          <Button render={<Link href={`/patients/${patient.id}`} />} variant="secondary" size="sm" className="h-8 shadow-sm">
                            <Eye className="h-3.5 w-3.5 mr-1.5" />
                            Perfil
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={() => handleDelete(patient.id)}>
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Excluir</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useEffect, useState, useCallback, Suspense } from "react"
import dynamic from "next/dynamic"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Search, FileText, Users, Eye, Trash2, Calendar, UserPlus, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { deletePatient } from "@/lib/actions/patient.actions"
import { toast } from "sonner"

const PatientForm = dynamic(
  () => import("@/components/forms/PatientForm").then((mod) => ({ default: mod.PatientForm })),
  { loading: () => <div className="p-6"><Skeleton className="h-[400px] w-full rounded-xl" /></div> }
)

const AVATAR_GRADIENTS = [
  "from-emerald-500 to-teal-700",
  "from-amber-500 to-orange-600",
  "from-indigo-500 to-blue-700",
  "from-rose-500 to-pink-700",
  "from-purple-500 to-indigo-700",
]

export default function PatientsPage() {
  const [patients, setPatients] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [newPatientId, setNewPatientId] = useState<string | null>(null)
  const [showSchedulePrompt, setShowSchedulePrompt] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const fetchPatients = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from("patients")
        .select("id, full_name, email, phone, cpf, created_at")
        .order("created_at", { ascending: false })

      if (data) setPatients(data)
    } catch (err) {
      console.error("Erro ao buscar pacientes:", err)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchPatients()
  }, [fetchPatients])

  const filteredPatients = patients.filter((patient) =>
    patient.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone?.includes(searchTerm) ||
    patient.cpf?.includes(searchTerm)
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

  function handlePatientCreated(patientId?: string) {
    setIsOpen(false)
    fetchPatients()
    if (patientId) {
      setNewPatientId(patientId)
      setShowSchedulePrompt(true)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Pacientes</h1>
          <p className="text-sm text-muted-foreground">Gerencie sua lista de pacientes, fichas e prontuários médicos.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger render={<Button className="rounded-xl font-semibold shadow-md shadow-emerald-500/20" />}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Paciente
          </DialogTrigger>
          <DialogContent className="sm:max-w-md rounded-2xl border-border/60">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">Adicionar Novo Paciente</DialogTitle>
            </DialogHeader>
            <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-xl" />}>
              <PatientForm onSuccess={handlePatientCreated} />
            </Suspense>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={showSchedulePrompt} onOpenChange={setShowSchedulePrompt}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-emerald-600 dark:text-emerald-400 font-bold">Paciente criado com sucesso!</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Deseja agendar uma consulta para este paciente agora?
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => { setShowSchedulePrompt(false); setNewPatientId(null) }}>
                Agora não
              </Button>
              <Button className="flex-1 rounded-xl font-semibold shadow-md shadow-emerald-500/20" onClick={() => {
                setShowSchedulePrompt(false)
                router.push(`/appointments?patient=${newPatientId}`)
                setNewPatientId(null)
              }}>
                <Calendar className="mr-2 h-4 w-4" />
                Agendar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        <Input
          placeholder="Buscar por nome, email, telefone ou CPF..."
          className="pl-10 pr-9 bg-card border-border/60 rounded-xl shadow-xs focus:border-primary/50 transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <Card className="glass-card border-border/60 overflow-hidden shadow-lg">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-24 rounded-lg" />
                </div>
              ))}
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="p-16 text-center text-muted-foreground">
              <div className="h-14 w-14 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
                <Users className="h-7 w-7" />
              </div>
              <p className="text-xl font-bold text-foreground mb-1">Nenhum paciente encontrado</p>
              <p className="text-sm max-w-sm mx-auto">
                {searchTerm ? "Nenhum resultado corresponde à sua pesquisa." : "Adicione seu primeiro paciente para gerenciar anamneses e consultas."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm whitespace-nowrap">
                <thead className="border-b border-border/60 bg-muted/30">
                  <tr className="text-left text-muted-foreground">
                    <th className="p-4 font-bold uppercase text-[11px] tracking-wider">Nome do Paciente</th>
                    <th className="p-4 font-bold uppercase text-[11px] tracking-wider">Contato</th>
                    <th className="p-4 font-bold uppercase text-[11px] tracking-wider text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredPatients.map((patient, idx) => {
                    const gradient = AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length]
                    const initial = patient.full_name?.charAt(0).toUpperCase() || "P"
                    return (
                      <tr key={patient.id} className="hover:bg-primary/5 transition-colors group">
                        <td className="p-4">
                          <div className="flex items-center gap-3.5">
                            <div className={`h-10 w-10 rounded-full bg-gradient-to-tr ${gradient} text-white flex items-center justify-center font-bold text-sm shadow-xs group-hover:scale-105 transition-transform`}>
                              {initial}
                            </div>
                            <div>
                              <span className="font-semibold text-base text-foreground group-hover:text-primary transition-colors">{patient.full_name}</span>
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {patient.cpf ? `CPF: ${patient.cpf}` : "CPF não informado"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm font-medium text-foreground">{patient.email || "Sem e-mail"}</div>
                          <div className="text-xs text-muted-foreground">{patient.phone || "Sem telefone"}</div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button render={<Link href={`/patients/${patient.id}/anamnese`} />} variant="outline" size="sm" className="h-8 rounded-lg shadow-xs hover:border-primary/40">
                              <FileText className="h-3.5 w-3.5 mr-1.5 text-emerald-600 dark:text-emerald-400" />
                              Anamnese
                            </Button>
                            <Button render={<Link href={`/patients/${patient.id}`} />} variant="secondary" size="sm" className="h-8 rounded-lg shadow-xs">
                              <Eye className="h-3.5 w-3.5 mr-1.5 text-primary" />
                              Perfil
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg text-rose-500 hover:bg-rose-500/10 hover:text-rose-600" onClick={() => handleDelete(patient.id)} title="Excluir paciente">
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Excluir</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
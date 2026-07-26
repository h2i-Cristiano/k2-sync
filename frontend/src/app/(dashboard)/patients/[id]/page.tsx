"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, FileText, Calendar, Edit, Activity, User, Phone, MapPin, Pill, AlertCircle, Clock } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { PatientForm } from "@/components/forms/PatientForm"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function PatientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const patientId = params.id as string
  const [patient, setPatient] = useState<any>(null)
  const [anamnesis, setAnamnesis] = useState<any[]>([])
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [{ data: p }, { data: a }, { data: appts }] = await Promise.all([
      supabase.from("patients").select("*").eq("id", patientId).single(),
      supabase.from("anamnesis").select("*").eq("patient_id", patientId).order("created_at", { ascending: false }),
      supabase.from("appointments").select("*").eq("patient_id", patientId).order("scheduled_at", { ascending: false }),
    ])
    setPatient(p)
    setAnamnesis(a || [])
    setAppointments(appts || [])
    setLoading(false)
  }, [supabase, patientId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p>Carregando perfil...</p>
        </div>
      </div>
    )
  }
  if (!patient) return <div className="p-12 text-center text-muted-foreground text-lg">Paciente não encontrado.</div>

  const formatAge = (birthDate: string) => {
    if (!birthDate) return "N/A"
    const diff = new Date().getTime() - new Date(birthDate).getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25)) + " anos"
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex h-14 w-14 rounded-full bg-primary/10 items-center justify-center text-primary font-bold text-xl shadow-sm ring-1 ring-primary/20">
              {patient.full_name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{patient.full_name}</h1>
              <p className="text-muted-foreground flex items-center gap-2 mt-1">
                <span className="inline-flex items-center"><User className="h-3.5 w-3.5 mr-1"/> {patient.gender === 'M' ? 'Masc.' : patient.gender === 'F' ? 'Fem.' : patient.gender === 'O' ? 'Outro' : 'N/I'} • {formatAge(patient.birth_date)}</span>
                <span>•</span>
                <span className="inline-flex items-center"><Phone className="h-3.5 w-3.5 mr-1"/> {patient.phone || "Sem telefone"}</span>
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogTrigger render={<Button variant="outline" className="flex-1 sm:flex-none" />}>
              <Edit className="mr-2 h-4 w-4" />
              Editar Perfil
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Editar Paciente</DialogTitle>
                <DialogDescription>Atualize os dados de {patient.full_name}</DialogDescription>
              </DialogHeader>
              <PatientForm initialData={patient} onSuccess={() => {
                setIsEditOpen(false)
                fetchData()
              }} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="clinical">Clínico</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-sm border-none bg-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" /> Dados Pessoais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-muted-foreground mb-1">CPF</p>
                    <p className="font-medium">{patient.cpf || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">RG</p>
                    <p className="font-medium">{patient.rg || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Data Nasc.</p>
                    <p className="font-medium">{patient.birth_date ? new Date(patient.birth_date).toLocaleDateString('pt-BR') : "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Estado Civil</p>
                    <p className="font-medium capitalize">{patient.marital_status || "-"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground mb-1">Email</p>
                    <p className="font-medium">{patient.email || "-"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground mb-1">Profissão</p>
                    <p className="font-medium">{patient.occupation || "-"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="shadow-sm border-none bg-card">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" /> Endereço & Contato
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  {patient.address && Object.keys(patient.address).length > 0 ? (
                    <div className="space-y-1">
                      <p>{patient.address.street || ""}, {patient.address.number || "S/N"} {patient.address.complement ? `- ${patient.address.complement}` : ""}</p>
                      <p>{patient.address.neighborhood || ""}</p>
                      <p>{patient.address.city || ""} - {patient.address.state || ""}</p>
                      <p className="text-muted-foreground">{patient.address.zip_code || ""}</p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">Endereço não cadastrado.</p>
                  )}
                  
                  <div className="pt-4 border-t">
                    <p className="font-medium text-destructive flex items-center gap-2 mb-2">
                      <AlertCircle className="h-4 w-4" /> Contato de Emergência
                    </p>
                    {patient.emergency_contact?.name ? (
                      <div>
                        <p className="font-medium">{patient.emergency_contact.name} ({patient.emergency_contact.relationship || "N/A"})</p>
                        <p>{patient.emergency_contact.phone}</p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground italic">Não cadastrado.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-sm border-none bg-card">
                <CardContent className="p-6">
                  <div className="flex gap-3">
                    <Button render={<Link href={`/patients/${patientId}/anamnese`} />} className="flex-1 shadow-sm">
                      <FileText className="mr-2 h-4 w-4" />
                      Nova Anamnese
                    </Button>
                    <Button render={<Link href="/appointments" />} variant="secondary" className="flex-1 shadow-sm">
                      <Calendar className="mr-2 h-4 w-4" />
                      Agendar Sessão
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="clinical" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-sm border-none bg-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5 text-rose-500" /> Condições e Alergias
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 text-sm">
                <div>
                  <p className="text-muted-foreground font-medium mb-2">Condições Médicas</p>
                  {patient.medical_conditions?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {patient.medical_conditions.map((cond: string, i: number) => (
                        <span key={i} className="px-2.5 py-1 rounded-md bg-rose-100 text-rose-700 text-xs font-medium">{cond}</span>
                      ))}
                    </div>
                  ) : <p className="text-muted-foreground italic">Nenhuma condição informada.</p>}
                </div>
                <div>
                  <p className="text-muted-foreground font-medium mb-2">Alergias</p>
                  {patient.allergies?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {patient.allergies.map((alg: string, i: number) => (
                        <span key={i} className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-700 text-xs font-medium">{alg}</span>
                      ))}
                    </div>
                  ) : <p className="text-muted-foreground italic">Nenhuma alergia informada.</p>}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-none bg-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Pill className="h-5 w-5 text-blue-500" /> Medicamentos em Uso
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                {patient.medications?.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    {patient.medications.map((med: string, i: number) => (
                      <li key={i} className="text-foreground">{med}</li>
                    ))}
                  </ul>
                ) : <p className="text-muted-foreground italic">Nenhum medicamento informado.</p>}
              </CardContent>
            </Card>

            <Card className="md:col-span-2 shadow-sm border-none bg-card">
              <CardHeader>
                <CardTitle className="text-lg">Observações Clínicas (Tags & Notas)</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-4">
                {patient.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {patient.tags.map((tag: string, i: number) => (
                      <span key={i} className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">#{tag}</span>
                    ))}
                  </div>
                )}
                {patient.notes ? (
                  <div className="p-4 bg-muted/30 rounded-lg whitespace-pre-wrap">{patient.notes}</div>
                ) : (
                  <p className="text-muted-foreground italic">Sem notas adicionais.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card className="shadow-sm border-none bg-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" /> Histórico de Anamneses
              </CardTitle>
            </CardHeader>
            <CardContent>
              {anamnesis.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground bg-muted/20 rounded-lg">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p>Nenhuma anamnese registrada.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {anamnesis.map((a) => (
                    <div key={a.id} className="p-4 border border-border/50 bg-muted/10 rounded-xl flex justify-between items-center hover:bg-muted/30 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="mt-1 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-semibold capitalize">{a.form_type} Anamnese</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3" />
                            {new Date(a.created_at).toLocaleString("pt-BR")}
                          </p>
                        </div>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${a.status === 'completed' || a.status === 'signed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {a.status === 'completed' ? 'Concluída' : a.status === 'signed' ? 'Assinada' : 'Rascunho'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm border-none bg-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" /> Histórico de Agendamentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {appointments.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground bg-muted/20 rounded-lg">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p>Nenhum agendamento registrado.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {appointments.map((appt) => (
                    <div key={appt.id} className="p-4 border border-border/50 bg-muted/10 rounded-xl flex justify-between items-center hover:bg-muted/30 transition-colors">
                      <div>
                        <p className="font-semibold capitalize">{appt.service_type}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" />
                          {new Date(appt.scheduled_at).toLocaleString("pt-BR")}
                        </p>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-secondary text-secondary-foreground">
                        {appt.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

"use client"

import { useEffect, useState, useCallback, type ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, FileText, Calendar, Edit, Activity, User, Phone, MapPin, Pill, AlertCircle, Clock, ClipboardList, Plus, NotebookPen, Wallet } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { PatientForm } from "@/components/forms/PatientForm"
import { RecordForm } from "@/components/forms/RecordForm"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { getServiceById, fetchServices, type ServiceDef } from "@/lib/services"

export default function PatientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const patientId = params.id as string
  const [patient, setPatient] = useState<any>(null)
  const [anamnesis, setAnamnesis] = useState<any[]>([])
  const [appointments, setAppointments] = useState<any[]>([])
  const [records, setRecords] = useState<any[]>([])
  const [services, setServices] = useState<ServiceDef[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isRecordOpen, setIsRecordOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [historyFilter, setHistoryFilter] = useState<"all" | "record" | "anamnesis" | "appointment">("all")
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [{ data: p }, { data: a }, { data: appts }, { data: recs }, svcs] = await Promise.all([
      supabase.from("patients").select("*").eq("id", patientId).single(),
      supabase.from("anamnesis").select("*").eq("patient_id", patientId).order("created_at", { ascending: false }),
      supabase.from("appointments").select("*").eq("patient_id", patientId).order("scheduled_at", { ascending: false }),
      supabase.from("medical_records").select("id, session_number, chief_complaint, assessment, treatment_plan, status, created_at").eq("patient_id", patientId).order("created_at", { ascending: false }),
      fetchServices(),
    ])
    setPatient(p)
    setAnamnesis(a || [])
    setAppointments(appts || [])
    setRecords(recs || [])
    setServices(svcs)
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

  const completedAppointments = appointments.filter((a) => a.status === "completed")
  const totalInvestido = completedAppointments.reduce((sum, a) => sum + (Number(a.total_cost) || 0), 0)
  const sessionNumbers = records.map((r) => Number(r.session_number)).filter((n) => Number.isFinite(n) && n > 0)
  const nextSession = sessionNumbers.length > 0 ? Math.max(...sessionNumbers) + 1 : 1

  const summaryCards = [
    { label: "Atendimentos", value: String(completedAppointments.length), color: "bg-primary/10 text-primary", icon: <Calendar className="h-5 w-5" /> },
    { label: "Total investido", value: `R$ ${totalInvestido.toFixed(2).replace(".", ",")}`, color: "bg-emerald-500/10 text-emerald-600", icon: <Wallet className="h-5 w-5" /> },
    { label: "Prontuários", value: String(records.length), color: "bg-sky-500/10 text-sky-600", icon: <NotebookPen className="h-5 w-5" /> },
    { label: "Anamneses", value: String(anamnesis.length), color: "bg-violet-500/10 text-violet-600", icon: <ClipboardList className="h-5 w-5" /> },
  ]

  const events: { id: string; kind: "record" | "anamnesis" | "appointment"; date: string; dateLabel: string; title: string; subtitle: string; badge: string; badgeVariant: "success" | "warning" | "destructive" | "default" | "secondary"; dot: string; iconBg: string; icon: ReactNode }[] = []

  records.forEach((r) => {
    events.push({
      id: `rec-${r.id}`, kind: "record", date: r.created_at,
      dateLabel: new Date(r.created_at).toLocaleString("pt-BR"),
      title: `Prontuário - Sessão ${r.session_number || "?"}`,
      subtitle: r.chief_complaint || r.assessment || "Sem queixa registrada",
      badge: r.status === "completed" ? "Concluído" : "Rascunho",
      badgeVariant: r.status === "completed" ? "success" : "warning",
      dot: "bg-sky-500", iconBg: "bg-sky-500/10 text-sky-600",
      icon: <NotebookPen className="h-4 w-4" />,
    })
  })

  anamnesis.forEach((a) => {
    events.push({
      id: `ana-${a.id}`, kind: "anamnesis", date: a.created_at,
      dateLabel: new Date(a.created_at).toLocaleString("pt-BR"),
      title: `${a.form_type ? a.form_type.charAt(0).toUpperCase() + a.form_type.slice(1) : "Formulário"} Anamnese`,
      subtitle: a.status === "completed" ? "Anamnese concluída" : a.status === "signed" ? "Anamnese assinada" : "Rascunho de anamnese",
      badge: a.status === "completed" ? "Concluída" : a.status === "signed" ? "Assinada" : "Rascunho",
      badgeVariant: a.status === "completed" || a.status === "signed" ? "success" : "warning",
      dot: "bg-violet-500", iconBg: "bg-violet-500/10 text-violet-600",
      icon: <ClipboardList className="h-4 w-4" />,
    })
  })

  appointments.forEach((appt) => {
    const svc = getServiceById(services, appt.service_type)
    const badgeMap: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "default" | "secondary" }> = {
      scheduled: { label: "Agendado", variant: "secondary" },
      confirmed: { label: "Confirmado", variant: "default" },
      in_progress: { label: "Em andamento", variant: "warning" },
      completed: { label: "Concluído", variant: "success" },
      cancelled: { label: "Cancelado", variant: "destructive" },
      no_show: { label: "Não Compareceu", variant: "destructive" },
    }
    const badge = badgeMap[appt.status] || { label: appt.status || "Agendado", variant: "secondary" as const }
    events.push({
      id: `appt-${appt.id}`, kind: "appointment", date: appt.scheduled_at,
      dateLabel: new Date(appt.scheduled_at).toLocaleString("pt-BR"),
      title: svc?.label || appt.service_type,
      subtitle: `Sessão agendada${appt.total_cost ? ` • R$ ${Number(appt.total_cost).toFixed(2).replace(".", ",")}` : ""}`,
      badge: badge.label, badgeVariant: badge.variant,
      dot: "bg-emerald-500", iconBg: "bg-emerald-500/10 text-emerald-600",
      icon: <Calendar className="h-4 w-4" />,
    })
  })

  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  const filteredEvents = historyFilter === "all" ? events : events.filter((e) => e.kind === historyFilter)

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex h-14 w-14 shrink-0 rounded-full bg-primary/10 items-center justify-center text-primary font-bold text-xl ring-1 ring-primary/20">
            {patient.full_name?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">{patient.full_name}</h1>
            <p className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-sm">
              <span className="inline-flex items-center"><User className="h-3.5 w-3.5 mr-1"/> {patient.gender === 'M' ? 'Masc.' : patient.gender === 'F' ? 'Fem.' : patient.gender === 'O' ? 'Outro' : 'N/I'} • {formatAge(patient.birth_date)}</span>
              <span>•</span>
              <span className="inline-flex items-center"><Phone className="h-3.5 w-3.5 mr-1"/> {patient.phone || "Sem telefone"}</span>
            </p>
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted/50 p-1 w-full justify-start overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TabsTrigger value="overview" className="whitespace-nowrap">Visão Geral</TabsTrigger>
          <TabsTrigger value="clinical" className="whitespace-nowrap">Clínico</TabsTrigger>
          <TabsTrigger value="history" className="whitespace-nowrap">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="ring-1 ring-border/40">
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
              <Card className="ring-1 ring-border/40">
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
              
              <Card className="ring-1 ring-border/40">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Button render={<Link href={`/patients/${patientId}/anamnese`} />} className="shadow-sm">
                      <FileText className="mr-2 h-4 w-4" />
                      Nova Anamnese
                    </Button>
                    <Button onClick={() => setIsRecordOpen(true)} className="shadow-sm">
                      <NotebookPen className="mr-2 h-4 w-4" />
                      Novo Prontuário
                    </Button>
                    <Button render={<Link href="/appointments" />} variant="secondary" className="shadow-sm">
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
            <Card className="ring-1 ring-border/40">
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

            <Card className="ring-1 ring-border/40">
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {summaryCards.map((c) => (
              <Card key={c.label} className="ring-1 ring-border/40">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${c.color}`}>{c.icon}</div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{c.label}</p>
                    <p className="text-xl font-bold truncate">{c.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-xl w-full sm:w-auto overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {(["all", "record", "anamnesis", "appointment"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setHistoryFilter(k)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    historyFilter === k ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {k === "all" ? "Todos" : k === "record" ? "Prontuários" : k === "anamnesis" ? "Anamneses" : "Agendamentos"}
                </button>
              ))}
            </div>
            <Button onClick={() => setIsRecordOpen(true)} className="shadow-sm">
              <Plus className="mr-2 h-4 w-4" />
              Novo Prontuário
            </Button>
          </div>

          <Card className="ring-1 ring-border/40">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" /> Linha do Tempo
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredEvents.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground bg-muted/20 rounded-lg">
                  <NotebookPen className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p>{events.length === 0 ? "Nenhum registro no histórico deste paciente." : "Nenhum evento nesta categoria."}</p>
                </div>
              ) : (
                <ol className="relative border-l-2 border-border/60 ml-2 space-y-6">
                  {filteredEvents.map((ev) => (
                    <li key={ev.id} className="relative pl-7">
                      <span className={`absolute -left-[9px] top-1.5 h-4 w-4 rounded-full ring-4 ring-background ${ev.dot}`} />
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${ev.iconBg}`}>{ev.icon}</div>
                          <div>
                            <p className="font-semibold">{ev.title}</p>
                            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{ev.subtitle}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-muted-foreground">{ev.dateLabel}</span>
                          <Badge variant={ev.badgeVariant}>{ev.badge}</Badge>
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isRecordOpen} onOpenChange={setIsRecordOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Prontuário</DialogTitle>
            <DialogDescription>Registre uma nova evolução para {patient.full_name}</DialogDescription>
          </DialogHeader>
          <RecordForm
            patients={[{ id: patientId, full_name: patient.full_name }]}
            initialData={{ patient_id: patientId, session_number: nextSession, status: "draft" }}
            onSuccess={() => { setIsRecordOpen(false); fetchData() }}
            onCancel={() => setIsRecordOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

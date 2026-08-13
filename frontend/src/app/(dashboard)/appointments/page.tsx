"use client"

import { useEffect, useState, useCallback, Suspense, useMemo } from "react"
import dynamic from "next/dynamic"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, ChevronLeft, ChevronRight, User, MapPin, Pencil, CalendarDays, ChevronDown, MessageCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { fetchServices, getServiceById, ServiceDef } from "@/lib/services"
import { useSearchParams } from "next/navigation"
import { updateAppointment } from "@/lib/actions/appointment.actions"
import { toast } from "sonner"
import { getWhatsAppUrl, buildPaymentMessage } from "@/lib/whatsapp"

const AppointmentForm = dynamic(
  () => import("@/components/forms/AppointmentForm").then((mod) => ({ default: mod.AppointmentForm })),
  { loading: () => <div className="p-6"><Skeleton className="h-[500px] w-full rounded-xl" /></div> }
)

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30",
  confirmed: "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30 font-semibold",
  completed: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  cancelled: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30",
  no_show: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30",
}

const statusLabels: Record<string, string> = {
  scheduled: "Agendado",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Não Compareceu",
}

const filterOptions = [
  { key: "all", label: "Todos" },
  { key: "today", label: "Hoje" },
  { key: "scheduled", label: "Agendados" },
  { key: "confirmed", label: "Confirmados" },
  { key: "completed", label: "Concluídos" },
  { key: "cancelled", label: "Cancelados" },
]

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

function isSameDay(d1: Date, d2: Date) {
  return d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear()
}

function AppointmentsPageInner() {
  const searchParams = useSearchParams()
  const preselectedPatientId = searchParams.get("patient")
  const [appointments, setAppointments] = useState<any[]>([])
  const [allMonthAppointments, setAllMonthAppointments] = useState<any[]>([])
  const [patients, setPatients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [view, setView] = useState<"day" | "list">("day")
  const [activeFilter, setActiveFilter] = useState("all")
  const [services, setServices] = useState<ServiceDef[]>([])
  const supabase = useMemo(() => createClient(), [])

  const year = selectedDate.getFullYear()
  const month = selectedDate.getMonth()

  const fetchAppointmentsForDay = useCallback(async () => {
    setLoading(true)
    const startOfDay = new Date(selectedDate)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(selectedDate)
    endOfDay.setHours(23, 59, 59, 999)

    const { data } = await supabase
      .from("appointments")
      .select("*, patients(full_name, phone)")
      .gte("scheduled_at", startOfDay.toISOString())
      .lte("scheduled_at", endOfDay.toISOString())
      .order("scheduled_at", { ascending: true })

    const aptList = data || []
    const aptIds = aptList.map(a => a.id)
    let depositMap: Record<string, number> = {}
    if (aptIds.length > 0) {
      const { data: entries } = await supabase
        .from("financial_entries")
        .select("appointment_id, amount")
        .eq("type", "receivable")
        .in("appointment_id", aptIds)
      ;(entries || []).forEach(e => {
        if (e.appointment_id) depositMap[e.appointment_id] = Number(e.amount) || 0
      })
    }

    setAppointments(aptList.map(a => ({ ...a, deposit: depositMap[a.id] })))
    setLoading(false)
  }, [supabase, selectedDate])

  const fetchMonthAppointments = useCallback(async () => {
    const startOfMonth = new Date(year, month, 1)
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999)

    const { data } = await supabase
      .from("appointments")
      .select("id, scheduled_at, service_type, status")
      .gte("scheduled_at", startOfMonth.toISOString())
      .lte("scheduled_at", endOfMonth.toISOString())

    setAllMonthAppointments(data || [])
  }, [supabase, year, month])

  const fetchPatients = useCallback(async () => {
    const { data } = await supabase.from("patients").select("id, full_name, phone").order("full_name")
    setPatients(data || [])
  }, [supabase])

  const handleStatusChange = useCallback(async (appointmentId: string, newStatus: "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show") => {
    const previousAppointments = [...appointments]
    const previousMonthAppointments = [...allMonthAppointments]

    setAppointments(prev =>
      prev.map(apt => apt.id === appointmentId ? { ...apt, status: newStatus } : apt)
    )
    setAllMonthAppointments(prev =>
      prev.map(apt => apt.id === appointmentId ? { ...apt, status: newStatus } : apt)
    )

    const result = await updateAppointment(appointmentId, { status: newStatus })

    if (result.error) {
      setAppointments(previousAppointments)
      setAllMonthAppointments(previousMonthAppointments)
      toast.error("Erro ao atualizar status", { description: result.error })
    } else {
      toast.success(`Status alterado para "${statusLabels[newStatus] || newStatus}"`)
    }
  }, [appointments, allMonthAppointments])

  const openWhatsApp = useCallback((apt: any, svc?: ServiceDef) => {
    const phone = apt.patients?.phone
    if (!phone) {
      toast.error("Paciente sem telefone cadastrado")
      return
    }
    const msg = buildPaymentMessage({
      patientName: apt.patients.full_name || "Paciente",
      serviceName: svc?.label || apt.service_type,
      amount: Number(apt.total_cost) || svc?.price || 0,
      status: apt.status === "completed" ? "completed" : "scheduled",
    })
    window.open(getWhatsAppUrl(phone, msg), "_blank")
  }, [])

  useEffect(() => {
    fetchPatients()
    fetchServices().then(setServices)
  }, [fetchPatients])
  useEffect(() => { fetchAppointmentsForDay() }, [fetchAppointmentsForDay])
  useEffect(() => { fetchMonthAppointments() }, [fetchMonthAppointments])

  useEffect(() => {
    if (preselectedPatientId && patients.length > 0) {
      setEditingAppointment({ patient_id: preselectedPatientId })
      setIsOpen(true)
    }
  }, [preselectedPatientId, patients])

  const filteredAppointments = appointments.filter((apt) => {
    if (activeFilter === "all") return true
    if (activeFilter === "today") return true
    return apt.status === activeFilter
  })

  const hasAppointmentsOnDay = (day: number) => {
    const d = new Date(year, month, day)
    return allMonthAppointments.some(apt => {
      const aptDate = new Date(apt.scheduled_at)
      return isSameDay(aptDate, d)
    })
  }

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)

  const prevMonth = () => {
    if (month === 0) setSelectedDate(new Date(year - 1, 11, 1))
    else setSelectedDate(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    if (month === 11) setSelectedDate(new Date(year + 1, 0, 1))
    else setSelectedDate(new Date(year, month + 1, 1))
  }

  const goToToday = () => {
    setSelectedDate(new Date())
  }

  const formatSelectedDate = () => {
    return selectedDate.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  }

  const timeSlots = Array.from({ length: 17 }, (_, i) => i + 7)

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agenda</h1>
          <p className="text-muted-foreground mt-1">Gerencie seus compromissos e pacientes.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-muted/50 rounded-xl p-1">
            <button
              onClick={() => setView("day")}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${view === "day" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Dia
            </button>
            <button
              onClick={() => setView("list")}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${view === "list" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Lista
            </button>
          </div>
          <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) setEditingAppointment(null) }}>
            <DialogTrigger render={<Button className="shadow-sm rounded-xl" />}>
              <Plus className="mr-2 h-4 w-4" />
              Novo
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingAppointment?.id ? "Editar Agendamento" : "Novo Agendamento"}</DialogTitle>
              </DialogHeader>
              <Suspense fallback={<Skeleton className="h-[500px] w-full rounded-xl" />}>
                <AppointmentForm
                  patients={patients}
                  initialData={editingAppointment}
                  onSuccess={() => {
                    setIsOpen(false)
                    setEditingAppointment(null)
                    fetchAppointmentsForDay()
                    fetchMonthAppointments()
                  }}
                  onCancel={() => { setIsOpen(false); setEditingAppointment(null) }}
                />
              </Suspense>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <div className="space-y-4">
          <Card variant="glass">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <button onClick={prevMonth} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="text-center">
                  <p className="text-sm font-semibold">{MONTHS[month]} {year}</p>
                </div>
                <button onClick={nextMonth} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-0 mb-1">
                {WEEKDAYS.map((day) => (
                  <div key={day} className="text-center text-[10px] font-medium text-muted-foreground py-1">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-0">
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1
                  const date = new Date(year, month, day)
                  const isSelected = isSameDay(date, selectedDate)
                  const isToday = isSameDay(date, new Date())
                  const hasApts = hasAppointmentsOnDay(day)

                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDate(date)}
                      className={`relative h-9 w-full flex items-center justify-center text-sm rounded-lg transition-all duration-150 ${
                        isSelected
                          ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                          : isToday
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-foreground hover:bg-muted/60"
                      }`}
                    >
                      {day}
                      {hasApts && !isSelected && (
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                          <div className="h-1 w-1 rounded-full bg-primary/60" />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>

              <button
                onClick={goToToday}
                className="w-full mt-3 py-2 text-xs font-medium text-primary hover:bg-primary/5 rounded-lg transition-colors"
              >
                Ir para Hoje
              </button>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Serviços</p>
              <div className="space-y-1.5">
                {Object.entries(
                  allMonthAppointments.reduce<Record<string, number>>((acc, apt) => {
                    acc[apt.service_type] = (acc[apt.service_type] || 0) + 1
                    return acc
                  }, {})
                ).map(([type, count]) => {
                  const svc = getServiceById(services, type)
                  return (
                    <div key={type} className="flex items-center gap-2 text-xs">
                      <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: svc?.color || "#6B7280" }} />
                      <span className="flex-1 text-muted-foreground">{svc?.label || type}</span>
                      <span className="text-muted-foreground/60">{String(count)}</span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold capitalize">{formatSelectedDate()}</h2>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <CalendarDays className="h-3.5 w-3.5" />
                {filteredAppointments.length} agendamento(s)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {filterOptions.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                  activeFilter === filter.key
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-background text-muted-foreground border-border/60 hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="glass-card rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-5 w-24 rounded-full" />
                      </div>
                      <Skeleton className="h-4 w-48" />
                    </div>
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="text-center py-20 glass-card rounded-2xl flex flex-col items-center justify-center">
              <div className="h-20 w-20 bg-muted/30 rounded-full flex items-center justify-center mb-4">
                <CalendarDays className="h-10 w-10 text-muted-foreground/40" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Dia Livre</h3>
              <p className="text-muted-foreground mb-6">Nenhum agendamento marcado para esta data.</p>
              <Button variant="outline" onClick={() => setIsOpen(true)} className="rounded-xl">
                Agendar Agora
              </Button>
            </div>
          ) : view === "day" ? (
            <div className="space-y-2">
              {timeSlots.map((hour) => {
                const hourAppointments = filteredAppointments.filter(apt => {
                  const d = new Date(apt.scheduled_at)
                  return d.getHours() === hour
                })

                return (
                  <div key={hour} className="flex gap-4 min-h-[60px]">
                    <div className="w-16 shrink-0 text-right pt-1">
                      <span className="text-xs font-medium text-muted-foreground">
                        {String(hour).padStart(2, "0")}:00
                      </span>
                    </div>

                    <div className="relative w-px bg-border/50 shrink-0">
                      <div className="absolute top-2 -left-1 h-2.5 w-2.5 rounded-full bg-border" />
                    </div>

                    <div className="flex-1 pb-2">
                      {hourAppointments.map((apt) => {
                        const aptTime = new Date(apt.scheduled_at)
                        const timeStr = aptTime.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
                        const svc = getServiceById(services, apt.service_type)

                        return (
                          <div
                            key={apt.id}
                            className="glass-card rounded-xl p-4 mb-2 hover:shadow-md transition-all duration-200 cursor-pointer group"
                            style={{ borderLeft: `3px solid ${svc?.color || "#6B7280"}` }}
                            onClick={() => { setEditingAppointment(apt); setIsOpen(true) }}
                          >
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-foreground">{timeStr}</span>
                                  <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: `${svc?.color}15`, color: svc?.color }}>
                                    {svc?.label || apt.service_type}
                                  </span>
                                  <span className="text-xs text-muted-foreground">{apt.duration_minutes}min</span>
                                  {apt.deposit ? (
                                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                                      Entrada R$ {apt.deposit.toFixed(0)}
                                    </span>
                                  ) : (
                                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                      Sem entrada
                                    </span>
                                  )}
                                </div>
                                <p className="font-medium text-foreground flex items-center gap-1.5">
                                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                                  {apt.patients?.full_name || "Paciente Removido"}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <DropdownMenu>
                                  <DropdownMenuTrigger
                                    render={
                                      <button
                                        className={`text-xs px-2.5 py-1 rounded-full font-medium border cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1 ${statusColors[apt.status] || ""}`}
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                    }
                                  >
                                    {statusLabels[apt.status] || apt.status}
                                    <ChevronDown className="h-3 w-3" />
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                    {Object.entries(statusLabels).map(([key, label]) => (
                                      <DropdownMenuItem
                                        key={key}
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleStatusChange(apt.id, key as any)
                                        }}
                                        className={apt.status === key ? "bg-accent" : ""}
                                      >
                                        <span className={`w-2 h-2 rounded-full ${statusColors[key]?.split(" ")[0]}`} />
                                        {label}
                                      </DropdownMenuItem>
                                    ))}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => { e.stopPropagation(); setEditingAppointment(apt); setIsOpen(true) }}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Cobrar via WhatsApp"
                                  className="h-8 w-8 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-700"
                                  onClick={(e) => { e.stopPropagation(); openWhatsApp(apt, svc) }}
                                >
                                  <MessageCircle className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                            {apt.is_home_visit && (
                              <div className="flex items-center gap-1.5 text-amber-600 mt-2">
                                <MapPin className="h-3.5 w-3.5" />
                                <span className="text-xs font-medium">Atendimento Domiciliar</span>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAppointments.map((apt) => {
                const aptTime = new Date(apt.scheduled_at)
                const timeStr = aptTime.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
                const svc = getServiceById(services, apt.service_type)

                return (
                  <div
                    key={apt.id}
                    className="glass-card rounded-xl p-4 hover:shadow-md transition-all duration-200 cursor-pointer group flex items-center gap-4"
                    style={{ borderLeft: `3px solid ${svc?.color || "#6B7280"}` }}
                    onClick={() => { setEditingAppointment(apt); setIsOpen(true) }}
                  >
                    <div className="w-16 shrink-0 text-center">
                      <span className="text-sm font-bold text-foreground">{timeStr}</span>
                      <span className="block text-[10px] text-muted-foreground">{apt.duration_minutes}min</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{apt.patients?.full_name || "Paciente Removido"}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${svc?.color}15`, color: svc?.color }}>
                          {svc?.label || apt.service_type}
                        </span>
                        {apt.deposit ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                            Entrada R$ {apt.deposit.toFixed(0)}
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                            Sem entrada
                          </span>
                        )}
                        {apt.is_home_visit && (
                          <span className="text-[10px] text-amber-600 font-medium flex items-center gap-0.5">
                            <MapPin className="h-3 w-3" /> Domiciliar
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <button
                              className={`text-xs px-2.5 py-1 rounded-full font-medium border cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1 ${statusColors[apt.status] || ""}`}
                              onClick={(e) => e.stopPropagation()}
                            />
                          }
                        >
                          {statusLabels[apt.status] || apt.status}
                          <ChevronDown className="h-3 w-3" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                          {Object.entries(statusLabels).map(([key, label]) => (
                            <DropdownMenuItem
                              key={key}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleStatusChange(apt.id, key as any)
                              }}
                              className={apt.status === key ? "bg-accent" : ""}
                            >
                              <span className={`w-2 h-2 rounded-full ${statusColors[key]?.split(" ")[0]}`} />
                              {label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => { e.stopPropagation(); setEditingAppointment(apt); setIsOpen(true) }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Cobrar via WhatsApp"
                        className="h-8 w-8 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-700"
                        onClick={(e) => { e.stopPropagation(); openWhatsApp(apt, svc) }}
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      </div>
  )
}

export default function AppointmentsPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="flex justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-24 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          <Skeleton className="h-[400px] rounded-xl" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[80px] rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    }>
      <AppointmentsPageInner />
    </Suspense>
  )
}
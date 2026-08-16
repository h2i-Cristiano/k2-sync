"use client"

import { useEffect, useState, useCallback, Suspense, useMemo } from "react"
import dynamic from "next/dynamic"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/ui/page-header"
import { DateStrip } from "@/components/ui/date-strip"
import { EmptyState } from "@/components/ui/empty-state"
import { Plus, ChevronLeft, ChevronRight, User, MapPin, CalendarDays, ChevronDown, MessageCircle } from "lucide-react"
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

const statusTones: Record<string, "default" | "success" | "destructive" | "warning"> = {
  scheduled: "default",
  confirmed: "success",
  completed: "success",
  cancelled: "destructive",
  no_show: "warning",
}

const statusDot: Record<string, string> = {
  scheduled: "bg-primary",
  confirmed: "bg-success",
  completed: "bg-success",
  cancelled: "bg-destructive",
  no_show: "bg-warning",
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
  const [view, setView] = useState<"day" | "week" | "month">("day")
  const [activeFilter, setActiveFilter] = useState("all")
  const [services, setServices] = useState<ServiceDef[]>([])
  const [mobileCalendarOpen, setMobileCalendarOpen] = useState(false)
  const supabase = useMemo(() => createClient(), [])

  const year = selectedDate.getFullYear()
  const month = selectedDate.getMonth()

  const getWindowRange = useCallback((base: Date, currentView: "day" | "week" | "month") => {
    if (currentView === "day") {
      const start = new Date(base)
      start.setHours(0, 0, 0, 0)
      const end = new Date(base)
      end.setHours(23, 59, 59, 999)
      return { start, end }
    }
    if (currentView === "week") {
      const offset = base.getDay()
      const start = new Date(base)
      start.setDate(base.getDate() - offset)
      start.setHours(0, 0, 0, 0)
      const end = new Date(start)
      end.setDate(start.getDate() + 6)
      end.setHours(23, 59, 59, 999)
      return { start, end }
    }
    const start = new Date(base.getFullYear(), base.getMonth(), 1)
    const end = new Date(base.getFullYear(), base.getMonth() + 1, 0, 23, 59, 59, 999)
    return { start, end }
  }, [])

  const fetchAppointments = useCallback(async () => {
    setLoading(true)
    const { start, end } = getWindowRange(selectedDate, view)

    const { data } = await supabase
      .from("appointments")
      .select("*, patients(full_name, phone)")
      .gte("scheduled_at", start.toISOString())
      .lte("scheduled_at", end.toISOString())
      .order("scheduled_at", { ascending: true })

    const aptList = data || []
    const aptIds = aptList.map(a => a.id)
    const depositMap: Record<string, number> = {}
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
  }, [supabase, selectedDate, view, getWindowRange])

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
  useEffect(() => { fetchAppointments() }, [fetchAppointments])
  useEffect(() => { fetchMonthAppointments() }, [fetchMonthAppointments])

  useEffect(() => {
    if (preselectedPatientId && patients.length > 0) {
      setEditingAppointment({ patient_id: preselectedPatientId })
      setIsOpen(true)
    }
  }, [preselectedPatientId, patients])

  const filteredAppointments = appointments.filter((apt) => {
    if (activeFilter === "all") return true
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

  const shiftWindow = (dir: -1 | 1) => {
    setSelectedDate((prev) => {
      const d = new Date(prev)
      if (view === "week") d.setDate(d.getDate() + 7 * dir)
      else if (view === "month") d.setMonth(d.getMonth() + dir)
      else d.setDate(d.getDate() + dir)
      return d
    })
  }

  const formatSelectedDate = () => {
    return selectedDate.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  }

  const windowLabel = (() => {
    if (view === "month") return `${MONTHS[month]} ${year}`
    if (view === "week") {
      const { start } = getWindowRange(selectedDate, "week")
      const end = new Date(start)
      end.setDate(start.getDate() + 6)
      const fmt = (d: Date) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })
      return `${fmt(start)} — ${fmt(end)}`
    }
    return formatSelectedDate()
  })()

  const groupByDay = (list: any[]) => {
    const map = new Map<string, any[]>()
    list.forEach((apt) => {
      const key = new Date(apt.scheduled_at).toDateString()
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(apt)
    })
    return Array.from(map.entries())
      .map(([key, items]) => ({
        date: new Date(key),
        items: items.sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()),
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime())
  }

  const weekDays = (() => {
    const { start } = getWindowRange(selectedDate, "week")
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      return d
    })
  })()

  const renderCalendar = () => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="rounded-lg p-1.5 hover:bg-muted transition-colors" aria-label="Mês anterior">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="text-center">
            <p className="text-sm font-semibold">{MONTHS[month]} {year}</p>
          </div>
          <button onClick={nextMonth} className="rounded-lg p-1.5 hover:bg-muted transition-colors" aria-label="Próximo mês">
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
  )

  const renderServicesSummary = () => {
    const counts = Object.entries(
      allMonthAppointments.reduce<Record<string, number>>((acc, apt) => {
        acc[apt.service_type] = (acc[apt.service_type] || 0) + 1
        return acc
      }, {})
    )
    if (counts.length === 0) return null
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Serviços no mês</p>
          <div className="space-y-1.5">
            {counts.map(([type, count]) => {
              const svc = getServiceById(services, type)
              return (
                <div key={type} className="flex items-center gap-2 text-xs">
                  <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: svc?.color || "#6B7280" }} />
                  <span className="flex-1 text-muted-foreground">{svc?.label || type}</span>
                  <span className="tnum text-muted-foreground/60">{String(count)}</span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderStatusTrigger = (apt: any) => (
    <DropdownMenuTrigger
      render={
        <button
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition-opacity cursor-pointer hover:opacity-80 ${
            statusTones[apt.status] === "destructive"
              ? "bg-destructive/15 text-destructive"
              : statusTones[apt.status] === "warning"
              ? "bg-warning/15 text-warning"
              : statusTones[apt.status] === "success"
              ? "bg-success/15 text-success"
              : "bg-primary/10 text-primary"
          }`}
          onClick={(e) => e.stopPropagation()}
        />
      }
    >
      <span className={`h-1.5 w-1.5 rounded-full ${statusDot[apt.status] || "bg-primary"}`} />
      {statusLabels[apt.status] || apt.status}
      <ChevronDown className="h-3 w-3" />
    </DropdownMenuTrigger>
  )

  const renderStatusMenu = (apt: any) => (
    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
      {Object.entries(statusLabels).map(([key, label]) => (
        <DropdownMenuItem
          key={key}
          onClick={(e) => {
            e.stopPropagation()
            handleStatusChange(apt.id, key as any)
          }}
          className={apt.status === key ? "bg-accent/50" : ""}
        >
          <span className={`h-2 w-2 rounded-full ${statusDot[key] || "bg-primary"}`} />
          {label}
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  )

  const renderAppointmentCard = (apt: any) => {
    const aptTime = new Date(apt.scheduled_at)
    const timeStr = aptTime.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    const svc = getServiceById(services, apt.service_type)

    return (
      <div
        key={apt.id}
        className="cursor-pointer rounded-xl bg-card p-4 ring-1 ring-border/40 transition-[box-shadow,transform] hover:shadow-md group"
        style={{ borderLeft: `3px solid ${svc?.color || "#6B7280"}` }}
        onClick={() => { setEditingAppointment(apt); setIsOpen(true) }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-sm font-bold text-foreground tnum">{timeStr}</span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full max-w-full truncate" style={{ backgroundColor: `${svc?.color}15`, color: svc?.color }}>
                {svc?.label || apt.service_type}
              </span>
              <span className="text-xs text-muted-foreground">{apt.duration_minutes}min</span>
              {apt.deposit ? (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gold/15 text-gold">
                  Entrada R$ {apt.deposit.toFixed(0)}
                </span>
              ) : (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  Sem entrada
                </span>
              )}
            </div>
            <p className="font-medium text-foreground flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              {apt.patients?.full_name || "Paciente Removido"}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <DropdownMenu>
              {renderStatusTrigger(apt)}
              {renderStatusMenu(apt)}
            </DropdownMenu>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-700"
              title="Cobrar via WhatsApp"
              onClick={(e) => { e.stopPropagation(); openWhatsApp(apt, svc) }}
            >
              <MessageCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {apt.is_home_visit && (
          <div className="flex items-center gap-1.5 text-gold mt-2">
            <MapPin className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">Atendimento Domiciliar</span>
          </div>
        )}
      </div>
    )
  }

  const renderDayHeader = (date: Date) => {
    const isToday = isSameDay(date, new Date())
    return (
      <div className="flex items-center gap-2 pt-1 pb-2">
        <span className="h-4 w-1 rounded-full bg-primary/60" />
        <p className="text-sm font-semibold text-foreground capitalize">
          {date.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
        </p>
        {isToday && <span className="text-[10px] font-semibold uppercase tracking-wide text-primary bg-primary/10 px-2 py-0.5 rounded-full">Hoje</span>}
      </div>
    )
  }

  const emptyStateContent = (() => {
    if (view === "day") {
      return (
        <EmptyState
          icon={CalendarDays}
          title="Dia Livre"
          description="Nenhum agendamento para esta data."
          action={
            <Button variant="outline" onClick={() => setIsOpen(true)}>
              Agendar Agora
            </Button>
          }
        />
      )
    }
    if (view === "week") {
      return (
        <EmptyState
          icon={CalendarDays}
          title="Semana sem agendamentos"
          description="Nenhum agendamento nesta semana."
        />
      )
    }
    return (
      <EmptyState
        icon={CalendarDays}
        title="Mês sem agendamentos"
        description="Nenhum agendamento neste mês."
      />
    )
  })()

  const renderListContent = () => {
    if (loading) {
      return (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-card p-4 ring-1 ring-border/40">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      )
    }

    if (filteredAppointments.length === 0) {
      return <div className="rounded-2xl bg-card ring-1 ring-border/40">{emptyStateContent}</div>
    }

    if (view === "day") {
      return (
        <div className="space-y-2">
          {filteredAppointments.map((apt) => renderAppointmentCard(apt))}
        </div>
      )
    }

    if (view === "week") {
      const grouped = groupByDay(filteredAppointments)
      return (
        <div className="space-y-5">
          {weekDays.map((day) => {
            const dayItems = grouped.find((g) => isSameDay(g.date, day))?.items || []
            return (
              <div key={day.toDateString()}>
                {renderDayHeader(day)}
                {dayItems.length === 0 ? (
                  <p className="text-xs text-muted-foreground/70 pl-3">Sem agendamentos</p>
                ) : (
                  <div className="space-y-2">
                    {dayItems.map((apt) => renderAppointmentCard(apt))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )
    }

    const grouped = groupByDay(filteredAppointments)
    return (
      <div className="space-y-5">
        {grouped.map((group) => (
          <div key={group.date.toDateString()}>
            {renderDayHeader(group.date)}
            <div className="space-y-2">
              {group.items.map((apt) => renderAppointmentCard(apt))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-slide-up-fade">
      <PageHeader
        title="Agenda"
        description="Gerencie seus compromissos e pacientes."
        actions={
          <>
            <div className="flex items-center rounded-xl bg-muted/60 p-1">
              {(["day", "week", "month"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                    view === v ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {v === "day" ? "Dia" : v === "week" ? "Semana" : "Mês"}
                </button>
              ))}
            </div>
            <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) setEditingAppointment(null) }}>
              <DialogTrigger render={<Button />}>
                <Plus className="mr-2 h-4 w-4" />
                Novo
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto grid-cols-[minmax(0,1fr)]">
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
                      fetchAppointments()
                      fetchMonthAppointments()
                    }}
                    onCancel={() => { setIsOpen(false); setEditingAppointment(null) }}
                  />
                </Suspense>
              </DialogContent>
            </Dialog>
          </>
        }
      />

      {/* Mobile: date strip + collapsible calendar */}
      <div className="space-y-3 lg:hidden">
        <DateStrip selected={selectedDate} onSelect={setSelectedDate} />
        <button
          onClick={() => setMobileCalendarOpen((v) => !v)}
          className="flex w-full items-center justify-between rounded-xl border border-border/60 bg-card px-4 py-2.5 text-sm font-medium text-foreground"
          aria-expanded={mobileCalendarOpen}
        >
          {MONTHS[month]} {year}
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${mobileCalendarOpen ? "rotate-180" : ""}`} />
        </button>
        {mobileCalendarOpen && (
          <div className="animate-slide-up-fade">
            {renderCalendar()}
            {renderServicesSummary()}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Desktop sidebar */}
        <div className="hidden space-y-4 lg:block">
          {renderCalendar()}
          {renderServicesSummary()}
        </div>

        <div>
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold truncate">{windowLabel}</h2>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                {filteredAppointments.length} agendamento(s)
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => shiftWindow(-1)} aria-label="Período anterior">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={goToToday} title="Ir para hoje" aria-label="Ir para hoje">
                <CalendarDays className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => shiftWindow(1)} aria-label="Próximo período">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex gap-2 mb-4 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {filterOptions.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all whitespace-nowrap ${
                  activeFilter === filter.key
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card text-muted-foreground border-border/60 hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {renderListContent()}
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